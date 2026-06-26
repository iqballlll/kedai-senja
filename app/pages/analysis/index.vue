<template>
  <div class="dash-root" :class="theme">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🌅</span>
        <span class="brand-name">Kedai Senja</span>
      </div>
      <nav class="sidebar-nav">
        <NuxtLink to="/dashboard" class="nav-item" active-class="active"><span class="nav-icon">📊</span> Dashboard</NuxtLink>
        <NuxtLink to="/menu" class="nav-item" active-class="active"><span class="nav-icon">🍜</span> Menu</NuxtLink>
        <NuxtLink to="/sales" class="nav-item" active-class="active"><span class="nav-icon">💰</span> Sales</NuxtLink>
        <NuxtLink to="/analysis" class="nav-item" active-class="active"><span class="nav-icon">🤖</span> Analysis</NuxtLink>
      </nav>
      <div class="sidebar-bottom">
        <button class="btn-theme" @click="toggleTheme">{{ theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode' }}</button>
        <button class="btn-logout" @click="logout">Sign out</button>
      </div>
    </aside>

    <main class="main">
      <div class="top-bar">
        <div>
          <p class="top-eyebrow">Intelligence</p>
          <h1 class="top-title">Analysis</h1>
        </div>
        <div class="top-tabs">
          <button :class="['tab', activeTab === 'overview' && 'active']" @click="activeTab = 'overview'">Overview</button>
          <button :class="['tab', activeTab === 'products' && 'active']" @click="activeTab = 'products'">Products</button>
          <button :class="['tab', activeTab === 'time' && 'active']" @click="activeTab = 'time'">Time Analysis</button>
          <button :class="['tab', activeTab === 'ai' && 'active']" @click="activeTab = 'ai'">🤖 AI Strategy</button>
          <button :class="['tab', activeTab === 'chat' && 'active']" @click="activeTab = 'chat'">💬 Chat AI</button>
        </div>
      </div>

      <!-- OVERVIEW TAB -->
      <div v-if="activeTab === 'overview'">
        <div class="period-bar">
          <button v-for="p in periods" :key="p.value" :class="['period-btn', activePeriod === p.value && 'active']" @click="activePeriod = p.value">{{ p.label }}</button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">Revenue</p>
            <p class="stat-value">{{ formatRp(overview.revenue) }}</p>
            <p class="stat-sub">{{ activePeriodLabel }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Modal (HPP)</p>
            <p class="stat-value">{{ formatRp(overview.modal) }}</p>
            <p class="stat-sub">total cost</p>
          </div>
          <div class="stat-card highlight">
            <p class="stat-label">Profit</p>
            <p class="stat-value" :class="overview.profit >= 0 ? 'positive' : 'negative'">{{ formatRp(overview.profit) }}</p>
            <p class="stat-sub">margin {{ overview.margin }}%</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Items Sold</p>
            <p class="stat-value">{{ overview.qty }}</p>
            <p class="stat-sub">total pcs</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Avg Daily Revenue</p>
            <p class="stat-value">{{ formatRp(overview.avgDaily) }}</p>
            <p class="stat-sub">per hari</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Best Day</p>
            <p class="stat-value text-sm">{{ overview.bestDay || '-' }}</p>
            <p class="stat-sub">{{ formatRp(overview.bestDayRevenue) }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Avg per Transaksi</p>
            <p class="stat-value">{{ formatRp(overview.avgPerTx) }}</p>
            <p class="stat-sub">per item entry</p>
          </div>
          <div class="stat-card" :class="overview.margin < 20 ? 'danger' : overview.margin < 35 ? 'warning' : 'safe'">
            <p class="stat-label">Health Status</p>
            <p class="stat-value text-sm">{{ overview.margin < 20 ? '⚠️ Tipis' : overview.margin < 35 ? '🟡 Oke' : '✅ Sehat' }}</p>
            <p class="stat-sub">margin {{ overview.margin }}%</p>
          </div>
        </div>

        <!-- Daily chart -->
        <div class="chart-card">
          <h3 class="chart-title">Daily Revenue vs Profit</h3>
          <div class="chart-wrap">
            <div class="chart-bars">
              <div v-for="d in dailyChart" :key="d.date" class="chart-col">
                <div class="bar-group">
                  <div class="bar revenue-bar" :style="{ height: d.revenueH + 'px' }" :title="`Revenue: ${formatRp(d.revenue)}`" />
                  <div class="bar profit-bar" :style="{ height: Math.max(d.profitH, 0) + 'px' }" :title="`Profit: ${formatRp(d.profit)}`" />
                </div>
                <span class="bar-label">{{ d.label }}</span>
              </div>
            </div>
            <div class="chart-legend">
              <span class="legend-dot revenue" /> Revenue
              <span class="legend-dot profit" /> Profit
            </div>
          </div>
        </div>
      </div>

      <!-- PRODUCTS TAB -->
      <div v-if="activeTab === 'products'">
        <div class="period-bar">
          <button v-for="p in periods" :key="p.value" :class="['period-btn', activePeriod === p.value && 'active']" @click="activePeriod = p.value">{{ p.label }}</button>
        </div>

        <div class="product-grid">
          <div v-for="(p, i) in productStats" :key="p.name" class="product-card">
            <div class="product-rank">#{{ i + 1 }}</div>
            <div class="product-info">
              <div class="product-header">
                <span class="product-name">{{ p.name }}</span>
                <span class="product-badge">{{ p.category }}</span>
              </div>
              <div class="product-stats">
                <div class="ps-item">
                  <span class="ps-label">Terjual</span>
                  <span class="ps-val">{{ p.qty }}pcs</span>
                </div>
                <div class="ps-item">
                  <span class="ps-label">Revenue</span>
                  <span class="ps-val td-green">{{ formatRp(p.revenue) }}</span>
                </div>
                <div class="ps-item">
                  <span class="ps-label">Profit</span>
                  <span class="ps-val" :class="p.profit >= 0 ? 'td-green' : 'td-red'">{{ formatRp(p.profit) }}</span>
                </div>
                <div class="ps-item">
                  <span class="ps-label">Margin</span>
                  <span class="ps-val" :class="p.margin < 20 ? 'td-red' : p.margin < 35 ? 'td-orange' : 'td-green'">{{ p.margin }}%</span>
                </div>
                <div class="ps-item">
                  <span class="ps-label">Harga Jual</span>
                  <span class="ps-val">{{ formatRp(p.price) }}</span>
                </div>
                <div class="ps-item">
                  <span class="ps-label">HPP/porsi</span>
                  <span class="ps-val td-red">{{ p.qty > 0 ? formatRp(Math.round(p.modal / p.qty)) : '-' }}</span>
                </div>
              </div>
              <div class="margin-bar-wrap">
                <div class="margin-bar" :style="{ width: Math.min(p.margin, 100) + '%' }" :class="p.margin < 20 ? 'bar-red' : p.margin < 35 ? 'bar-orange' : 'bar-green'" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="productStats.length === 0" class="empty-state">No sales data yet for this period.</div>
      </div>

      <!-- TIME ANALYSIS TAB -->
      <div v-if="activeTab === 'time'">
        <div class="time-grid">
          <!-- Day of week -->
          <div class="time-card">
            <h3 class="time-title">📅 Hari Terbaik</h3>
            <div class="dow-bars">
              <div v-for="d in dayOfWeekStats" :key="d.day" class="dow-row">
                <span class="dow-label">{{ d.day }}</span>
                <div class="dow-bar-wrap">
                  <div class="dow-bar" :style="{ width: d.pct + '%' }" />
                </div>
                <span class="dow-val">{{ formatRp(d.revenue) }}</span>
              </div>
            </div>
          </div>

          <!-- Monthly trend -->
          <div class="time-card">
            <h3 class="time-title">📈 Trend Bulanan</h3>
            <div class="month-list">
              <div v-for="m in monthlyStats" :key="m.month" class="month-row">
                <span class="month-label">{{ m.month }}</span>
                <div class="month-bar-wrap">
                  <div class="month-bar" :style="{ width: m.pct + '%' }" />
                </div>
                <div class="month-vals">
                  <span class="td-green">{{ formatRp(m.revenue) }}</span>
                  <span class="td-muted">{{ m.qty }}pcs</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Season analysis -->
          <div class="time-card full-width">
            <h3 class="time-title">🌦️ Analisis Musim (Konteks Majalengka)</h3>
            <div class="season-grid">
              <div v-for="s in seasonStats" :key="s.name" class="season-card">
                <div class="season-icon">{{ s.icon }}</div>
                <div class="season-info">
                  <p class="season-name">{{ s.name }}</p>
                  <p class="season-period">{{ s.period }}</p>
                  <p class="season-revenue">{{ formatRp(s.revenue) }}</p>
                  <p class="season-qty">{{ s.qty }} pcs terjual</p>
                  <div class="season-tag" :class="s.tagClass">{{ s.tag }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- School season -->
          <div class="time-card full-width">
            <h3 class="time-title">🎒 Musim Sekolah vs Libur</h3>
            <div class="school-compare">
              <div class="school-card">
                <p class="school-label">📚 Musim Sekolah Aktif</p>
                <p class="school-val td-green">{{ formatRp(schoolStats.active.revenue) }}</p>
                <p class="school-sub">{{ schoolStats.active.qty }} pcs · {{ schoolStats.active.days }} hari data</p>
                <p class="school-avg">Avg/hari: {{ formatRp(schoolStats.active.avgDaily) }}</p>
              </div>
              <div class="school-vs">VS</div>
              <div class="school-card">
                <p class="school-label">🏖️ Libur Sekolah</p>
                <p class="school-val" :class="schoolStats.holiday.revenue > schoolStats.active.revenue ? 'td-green' : 'td-red'">{{ formatRp(schoolStats.holiday.revenue) }}</p>
                <p class="school-sub">{{ schoolStats.holiday.qty }} pcs · {{ schoolStats.holiday.days }} hari data</p>
                <p class="school-avg">Avg/hari: {{ formatRp(schoolStats.holiday.avgDaily) }}</p>
              </div>
            </div>
            <div class="school-insight">
              <span class="insight-icon">💡</span>
              <span>{{ schoolInsight }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI STRATEGY TAB -->
      <div v-if="activeTab === 'ai'">
        <div class="ai-section">
          <div class="ai-header">
            <div>
              <h2 class="ai-title">AI Business Strategy</h2>
              <p class="ai-sub">Rekomendasi otomatis berdasarkan data penjualan 30 hari terakhir</p>
            </div>
            <div class="ai-actions">
              <button class="btn-ai" @click="fetchStrategy('strategy')" :disabled="aiLoading">
                <span v-if="aiLoading && aiType === 'strategy'" class="spinner" />
                <span v-else>🎯 Analisis Strategi</span>
              </button>
              <button class="btn-ai secondary" @click="fetchStrategy('pricing')" :disabled="aiLoading">
                <span v-if="aiLoading && aiType === 'pricing'" class="spinner" />
                <span v-else>💰 Analisis Harga</span>
              </button>
            </div>
          </div>

          <div v-if="!aiResult && !aiLoading" class="ai-empty">
            <p>🤖 Klik salah satu tombol di atas untuk dapat rekomendasi AI berdasarkan data bisnis kamu.</p>
          </div>

          <div v-if="aiLoading" class="ai-loading">
            <div class="spinner large" />
            <p>Gemini lagi mikir, sabar bentar Le...</p>
          </div>

          <div v-if="aiResult" class="ai-result">
            <div class="ai-result-header">
              <span class="ai-result-badge">{{ aiType === 'strategy' ? '🎯 Strategi Bisnis' : '💰 Rekomendasi Harga' }}</span>
              <span class="ai-result-time">{{ aiResultTime }}</span>
            </div>
            <div class="ai-result-body" v-html="formatAiText(aiResult)" />
          </div>

          <!-- Product summary for context -->
          <div v-if="productStats.length > 0" class="product-summary">
            <h3 class="ps-title">Data Produk yang Dianalisis</h3>
            <div class="ps-table-wrap">
              <table class="ps-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Qty</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Margin</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in productStats" :key="p.name">
                    <td class="td-name">{{ p.name }}</td>
                    <td>{{ p.qty }}pcs</td>
                    <td class="td-green">{{ formatRp(p.revenue) }}</td>
                    <td :class="p.profit >= 0 ? 'td-green' : 'td-red'">{{ formatRp(p.profit) }}</td>
                    <td :class="p.margin < 20 ? 'td-red' : p.margin < 35 ? 'td-orange' : 'td-green'">{{ p.margin }}%</td>
                    <td>
                      <span class="status-badge" :class="p.margin < 20 ? 'danger' : p.margin < 35 ? 'warn' : 'good'">
                        {{ p.margin < 20 ? '⚠️ Tipis' : p.margin < 35 ? '🟡 Oke' : '✅ Sehat' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAT TAB -->
      <div v-if="activeTab === 'chat'" class="chat-section">
        <div class="chat-header">
          <div class="chat-avatar">🤖</div>
          <div>
            <p class="chat-name">Konsultan AI Kedai Senja</p>
            <p class="chat-status">● Online — tahu data bisnis kamu 30 hari terakhir</p>
          </div>
          <button class="btn-clear-chat" @click="clearChat">Reset</button>
        </div>

        <div class="chat-messages" ref="chatBox">
          <div v-if="chatHistory.length === 0" class="chat-empty">
            <p class="chat-empty-title">Tanya apapun soal bisnis kamu Le 👋</p>
            <div class="chat-suggestions">
              <button v-for="s in suggestions" :key="s" class="suggestion-btn" @click="sendSuggestion(s)">{{ s }}</button>
            </div>
          </div>

          <div v-for="(msg, i) in chatHistory" :key="i" :class="['chat-msg', msg.role]">
            <div class="msg-bubble" v-html="msg.role === 'model' ? formatAiText(msg.text) : msg.text" />
          </div>

          <div v-if="chatLoading" class="chat-msg model">
            <div class="msg-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <div class="chat-input-wrap">
          <input
            v-model="chatInput"
            class="chat-input"
            placeholder="Tanya soal bisnis, promo, harga, strategi..."
            @keydown.enter="sendChat"
          />
          <button class="btn-send" @click="sendChat" :disabled="chatLoading || !chatInput.trim()">
            <span v-if="!chatLoading">➤</span>
            <span v-else class="spinner sm" />
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

const theme = ref('dark')
function toggleTheme() { theme.value = theme.value === 'dark' ? 'light' : 'dark' }

const activeTab = ref('overview')
const activePeriod = ref(30)
const periods = [
  { label: '7 Hari', value: 7 },
  { label: '30 Hari', value: 30 },
  { label: '90 Hari', value: 90 },
  { label: 'All Time', value: 9999 }
]
const activePeriodLabel = computed(() => periods.find(p => p.value === activePeriod.value)?.label || '')

// Fetch all sales
const { data: allSales } = await useAsyncData('all-sales', async () => {
  const { data } = await supabase
    .from('sales')
    .select('*, menus(id, name, price, category)')
    .order('date', { ascending: true })
  return data || []
})

// Filtered sales by period
const filteredSales = computed(() => {
  if (activePeriod.value === 9999) return allSales.value
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - activePeriod.value)
  return allSales.value.filter(s => new Date(s.date) >= cutoff)
})

// Overview stats
const overview = computed(() => {
  const sales = filteredSales.value
  const revenue = sales.reduce((a, s) => a + s.qty_sold * (s.menus?.price || 0), 0)
  const modal = sales.reduce((a, s) => a + s.modal, 0)
  const profit = revenue - modal
  const qty = sales.reduce((a, s) => a + s.qty_sold, 0)
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0

  // Best day
  const dayMap: Record<string, number> = {}
  for (const s of sales) {
    dayMap[s.date] = (dayMap[s.date] || 0) + s.qty_sold * (s.menus?.price || 0)
  }
  const days = Object.entries(dayMap)
  const best = days.sort((a, b) => b[1] - a[1])[0]
  const uniqueDays = days.length || 1
  const avgDaily = Math.round(revenue / uniqueDays)
  const avgPerTx = sales.length > 0 ? Math.round(revenue / sales.length) : 0

  return {
    revenue, modal, profit, qty, margin,
    bestDay: best?.[0] || null,
    bestDayRevenue: best?.[1] || 0,
    avgDaily, avgPerTx
  }
})

// Daily chart data
const dailyChart = computed(() => {
  const sales = filteredSales.value
  const dayMap: Record<string, { revenue: number, profit: number }> = {}
  for (const s of sales) {
    if (!dayMap[s.date]) dayMap[s.date] = { revenue: 0, profit: 0 }
    const rev = s.qty_sold * (s.menus?.price || 0)
    dayMap[s.date].revenue += rev
    dayMap[s.date].profit += rev - s.modal
  }

  const entries = Object.entries(dayMap).slice(-20)
  const maxRev = Math.max(...entries.map(e => e[1].revenue), 1)

  return entries.map(([date, d]) => ({
    date,
    label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    revenue: d.revenue,
    profit: d.profit,
    revenueH: Math.round((d.revenue / maxRev) * 120),
    profitH: Math.round((d.profit / maxRev) * 120)
  }))
})

// Product stats
const productStats = computed(() => {
  const map: Record<string, any> = {}
  for (const s of filteredSales.value) {
    const id = s.menus?.id
    if (!id) continue
    if (!map[id]) map[id] = { name: s.menus.name, category: s.menus.category, price: s.menus.price, qty: 0, revenue: 0, modal: 0 }
    map[id].qty += s.qty_sold
    map[id].revenue += s.qty_sold * s.menus.price
    map[id].modal += s.modal
  }
  return Object.values(map).map((p: any) => ({
    ...p,
    profit: p.revenue - p.modal,
    margin: p.revenue > 0 ? Math.round(((p.revenue - p.modal) / p.revenue) * 100) : 0
  })).sort((a, b) => b.qty - a.qty)
})

// Day of week stats
const dayOfWeekStats = computed(() => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const map: Record<string, number> = {}
  for (const d of days) map[d] = 0
  for (const s of allSales.value) {
    const day = days[new Date(s.date).getDay()]
    map[day] += s.qty_sold * (s.menus?.price || 0)
  }
  const max = Math.max(...Object.values(map), 1)
  return days.map(d => ({ day: d, revenue: map[d], pct: Math.round((map[d] / max) * 100) }))
})

// Monthly stats
const monthlyStats = computed(() => {
  const map: Record<string, { revenue: number, qty: number }> = {}
  for (const s of allSales.value) {
    const key = new Date(s.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    if (!map[key]) map[key] = { revenue: 0, qty: 0 }
    map[key].revenue += s.qty_sold * (s.menus?.price || 0)
    map[key].qty += s.qty_sold
  }
  const entries = Object.entries(map)
  const max = Math.max(...entries.map(e => e[1].revenue), 1)
  return entries.map(([month, d]) => ({ month, ...d, pct: Math.round((d.revenue / max) * 100) }))
})

// Season stats (Majalengka context)
const seasonStats = computed(() => {
  const seasons = [
    { name: 'Musim Hujan', icon: '🌧️', months: [10, 11, 12, 1, 2, 3], period: 'Okt–Mar', tag: '', tagClass: '' },
    { name: 'Musim Kemarau', icon: '☀️', months: [4, 5, 6, 7, 8, 9], period: 'Apr–Sep', tag: '', tagClass: '' },
    { name: 'Ramadan & Lebaran', icon: '🌙', months: [], period: 'Kondisional', tag: '', tagClass: '' },
    { name: 'Libur Sekolah', icon: '🎒', months: [6, 7, 12], period: 'Jun–Jul, Des', tag: '', tagClass: '' },
  ]

  return seasons.map(s => {
    let revenue = 0, qty = 0
    for (const sale of allSales.value) {
      const month = new Date(sale.date).getMonth() + 1
      if (s.months.includes(month)) {
        revenue += sale.qty_sold * (sale.menus?.price || 0)
        qty += sale.qty_sold
      }
    }
    const tag = qty === 0 ? 'Belum ada data' : revenue > 500000 ? '🔥 Ramai' : revenue > 200000 ? '🟡 Normal' : '❄️ Sepi'
    const tagClass = qty === 0 ? 'neutral' : revenue > 500000 ? 'hot' : revenue > 200000 ? 'warm' : 'cold'
    return { ...s, revenue, qty, tag, tagClass }
  })
})

// School vs holiday
const schoolStats = computed(() => {
  const holidayMonths = [6, 7, 12]
  const active = { revenue: 0, qty: 0, days: new Set<string>() }
  const holiday = { revenue: 0, qty: 0, days: new Set<string>() }

  for (const s of allSales.value) {
    const month = new Date(s.date).getMonth() + 1
    const target = holidayMonths.includes(month) ? holiday : active
    target.revenue += s.qty_sold * (s.menus?.price || 0)
    target.qty += s.qty_sold
    target.days.add(s.date)
  }

  const activeDays = active.days.size || 1
  const holidayDays = holiday.days.size || 1

  return {
    active: { revenue: active.revenue, qty: active.qty, days: activeDays, avgDaily: Math.round(active.revenue / activeDays) },
    holiday: { revenue: holiday.revenue, qty: holiday.qty, days: holidayDays, avgDaily: Math.round(holiday.revenue / holidayDays) }
  }
})

const schoolInsight = computed(() => {
  const a = schoolStats.value.active.avgDaily
  const h = schoolStats.value.holiday.avgDaily
  if (a === 0 && h === 0) return 'Belum cukup data untuk analisis musim sekolah.'
  if (a > h) return `Musim sekolah lebih ramai ${Math.round(((a - h) / Math.max(h, 1)) * 100)}% dibanding libur. Fokus promo saat sekolah aktif!`
  if (h > a) return `Libur sekolah justru lebih ramai ${Math.round(((h - a) / Math.max(a, 1)) * 100)}% dibanding hari sekolah. Siapkan stok lebih saat libur!`
  return 'Penjualan relatif stabil antara musim sekolah dan libur.'
})

// AI Strategy
const aiResult = ref('')
const aiLoading = ref(false)
const aiType = ref('strategy')
const aiResultTime = ref('')

async function fetchStrategy(type: string) {
  aiLoading.value = true
  aiType.value = type
  aiResult.value = ''
  const res = await $fetch('/api/analysis', { method: 'POST', body: { type } })
  aiResult.value = (res as any).advice || 'Tidak ada rekomendasi.'
  aiResultTime.value = new Date().toLocaleTimeString('id-ID')
  aiLoading.value = false
}

// Chat
const chatHistory = ref<{ role: string, text: string }[]>([])
const chatInput = ref('')
const chatLoading = ref(false)
const chatBox = ref<HTMLElement>()

const suggestions = [
  'Produk mana yang paling untung?',
  'Kapan waktu terbaik buat promo?',
  'Harga menu mana yang perlu naik?',
  'Gimana cara ningkatin penjualan minuman?',
  'Promo apa yang cocok buat hari Jumat?',
  'Produk mana yang harus di-push minggu ini?'
]

async function sendChat() {
  const msg = chatInput.value.trim()
  if (!msg || chatLoading.value) return
  chatHistory.value.push({ role: 'user', text: msg })
  chatInput.value = ''
  chatLoading.value = true
  await nextTick()
  scrollChat()

  const res = await $fetch('/api/chat', {
    method: 'POST',
    body: {
      message: msg,
      history: chatHistory.value.slice(-10).map(h => ({ role: h.role, text: h.text }))
    }
  })
  chatHistory.value.push({ role: 'model', text: (res as any).reply || 'Hmm gua bingung Le, coba tanya lagi!' })
  chatLoading.value = false
  await nextTick()
  scrollChat()
}

function sendSuggestion(s: string) {
  chatInput.value = s
  sendChat()
}

function clearChat() { chatHistory.value = [] }

function scrollChat() {
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}

function formatAiText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s(.+)$/gm, '<p class="ai-heading">$1</p>')
    .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

function formatRp(val: number) { return 'Rp ' + (val || 0).toLocaleString('id-ID') }

async function logout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>


* { box-sizing: border-box; margin: 0; padding: 0; }

.dark {
  --bg: #0f0f0f; --sidebar-bg: #141414; --border: #1e1e1e; --border2: #1a1a1a;
  --text: #ffffff; --text-muted: rgba(255,255,255,0.4); --text-dim: rgba(255,255,255,0.3);
  --text-body: rgba(255,255,255,0.75); --card-bg: #141414; --highlight-bg: #1a0e00;
  --highlight-border: #3d1a00; --nav-active-bg: #1f1510; --nav-hover-bg: #1e1e1e;
  --badge-bg: #1f1510; --input-bg: #1a1a1a; --input-border: #2a2a2a;
  --accent: #e07b39; --accent2: #c45e1e; --entry-bg: #181818;
  --chat-user: #1f1510; --chat-model: #141414;
}

.light {
  --bg: #f5f5f0; --sidebar-bg: #ffffff; --border: #e8e8e3; --border2: #efefea;
  --text: #111111; --text-muted: rgba(0,0,0,0.45); --text-dim: rgba(0,0,0,0.3);
  --text-body: rgba(0,0,0,0.75); --card-bg: #ffffff; --highlight-bg: #fff5ee;
  --highlight-border: #f5c9a0; --nav-active-bg: #fff0e6; --nav-hover-bg: #f5f5f0;
  --badge-bg: #fff0e6; --input-bg: #f5f5f0; --input-border: #e0e0db;
  --accent: #e07b39; --accent2: #c45e1e; --entry-bg: #fafaf7;
  --chat-user: #fff0e6; --chat-model: #ffffff;
}

.dash-root { display: flex; min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; }
.sidebar { width: 240px; background: var(--sidebar-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 28px 16px; position: fixed; top: 0; left: 0; bottom: 0; }
.sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 36px; }
.brand-icon { font-size: 24px; }
.brand-name { font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--text-muted); text-decoration: none; transition: all 0.15s; }
.nav-item:hover { background: var(--nav-hover-bg); color: var(--text); }
.nav-item.active { background: var(--nav-active-bg); color: var(--accent); }
.nav-icon { font-size: 16px; }
.sidebar-bottom { display: flex; flex-direction: column; gap: 8px; }
.btn-theme { background: var(--input-bg); border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; }
.btn-theme:hover { color: var(--text); }
.btn-logout { background: none; border: 1px solid var(--border); color: var(--text-dim); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; }
.btn-logout:hover { border-color: #ff6b6b; color: #ff6b6b; }

.main { margin-left: 240px; flex: 1; padding: 40px; }

.top-bar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
.top-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.top-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }

.top-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.tab { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-muted); transition: all 0.15s; }
.tab:hover { color: var(--text); }
.tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.period-bar { display: flex; gap: 8px; margin-bottom: 24px; }
.period-btn { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-muted); transition: all 0.15s; }
.period-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* STATS GRID */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
.stat-card.highlight { border-color: var(--highlight-border); background: var(--highlight-bg); }
.stat-card.danger { border-color: rgba(220,38,38,0.4); background: rgba(220,38,38,0.05); }
.stat-card.warning { border-color: rgba(234,179,8,0.4); background: rgba(234,179,8,0.05); }
.stat-card.safe { border-color: rgba(22,163,74,0.4); background: rgba(22,163,74,0.05); }
.stat-label { font-size: 11px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.stat-value { font-size: 20px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
.stat-value.text-sm { font-size: 14px; }
.stat-value.positive { color: #16a34a; }
.stat-value.negative { color: #dc2626; }
.stat-sub { margin-top: 4px; font-size: 11px; color: var(--text-dim); }

/* CHART */
.chart-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.chart-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; }
.chart-wrap { overflow-x: auto; }
.chart-bars { display: flex; align-items: flex-end; gap: 6px; min-height: 140px; padding-bottom: 24px; min-width: 600px; }
.chart-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 28px; }
.bar-group { display: flex; gap: 2px; align-items: flex-end; }
.bar { width: 12px; border-radius: 3px 3px 0 0; transition: height 0.3s; min-height: 2px; }
.revenue-bar { background: var(--accent); opacity: 0.8; }
.profit-bar { background: #16a34a; opacity: 0.8; }
.bar-label { font-size: 9px; color: var(--text-dim); text-align: center; white-space: nowrap; }
.chart-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; color: var(--text-muted); }
.legend-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 4px; }
.legend-dot.revenue { background: var(--accent); }
.legend-dot.profit { background: #16a34a; }

/* PRODUCTS */
.product-grid { display: flex; flex-direction: column; gap: 12px; }
.product-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; gap: 16px; align-items: flex-start; }
.product-rank { font-size: 20px; font-weight: 900; color: var(--accent); opacity: 0.5; min-width: 32px; margin-top: 2px; }
.product-info { flex: 1; }
.product-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.product-name { font-size: 16px; font-weight: 700; color: var(--text); }
.product-badge { background: var(--badge-bg); color: var(--accent); font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; border: 1px solid var(--highlight-border); }
.product-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 10px; }
.ps-item { display: flex; flex-direction: column; gap: 3px; }
.ps-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.3px; }
.ps-val { font-size: 13px; font-weight: 600; color: var(--text); }
.margin-bar-wrap { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
.margin-bar { height: 100%; border-radius: 2px; transition: width 0.5s; }
.bar-green { background: #16a34a; }
.bar-orange { background: #f59e0b; }
.bar-red { background: #dc2626; }

/* TIME */
.time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.time-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; }
.time-card.full-width { grid-column: 1 / -1; }
.time-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.dow-bars { display: flex; flex-direction: column; gap: 10px; }
.dow-row { display: flex; align-items: center; gap: 10px; }
.dow-label { font-size: 12px; font-weight: 600; color: var(--text-muted); min-width: 60px; }
.dow-bar-wrap { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
.dow-bar { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.5s; }
.dow-val { font-size: 12px; color: var(--text-muted); min-width: 100px; text-align: right; }
.month-list { display: flex; flex-direction: column; gap: 10px; }
.month-row { display: flex; align-items: center; gap: 10px; }
.month-label { font-size: 12px; font-weight: 600; color: var(--text-muted); min-width: 70px; }
.month-bar-wrap { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
.month-bar { height: 100%; background: #16a34a; border-radius: 4px; }
.month-vals { display: flex; flex-direction: column; align-items: flex-end; min-width: 100px; }
.month-vals span { font-size: 11px; }
.season-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.season-card { background: var(--entry-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; display: flex; gap: 12px; }
.season-icon { font-size: 28px; }
.season-name { font-size: 13px; font-weight: 700; color: var(--text); }
.season-period { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
.season-revenue { font-size: 14px; font-weight: 700; color: #16a34a; margin-top: 8px; }
.season-qty { font-size: 11px; color: var(--text-muted); }
.season-tag { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; margin-top: 6px; display: inline-block; }
.season-tag.hot { background: rgba(239,68,68,0.1); color: #ef4444; }
.season-tag.warm { background: rgba(234,179,8,0.1); color: #ca8a04; }
.season-tag.cold { background: rgba(59,130,246,0.1); color: #3b82f6; }
.season-tag.neutral { background: var(--border); color: var(--text-dim); }
.school-compare { display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center; margin-bottom: 16px; }
.school-card { background: var(--entry-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; }
.school-label { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
.school-val { font-size: 22px; font-weight: 800; }
.school-sub { font-size: 12px; color: var(--text-dim); margin-top: 4px; }
.school-avg { font-size: 13px; color: var(--text-muted); margin-top: 6px; font-weight: 600; }
.school-vs { font-size: 18px; font-weight: 900; color: var(--text-dim); text-align: center; }
.school-insight { background: var(--highlight-bg); border: 1px solid var(--highlight-border); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: var(--text-body); display: flex; gap: 10px; align-items: flex-start; }
.insight-icon { font-size: 16px; flex-shrink: 0; }

/* AI */
.ai-section { display: flex; flex-direction: column; gap: 20px; }
.ai-header { display: flex; justify-content: space-between; align-items: flex-start; }
.ai-title { font-size: 20px; font-weight: 700; }
.ai-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.ai-actions { display: flex; gap: 10px; }
.btn-ai { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; font-size: 13px; font-weight: 600; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; display: flex; align-items: center; gap: 8px; min-width: 160px; justify-content: center; }
.btn-ai.secondary { background: var(--card-bg); border: 1px solid var(--highlight-border); color: var(--accent); }
.btn-ai:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-empty { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }
.ai-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: var(--text-muted); font-size: 14px; }
.ai-result { background: var(--card-bg); border: 1px solid var(--highlight-border); border-radius: 12px; padding: 24px; }
.ai-result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ai-result-badge { background: var(--highlight-bg); color: var(--accent); font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; border: 1px solid var(--highlight-border); }
.ai-result-time { font-size: 11px; color: var(--text-dim); }
.ai-result-body { font-size: 14px; line-height: 1.7; color: var(--text-body); }
.ai-result-body :deep(.ai-heading) { font-size: 15px; font-weight: 700; color: var(--text); margin: 12px 0 6px; }
.ai-result-body :deep(ul) { padding-left: 20px; margin: 8px 0; }
.ai-result-body :deep(li) { margin: 4px 0; }
.ai-result-body :deep(strong) { color: var(--text); font-weight: 700; }
.product-summary { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
.ps-title { font-size: 14px; font-weight: 700; margin-bottom: 14px; }
.ps-table-wrap { overflow-x: auto; }
.ps-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ps-table th { padding: 8px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border); text-align: left; }
.ps-table td { padding: 10px 12px; border-bottom: 1px solid var(--border2); color: var(--text-body); }
.ps-table tr:last-child td { border-bottom: none; }
.status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
.status-badge.good { background: rgba(22,163,74,0.1); color: #16a34a; }
.status-badge.warn { background: rgba(234,179,8,0.1); color: #ca8a04; }
.status-badge.danger { background: rgba(220,38,38,0.1); color: #dc2626; }

/* CHAT */
.chat-section { display: flex; flex-direction: column; height: calc(100vh - 160px); }
.chat-header { display: flex; align-items: center; gap: 14px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px 12px 0 0; padding: 16px 20px; }
.chat-avatar { font-size: 28px; }
.chat-name { font-size: 15px; font-weight: 700; color: var(--text); }
.chat-status { font-size: 12px; color: #16a34a; margin-top: 2px; }
.btn-clear-chat { margin-left: auto; background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
.btn-clear-chat:hover { color: var(--text); }
.chat-messages { flex: 1; overflow-y: auto; background: var(--entry-bg); border-left: 1px solid var(--border); border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.chat-empty { text-align: center; padding: 20px; }
.chat-empty-title { font-size: 15px; font-weight: 600; color: var(--text-muted); margin-bottom: 16px; }
.chat-suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.suggestion-btn { background: var(--card-bg); border: 1px solid var(--border); color: var(--text-muted); border-radius: 20px; padding: 8px 14px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.suggestion-btn:hover { border-color: var(--accent); color: var(--accent); }
.chat-msg { display: flex; }
.chat-msg.user { justify-content: flex-end; }
.chat-msg.model { justify-content: flex-start; }
.msg-bubble { max-width: 70%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; }
.chat-msg.user .msg-bubble { background: var(--chat-user); border: 1px solid var(--highlight-border); color: var(--text); border-radius: 12px 12px 2px 12px; }
.chat-msg.model .msg-bubble { background: var(--chat-model); border: 1px solid var(--border); color: var(--text-body); border-radius: 12px 12px 12px 2px; }
.msg-bubble :deep(.ai-heading) { font-size: 14px; font-weight: 700; color: var(--text); margin: 8px 0 4px; }
.msg-bubble :deep(ul) { padding-left: 18px; margin: 6px 0; }
.msg-bubble :deep(li) { margin: 3px 0; }
.msg-bubble :deep(strong) { color: var(--text); font-weight: 700; }
.typing { display: flex; gap: 4px; align-items: center; padding: 14px 16px; }
.typing span { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: bounce 1.2s infinite; }
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
.chat-input-wrap { display: flex; gap: 10px; background: var(--card-bg); border: 1px solid var(--border); border-top: none; border-radius: 0 0 12px 12px; padding: 14px 16px; }
.chat-input { flex: 1; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 8px; padding: 10px 14px; font-size: 14px; color: var(--text); outline: none; font-family: inherit; }
.chat-input:focus { border-color: var(--accent); }
.btn-send { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; border: none; border-radius: 8px; width: 42px; height: 42px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

/* SHARED */
.td-name { font-weight: 600; color: var(--text); }
.td-green { color: #16a34a; font-weight: 600; }
.td-red { color: #dc2626; }
.td-orange { color: #f59e0b; }
.td-muted { color: var(--text-dim); font-size: 12px; }
.empty-state { text-align: center; color: var(--text-dim); padding: 60px; font-size: 14px; }

.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
.spinner.large { width: 28px; height: 28px; border-width: 3px; }
.spinner.sm { width: 14px; height: 14px; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .dash-root { flex-direction: column; }
  .sidebar { position: fixed; bottom: 0; left: 0; right: 0; top: auto; width: 100%; height: 64px; flex-direction: row; padding: 0 8px; border-right: none; border-top: 1px solid var(--border); z-index: 100; }
  .sidebar-brand { display: none; }
  .sidebar-bottom { display: none; }
  .sidebar-nav { flex-direction: row; justify-content: space-around; align-items: center; flex: 1; gap: 0; }
  .nav-item { flex-direction: column; gap: 2px; padding: 6px 8px; font-size: 9px; text-align: center; }
  .nav-icon { font-size: 20px; }
  .main { margin-left: 0 !important; padding: 16px 14px 80px !important; }
  .top-bar { flex-direction: column; gap: 12px; }
  .top-tabs { gap: 4px; flex-wrap: wrap; }
  .tab { padding: 6px 10px; font-size: 11px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; }
  .product-stats { grid-template-columns: repeat(2, 1fr); }
  .time-grid { grid-template-columns: 1fr; }
  .time-card.full-width { grid-column: 1; }
  .season-grid { grid-template-columns: repeat(2, 1fr); }
  .school-compare { grid-template-columns: 1fr; gap: 10px; }
  .school-vs { display: none; }
  .ai-header { flex-direction: column; gap: 12px; }
  .ai-actions { flex-direction: column; width: 100%; }
  .btn-ai { width: 100%; }
  .msg-bubble { max-width: 90%; }
  .chat-section { height: calc(100vh - 120px); }
  .chart-bars { min-width: 400px; }
}
</style>