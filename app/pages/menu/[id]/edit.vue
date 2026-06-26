<template>
  <div class="dash-root" :class="theme">
    <!-- Sidebar -->
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

    <!-- Main -->
    <main class="main">
      <div class="top-bar">
        <div>
          <p class="top-eyebrow">Menu</p>
          <h1 class="top-title">Edit Menu</h1>
        </div>
        <NuxtLink to="/menu" class="btn-back">← Back</NuxtLink>
      </div>

      <div v-if="pending" class="loading-state">Loading...</div>

      <div v-else class="form-card">
        <div class="field">
          <label>Menu Name</label>
          <input v-model="form.name" type="text" placeholder="e.g. Ayam Geprek" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Price (Rp)</label>
            <input v-model="form.price" type="number" placeholder="e.g. 15000" />
          </div>
          <div class="field">
            <label>Category</label>
            <select v-model="form.category">
              <option value="">Select category</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>Description <span class="optional">(optional)</span></label>
          <textarea v-model="form.description" placeholder="Short description..." rows="3" />
        </div>

        <div class="field">
          <label>Availability</label>
          <div class="toggle-row">
            <button class="toggle-btn" :class="{ active: form.is_available }" @click="form.is_available = true">Available</button>
            <button class="toggle-btn" :class="{ active: !form.is_available }" @click="form.is_available = false">Unavailable</button>
          </div>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">Menu updated successfully!</p>

        <div class="form-actions">
          <NuxtLink to="/menu" class="btn-cancel">Cancel</NuxtLink>
          <button class="btn-save" @click="save" :disabled="loading">
            <span v-if="!loading">Save Changes</span>
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
const route = useRoute()
const id = route.params.id

const theme = ref('dark')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

const form = reactive({ name: '', price: '', category: '', description: '', is_available: true })
const loading = ref(false)
const error = ref('')
const success = ref(false)

const { pending } = await useAsyncData('menu-edit', async () => {
  const { data } = await supabase.from('menus').select('*').eq('id', id).single()
  if (data) {
    form.name = data.name
    form.price = data.price
    form.category = data.category
    form.description = data.description || ''
    form.is_available = data.is_available
  }
  return data
})

async function save() {
  error.value = ''
  if (!form.name || !form.price || !form.category) {
    error.value = 'Name, price, and category are required.'
    return
  }
  loading.value = true
  const { error: err } = await supabase.from('menus').update({
    name: form.name,
    price: parseInt(form.price),
    category: form.category,
    description: form.description || null,
    is_available: form.is_available
  }).eq('id', id)
  if (err) {
    error.value = 'Failed to update. Try again.'
  } else {
    success.value = true
    setTimeout(() => router.push('/menu'), 1000)
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
  --badge-bg: #1f1510; --highlight-border: #3d1a00;
  --input-bg: #1a1a1a; --input-border: #2a2a2a; --input-focus: #1f1510;
  --accent: #e07b39; --accent2: #c45e1e;
}

.light {
  --bg: #f5f5f0; --sidebar-bg: #ffffff; --border: #e8e8e3;
  --text: #111111; --text-muted: rgba(0,0,0,0.45); --text-dim: rgba(0,0,0,0.3);
  --card-bg: #ffffff; --nav-active-bg: #fff0e6; --nav-hover-bg: #f5f5f0;
  --badge-bg: #fff0e6; --highlight-border: #f5c9a0;
  --input-bg: #f5f5f0; --input-border: #e0e0db; --input-focus: #fff5ee;
  --accent: #e07b39; --accent2: #c45e1e;
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
.btn-theme { background: var(--input-bg); border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; transition: all 0.15s; }
.btn-theme:hover { color: var(--text); }
.btn-logout { background: none; border: 1px solid var(--border); color: var(--text-dim); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; transition: all 0.15s; }
.btn-logout:hover { border-color: #ff6b6b; color: #ff6b6b; }

.main { margin-left: 240px; flex: 1; padding: 40px; }
.top-bar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
.top-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.top-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
.btn-back { font-size: 13px; font-weight: 600; color: var(--text-muted); text-decoration: none; padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--card-bg); transition: all 0.15s; margin-top: 6px; display: inline-block; }
.btn-back:hover { color: var(--text); }

.loading-state { color: var(--text-muted); font-size: 14px; padding: 40px; }

.form-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 32px; max-width: 600px; display: flex; flex-direction: column; gap: 22px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
label { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.optional { font-weight: 400; color: var(--text-dim); }
input, select, textarea { background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 12px 14px; font-size: 14px; color: var(--text); outline: none; transition: border-color 0.2s; font-family: inherit; width: 100%; }
input::placeholder, textarea::placeholder { color: var(--text-dim); }
input:focus, select:focus, textarea:focus { border-color: var(--accent); background: var(--input-focus); }
textarea { resize: vertical; }
select option { background: var(--card-bg); }
.toggle-row { display: flex; gap: 8px; }
.toggle-btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-muted); transition: all 0.15s; }
.toggle-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.error-msg { font-size: 13px; color: #dc2626; background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); padding: 10px 14px; border-radius: 8px; }
.success-msg { font-size: 13px; color: #16a34a; background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2); padding: 10px 14px; border-radius: 8px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { padding: 11px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-muted); text-decoration: none; transition: all 0.15s; }
.btn-cancel:hover { color: var(--text); }
.btn-save { padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; transition: opacity 0.15s; min-width: 120px; display: flex; align-items: center; justify-content: center; }
.btn-save:hover:not(:disabled) { opacity: 0.88; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>