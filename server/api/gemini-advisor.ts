import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return { success: false, advice: 'Le, API Key Gemininya belum dipasang di .env!' }
  }

  // Init Supabase server-side
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  )

  const body = await readBody(event)
  const type = body?.type || 'strategy' // 'strategy' | 'pricing'

  // ── Fetch semua data yang dibutuhkan ──

  // 1. Sales 30 hari terakhir + join menus
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: sales } = await supabase
    .from('sales')
    .select('*, menus(id, name, price, category)')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  // 2. Semua menu
  const { data: menus } = await supabase
    .from('menus')
    .select('*')

  // 3. Ingredients + menu_ingredients
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')

  const { data: menuIngredients } = await supabase
    .from('menu_ingredients')
    .select('*, menus(name)')

  // ── Olah data ──

  // Per-produk: revenue, modal, profit, qty
  const productMap: Record<string, any> = {}
  for (const s of sales || []) {
    const id = s.menus?.id
    if (!id) continue
    if (!productMap[id]) {
      productMap[id] = {
        name: s.menus.name,
        category: s.menus.category,
        price: s.menus.price,
        qty: 0,
        revenue: 0,
        modal: 0,
      }
    }
    productMap[id].qty += s.qty_sold
    productMap[id].revenue += s.qty_sold * s.menus.price
    productMap[id].modal += s.modal
  }

  const productStats = Object.values(productMap).map((p: any) => ({
    ...p,
    profit: p.revenue - p.modal,
    margin: p.revenue > 0 ? Math.round(((p.revenue - p.modal) / p.revenue) * 100) : 0
  })).sort((a, b) => b.qty - a.qty)

  // Overall 30 hari
  const totalRevenue = productStats.reduce((a, p) => a + p.revenue, 0)
  const totalModal = productStats.reduce((a, p) => a + p.modal, 0)
  const totalProfit = totalRevenue - totalModal
  const totalQty = productStats.reduce((a, p) => a + p.qty, 0)
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  // Ingredients cost per menu
  const ingredientCostMap: Record<string, number> = {}
  for (const mi of menuIngredients || []) {
    const ing = (ingredients || []).find((i: any) => i.id === mi.ingredient_id)
    if (!ing) continue
    const costPerUnit = ing.purchase_price / ing.purchase_quantity
    const usageCost = costPerUnit * mi.usage_quantity
    if (!ingredientCostMap[mi.menu_id]) ingredientCostMap[mi.menu_id] = 0
    ingredientCostMap[mi.menu_id] += usageCost
  }

  // Enrich produk dengan ingredient cost
  const enrichedProducts = productStats.map(p => {
    const menu = (menus || []).find((m: any) => m.name === p.name)
    const ingredientCost = menu ? (ingredientCostMap[menu.id] || 0) : 0
    const theoreticalMargin = p.price > 0 && ingredientCost > 0
      ? Math.round(((p.price - ingredientCost) / p.price) * 100)
      : null
    return { ...p, ingredientCost: Math.round(ingredientCost), theoreticalMargin }
  })

  // ── Build prompt ──

  const ai = new GoogleGenAI({ apiKey })

  const systemInstruction = `
Anda adalah konsultan bisnis UMKM kuliner senior yang tajam, pragmatis, dan suportif.
Gunakan bahasa santai blak-blakan khas Sunda/Indonesia, panggil user dengan 'Le' atau 'Mang'.
Jawaban harus padat, actionable, langsung ke inti — tanpa intro, tanpa penutup basa-basi, tanpa format markdown formal.
Konteks bisnis: Kedai Senja, warung kuliner di Kertajati, Majalengka. Segmen pasar: pelajar dan warga sekpesantren, daya beli menengah ke bawah. Harga menu rata-rata Rp 5.000–15.000.
`.trim()

  let userPrompt = ''

  if (type === 'pricing') {
    userPrompt = `Analisis harga produk Kedai Senja berdasarkan data 30 hari terakhir:

RINGKASAN:
- Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}
- Total Profit: Rp ${totalProfit.toLocaleString('id-ID')}
- Avg Margin: ${avgMargin}%
- Total Terjual: ${totalQty} pcs

PER PRODUK:
${enrichedProducts.map(p =>
  `• ${p.name} (${p.category}): harga Rp ${p.price.toLocaleString('id-ID')}, terjual ${p.qty}pcs, margin ${p.margin}%` +
  (p.ingredientCost > 0 ? `, HPP bahan Rp ${p.ingredientCost.toLocaleString('id-ID')}, theoretical margin ${p.theoreticalMargin}%` : '')
).join('\n')}

Berikan rekomendasi harga untuk tiap produk yang margin-nya terlalu tipis atau harga-nya bisa dioptimasi. Pertimbangkan daya beli pasar Majalengka. Sebutkan produk mana yang harus naik harga, berapa idealnya, dan kenapa.`

  } else {
    // strategy
    userPrompt = `Analisis strategi bisnis Kedai Senja berdasarkan data 30 hari terakhir:

RINGKASAN:
- Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}
- Total Profit: Rp ${totalProfit.toLocaleString('id-ID')}
- Avg Margin: ${avgMargin}%
- Total Terjual: ${totalQty} pcs

PRODUK TERLARIS:
${enrichedProducts.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} — ${p.qty}pcs, profit Rp ${p.profit.toLocaleString('id-ID')}, margin ${p.margin}%`).join('\n')}

PRODUK PALING SEPI:
${enrichedProducts.slice(-3).map((p, i) => `${i + 1}. ${p.name} — ${p.qty}pcs, margin ${p.margin}%`).join('\n')}

Hari ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}

Berikan 2-3 rekomendasi strategi konkret: kapan waktu promo terbaik, produk mana yang perlu didorong, jenis promo apa yang cocok (buy 1 get 1, bundling, diskon jumat, dll) berdasarkan data di atas. Sesuaikan dengan daya beli pasar Kertajati Majalengka.`
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.75,
      }
    })

    const adviceText = response.text || 'Belum ada saran taktis, jualan terus le!'
    return { success: true, advice: adviceText.trim(), productStats: enrichedProducts }

  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return { success: false, advice: 'Koneksi ke Gemini lagi seret Le, coba refresh bentar lagi!' }
  }
})