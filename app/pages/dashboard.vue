<template>
  <div class="dash-root" :class="theme">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🌅</span>
        <span class="brand-name">Kedai Senja</span>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink to="/dashboard" class="nav-item" active-class="active">
          <span class="nav-icon">📊</span> Dashboard
        </NuxtLink>
        <NuxtLink to="/menu" class="nav-item" active-class="active">
          <span class="nav-icon">🍜</span> Menu
        </NuxtLink>
        <NuxtLink to="/sales" class="nav-item" active-class="active">
          <span class="nav-icon">💰</span> Sales
        </NuxtLink>
        <NuxtLink to="/analysis" class="nav-item" active-class="active">
          <span class="nav-icon">🤖</span> Analysis
        </NuxtLink>
      </nav>

      <div class="sidebar-bottom">
        <button class="btn-theme" @click="toggleTheme">
          {{ theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode' }}
        </button>
        <button class="btn-logout" @click="logout">Sign out</button>
      </div>
    </aside>

    <nav class="bottom-nav">
      <NuxtLink to="/dashboard" class="bnav-item" active-class="active">
        <span class="bnav-icon">📊</span>
        <span class="bnav-label">Dash</span>
      </NuxtLink>
      <NuxtLink to="/menu" class="bnav-item" active-class="active">
        <span class="bnav-icon">🍜</span>
        <span class="bnav-label">Menu</span>
      </NuxtLink>
      <NuxtLink to="/sales" class="bnav-item" active-class="active">
        <span class="bnav-icon">💰</span>
        <span class="bnav-label">Sales</span>
      </NuxtLink>
      <NuxtLink to="/analysis" class="bnav-item" active-class="active">
        <span class="bnav-icon">🤖</span>
        <span class="bnav-label">AI</span>
      </NuxtLink>
      <button class="bnav-item btn-theme-toggle" @click="toggleTheme">
        <span class="bnav-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
        <span class="bnav-label">Mode</span>
      </button>
    </nav>

    <main class="main">
      <div class="top-bar">
        <div>
          <p class="top-eyebrow">Overview</p>
          <h1 class="top-title">Dashboard</h1>
        </div>
        <div class="top-date">{{ today }}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">Items Sold Today</p>
          <p class="stat-value">{{ stats.salesToday }} <span class="unit">pcs</span></p>
          <p class="stat-sub">from {{ stats.totalMenu }} variants</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Revenue Today</p>
          <p class="stat-value">{{ formatRp(stats.revenueToday) }}</p>
          <p class="stat-sub">gross income generated</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">HPP Today (Cost)</p>
          <p class="stat-value text-cost">{{ formatRp(stats.modalToday) }}</p>
          <p class="stat-sub">capital cost from sold items</p>
        </div>
        <div class="stat-card highlight" :class="stats.profitToday >= 0 ? 'profit-positive' : 'profit-negative'">
          <p class="stat-label">Profit Today</p>
          <p class="stat-value" :class="stats.profitToday >= 0 ? 'positive' : 'negative'">
            {{ formatRp(stats.profitToday) }}
          </p>
          <p class="stat-sub">margin {{ stats.marginToday }}%</p>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Recent Sales</h2>
          <NuxtLink to="/sales/add" class="btn-add">+ Add</NuxtLink>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Menu</th>
                <th class="hide-on-mobile">Category</th>
                <th>Qty</th>
                <th>Revenue</th>
                <th class="hide-on-mobile">HPP Pokok</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentSales.length === 0">
                <td colspan="7" class="empty">No sales data yet</td>
              </tr>
              <tr v-for="s in recentSales" :key="s.id">
                <td class="td-muted">{{ formatTime(s.created_at) }}</td>
                <td class="td-name">{{ s.menus?.name }}</td>
                <td class="hide-on-mobile"><span class="badge">{{ s.menus?.category }}</span></td>
                <td>{{ s.qty_sold }}x</td>
                <td class="td-green">{{ formatRp(s.qty_sold * s.menus?.price) }}</td>
                <td class="td-cost-row hide-on-mobile">{{ formatRp(s.modal) }}</td>
                <td :class="(s.qty_sold * s.menus?.price - s.modal) >= 0 ? 'td-green' : 'td-red'">
                  {{ formatRp(s.qty_sold * s.menus?.price - s.modal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="widgets-grid">
        <div class="widget-card">
          <h3 class="widget-title">🔥 Terlaris Hari Ini</h3>
          <div class="top-menus-list">
            <div v-if="topMenus.length === 0" class="widget-empty">Belum ada data porsi terjual.</div>
            <div v-for="(item, idx) in topMenus" :key="idx" class="top-menu-item">
              <div class="top-menu-info">
                <span class="top-menu-rank">#{{ idx + 1 }}</span>
                <span class="top-menu-name">{{ item.name }}</span>
                <span class="top-menu-qty">{{ item.qty }} pcs</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" :style="{ width: item.percentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="widget-card ai-card">
          <div class="ai-header">
            <span class="ai-icon">🤖</span>
            <h3 class="widget-title ai-title">Gemini Business Insight</h3>
          </div>
          <div class="ai-content">
            <p v-if="loadingAI" class="ai-loading">Mengkalkulasi matriks finansial...</p>
            <p v-else class="ai-text">
              {{ aiAdvice || `"Le, penjualan Cipay mendominasi omsetmu hari ini. Amankan stok bahan baku untuk lonjakan besok malam!"` }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const router = useRouter()

const theme = ref('dark')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const todayISO = new Date().toISOString().split('T')[0]

const aiAdvice = ref('')
const loadingAI = ref(false)

const { data: menus } = await useAsyncData('menus', async () => {
  const { data } = await supabase.from('menus').select('*')
  return data || []
})

const { data: salesTodayData } = await useAsyncData('sales-today', async () => {
  const { data } = await supabase
    .from('sales')
    .select('*, menus(name, price, category)')
    .eq('date', todayISO)
  return data || []
})

const { data: recentSales } = await useAsyncData('recent-sales', async () => {
  const { data } = await supabase
    .from('sales')
    .select('*, menus(name, price, category)')
    .order('created_at', { ascending: false })
    .limit(8)
  return data || []
})

const stats = computed(() => {
  const totalMenu = menus.value?.length || 0
  const salesToday = salesTodayData.value?.reduce((a, s) => a + s.qty_sold, 0) || 0
  const revenueToday = salesTodayData.value?.reduce((a, s) => a + (s.qty_sold * (s.menus?.price || 0)), 0) || 0
  const modalToday = salesTodayData.value?.reduce((a, s) => a + s.modal, 0) || 0
  const profitToday = revenueToday - modalToday
  const marginToday = revenueToday > 0 ? Math.round((profitToday / revenueToday) * 100) : 0
  return { totalMenu, salesToday, revenueToday, modalToday, profitToday, marginToday }
})

const topMenus = computed(() => {
  if (!salesTodayData.value || salesTodayData.value.length === 0) return []
  
  const aggregation = {}
  salesTodayData.value.forEach(s => {
    const name = s.menus?.name || 'Unknown'
    aggregation[name] = (aggregation[name] || 0) + s.qty_sold
  })

  const sorted = Object.keys(aggregation).map(name => ({
    name,
    qty: aggregation[name]
  })).sort((a, b) => b.qty - a.qty)

  const maxQty = sorted[0]?.qty || 1
  return sorted.slice(0, 3).map(item => ({
    ...item,
    percentage: Math.min(Math.round((item.qty / maxQty) * 100), 100)
  }))
})

function formatRp(val) {
  return 'Rp ' + (val || 0).toLocaleString('id-ID')
}

function formatTime(isoString) {
  if (!isoString) return '--:--'
  const date = new Date(isoString)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

async function logout() {
  await supabase.auth.signOut()
  router.push('/login')
}

async function fetchDashboardInsight() {
  if (stats.value.salesToday === 0) return
  loadingAI.value = true
  try {
    const response = await $fetch('/api/gemini-advisor', {
      method: 'POST',
      body: { 
        type: 'dashboard_summary',
        stats: stats.value,
        topProducts: topMenus.value 
      }
    })
    if (response.success) aiAdvice.value = response.advice
  } catch (err) {
    console.error("Gagal memuat insight AI:", err)
  } finally {
    loadingAI.value = false
  }
}

onMounted(() => {
  fetchDashboardInsight()
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.dash-root {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  flex-direction: column; /* Biar gampang ditumpuk di mobile */
}

@media (min-width: 1025px) {
  .dash-root { flex-direction: row; }
}

.dark {
  --bg: #0f0f0f;
  --sidebar-bg: #141414;
  --border: #1e1e1e;
  --border2: #1a1a1a;
  --text: #ffffff;
  --text-muted: rgba(255,255,255,0.4);
  --text-dim: rgba(255,255,255,0.3);
  --text-body: rgba(255,255,255,0.75);
  --card-bg: #141414;
  --highlight-bg: #1a0e00;
  --highlight-border: #3d1a00;
  --nav-active-bg: #1f1510;
  --nav-hover-bg: #1e1e1e;
  --row-hover: #181818;
  --badge-bg: #1f1510;
  --input-bg: #1a1a1a;
  --accent: #e07b39;
  --accent2: #c45e1e;
}

.light {
  --bg: #f5f5f0;
  --sidebar-bg: #ffffff;
  --border: #e8e8e3;
  --border2: #efefea;
  --text: #111111;
  --text-muted: rgba(0,0,0,0.45);
  --text-dim: rgba(0,0,0,0.3);
  --text-body: rgba(0,0,0,0.75);
  --card-bg: #ffffff;
  --highlight-bg: #fff5ee;
  --highlight-border: #f5c9a0;
  --nav-active-bg: #fff0e6;
  --nav-hover-bg: #f5f5f0;
  --row-hover: #fafaf7;
  --badge-bg: #fff0e6;
  --input-bg: #f5f5f0;
  --accent: #e07b39;
  --accent2: #c45e1e;
}

.dash-root { background: var(--bg); color: var(--text); }

/* SIDEBAR DESKTOP */
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  display: none; /* Sembunyi secara default di mobile */
  flex-direction: column;
  padding: 28px 16px;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
}

@media (min-width: 1025px) {
  .sidebar { display: flex; }
}

.sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 36px; }
.brand-icon { font-size: 24px; }
.brand-name { font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.15s;
}
.nav-item:hover { background: var(--nav-hover-bg); color: var(--text); }
.nav-item.active { background: var(--nav-active-bg); color: var(--accent); }
.nav-icon { font-size: 16px; }
.sidebar-bottom { display: flex; flex-direction: column; gap: 8px; }

.btn-theme {
  background: var(--input-bg);
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-theme:hover { color: var(--text); }

.btn-logout {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  cursor: pointer;
}
.btn-logout:hover { border-color: #ff6b6b; color: #ff6b6b; }

/* BOTTOM NAVIGATION (MOBILE) */
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 64px;
  background: var(--sidebar-bg);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 999;
  padding: 0 8px;
}

@media (min-width: 1025px) {
  .bottom-nav { display: none; } /* Sembunyi di Desktop */
}

.bnav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 10px;
  font-weight: 600;
  flex: 1;
  height: 100%;
  gap: 3px;
}
.bnav-item.active { color: var(--accent); }
.bnav-icon { font-size: 18px; }
.btn-theme-toggle { background: none; border: none; cursor: pointer; }

/* MAIN AREA */
.main { 
  flex: 1; 
  padding: 20px 16px 100px 16px; /* Padding bawah digemukin biar gak ketutup bottom nav di HP */
}

@media (min-width: 1025px) {
  .main { margin-left: 240px; padding: 40px; }
}

.top-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 24px;
}

@media (min-width: 640px) {
  .top-bar { flex-direction: row; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
}

.top-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); }
.top-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
@media (min-width: 1025px) { .top-title { font-size: 28px; } }
.top-date { font-size: 12px; color: var(--text-dim); }

/* STATS GRID MOBILE FRIENDLY */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr; /* 1 Kolom di HP */
  gap: 12px;
  margin-bottom: 24px;
}

@media (min-width: 550px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } } /* 2 Kolom di Tablet */
@media (min-width: 1200px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } } /* 4 Kolom di Monitor Gede */

.stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }
@media (min-width: 1025px) { .stat-card { padding: 20px 22px; } }

.stat-card.highlight { border-color: var(--highlight-border); background: var(--highlight-bg); }
.stat-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.stat-value { font-size: 20px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
@media (min-width: 1025px) { .stat-value { font-size: 24px; } }
.stat-value.positive { color: #16a34a; }
.stat-value.negative { color: #dc2626; }
.stat-sub { margin-top: 4px; font-size: 11px; color: var(--text-dim); }

/* TABLE RESPONSIVE */
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-title { font-size: 16px; font-weight: 700; }
@media (min-width: 1025px) { .section-title { font-size: 18px; } }

.btn-add {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; padding: 6px 14px; text-decoration: none;
}

.table-wrap { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow-x: auto; } /* Bisa di-swipe horizontal kalau layarnya kesempitan */
.table { width: 100%; border-collapse: collapse; min-width: 450px; } /* Mencegah tabel bonyok merapat di HP */

.table th { padding: 10px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); text-align: left; }
.table td { padding: 11px 12px; font-size: 13px; color: var(--text-body); border-bottom: 1px solid var(--border2); }
.table tr:last-child td { border-bottom: none; }

.td-name { font-weight: 600; color: var(--text); }
.td-green { color: #16a34a; font-weight: 600; }
.td-red { color: #dc2626; }
.td-muted { color: var(--text-dim); font-size: 12px; }

.badge { background: var(--badge-bg); color: var(--accent); font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 20px; border: 1px solid var(--highlight-border); }
.empty { text-align: center; color: var(--text-dim); padding: 30px !important; font-size: 13px; }

/* Menyembunyikan Kolom Yang Kurang Penting Saat di HP */
@media (max-width: 640px) {
  .hide-on-mobile { display: none !important; }
}

/* WIDGET GRID LAYOUT */
.widgets-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 24px; }
@media (min-width: 1025px) { .widgets-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 30px; } }

.widget-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
@media (min-width: 1025px) { .widget-card { padding: 22px; } }
.widget-title { font-size: 14px; font-weight: 700; margin-bottom: 14px; }

.top-menu-item { margin-bottom: 12px; }
.top-menu-info { display: flex; font-size: 13px; margin-bottom: 4px; font-weight: 500; }
.top-menu-rank { color: var(--accent); margin-right: 6px; font-weight: 700; }
.top-menu-name { flex: 1; color: var(--text-body); }
.top-menu-qty { font-weight: 600; color: var(--text); }

.progress-bar-bg { background: var(--border); height: 5px; border-radius: 10px; overflow: hidden; }
.progress-bar-fill { background: var(--accent); height: 100%; border-radius: 10px; transition: width 0.5s ease-out; }

.ai-card { border: 1px dashed rgba(224, 123, 57, 0.4); background: linear-gradient(180deg, var(--card-bg) 0%, var(--nav-active-bg) 100%); }
.ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ai-icon { font-size: 18px; }
.ai-title { margin-bottom: 0; color: var(--accent); }
.ai-content { font-size: 13px; line-height: 1.5; color: var(--text-body); font-style: italic; }
.ai-loading { color: var(--text-dim); }
.widget-empty { font-size: 12px; color: var(--text-dim); text-align: center; padding: 16px 0; }
</style>