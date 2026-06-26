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

    <main class="main">
      <div class="top-bar">
        <div>
          <p class="top-eyebrow">Sales</p>
          <h1 class="top-title">Add Sales Entry</h1>
        </div>
        <NuxtLink to="/sales" class="btn-back">← Back</NuxtLink>
      </div>

      <div class="form-card">
        <!-- Date -->
        <div class="field">
          <label>Date</label>
          <input v-model="form.date" type="date" />
        </div>

        <!-- Entries -->
        <div class="entries-section">
          <div class="entries-header">
            <label>Sales Items</label>
            <button class="btn-add-row" @click="addRow">+ Add Item</button>
          </div>

          <div class="entry-row" v-for="(entry, i) in form.entries" :key="i">
            <div class="entry-num">{{ i + 1 }}</div>

            <div class="entry-fields">
              <select v-model="entry.menu_id" @change="onMenuChange(entry)">
                <option value="">Select menu</option>
                <option v-for="m in menus" :key="m.id" :value="m.id">
                  {{ m.name }} — Rp {{ m.price.toLocaleString('id-ID') }}
                </option>
              </select>

              <div class="entry-inline">
                <div class="field-sm">
                  <span class="field-label">Qty sold</span>
                  <input v-model="entry.qty_sold" type="number" min="1" placeholder="0" />
                </div>
                <div class="field-sm">
                  <span class="field-label">Modal (Rp)</span>
                  <input v-model="entry.modal" type="number" min="0" placeholder="0" />
                </div>
                <div class="field-sm preview">
                  <span class="field-label">Profit</span>
                  <span class="profit-val" :class="calcProfit(entry) >= 0 ? 'positive' : 'negative'">
                    {{ formatRp(calcProfit(entry)) }}
                  </span>
                </div>
              </div>
            </div>

            <button class="btn-remove" @click="removeRow(i)" v-if="form.entries.length > 1">✕</button>
          </div>
        </div>

        <!-- Total preview -->
        <div class="total-preview">
          <div class="total-row">
            <span>Total Revenue</span>
            <span class="td-green">{{ formatRp(totalRevenue) }}</span>
          </div>
          <div class="total-row">
            <span>Total Modal</span>
            <span class="td-red">{{ formatRp(totalModal) }}</span>
          </div>
          <div class="total-row total-profit">
            <span>Total Profit</span>
            <span :class="totalProfit >= 0 ? 'td-green' : 'td-red'">{{ formatRp(totalProfit) }}</span>
          </div>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">Sales saved successfully!</p>

        <div class="form-actions">
          <NuxtLink to="/sales" class="btn-cancel">Cancel</NuxtLink>
          <button class="btn-save" @click="save" :disabled="loading">
            <span v-if="!loading">Save Sales</span>
            <span v-else class="spinner" />
          </button>
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

const { data: menus } = await useAsyncData('menus', async () => {
  const { data } = await supabase.from('menus').select('*').eq('is_available', true).order('name')
  return data || []
})

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  date: today,
  entries: [{ menu_id: '', qty_sold: '', modal: '', price: 0 }]
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

function addRow() {
  form.entries.push({ menu_id: '', qty_sold: '', modal: '', price: 0 })
}

function removeRow(i) {
  form.entries.splice(i, 1)
}

function onMenuChange(entry) {
  const menu = menus.value.find(m => m.id === entry.menu_id)
  entry.price = menu?.price || 0
}

function calcProfit(entry) {
  const revenue = (parseInt(entry.qty_sold) || 0) * (entry.price || 0)
  const modal = parseInt(entry.modal) || 0
  return revenue - modal
}

const totalRevenue = computed(() =>
  form.entries.reduce((a, e) => a + ((parseInt(e.qty_sold) || 0) * (e.price || 0)), 0)
)
const totalModal = computed(() =>
  form.entries.reduce((a, e) => a + (parseInt(e.modal) || 0), 0)
)
const totalProfit = computed(() => totalRevenue.value - totalModal.value)

function formatRp(val) {
  return 'Rp ' + (val || 0).toLocaleString('id-ID')
}

async function save() {
  error.value = ''
  const valid = form.entries.every(e => e.menu_id && e.qty_sold && e.modal !== '')
  if (!valid) {
    error.value = 'Please fill in all fields for every item.'
    return
  }
  loading.value = true
  const rows = form.entries.map(e => ({
    menu_id: e.menu_id,
    date: form.date,
    qty_sold: parseInt(e.qty_sold),
    modal: parseInt(e.modal)
  }))
  const { error: err } = await supabase.from('sales').insert(rows)
  if (err) {
    error.value = 'Failed to save. Try again.'
  } else {
    success.value = true
    setTimeout(() => router.push('/sales'), 1000)
  }
  loading.value = false
}

async function logout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.dark {
  --bg: #0f0f0f; --sidebar-bg: #141414; --border: #1e1e1e;
  --text: #ffffff; --text-muted: rgba(255,255,255,0.4); --text-dim: rgba(255,255,255,0.3);
  --card-bg: #141414; --nav-active-bg: #1f1510; --nav-hover-bg: #1e1e1e;
  --badge-bg: #1f1510; --highlight-border: #3d1a00; --highlight-bg: #1a0e00;
  --input-bg: #1a1a1a; --input-border: #2a2a2a; --input-focus: #1f1510;
  --accent: #e07b39; --accent2: #c45e1e; --entry-bg: #181818;
}

.light {
  --bg: #f5f5f0; --sidebar-bg: #ffffff; --border: #e8e8e3;
  --text: #111111; --text-muted: rgba(0,0,0,0.45); --text-dim: rgba(0,0,0,0.3);
  --card-bg: #ffffff; --nav-active-bg: #fff0e6; --nav-hover-bg: #f5f5f0;
  --badge-bg: #fff0e6; --highlight-border: #f5c9a0; --highlight-bg: #fff5ee;
  --input-bg: #f5f5f0; --input-border: #e0e0db; --input-focus: #fff5ee;
  --accent: #e07b39; --accent2: #c45e1e; --entry-bg: #fafaf7;
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
.top-bar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
.top-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.top-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
.btn-back { font-size: 13px; font-weight: 600; color: var(--text-muted); text-decoration: none; padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--card-bg); transition: all 0.15s; margin-top: 6px; display: inline-block; }
.btn-back:hover { color: var(--text); }

.form-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 32px; max-width: 720px; display: flex; flex-direction: column; gap: 24px; }

.field { display: flex; flex-direction: column; gap: 8px; }
label { font-size: 13px; font-weight: 500; color: var(--text-muted); }
input, select { background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 11px 14px; font-size: 14px; color: var(--text); outline: none; transition: border-color 0.2s; font-family: inherit; width: 100%; }
input:focus, select:focus { border-color: var(--accent); background: var(--input-focus); }
select option { background: var(--card-bg); }

.entries-section { display: flex; flex-direction: column; gap: 12px; }
.entries-header { display: flex; align-items: center; justify-content: space-between; }
.btn-add-row { background: var(--badge-bg); border: 1px solid var(--highlight-border); color: var(--accent); font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.btn-add-row:hover { opacity: 0.8; }

.entry-row { display: flex; align-items: flex-start; gap: 12px; background: var(--entry-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.entry-num { font-size: 12px; font-weight: 700; color: var(--text-dim); min-width: 20px; margin-top: 12px; }
.entry-fields { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.entry-inline { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.field-sm { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 500; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.3px; }
.profit-val { font-size: 15px; font-weight: 700; padding-top: 4px; }
.preview { justify-content: center; }
.btn-remove { background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 14px; padding: 4px; margin-top: 8px; }
.btn-remove:hover { color: #dc2626; }

.total-preview { background: var(--entry-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.total-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-muted); }
.total-profit { font-size: 16px; font-weight: 700; color: var(--text); padding-top: 8px; border-top: 1px solid var(--border); }
.td-green { color: #16a34a; font-weight: 600; }
.td-red { color: #dc2626; }
.positive { color: #16a34a; }
.negative { color: #dc2626; }

.error-msg { font-size: 13px; color: #dc2626; background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); padding: 10px 14px; border-radius: 8px; }
.success-msg { font-size: 13px; color: #16a34a; background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2); padding: 10px 14px; border-radius: 8px; }

.form-actions { display: flex; gap: 12px; justify-content: flex-end; }
.btn-cancel { padding: 11px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-muted); text-decoration: none; }
.btn-cancel:hover { color: var(--text); }
.btn-save { padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; min-width: 120px; display: flex; align-items: center; justify-content: center; }
.btn-save:hover:not(:disabled) { opacity: 0.88; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>