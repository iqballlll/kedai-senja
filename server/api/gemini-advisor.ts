import { GoogleGenAI } from '@google/genai'

export default defineEventHandler(async (event) => {
  // 1. Ambil API Key Gemini dari runtime config Nuxt 3
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      advice: "Le, API Key Gemininya belum dipasang di .env atau runtimeConfig!"
    }
  }

  // 2. Ambil body data transaksi dengan aman
  const body = await readBody(event)
  const { stats, topProducts } = body

  // Proteksi awal jika data front-end belum siap / kosong
  const revenue = stats?.revenueToday ?? 0
  const modal = stats?.modalToday ?? 0
  const profit = stats?.profitToday ?? 0
  const margin = stats?.marginToday ?? 0
  const sales = stats?.salesToday ?? 0

  // 3. Inisialisasi SDK Gemini resmi
  const ai = new GoogleGenAI({ apiKey })

  // 4. Racik prompt dengan konteks lokal Majalengka yang tajam
  const systemInstruction = `
    Anda adalah seorang konsultan keuangan dan mentor bisnis UMKM kuliner yang sangat cerdas, praktis, dan suportif.
    Gunakan gaya bahasa santai, akrab, blak-blakan khas Indonesia, dan selalu panggil user dengan sebutan 'Le' atau 'Mang'.
    
    Tugas Anda adalah menganalisis data ringkasan penjualan harian dari aplikasi kasir "Kedai Senja" (berlokasi di Kertajati, Majalengka) dan memberikan 1 atau 2 kalimat insight bisnis yang padat, tajam, tanpa basa-basi, dan langsung bisa dieksekusi malam ini atau besok.
    Jangan berikan intro, penutup, atau format markdown formal. Langsung to the point ke inti rekomendasinya.
  `

  let userPrompt = `Berikut adalah data penjualan Kedai Senja hari ini:
    - Total Pendapatan (Revenue): Rp ${revenue.toLocaleString('id-ID')}
    - Total Modal Porsi Terjual (HPP): Rp ${modal.toLocaleString('id-ID')}
    - Keuntungan Bersih (Profit): Rp ${profit.toLocaleString('id-ID')}
    - Margin Keuntungan: ${margin}%
    - Total Porsi Terjual: ${sales} pcs
  `

  if (topProducts && topProducts.length > 0) {
    userPrompt += `\n- Produk Terlaris: ${topProducts.map((p: any) => `${p.name} (${p.qty ?? 0} pcs)`).join(', ')}`
  }

  userPrompt += `\n\nBerikan analisa ringkas dan 1 rekomendasi operasional atau strategi harga/promo taktis yang cocok dengan daya beli pasar lokal Majalengka berdasarkan data tersebut!`

  try {
    // 5. Panggil model gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    })

    // Ambil output text secara aman sesuai spesifikasi SDK terbaru
    const adviceText = response.text || "Belum ada saran taktis malam ini le, jualan terus!"

    return {
      success: true,
      advice: adviceText.trim()
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error)
    return {
      success: false,
      advice: "Aman Le, tapi koneksi ke Gemini AI lagi rada seret nih. Coba refresh beberapa saat lagi ya!"
    }
  }
})