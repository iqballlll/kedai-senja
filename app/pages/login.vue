<template>
  <div class="login-root">
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
      <div class="login-box">
        <div class="login-header">
          <p class="login-eyebrow">Admin Portal</p>
          <h2 class="login-title">Welcome back</h2>
          <p class="login-sub">Sign in to your dashboard</p>
        </div>

        <div class="login-form">
          <div class="field">
            <label>Email</label>
            <input v-model="state.email" type="email" placeholder="admin@kedaisenja.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input v-model="state.password" type="password" placeholder="••••••••" />
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <button class="btn-login" :class="{ loading }" @click="login" :disabled="loading">
            <span v-if="!loading">Sign in</span>
            <span v-else class="spinner" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const router = useRouter()

const state = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function login() {
  loading.value = true
  error.value = ''
  const { error: err } = await supabase.auth.signInWithPassword({
    email: state.email,
    password: state.password
  })
  if (err) {
    error.value = 'Invalid email or password'
  } else {
    router.push('/dashboard')
  }
  loading.value = false
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.login-root {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  background: #0f0f0f;
}

/* LEFT PANEL */
.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1a0a00 0%, #3d1a00 50%, #7c3500 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
}

.brand-icon {
  font-size: 56px;
  margin-bottom: 16px;
  display: block;
}

.brand-name {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1px;
  color: #fff;
  line-height: 1;
}

.brand-tagline {
  margin-top: 16px;
  font-size: 16px;
  color: rgba(255,255,255,0.55);
  line-height: 1.6;
}

.deco-circles {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 140, 50, 0.08);
  border: 1px solid rgba(255, 140, 50, 0.12);
}

.c1 { width: 400px; height: 400px; top: -100px; right: -100px; }
.c2 { width: 250px; height: 250px; bottom: 40px; left: -60px; }
.c3 { width: 150px; height: 150px; bottom: 160px; right: 60px; }

/* RIGHT PANEL */
.login-right {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f0f;
  padding: 48px 40px;
}

.login-box {
  width: 100%;
  max-width: 360px;
}

.login-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #e07b39;
  margin-bottom: 12px;
}

.login-title {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.login-sub {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(255,255,255,0.4);
}

.login-form {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.3px;
}

.field input {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 13px 16px;
  font-size: 14px;
  color: #fff;
  outline: none;
  transition: border-color 0.2s;
}

.field input::placeholder { color: rgba(255,255,255,0.2); }

.field input:focus {
  border-color: #e07b39;
  background: #1f1510;
}

.error-msg {
  font-size: 13px;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.08);
  border: 1px solid rgba(255,107,107,0.2);
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
.btn-login:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .login-left { display: none; }
  .login-right { width: 100%; }
}
</style>