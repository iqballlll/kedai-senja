import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return { success: false, advice: 'API Key Gemini belum dipasang Le!' }
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  const body = await readBody(event)
  const type = body?.type || 'strategy'

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sales } = await supabase
    .from('sales')
    .select('*, menus(id, name, price, category)')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

  const { data: menus } = await supabase.from('menus').select('*')
  const { data: ingredients } = await supabase.from('ingredients').select('*')
  const { data: menuIngredients } = await supabase.from('menu_ingredients').select('*')

  const productMap: Record<string, any> = {}
  for (const s of sales || []) {
    const id = s.menus?.id
    if (!id) continue
    if (!productMap[id]) {
      productMap[id] = { name: s.menus.name, category: s.menus.category, price: s.menus.price, qty: 0, revenue: 0, modal: 0 }
    }
    productMap[id].qty += s.qty_sold
    productMap[id].revenue += s.qty_sold * s.menus.price
    productMap[id].modal += s.modal
  }

  const productStats = Object.values(productMap).map((p: any) => ({
    ...p,
    profit: p.revenue - p.modal,
    margin: p.revenue > 0 ? Math.round(((p.revenue - p.modal) / p.revenue) * 100) : 0
  })).sort((a: any, b: any) => b.qty - a.qty)

  const totalRevenue = productStats.reduce((a: number, p: any) => a + p.revenue, 0)
  const totalProfit = productStats.reduce((a: number, p: any) => a + p.profit, 0)
  const totalQty = productStats.reduce((a: number, p: any) => a + p.qty, 0)

  const ingredientCostMap: Record<string, number> = {}
  for (const mi of menuIngredients || []) {
    const ing = (ingredients || []).find((i: any) => i.id === mi.ingredient_id)
    if (!ing) continue
    const costPerUnit = ing.purchase_price / ing.purchase_quantity
    ingredientCostMap[mi.menu_id] = (ingredientCostMap[mi.menu_id] || 0) + costPerUnit * mi.usage_quantity
  }

  const enrichedProducts = productStats.map((p: any) => {
    const menu = (menus || []).find((m: any) => m.name === p.name)
    const ingredientCost = menu ? (ingredientCostMap[menu.id] || 0) : 0
    const theoreticalMargin = p.price > 0 && ingredientCost > 0
      ? Math.round(((p.price - ingredientCost) / p.price) * 100)
      : null
    return { ...p, ingredientCost: Math.round(ingredientCost), theoreticalMargin }
  })

  const ai = new GoogleGenAI({ apiKey })

  const systemInstruction = `
Anda adalah konsultan bisnis UMKM kuliner senior yang tajam, pragmatis, dan suportif.
Gunakan bahasa santai blak-blakan khas Sunda/Indonesia, panggil user dengan 'Le' atau 'Mang'.
Jawaban harus padat, actionable, langsung ke inti — tanpa intro, tanpa penutup basa-basi.
Konteks: Kedai Senja, warung kuliner di Kertajati, Majalengka. Segmen: pelajar, santri, orangtua. Daya beli menengah ke bawah. Harga menu Rp 5.000–15.000.
`.trim()

  let userPrompt = ''

  if (type === 'pricing') {
    userPrompt = `Analisis harga produk Kedai Senja berdasarkan data 30 hari terakhir:

RINGKASAN:
- Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}
- Total Profit: Rp ${totalProfit.toLocaleString('id-ID')}
- Total Terjual: ${totalQty} pcs

PER PRODUK:
${enrichedProducts.map((p: any) =>
  `• ${p.name} (${p.category}): harga Rp ${p.price.toLocaleString('id-ID')}, terjual ${p.qty}pcs, margin ${p.margin}%` +
  (p.ingredientCost > 0 ? `, HPP bahan Rp ${p.ingredientCost.toLocaleString('id-ID')}, theoretical margin ${p.theoreticalMargin}%` : '')
).join('\n')}

Berikan rekomendasi harga untuk tiap produk yang margin-nya terlalu tipis. Sebutkan produk mana yang harus naik harga, berapa idealnya, dan kenapa. Pertimbangkan daya beli pasar Majalengka.`

  } else {
    userPrompt = `Analisis strategi bisnis Kedai Senja berdasarkan data 30 hari terakhir:

RINGKASAN:
- Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}
- Total Profit: Rp ${totalProfit.toLocaleString('id-ID')}
- Total Terjual: ${totalQty} pcs

PRODUK TERLARIS:
${enrichedProducts.slice(0, 5).map((p: any, i: number) => `${i + 1}. ${p.name} — ${p.qty}pcs, profit Rp ${p.profit.toLocaleString('id-ID')}, margin ${p.margin}%`).join('\n')}

PRODUK PALING SEPI:
${enrichedProducts.slice(-3).map((p: any, i: number) => `${i + 1}. ${p.name} — ${p.qty}pcs, margin ${p.margin}%`).join('\n')}

Hari ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}

Berikan 2-3 rekomendasi strategi konkret: kapan waktu promo terbaik, produk mana yang perlu didorong, jenis promo apa yang cocok (buy 1 get 1, bundling, diskon jumat, dll). Sesuaikan dengan daya beli pasar Kertajati Majalengka.`
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: { systemInstruction, temperature: 0.75 }
    })
    return { success: true, advice: response.text?.trim() || 'Belum ada saran taktis, jualan terus le!' }
  } catch (err: any) {
    console.error('Gemini analysis error:', err)
    return { success: false, advice: 'Koneksi ke Gemini lagi seret Le, coba refresh bentar lagi!' }
  }
})