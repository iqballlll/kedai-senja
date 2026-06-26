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
          <p class="top-eyebrow">Track</p>
          <h1 class="top-title">Sales</h1>
        </div>
        <button class="btn-add" @click="openFormModal()">+ Add Sales</button>
      </div>

      <!-- Summary -->
      <div class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">Total Revenue</p>
          <p class="stat-value">{{ formatRp(summary.revenue) }}</p>
          <p class="stat-sub">all time</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total Modal</p>
          <p class="stat-value">{{ formatRp(summary.modal) }}</p>
          <p class="stat-sub">all time</p>
        </div>
        <div class="stat-card highlight">
          <p class="stat-label">Total Profit</p>
          <p class="stat-value" :class="summary.profit >= 0 ? 'positive' : 'negative'">
            {{ formatRp(summary.profit) }}
          </p>
          <p class="stat-sub">margin {{ summary.margin }}%</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Items Sold</p>
          <p class="stat-value">{{ summary.qty }}</p>
          <p class="stat-sub">total pcs</p>
        </div>
      </div>

      <!-- Filter by date -->
      <div class="filter-bar">
        <input type="date" v-model="filterDate" class="date-input" />
        <button v-if="filterDate" class="btn-clear" @click="filterDate = ''">Clear</button>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Menu</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Revenue</th>
              <th>Modal</th>
              <th>Profit</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSales.length === 0">
              <td colspan="8" class="empty">No sales data yet</td>
            </tr>
            <tr v-for="s in filteredSales" :key="s.id">
              <td class="td-name">{{ s.menus?.name }}</td>
              <td><span class="badge">{{ s.menus?.category }}</span></td>
              <td>{{ s.qty_sold }}pcs</td>
              <td class="td-green">{{ formatRp(s.qty_sold * s.menus?.price) }}</td>
              <td class="td-red">{{ formatRp(s.modal) }}</td>
              <td :class="(s.qty_sold * s.menus?.price - s.modal) >= 0 ? 'td-green' : 'td-red'">
                {{ formatRp(s.qty_sold * s.menus?.price - s.modal) }}
              </td>
              <td class="td-muted">{{ s.date }}</td>
              <td>
                <div class="action-cell">
                  <button class="btn-edit" @click="openFormModal(s)">Edit</button>
                  <button class="btn-delete" @click="requestDeleteSale(s)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- MODAL: TAMBAH / EDIT SALES -->
    <div v-if="isFormModalOpen" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ form.id ? '✏️ Edit Sales' : '✨ Tambah Sales' }}</h2>
          <button class="btn-close-modal" @click="closeFormModal">✕</button>
        </div>

        <form @submit.prevent="saveSale" class="modal-form">
          <div class="form-group">
            <label class="form-label">Menu</label>
            <select v-model="form.menu_id" class="form-input" required @change="onMenuPicked">
              <option :value="null" disabled>-- pilih menu --</option>
              <option v-for="m in menus" :key="m.id" :value="m.id">
                {{ m.name }} — Rp {{ m.price.toLocaleString('id-ID') }}
                {{ !m.is_available ? '(Stock Out)' : '' }}
              </option>
            </select>
            <p v-if="selectedMenuIsUnavailable" class="stock-warning">
              ⚠️ Menu ini sedang ditandai Stock Out. Pastikan stoknya benar tersedia sebelum mencatat penjualan.
            </p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Qty Terjual</label>
              <input v-model.number="form.qty_sold" type="number" min="1" class="form-input" placeholder="0" required @input="recalculateModal" />
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input v-model="form.date" type="date" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Modal (Rp)</label>
            <input v-model.number="form.modal" type="number" class="form-input text-orange" placeholder="0" required />
            <small class="form-hint">
              Terisi otomatis dari HPP menu × qty. Bisa diubah manual kalau ada selisih harga bahan hari ini.
            </small>
          </div>

          <div v-if="form.menu_id && form.qty_sold" class="preview-box">
            <div class="preview-row">
              <span>Revenue:</span>
              <strong class="text-green">Rp {{ previewRevenue.toLocaleString('id-ID') }}</strong>
            </div>
            <div class="preview-row">
              <span>Profit:</span>
              <strong :class="previewProfit >= 0 ? 'text-green' : 'text-red'">
                Rp {{ previewProfit.toLocaleString('id-ID') }}
              </strong>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeFormModal">Batal</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: KONFIRMASI DELETE -->
    <div v-if="isDeleteModalOpen" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content modal-confirm">
        <div class="confirm-icon">🗑️</div>
        <h2 class="confirm-title">Hapus catatan penjualan?</h2>
        <p class="confirm-desc">
          Penjualan <strong>{{ saleToDelete?.menus?.name }}</strong>
          ({{ saleToDelete?.qty_sold }}pcs, {{ saleToDelete?.date }}) akan dihapus permanen.
          Tindakan ini tidak bisa dibatalkan.
        </p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="cancelDelete">Batal</button>
          <button class="btn-confirm-delete" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const router = useRouter()

const theme = ref('dark')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

const filterDate = ref('')

// ============ FETCH SALES ============
const { data: sales, refresh } = await useAsyncData('sales', async () => {
  const { data } = await supabase
    .from('sales')
    .select('*, menus(name, price, category, is_available, calculated_hpp)')
    .order('date', { ascending: false })
  return data || []
})

// ============ FETCH MENUS (untuk dropdown) ============
const { data: menus } = await useAsyncData('menus-for-sales', async () => {
  const { data } = await supabase
    .from('menus')
    .select('id, name, price, category, is_available, calculated_hpp')
    .order('name', { ascending: true })
  return data || []
})

const filteredSales = computed(() => {
  if (!sales.value) return []
  if (!filterDate.value) return sales.value
  return sales.value.filter(s => s.date === filterDate.value)
})

const summary = computed(() => {
  const list = sales.value || []
  const revenue = list.reduce((a, s) => a + (s.qty_sold * (s.menus?.price || 0)), 0)
  const modal = list.reduce((a, s) => a + s.modal, 0)
  const profit = revenue - modal
  const qty = list.reduce((a, s) => a + s.qty_sold, 0)
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
  return { revenue, modal, profit, qty, margin }
})

function formatRp(val) {
  return 'Rp ' + (val || 0).toLocaleString('id-ID')
}

// ============ MODAL FORM ADD/EDIT ============
const isFormModalOpen = ref(false)
const submitting = ref(false)
const form = ref({ id: null, menu_id: null, qty_sold: '', modal: '', date: todayStr() })

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function openFormModal(saleData = null) {
  if (saleData) {
    form.value = {
      id: saleData.id,
      menu_id: saleData.menu_id,
      qty_sold: saleData.qty_sold,
      modal: saleData.modal,
      date: saleData.date,
    }
  } else {
    form.value = { id: null, menu_id: null, qty_sold: '', modal: '', date: todayStr() }
  }
  isFormModalOpen.value = true
}
function closeFormModal() {
  isFormModalOpen.value = false
}

const selectedMenu = computed(() => {
  if (!form.value.menu_id || !menus.value) return null
  return menus.value.find(m => m.id === form.value.menu_id) || null
})
const selectedMenuIsUnavailable = computed(() => {
  return selectedMenu.value ? !selectedMenu.value.is_available : false
})

function onMenuPicked() {
  recalculateModal()
}
// Modal otomatis terisi dari HPP menu × qty, tapi tetap bisa diedit manual setelahnya
function recalculateModal() {
  if (!selectedMenu.value || !form.value.qty_sold) return
  const hpp = selectedMenu.value.calculated_hpp || 0
  form.value.modal = hpp * form.value.qty_sold
}

const previewRevenue = computed(() => {
  const price = selectedMenu.value?.price || 0
  return price * (form.value.qty_sold || 0)
})
const previewProfit = computed(() => {
  return previewRevenue.value - (form.value.modal || 0)
})

async function saveSale() {
  submitting.value = true
  try {
    const payload = {
      menu_id: form.value.menu_id,
      qty_sold: form.value.qty_sold,
      modal: form.value.modal,
      date: form.value.date,
    }
    if (form.value.id) {
      await supabase.from('sales').update(payload).eq('id', form.value.id)
    } else {
      await supabase.from('sales').insert([payload])
    }
    closeFormModal()
    refresh()
  } catch (err) {
    console.error(err)
    alert('Gagal menyimpan data penjualan. Coba lagi.')
  } finally {
    submitting.value = false
  }
}

// ============ MODAL KONFIRMASI DELETE ============
const isDeleteModalOpen = ref(false)
const deleting = ref(false)
const saleToDelete = ref(null)

function requestDeleteSale(sale) {
  saleToDelete.value = sale
  isDeleteModalOpen.value = true
}
function cancelDelete() {
  isDeleteModalOpen.value = false
  saleToDelete.value = null
}
async function confirmDelete() {
  if (!saleToDelete.value) return
  deleting.value = true
  try {
    await supabase.from('sales').delete().eq('id', saleToDelete.value.id)
    refresh()
    cancelDelete()
  } catch (err) {
    console.error(err)
    alert('Gagal menghapus data. Coba lagi.')
  } finally {
    deleting.value = false
  }
}

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
  --accent: #e07b39; --accent2: #c45e1e; --modal-overlay: rgba(0,0,0,0.75);
}
.light {
  --bg: #f5f5f0; --sidebar-bg: #ffffff; --border: #e8e8e3; --border2: #efefea;
  --text: #111111; --text-muted: rgba(0,0,0,0.45); --text-dim: rgba(0,0,0,0.3);
  --text-body: rgba(0,0,0,0.75); --card-bg: #ffffff; --highlight-bg: #fff5ee;
  --highlight-border: #f5c9a0; --nav-active-bg: #fff0e6; --nav-hover-bg: #f5f5f0;
  --badge-bg: #fff0e6; --input-bg: #f5f5f0; --input-border: #e0e0db;
  --accent: #e07b39; --accent2: #c45e1e; --modal-overlay: rgba(0,0,0,0.4);
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
.btn-add { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; font-size: 13px; font-weight: 600; border: none; border-radius: 8px; padding: 10px 18px; cursor: pointer; text-decoration: none; transition: opacity 0.15s; margin-top: 6px; }
.btn-add:hover { opacity: 0.85; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px 22px; }
.stat-card.highlight { border-color: var(--highlight-border); background: var(--highlight-bg); }
.stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.stat-value { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
.stat-value.positive { color: #16a34a; }
.stat-value.negative { color: #dc2626; }
.stat-sub { margin-top: 6px; font-size: 12px; color: var(--text-dim); }
.filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.date-input { background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 8px; padding: 8px 12px; font-size: 13px; color: var(--text); outline: none; }
.date-input:focus { border-color: var(--accent); }
.btn-clear { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; }
.btn-clear:hover { color: var(--text); }
.table-wrap { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
.table th { padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border); text-align: left; }
.table td { padding: 13px 16px; font-size: 14px; color: var(--text-body); border-bottom: 1px solid var(--border2); }
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: var(--nav-hover-bg); }
.td-name { font-weight: 600; color: var(--text); }
.td-green { color: #16a34a; font-weight: 600; }
.td-red { color: #dc2626; }
.td-muted { color: var(--text-dim); font-size: 13px; }
.badge { background: var(--badge-bg); color: var(--accent); font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; border: 1px solid var(--highlight-border); }
.action-cell { display: flex; gap: 6px; }
.btn-edit { font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 6px; cursor: pointer; background: var(--badge-bg); border: 1px solid var(--highlight-border); color: var(--accent); }
.btn-edit:hover { opacity: 0.85; }
.btn-delete { font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 6px; cursor: pointer; background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); color: #dc2626; }
.btn-delete:hover { background: rgba(220,38,38,0.15); }
.empty { text-align: center; color: var(--text-dim); padding: 40px !important; font-size: 14px; }

/* MODAL LAYOUT */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--modal-overlay); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px; }
.modal-content { background: var(--sidebar-bg); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 440px; padding: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); animation: modalSlideUp 0.15s ease-out; }
@keyframes modalSlideUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.modal-title { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
.btn-close-modal { background: none; border: none; color: var(--text-dim); font-size: 16px; cursor: pointer; }
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.form-input { background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text); border-radius: 8px; padding: 10px 12px; font-size: 14px; outline: none; width: 100%; }
.form-input:focus { border-color: var(--accent); }
.text-orange { color: var(--accent); font-weight: 600; }
.form-hint { font-size: 11px; color: var(--text-dim); line-height: 1.4; }
.stock-warning { font-size: 11px; color: #fbbf24; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.25); border-radius: 8px; padding: 8px 10px; margin-top: 4px; }
.preview-box { background: var(--highlight-bg); border: 1px solid var(--highlight-border); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.preview-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-body); }
.text-green { color: #16a34a; }
.text-red { color: #dc2626; }
.modal-actions { display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end; }
.btn-cancel { background: none; border: 1px solid var(--border); color: var(--text-muted); font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
.btn-submit { background: var(--accent); border: none; color: #fff; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* MODAL KONFIRMASI DELETE */
.modal-confirm { max-width: 380px; text-align: center; padding: 28px 24px; }
.confirm-icon { font-size: 36px; margin-bottom: 12px; }
.confirm-title { font-size: 17px; font-weight: 800; margin-bottom: 10px; }
.confirm-desc { font-size: 13px; color: var(--text-body); line-height: 1.5; margin-bottom: 22px; }
.confirm-actions { display: flex; gap: 10px; justify-content: center; }
.btn-confirm-delete { background: #dc2626; border: none; color: #fff; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-confirm-delete:hover { background: #b91c1c; }
.btn-confirm-delete:disabled { opacity: 0.5; cursor: not-allowed; }
</style>