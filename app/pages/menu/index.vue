<template>
  <div class="dash-root" :class="theme">
    <!-- Sidebar (Desktop Only) -->
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

    <!-- Bottom Navigation (Mobile Only) -->
    <nav class="bottom-nav">
      <NuxtLink to="/dashboard" class="bnav-item" active-class="active">
        <span class="bnav-icon">📊</span><span class="bnav-label">Dash</span>
      </NuxtLink>
      <NuxtLink to="/menu" class="bnav-item" active-class="active">
        <span class="bnav-icon">🍜</span><span class="bnav-label">Menu</span>
      </NuxtLink>
      <NuxtLink to="/sales" class="bnav-item" active-class="active">
        <span class="bnav-icon">💰</span><span class="bnav-label">Sales</span>
      </NuxtLink>
      <NuxtLink to="/analysis" class="bnav-item" active-class="active">
        <span class="bnav-icon">🤖</span><span class="bnav-label">AI</span>
      </NuxtLink>
      <button class="bnav-item btn-theme-toggle" @click="toggleTheme">
        <span class="bnav-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span><span class="bnav-label">Mode</span>
      </button>
    </nav>

    <!-- Main Content Area -->
    <main class="main">
      <div class="top-bar">
        <div>
          <p class="top-eyebrow">Manage</p>
          <h1 class="top-title">Menu</h1>
        </div>
        <button class="btn-add" @click="openFormModal()">+ Add Menu</button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-wrap">
        <div class="filter-bar">
          <button
            v-for="cat in categories"
            :key="cat"
            class="filter-btn"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Grid Menu -->
      <div class="menu-grid">
        <div v-for="menu in filteredMenus" :key="menu.id" class="menu-card">
          <div class="menu-card-top">
            <div class="menu-img-placeholder">{{ menu.name.charAt(0) }}</div>
            <span class="availability-dot" :class="menu.is_available ? 'on' : 'off'" />
          </div>
          <div class="menu-card-body">
            <span class="menu-badge">{{ menu.category }}</span>
            <h3 class="menu-name">{{ menu.name }}</h3>
            <p class="menu-price">Rp {{ menu.price.toLocaleString('id-ID') }}</p>
            <p class="menu-hpp-info">
              HPP: Rp {{ (menu.calculated_hpp || 0).toLocaleString('id-ID') }}
              <span v-if="menu.calculated_hpp" :class="marginBadgeClass(menu)">
                ({{ marginPercentFor(menu) }}% margin)
              </span>
            </p>

            <button class="btn-hpp-calc-trigger" @click="openHppModal(menu)">
              📊 Hitung HPP Pokok
            </button>
          </div>
          <div class="menu-card-actions">
            <button class="btn-toggle" @click="toggleAvailability(menu)">
              {{ menu.is_available ? 'Set Stock Out' : 'Set Ready' }}
            </button>
            <div class="action-right">
              <button class="btn-edit" @click="openFormModal(menu)">Edit</button>
              <button class="btn-delete" @click="deleteMenu(menu.id)">Del</button>
            </div>
          </div>
        </div>
        <div v-if="filteredMenus.length === 0" class="empty-state">
          Belum ada menu di kategori {{ activeCategory }}
        </div>
      </div>
    </main>

    <!-- MODAL 1: FORM UTAMA (TAMBAH & EDIT MENU) -->
    <div v-if="isFormModalOpen" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ form.id ? '✏️ Edit Menu' : '✨ Tambah Menu Baru' }}</h2>
          <button class="btn-close-modal" @click="closeFormModal">✕</button>
        </div>
        <form @submit.prevent="saveMenu" class="modal-form">
          <div class="form-group">
            <label class="form-label">Nama Menu</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="Contoh: Cipay Bumbu Balado" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select v-model="form.category" class="form-input" required>
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
                <option value="Cemilan">Cemilan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Harga Jual (Rp)</label>
              <input v-model.number="form.price" type="number" class="form-input" placeholder="0" required />
            </div>
          </div>
          <div class="form-group">
            <p class="form-hint">
              HPP tidak diinput manual di sini. Setelah menu dibuat, klik
              <strong>"📊 Hitung HPP Pokok"</strong> di kartu menu untuk menghitung HPP
              berdasarkan resep bahan baku, tenaga kerja, kemasan, dan overhead.
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeFormModal">Batal</button>
            <button type="submit" class="btn-submit" :disabled="submitting">{{ submitting ? 'Menyimpan...' : 'Simpan Menu' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: KALKULATOR HPP FULL COSTING -->
    <div v-if="isHppModalOpen" class="modal-overlay" @click.self="closeHppModal">
      <div class="modal-content max-w-large bg-advanced">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">📊 Kalkulator HPP & Proyeksi Bisnis</h2>
            <p class="modal-subtitle">Menu: <strong>{{ selectedMenuForHpp?.name }}</strong></p>
          </div>
          <button class="btn-close-modal" @click="closeHppModal">✕</button>
        </div>

        <div v-if="loadingHppData" class="loading-state">Memuat data resep...</div>

        <div v-else class="modal-body-scroll">

          <!-- SECTION 1: BIAYA VARIABEL - BAHAN BAKU -->
          <div class="calc-section">
            <div class="section-header-flex">
              <h3 class="section-title">💸 Biaya Bahan Baku (Resep)</h3>
              <button type="button" class="btn-add-row" @click="addIngredientRow">+ Tambah Bahan</button>
            </div>

            <div v-for="(row, index) in hppCalc.recipeRows" :key="row.uid" class="ingredient-row-card">
              <div class="form-group grid-span-2">
                <label class="form-label-xs">Pilih Bahan Baku</label>
                <select v-model="row.ingredient_id" class="form-input-sm" @change="onIngredientPicked(row)">
                  <option :value="null" disabled>-- pilih dari master bahan --</option>
                  <option v-for="ing in masterIngredients" :key="ing.id" :value="ing.id">
                    {{ ing.name }} (Rp {{ ing.purchase_price.toLocaleString('id-ID') }} / {{ ing.purchase_quantity }} {{ ing.purchase_unit }})
                  </option>
                  <option value="new">+ Buat bahan baru...</option>
                </select>
              </div>

              <!-- Form bahan baru, hanya muncul kalau pilih "Buat bahan baru" -->
              <div v-if="row.ingredient_id === 'new'" class="new-ingredient-box">
                <input v-model="row.newName" type="text" class="form-input-sm" placeholder="Nama bahan, contoh: Tepung Tapioka" />
                <div class="form-row-3col">
                  <input v-model.number="row.newPurchasePrice" type="number" class="form-input-sm" placeholder="Harga beli (Rp)" @input="calculateAll" />
                  <input v-model.number="row.newPurchaseQty" type="number" class="form-input-sm" placeholder="Isi kemasan" @input="calculateAll" />
                  <select v-model="row.newPurchaseUnit" class="form-input-sm" @change="calculateAll">
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
              </div>

              <div class="form-row-3col">
                <div class="form-group">
                  <label class="form-label-xs">Takaran Pakai</label>
                  <input v-model.number="row.usage_quantity" type="number" class="form-input-sm" @input="calculateAll" />
                </div>
                <div class="form-group">
                  <label class="form-label-xs">Satuan Pakai</label>
                  <select v-model="row.usage_unit" class="form-input-sm" @change="calculateAll">
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div class="row-footer-calc">
                <p class="cost-per-ingredient">
                  Beban Biaya Bahan: <span>Rp {{ rowCost(row).toLocaleString('id-ID') }}</span>
                </p>
                <button type="button" class="btn-del-row" @click="removeIngredientRow(index)">✕</button>
              </div>
            </div>

            <p v-if="hppCalc.recipeRows.length === 0" class="empty-hint">
              Belum ada bahan. Klik "+ Tambah Bahan" untuk mulai menyusun resep.
            </p>

            <p class="section-total-summary">
              Total Biaya Bahan Baku: <span>Rp {{ totalIngredientCost.toLocaleString('id-ID') }}</span>
            </p>
          </div>

          <!-- SECTION 2: BIAYA VARIABEL LAIN - KEMASAN -->
          <div class="calc-section">
            <h3 class="section-title">📦 Biaya Kemasan (Per Porsi)</h3>
            <p class="section-desc">
              Biaya variabel langsung per unit terjual: plastik, kotak, sedotan, label, dsb.
            </p>
            <div class="form-group">
              <label class="form-label-xs">Biaya Kemasan / Porsi (Rp)</label>
              <input v-model.number="hppCalc.packaging_cost_per_unit" type="number" class="form-input-sm" @input="calculateAll" />
            </div>
          </div>

          <!-- SECTION 3: TENAGA KERJA & OVERHEAD (DIALOKASIKAN PER BULAN) -->
          <div class="calc-section">
            <h3 class="section-title">🏢 Tenaga Kerja & Overhead (Alokasi per Bulan)</h3>
            <p class="section-desc">
              Biaya tetap bulanan ini dibagi rata ke target volume produksi bulanan, supaya tiap porsi menanggung porsi overhead yang wajar.
            </p>

            <div class="form-group mb-3">
              <label class="form-label">Target Penjualan Produk Ini (Unit/Bulan)</label>
              <input v-model.number="hppCalc.target_sales_volume" type="number" min="1" class="form-input" @input="calculateAll" />
            </div>

            <div class="form-row-3col">
              <div class="form-group">
                <label class="form-label-xs">Tenaga Kerja / Bulan (Rp)</label>
                <input v-model.number="hppCalc.fixed_labor_cost" type="number" class="form-input-sm" @input="calculateAll" />
              </div>
              <div class="form-group">
                <label class="form-label-xs">Listrik & Air / Bulan (Rp)</label>
                <input v-model.number="hppCalc.fixed_utility_cost" type="number" class="form-input-sm" @input="calculateAll" />
              </div>
              <div class="form-group">
                <label class="form-label-xs">Pemasaran / Bulan (Rp)</label>
                <input v-model.number="hppCalc.fixed_marketing_cost" type="number" class="form-input-sm" @input="calculateAll" />
              </div>
            </div>
            <div class="form-group mt-2">
              <label class="form-label-xs">Penyusutan Alat / Bulan (Rp)</label>
              <input v-model.number="hppCalc.fixed_depreciation_cost" type="number" class="form-input-sm" @input="calculateAll" />
            </div>

            <p class="section-total-summary">
              Beban Tetap per Unit: <span>Rp {{ fixedCostPerUnit.toLocaleString('id-ID') }} / porsi</span>
            </p>
          </div>

          <!-- SECTION 4: LOKASI - INFORMASIONAL, TIDAK MEMPENGARUHI HITUNGAN -->
          <div class="calc-section">
            <h3 class="section-title">🗺️ Lokasi Toko</h3>
            <p class="section-desc">
              Catatan lokasi, tidak otomatis mengubah perhitungan. Sesuaikan biaya bahan/overhead
              di atas secara manual sesuai harga pasar setempat.
            </p>
            <input v-model="hppCalc.location_note" type="text" class="form-input" placeholder="Kertajati, Majalengka" />
          </div>

          <!-- LAPORAN AKHIR -->
          <div class="final-report-card">
            <div class="report-row">
              <span>Total HPP per Produk:</span>
              <strong class="text-green">Rp {{ finalHpp.toLocaleString('id-ID') }}</strong>
            </div>
            <div class="report-row">
              <span>Food Cost % (Bahan saja / Harga Jual):</span>
              <span class="text-white">{{ foodCostPercent }}%</span>
            </div>
            <div class="report-row">
              <span>Harga Jual Saat Ini:</span>
              <span class="text-orange">Rp {{ (selectedMenuForHpp?.price || 0).toLocaleString('id-ID') }}</span>
            </div>
            <div class="report-row highlight-row">
              <span>Estimasi Margin Keuntungan / Unit:</span>
              <strong :class="computedMargin >= 0 ? 'text-green' : 'text-red'">
                Rp {{ computedMargin.toLocaleString('id-ID') }} ({{ computedMarginPercent }}%)
              </strong>
            </div>
            <div class="report-row">
              <span>Titik Impas Jual (BEP Bulanan):</span>
              <span class="text-white">
                <strong>{{ computedBepUnits }} Unit</strong> / Bulan
                (Rp {{ (computedBepUnits * (selectedMenuForHpp?.price || 0)).toLocaleString('id-ID') }})
              </span>
            </div>

            <p v-if="foodCostWarning" class="cost-warning">⚠️ {{ foodCostWarning }}</p>

            <button type="button" class="btn-save-advanced-hpp" :disabled="savingHpp" @click="saveAdvancedHppToSupabase">
              {{ savingHpp ? 'Menyimpan...' : '💾 Simpan Perhitungan & Terapkan ke Supabase' }}
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const theme = ref('dark')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

const categories = ['All', 'Makanan', 'Minuman', 'Cemilan']
const activeCategory = ref('All')

// ============ STATE MODAL FORM UTAMA ============
const isFormModalOpen = ref(false)
const submitting = ref(false)
const form = ref({ id: null, name: '', category: 'Cemilan', price: '', is_available: true })

// ============ STATE MODAL HPP ============
const isHppModalOpen = ref(false)
const loadingHppData = ref(false)
const savingHpp = ref(false)
const selectedMenuForHpp = ref(null)
const masterIngredients = ref([]) // daftar bahan baku milik user, dari tabel `ingredients`

function emptyHppState() {
  return {
    recipeRows: [],          // baris resep aktif di modal: { uid, menu_ingredient_id, ingredient_id, usage_quantity, usage_unit, newName, newPurchasePrice, newPurchaseQty, newPurchaseUnit }
    packaging_cost_per_unit: 0,
    target_sales_volume: 30,
    fixed_labor_cost: 0,
    fixed_utility_cost: 0,
    fixed_marketing_cost: 0,
    fixed_depreciation_cost: 0,
    location_note: 'Kertajati, Majalengka',
  }
}
const hppCalc = ref(emptyHppState())

let rowUidCounter = 0
function newRowUid() {
  rowUidCounter += 1
  return `row_${rowUidCounter}`
}

// ============ FETCH DATA MENU ============
const { data: menus, refresh } = await useAsyncData('menus', async () => {
  const { data } = await supabase.from('menus').select('*').order('created_at', { ascending: true })
  return data || []
})

const filteredMenus = computed(() => {
  if (!menus.value) return []
  if (activeCategory.value === 'All') return menus.value
  return menus.value.filter(m => m.category === activeCategory.value)
})

function marginPercentFor(menu) {
  if (!menu.price) return 0
  const margin = menu.price - (menu.calculated_hpp || 0)
  return Math.round((margin / menu.price) * 100)
}
function marginBadgeClass(menu) {
  const pct = marginPercentFor(menu)
  if (pct >= 30) return 'text-green'
  if (pct >= 0) return 'text-orange'
  return 'text-red'
}

// ============ LOGIKA MODAL FORM UTAMA ============
function openFormModal(menuData = null) {
  if (menuData) {
    form.value = {
      id: menuData.id,
      name: menuData.name,
      category: menuData.category,
      price: menuData.price,
      is_available: menuData.is_available,
    }
  } else {
    form.value = { id: null, name: '', category: 'Cemilan', price: '', is_available: true }
  }
  isFormModalOpen.value = true
}
function closeFormModal() { isFormModalOpen.value = false }

// ============ LOGIKA MODAL HPP ============
async function openHppModal(menu) {
  selectedMenuForHpp.value = menu
  isHppModalOpen.value = true
  loadingHppData.value = true
  hppCalc.value = emptyHppState()

  try {
    // 1. Load master ingredients milik user (untuk dropdown pilih bahan)
    const { data: ingredientsData, error: ingErr } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true })
    if (ingErr) throw ingErr
    masterIngredients.value = ingredientsData || []

    // 2. Load resep bahan untuk menu ini dari menu_ingredients (join ke ingredients)
    const { data: recipeData, error: recipeErr } = await supabase
      .from('menu_ingredients')
      .select('*, ingredients(*)')
      .eq('menu_id', menu.id)
    if (recipeErr) throw recipeErr

    hppCalc.value.recipeRows = (recipeData || []).map(r => ({
      uid: newRowUid(),
      menu_ingredient_id: r.id,
      ingredient_id: r.ingredient_id,
      usage_quantity: r.usage_quantity,
      usage_unit: r.usage_unit,
      newName: '', newPurchasePrice: null, newPurchaseQty: null, newPurchaseUnit: 'gram',
    }))

    // 3. Isi parameter biaya dari kolom menus (kalau sudah pernah diisi sebelumnya)
    hppCalc.value.packaging_cost_per_unit = menu.packaging_cost_per_unit || 0
    hppCalc.value.target_sales_volume = menu.target_sales_volume || 30
    hppCalc.value.fixed_labor_cost = menu.fixed_labor_cost || 0
    hppCalc.value.fixed_utility_cost = menu.fixed_utility_cost || 0
    hppCalc.value.fixed_marketing_cost = menu.fixed_marketing_cost || 0
    hppCalc.value.fixed_depreciation_cost = menu.fixed_depreciation_cost || 0
    hppCalc.value.location_note = menu.location_note || 'Kertajati, Majalengka'
  } catch (err) {
    console.error('Gagal memuat data HPP:', err)
    alert('Gagal memuat data resep. Coba lagi.')
  } finally {
    loadingHppData.value = false
  }
}

function closeHppModal() {
  isHppModalOpen.value = false
  selectedMenuForHpp.value = null
}

function addIngredientRow() {
  hppCalc.value.recipeRows.push({
    uid: newRowUid(),
    menu_ingredient_id: null,
    ingredient_id: null,
    usage_quantity: null,
    usage_unit: 'gram',
    newName: '', newPurchasePrice: null, newPurchaseQty: null, newPurchaseUnit: 'gram',
  })
}
function removeIngredientRow(index) {
  hppCalc.value.recipeRows.splice(index, 1)
}
function onIngredientPicked(row) {
  // reset field bahan baru kalau user balik pilih dari master
  if (row.ingredient_id !== 'new') {
    row.newName = ''
    row.newPurchasePrice = null
    row.newPurchaseQty = null
  }
}

// ============ KONVERSI SATUAN & KALKULASI BIAYA BAHAN ============
// Peta konversi satuan beli -> satuan dasar (gram/ml/pcs), basis 1 kg = 1000 gram, 1 liter = 1000 ml
const UNIT_BASE_MULTIPLIER = { kg: 1000, liter: 1000, gram: 1, ml: 1, pcs: 1 }

function rowCost(row) {
  let purchasePrice, purchaseQty, purchaseUnit

  if (row.ingredient_id === 'new') {
    purchasePrice = row.newPurchasePrice
    purchaseQty = row.newPurchaseQty
    purchaseUnit = row.newPurchaseUnit
  } else {
    const master = masterIngredients.value.find(i => i.id === row.ingredient_id)
    if (!master) return 0
    purchasePrice = master.purchase_price
    purchaseQty = master.purchase_quantity
    purchaseUnit = master.purchase_unit
  }

  if (!purchasePrice || !purchaseQty || !row.usage_quantity) return 0

  const multiplier = UNIT_BASE_MULTIPLIER[purchaseUnit] || 1
  const totalBaseUnits = purchaseQty * multiplier
  if (totalBaseUnits <= 0) return 0

  const pricePerBaseUnit = purchasePrice / totalBaseUnits
  return Math.round(pricePerBaseUnit * row.usage_quantity)
}

const totalIngredientCost = computed(() => {
  return hppCalc.value.recipeRows.reduce((sum, row) => sum + rowCost(row), 0)
})

const fixedCostPerUnit = computed(() => {
  const volume = hppCalc.value.target_sales_volume || 1
  const totalFixed =
    (hppCalc.value.fixed_labor_cost || 0) +
    (hppCalc.value.fixed_utility_cost || 0) +
    (hppCalc.value.fixed_marketing_cost || 0) +
    (hppCalc.value.fixed_depreciation_cost || 0)
  return Math.round(totalFixed / volume)
})

// HPP Full Costing = Bahan Baku + Kemasan (variable) + Alokasi Tenaga Kerja & Overhead (fixed/unit)
const finalHpp = computed(() => {
  return totalIngredientCost.value + (hppCalc.value.packaging_cost_per_unit || 0) + fixedCostPerUnit.value
})

const foodCostPercent = computed(() => {
  const price = selectedMenuForHpp.value?.price || 0
  if (!price) return 0
  return Math.round((totalIngredientCost.value / price) * 100)
})

const foodCostWarning = computed(() => {
  // Patokan umum industri: food cost makanan idealnya di kisaran 25-35%, minuman 15-25%.
  // UMKM warung dengan overhead rendah masih wajar sampai ~50%.
  const pct = foodCostPercent.value
  if (pct > 55) return `Food cost ${pct}% cukup tinggi untuk standar UMKM. Pertimbangkan efisiensi bahan atau naikkan harga jual.`
  return ''
})

const computedMargin = computed(() => {
  const price = selectedMenuForHpp.value?.price || 0
  return price - finalHpp.value
})
const computedMarginPercent = computed(() => {
  const price = selectedMenuForHpp.value?.price || 0
  if (!price) return 0
  return Math.round((computedMargin.value / price) * 100)
})
const computedBepUnits = computed(() => {
  const margin = computedMargin.value
  const totalFixed =
    (hppCalc.value.fixed_labor_cost || 0) +
    (hppCalc.value.fixed_utility_cost || 0) +
    (hppCalc.value.fixed_marketing_cost || 0) +
    (hppCalc.value.fixed_depreciation_cost || 0)
  if (margin <= 0) return '∞'
  return Math.ceil(totalFixed / margin)
})

function calculateAll() {
  // computed properties otomatis re-evaluasi; fungsi ini cuma trigger reaktivitas dari @input/@change
}

// ============ SIMPAN KE SUPABASE ============
async function saveAdvancedHppToSupabase() {
  if (!selectedMenuForHpp.value) return
  savingHpp.value = true

  try {
    const menuId = selectedMenuForHpp.value.id

    // 1. Untuk setiap baris resep, pastikan ingredient_id valid (insert ke `ingredients` dulu kalau baru)
    const resolvedRows = []
    for (const row of hppCalc.value.recipeRows) {
      let ingredientId = row.ingredient_id

      if (ingredientId === 'new') {
        if (!row.newName || !row.newPurchasePrice || !row.newPurchaseQty) {
          throw new Error(`Lengkapi data bahan baru sebelum menyimpan.`)
        }
        const { data: inserted, error: insErr } = await supabase
          .from('ingredients')
          .insert([{
            user_id: user.value.id,
            name: row.newName,
            purchase_price: row.newPurchasePrice,
            purchase_quantity: row.newPurchaseQty,
            purchase_unit: row.newPurchaseUnit,
          }])
          .select()
          .single()
        if (insErr) throw insErr
        ingredientId = inserted.id
        masterIngredients.value.push(inserted)
      }

      if (!ingredientId || !row.usage_quantity) continue
      resolvedRows.push({ ...row, ingredient_id: ingredientId })
    }

    // 2. Sinkronisasi menu_ingredients: hapus baris lama untuk menu ini, lalu insert ulang
    //    (lebih sederhana & aman daripada upsert manual per baris untuk kasus tambah/hapus campur)
    const { error: delErr } = await supabase
      .from('menu_ingredients')
      .delete()
      .eq('menu_id', menuId)
    if (delErr) throw delErr

    if (resolvedRows.length > 0) {
      const payload = resolvedRows.map(r => ({
        menu_id: menuId,
        ingredient_id: r.ingredient_id,
        usage_quantity: r.usage_quantity,
        usage_unit: r.usage_unit,
      }))
      const { error: insRowsErr } = await supabase.from('menu_ingredients').insert(payload)
      if (insRowsErr) throw insRowsErr
    }

    // 3. Update menus dengan parameter biaya + hasil HPP
    const { error: updErr } = await supabase
      .from('menus')
      .update({
        packaging_cost_per_unit: hppCalc.value.packaging_cost_per_unit || 0,
        target_sales_volume: hppCalc.value.target_sales_volume || 30,
        fixed_labor_cost: hppCalc.value.fixed_labor_cost || 0,
        fixed_utility_cost: hppCalc.value.fixed_utility_cost || 0,
        fixed_marketing_cost: hppCalc.value.fixed_marketing_cost || 0,
        fixed_depreciation_cost: hppCalc.value.fixed_depreciation_cost || 0,
        location_note: hppCalc.value.location_note || 'Kertajati, Majalengka',
        calculated_hpp: finalHpp.value,
      })
      .eq('id', menuId)
    if (updErr) throw updErr

    alert(`HPP berhasil disimpan: Rp ${finalHpp.value.toLocaleString('id-ID')} / porsi`)
    closeHppModal()
    refresh()
  } catch (err) {
    console.error(err)
    alert(err.message || 'Gagal menyimpan perhitungan HPP. Coba lagi.')
  } finally {
    savingHpp.value = false
  }
}

// ============ CRUD MENU LAINNYA ============
async function saveMenu() {
  submitting.value = true
  try {
    const payload = {
      name: form.value.name,
      category: form.value.category,
      price: form.value.price,
      is_available: form.value.is_available,
    }
    if (form.value.id) {
      await supabase.from('menus').update(payload).eq('id', form.value.id)
    } else {
      await supabase.from('menus').insert([payload])
    }
    closeFormModal()
    refresh()
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}
async function toggleAvailability(menu) {
  await supabase.from('menus').update({ is_available: !menu.is_available }).eq('id', menu.id)
  refresh()
}
async function deleteMenu(id) {
  if (!confirm('Hapus menu ini le?')) return
  await supabase.from('menus').delete().eq('id', id)
  refresh()
}
async function logout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
/* CSS THEMING VARIABLE */
.dark {
  --bg: #0f0f0f; --sidebar-bg: #141414; --border: #1e1e1e; --border2: #1a1a1a;
  --text: #ffffff; --text-muted: rgba(255,255,255,0.4); --text-dim: rgba(255,255,255,0.3);
  --text-body: rgba(255,255,255,0.75); --card-bg: #141414; --highlight-bg: #1a0e00;
  --highlight-border: #3d1a00; --nav-active-bg: #1f1510; --nav-hover-bg: #1e1e1e;
  --badge-bg: #1f1510; --input-bg: #1d1d1d; --accent: #e07b39; --accent2: #c45e1e;
  --placeholder-bg: #2a1a0a; --modal-overlay: rgba(0,0,0,0.75);
}
.light {
  --bg: #f5f5f0; --sidebar-bg: #ffffff; --border: #e8e8e3; --border2: #efefea;
  --text: #111111; --text-muted: rgba(0,0,0,0.45); --text-dim: rgba(0,0,0,0.3);
  --text-body: rgba(0,0,0,0.75); --card-bg: #ffffff; --highlight-bg: #fff5ee;
  --highlight-border: #f5c9a0; --nav-active-bg: #fff0e6; --nav-hover-bg: #f5f5f0;
  --badge-bg: #fff0e6; --input-bg: #f5f5f0; --accent: #e07b39; --accent2: #c45e1e;
  --placeholder-bg: #fde8d0; --modal-overlay: rgba(0,0,0,0.4);
}
.dash-root { display: flex; min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; flex-direction: column; }
@media (min-width: 1025px) { .dash-root { flex-direction: row; } }

/* SIDEBAR & NAV BAR */
.sidebar { width: 240px; background: var(--sidebar-bg); border-right: 1px solid var(--border); display: none; flex-direction: column; padding: 28px 16px; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; }
@media (min-width: 1025px) { .sidebar { display: flex; } }
.sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 36px; }
.brand-icon { font-size: 24px; }
.brand-name { font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--text-muted); text-decoration: none; }
.nav-item.active { background: var(--nav-active-bg); color: var(--accent); }
.sidebar-bottom { display: flex; flex-direction: column; gap: 8px; }
.btn-theme { background: var(--input-bg); border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; }
.btn-logout { background: none; border: 1px solid var(--border); color: var(--text-dim); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; }
.btn-logout:hover { border-color: #ff6b6b; color: #ff6b6b; }
.bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 64px; background: var(--sidebar-bg); border-top: 1px solid var(--border); display: flex; justify-content: space-around; align-items: center; z-index: 999; padding: 0 8px; }
@media (min-width: 1025px) { .bottom-nav { display: none; } }
.bnav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); text-decoration: none; font-size: 10px; font-weight: 600; flex: 1; height: 100%; gap: 3px; background: none; border: none; cursor: pointer; }
.bnav-item.active { color: var(--accent); }
.bnav-icon { font-size: 18px; }

/* MAIN CONTENT */
.main { flex: 1; padding: 20px 16px 100px 16px; }
@media (min-width: 1025px) { .main { margin-left: 240px; padding: 40px; } }
.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.top-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); }
.top-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
@media (min-width: 1025px) { .top-title { font-size: 28px; } }
.btn-add { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; }

/* GRID & CARD STYLING */
.filter-wrap { overflow-x: auto; margin-left: -16px; margin-right: -16px; padding-left: 16px; margin-bottom: 20px; }
@media (min-width: 1025px) { .filter-wrap { overflow: visible; margin: 0 0 24px 0; padding: 0; } }
.filter-bar { display: flex; gap: 8px; width: max-content; padding-right: 16px; }
@media (min-width: 1025px) { .filter-bar { width: auto; padding: 0; } }
.filter-btn { background: var(--card-bg); border: 1px solid var(--border); color: var(--text-muted); border-radius: 20px; padding: 6px 16px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
.filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 640px) { .menu-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; } }
.menu-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
.menu-card-top { position: relative; background: var(--placeholder-bg); height: 100px; display: flex; align-items: center; justify-content: center; }
.menu-img-placeholder { font-size: 36px; font-weight: 900; color: var(--accent); opacity: 0.35; text-transform: uppercase; }
.availability-dot { position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; border-radius: 50%; }
.availability-dot.on { background: #4ade80; box-shadow: 0 0 6px #4ade80; }
.availability-dot.off { background: #ff6b6b; box-shadow: 0 0 6px #ff6b6b; }
.menu-card-body { padding: 12px 12px 8px; flex-grow: 1; display: flex; flex-direction: column; }
.menu-badge { background: var(--badge-bg); color: var(--accent); font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 20px; border: 1px solid var(--highlight-border); text-transform: uppercase; align-self: flex-start; }
.menu-name { font-size: 14px; font-weight: 700; color: var(--text); margin-top: 6px; line-height: 1.3; }
.menu-price { font-size: 13px; color: var(--accent); font-weight: 600; margin-top: 4px; }
.menu-hpp-info { font-size: 11px; color: var(--text-dim); margin-top: 2px; margin-bottom: 8px; }
.btn-hpp-calc-trigger {
  background: var(--nav-active-bg); border: 1px solid var(--highlight-border); color: var(--accent);
  font-size: 11px; font-weight: 600; padding: 6px; border-radius: 6px; cursor: pointer; text-align: center; width: 100%; margin-top: auto;
}
.menu-card-actions { padding: 10px 12px; display: flex; flex-direction: column; border-top: 1px solid var(--border2); gap: 8px; }
@media (min-width: 550px) { .menu-card-actions { flex-direction: row; align-items: center; justify-content: space-between; } }
.btn-toggle { font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 6px; cursor: pointer; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-muted); text-align: center; }
.action-right { display: flex; gap: 4px; width: 100%; justify-content: space-between; }
@media (min-width: 550px) { .action-right { width: auto; } }
.btn-edit { font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: 6px; background: var(--badge-bg); border: 1px solid var(--highlight-border); color: var(--accent); cursor: pointer; }
.btn-delete { font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 6px; cursor: pointer; background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); color: #dc2626; }
.empty-state { grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 60px 20px; }

/* MODAL LAYOUT */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--modal-overlay); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px; }
.modal-content { background: var(--sidebar-bg); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 460px; padding: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); animation: modalSlideUp 0.15s ease-out; }
.modal-content.max-w-large { max-width: 560px; }
@keyframes modalSlideUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.modal-title { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
.modal-subtitle { font-size: 13px; color: var(--accent); font-weight: 600; margin-top: 2px; }
.btn-close-modal { background: none; border: none; color: var(--text-dim); font-size: 16px; cursor: pointer; }
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.modal-body-scroll { display: flex; flex-direction: column; gap: 20px; max-height: 75vh; overflow-y: auto; padding-right: 4px; }
.loading-state { padding: 40px 0; text-align: center; color: var(--text-muted); font-size: 13px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.mb-3 { margin-bottom: 6px; }
.form-group.mt-2 { margin-top: 8px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.form-label-xs { font-size: 10px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.3px; }
.form-input { background: var(--input-bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 10px 12px; font-size: 14px; outline: none; width: 100%; }
.form-input:focus { border-color: var(--accent); }
.form-input-sm { background: var(--input-bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 8px 10px; font-size: 12px; outline: none; width: 100%; }
.form-input-sm:focus { border-color: var(--accent); }
.text-orange { color: var(--accent); font-weight: 600; }
.form-hint { font-size: 11px; color: var(--text-dim); line-height: 1.5; background: var(--badge-bg); border: 1px solid var(--highlight-border); border-radius: 8px; padding: 10px 12px; }
.section-desc { font-size: 11px; color: var(--text-dim); line-height: 1.4; margin-bottom: 10px; }

/* KALKULATOR HPP SECTION SPECIFIC */
.calc-section { background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 14px; border-radius: 12px; }
.section-header-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 0; text-transform: uppercase; letter-spacing: 0.5px; }
.btn-add-row { background: var(--badge-bg); border: 1px solid var(--highlight-border); color: var(--accent); font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 6px; cursor: pointer; white-space: nowrap; }
.ingredient-row-card { background: var(--input-bg); border: 1px solid var(--border2); border-radius: 10px; padding: 10px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
.grid-span-2 { grid-column: 1 / -1; }
.form-row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
.new-ingredient-box { background: var(--highlight-bg); border: 1px dashed var(--highlight-border); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.row-footer-calc { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; border-top: 1px solid var(--border2); }
.cost-per-ingredient { font-size: 11px; color: var(--text-muted); }
.cost-per-ingredient span { color: var(--accent); font-weight: 700; }
.btn-del-row { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); color: #dc2626; font-size: 11px; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; }
.empty-hint { font-size: 11px; color: var(--text-dim); text-align: center; padding: 12px 0; }
.section-total-summary { font-size: 12px; color: var(--text-muted); margin-top: 10px; font-weight: 500; padding-top: 10px; border-top: 1px solid var(--border2); }
.section-total-summary span { color: var(--accent); font-weight: 700; }

/* LAPORAN AKHIR */
.final-report-card {
  background: var(--highlight-bg); border: 1px solid var(--highlight-border); padding: 16px; border-radius: 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.report-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-body); gap: 8px; }
.report-row.highlight-row { padding-top: 8px; border-top: 1px solid var(--highlight-border); }
.text-green { color: #4ade80; }
.text-red { color: #ff6b6b; }
.text-white { color: var(--text); }
.cost-warning { font-size: 11px; color: #fbbf24; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.25); border-radius: 8px; padding: 8px 10px; }
.btn-save-advanced-hpp {
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 700; border: none; border-radius: 8px;
  padding: 12px 16px; cursor: pointer; transition: opacity 0.15s; margin-top: 4px;
}
.btn-save-advanced-hpp:hover { opacity: 0.9; }
.btn-save-advanced-hpp:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-actions { display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end; }
.btn-cancel { background: none; border: 1px solid var(--border); color: var(--text-muted); font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
.btn-submit { background: var(--accent); border: none; color: #fff; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
</style>