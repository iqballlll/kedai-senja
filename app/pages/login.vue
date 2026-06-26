<template>
  <div class="login-root" :class="theme">
    <div class="login-left">
      <div class="brand">
        <div class="brand-icon">🌅</div>
        <h1 class="brand-name">Kedai Senja</h1>
        <p class="brand-tagline">Kelola bisnis kuliner kamu<br>dengan lebih cerdas.</p>
      </div>
      <div class="deco-circles">
        <div class="circle c1" />
        <div class="circle c2" />
        <div class="circle c3" />
      </div>
    </div>

    <div class="login-right">
      <button class="btn-theme-toggle" @click="toggleTheme">
        {{ theme === 'dark' ? '☀️ Light' : '🌙 Dark' }}
      </button>

      <div class="login-box">
        <div class="login-header">
          <p class="login-eyebrow">Admin Portal</p>
          <h2 class="login-title">Welcome back</h2>
          <p class="login-sub">Sign in to your dashboard</p>
        </div>

        <form @submit.prevent="login" class="login-form">
          <div class="field">
            <label>Email</label>
            <input v-model="state.email" type="email" placeholder="admin@kedaisenja.com" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input v-model="state.password" type="password" placeholder="••••••••" required />
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <button type="submit" class="btn-login" :disabled="loading">
            <span v-if="!loading">Sign in</span>
            <span v-else class="spinner" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const router = useRouter()

// Sinkronisasi theme switcher, default pakai 'dark'
const theme = ref('dark')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

const state = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function login() {
  loading.value = true
  error.value = ''
  try {
    const { error: err } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password
    })
    if (err) {
      error.value = 'Invalid email or password'
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    console.error(err)
    error.value = 'Terjadi kesalahan sistem.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

/* THEME VARIABLES MANAGEMENT */
.dark {
  --bg: #0f0f0f;
  --right-bg: #0f0f0f;
  --text-title: #ffffff;
  --text-sub: rgba(255,255,255,0.4);
  --text-label: rgba(255,255,255,0.6);
  --input-bg: #1a1a1a;
  --input-border: #2a2a2a;
  --input-focus-bg: #1f1510;
  --placeholder: rgba(255,255,255,0.2);
  --theme-btn-bg: #1a1a1a;
  --theme-btn-border: #2a2a2a;
  --theme-btn-text: rgba(255,255,255,0.6);
}
.light {
  --bg: #f5f5f0;
  --right-bg: #ffffff;
  --text-title: #111111;
  --text-sub: rgba(0,0,0,0.45);
  --text-label: rgba(0,0,0,0.65);
  --input-bg: #f5f5f0;
  --input-border: #e0e0db;
  --input-focus-bg: #fff0e6;
  --placeholder: rgba(0,0,0,0.3);
  --theme-btn-bg: #f5f5f0;
  --theme-btn-border: #e0e0db;
  --theme-btn-text: rgba(0,0,0,0.6);
}

.login-root {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg);
  transition: background 0.2s ease;
}

/* LEFT PANEL (Tetap dipertahankan gradasi khas Senja) */
.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1a0a00 0%, #3d1a00 50%, #7c3500 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.brand { position: relative; z-index: 2; text-align: center; color: #fff; }
.brand-icon { font-size: 56px; margin-bottom: 16px; display: block; }
.brand-name { font-size: 42px; font-weight: 800; letter-spacing: -1px; color: #fff; line-height: 1; }
.brand-tagline { margin-top: 16px; font-size: 16px; color: rgba(255,255,255,0.55); line-height: 1.6; }
.deco-circles { position: absolute; inset: 0; z-index: 1; }
.circle { position: absolute; border-radius: 50%; background: rgba(255, 140, 50, 0.08); border: 1px solid rgba(255, 140, 50, 0.12); }
.c1 { width: 400px; height: 400px; top: -100px; right: -100px; }
.c2 { width: 250px; height: 250px; bottom: 40px; left: -60px; }
.c3 { width: 150px; height: 150px; bottom: 160px; right: 60px; }

/* RIGHT PANEL */
.login-right {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--right-bg);
  padding: 48px 40px;
  position: relative;
  transition: background 0.2s ease;
}
.login-box { width: 100%; max-width: 360px; }
.login-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #e07b39; margin-bottom: 12px; }
.login-title { font-size: 32px; font-weight: 800; color: var(--text-title); letter-spacing: -0.5px; line-height: 1.1; }
.login-sub { margin-top: 8px; font-size: 14px; color: var(--text-sub); }

.login-form { margin-top: 40px; display: flex; flex-direction: column; gap: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 13px; font-weight: 500; color: var(--text-label); letter-spacing: 0.3px; }

.field input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 10px;
  padding: 13px 16px;
  font-size: 14px;
  color: var(--text-title);
  outline: none;
  transition: all 0.2s;
}
.field input::placeholder { color: var(--placeholder); }
.field input:focus { border-color: #e07b39; background: var(--input-focus-bg); }

.error-msg {
  font-size: 13px;
  color: #ff6b6b;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  padding: 10px 14px;
  border-radius: 8px;
}

.btn-login {
  margin-top: 4px;
  background: linear-gradient(135deg, #e07b39, #c45e1e);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}
.btn-login:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

/* FLOATING THEME TOGGLE BUTTON */
.btn-theme-toggle {
  position: absolute; top: 24px; right: 24px;
  background: var(--theme-btn-bg); border: 1px solid var(--theme-btn-border);
  color: var(--theme-btn-text); font-size: 12px; font-weight: 600;
  padding: 8px 14px; border-radius: 20px; cursor: pointer;
  transition: all 0.2s ease;
}
.btn-theme-toggle:hover { opacity: 0.85; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* MEDIA QUERIES */
@media (max-width: 768px) {
  .login-left { display: none; }
  .login-right { width: 100%; padding: 48px 24px; }
  .btn-theme-toggle { top: 16px; right: 16px; }
}
</style>