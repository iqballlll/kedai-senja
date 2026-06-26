import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return { success: false, reply: 'API Key Gemini belum dipasang Le!' }
  }

  // Gunakan non-null assertion (!) karena env dipastikan diset di runtime config / env
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  const body = await readBody(event)
  const { message, history } = body

  // ── Fetch semua data bisnis ──
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: allSales } = await supabase
    .from('sales')
    .select('*, menus(id, name, price, category)')
    .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })

  const { data: menus } = await supabase.from('menus').select('*')
  const { data: ingredients } = await supabase.from('ingredients').select('*')
  const { data: menuIngredients } = await supabase.from('menu_ingredients').select('*')

  // ── Olah data per produk ──
  const productMap: Record<string, any> = {}
  for (const s of allSales || []) {
    // Amankan join relation dari Supabase
    const menuData = s.menus as any
    const id = menuData?.id
    if (!id) continue

    const idStr = String(id)

    if (!productMap[idStr]) {
      productMap[idStr] = {
        name: menuData.name,
        category: menuData.category,
        price: menuData.price,
        qty: 0, 
        revenue: 0, 
        modal: 0
      }
    }
    
    const qtySold = s.qty_sold || 0
    const price = menuData.price || 0
    const modalCost = s.modal || 0

    productMap[idStr].qty += qtySold
    productMap[idStr].revenue += qtySold * price
    productMap[idStr].modal += modalCost
  }

  const productStats = Object.values(productMap).map((p: any) => ({
    ...p,
    profit: p.revenue - p.modal,
    margin: p.revenue > 0 ? Math.round(((p.revenue - p.modal) / p.revenue) * 100) : 0,
    avgModalPerPcs: p.qty > 0 ? Math.round(p.modal / p.qty) : 0
  })).sort((a: any, b: any) => b.qty - a.qty)

  const totalRevenue = productStats.reduce((a: number, p: any) => a + p.revenue, 0)
  const totalModal = productStats.reduce((a: number, p: any) => a + p.modal, 0)
  const totalProfit = totalRevenue - totalModal
  const totalQty = productStats.reduce((a: number, p: any) => a + p.qty, 0)
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  // ── Day of week analysis ──
  const dowMap: Record<string, { revenue: number, qty: number, count: number }> = {}
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  for (const d of days) dowMap[d] = { revenue: 0, qty: 0, count: 0 }
  
  const dayDateSet: Record<string, Set<string>> = {}
  for (const d of days) dayDateSet[d] = new Set<string>()

  for (const s of allSales || []) {
    if (!s.date) continue
    
    // Amankan inisialisasi Date dari string database
    const dateObj = new Date(s.date)
    if (isNaN(dateObj.getTime())) continue // skip invalid date

    const day = days[dateObj.getDay()]
    const menuData = s.menus as any
    const price = menuData?.price || 0
    const qtySold = s.qty_sold || 0

    dowMap[day].revenue += qtySold * price
    dowMap[day].qty += qtySold
    dayDateSet[day].add(s.date)
  }
  for (const d of days) dowMap[d].count = dayDateSet[d].size

  // Amankan penentuan hari terbaik & terburuk dengan typing eksplisit
  const bestDay = days.reduce((a, b) => {
    const avgA = dowMap[a].count > 0 ? dowMap[a].revenue / dowMap[a].count : 0
    const avgB = dowMap[b].count > 0 ? dowMap[b].revenue / dowMap[b].count : 0
    return avgA > avgB ? a : b
  }, days[0])

  const worstDay = days.reduce((a, b) => {
    const avgA = dowMap[a].count > 0 ? dowMap[a].revenue / dowMap[a].count : Infinity
    const avgB = dowMap[b].count > 0 ? dowMap[b].revenue / dowMap[b].count : Infinity
    return avgA < avgB ? a : b
  }, days[0])

  // ── Trend 30 hari vs 30 hari sebelumnya ──
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const recent30 = (allSales || []).filter(s => s.date && new Date(s.date) >= thirtyDaysAgo)
  const prev30 = (allSales || []).filter(s => s.date && new Date(s.date) >= sixtyDaysAgo && new Date(s.date) < thirtyDaysAgo)

  const rev30 = recent30.reduce((a, s) => {
    const menuData = s.menus as any
    return a + (s.qty_sold || 0) * (menuData?.price || 0)
  }, 0)

  const revPrev30 = prev30.reduce((a, s) => {
    const menuData = s.menus as any
    return a + (s.qty_sold || 0) * (menuData?.price || 0)
  }, 0)
  
  const trendPct = revPrev30 > 0 ? Math.round(((rev30 - revPrev30) / revPrev30) * 100) : 0

  // ── Ingredient cost per menu ──
  const ingredientCostMap: Record<string, number> = {}
  for (const mi of menuIngredients || []) {
    if (!mi.menu_id || !mi.ingredient_id) continue
    
    const ing = (ingredients || []).find((i: any) => i.id === mi.ingredient_id)
    if (!ing || !ing.purchase_quantity) continue
    
    const costPerUnit = (ing.purchase_price || 0) / ing.purchase_quantity
    const menuIdStr = String(mi.menu_id)
    const usageQty = mi.usage_quantity || 0

    ingredientCostMap[menuIdStr] = (ingredientCostMap[menuIdStr] || 0) + costPerUnit * usageQty
  }

  // ── Enrich products dengan ingredient cost ──
  const enrichedProducts = productStats.map((p: any) => {
    const menu = (menus || []).find((m: any) => m.name === p.name)
    const menuIdStr = menu ? String(menu.id) : ''
    const ingCost = menu ? Math.round(ingredientCostMap[menuIdStr] || 0) : 0
    const theoreticalMargin = p.price > 0 && ingCost > 0
      ? Math.round(((p.price - ingCost) / p.price) * 100)
      : null
    return {
      ...p,
      ingredientCost: ingCost,
      theoreticalMargin,
      isAvailable: menu?.is_available ?? true
    }
  })

  // ── Filter kriteria produk ──
  const lowMarginProducts = enrichedProducts.filter((p: any) => p.margin < 20 && p.qty > 0)
  const highPerformerProducts = enrichedProducts.filter((p: any) => p.margin >= 35 && p.qty > 0)
  const slowMovingProducts = enrichedProducts.filter((p: any) => p.qty < 5)

  // ── Today's data ──
  const todayISO = new Date().toISOString().split('T')[0]
  const todaySales = (allSales || []).filter(s => s.date === todayISO)
  const todayRevenue = todaySales.reduce((a, s) => {
    const menuData = s.menus as any
    return a + (s.qty_sold || 0) * (menuData?.price || 0)
  }, 0)
  const todayProfit = todaySales.reduce((a, s) => {
    const menuData = s.menus as any
    return a + (s.qty_sold || 0) * (menuData?.price || 0) - (s.modal || 0)
  }, 0)

  // ── Build rich context ──
  const contextData = `
=== DATA BISNIS KEDAI SENJA (90 hari terakhir) ===

📊 RINGKASAN KESELURUHAN:
- Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}
- Total Modal (HPP): Rp ${totalModal.toLocaleString('id-ID')}
- Total Profit: Rp ${totalProfit.toLocaleString('id-ID')}
- Avg Margin: ${avgMargin}%
- Total Terjual: ${totalQty} pcs
- Jumlah Menu Aktif: ${(menus || []).filter((m: any) => m.is_available).length} dari ${(menus || []).length} menu

📈 HARI INI (${todayISO}):
- Revenue: Rp ${todayRevenue.toLocaleString('id-ID')}
- Profit: Rp ${todayProfit.toLocaleString('id-ID')}

📉 TREND:
- Revenue 30 hari terakhir: Rp ${rev30.toLocaleString('id-ID')}
- Revenue 30 hari sebelumnya: Rp ${revPrev30.toLocaleString('id-ID')}
- Trend: ${trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`} ${trendPct > 0 ? '🔺 naik' : trendPct < 0 ? '🔻 turun' : '➡️ stabil'}

📅 PERFORMA PER HARI:
${days.map(d => {
  const avg = dowMap[d].count > 0 ? Math.round(dowMap[d].revenue / dowMap[d].count) : 0
  return `- ${d}: avg Rp ${avg.toLocaleString('id-ID')}/hari (${dowMap[d].count} hari data)`
}).join('\n')}
- Hari Terbaik: ${bestDay}
- Hari Paling Sepi: ${worstDay}

🍜 SEMUA PRODUK (ranking by qty):
${enrichedProducts.map((p: any, i: number) =>
  `${i + 1}. ${p.name} (${p.category})
   - Harga jual: Rp ${p.price.toLocaleString('id-ID')}
   - Terjual: ${p.qty} pcs | Revenue: Rp ${p.revenue.toLocaleString('id-ID')}
   - Profit: Rp ${p.profit.toLocaleString('id-ID')} | Margin: ${p.margin}%
   - HPP/porsi aktual: Rp ${p.avgModalPerPcs.toLocaleString('id-ID')}` +
  (p.ingredientCost > 0 ? `\n   - HPP bahan baku: Rp ${p.ingredientCost.toLocaleString('id-ID')} | Theoretical margin: ${p.theoreticalMargin}%` : '') +
  `\n   - Status: ${p.isAvailable ? '✅ Tersedia' : '❌ Tidak tersedia'}`
).join('\n\n')}

⚠️ PRODUK MARGIN TIPIS (<20%):
${lowMarginProducts.length > 0 ? lowMarginProducts.map((p: any) => `- ${p.name}: margin ${p.margin}%`).join('\n') : '- Tidak ada'}

🌟 PRODUK PERFORMA BAGUS (margin ≥35%):
${highPerformerProducts.length > 0 ? highPerformerProducts.map((p: any) => `- ${p.name}: margin ${p.margin}%, ${p.qty}pcs`).join('\n') : '- Belum ada data cukup'}

🐌 PRODUK KURANG LAKU (<5 pcs):
${slowMovingProducts.length > 0 ? slowMovingProducts.map((p: any) => `- ${p.name}: ${p.qty}pcs`).join('\n') : '- Semua produk laku'}

🧂 BAHAN BAKU TERDAFTAR:
${(ingredients || []).length > 0
  ? (ingredients || []).map((i: any) => `- ${i.name}: beli Rp ${i.purchase_price.toLocaleString('id-ID')} per ${i.purchase_quantity} ${i.purchase_unit} → Rp ${Math.round(i.purchase_price / (i.purchase_quantity || 1)).toLocaleString('id-ID')}/${i.purchase_unit}`).join('\n')
  : '- Belum ada data bahan baku'}
`.trim()

  // ── System instruction ──
  const systemInstruction = `
Kamu adalah konsultan bisnis dan analis keuangan UMKM kuliner senior bernama "Senja AI" — spesialis warung makan kelas menengah bawah di Jawa Barat.

KEPRIBADIAN:
- Blak-blakan, jujur, nggak suka basa-basi
- Santai tapi tajam dan analitik
- Kalau ada masalah bisnis, langsung kasih solusi konkret
- Panggil owner dengan "Le" atau "Mang"
- Sesekali pakai kata-kata Sunda ringan (tapi jangan berlebihan)

KEAHLIAN:
- Analisis margin dan profitabilitas produk
- Strategi pricing untuk pasar menengah bawah
- Desain promo yang efektif (buy 1 get 1, bundling, diskon hari spesial, dll)
- Manajemen bahan baku dan HPP
- Analisis tren penjualan harian/mingguan/musiman

DATA BISNIS AKTUAL KEDAI SENJA:
${contextData}
`.trim()

  // ── Build contents untuk Gemini ──
  const contents = [
    ...((history || []).slice(-12).map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }))),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ]

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })

    const reply = response.text?.trim() || 'Hmm, gua lagi mikir keras Le. Coba tanya lagi!'
    return { success: true, reply }

  } catch (err: any) {
    console.error('Gemini chat error:', err)
    return {
      success: false,
      reply: 'Aduh Le, koneksi ke AI-nya lagi seret. Coba bentar lagi ya!'
    }
  }
})