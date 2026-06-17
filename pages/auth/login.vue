<script setup lang="ts">
definePageMeta({ layout: false })
const { save } = useAuth()
const form = reactive({ account: '', password: '' })
const err = ref('')

async function submit() {
  try {
    const data = await $fetch('/api/auth/login', { method: 'POST', body: form })
    save(data); navigateTo('/lobby')
  } catch (e: any) { err.value = e.data?.message ?? '登录失败，请重试' }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="card">
      <h1>💣 BomberVerse</h1>
      <form @submit.prevent="submit">
        <input v-model="form.account"  type="text"     placeholder="用户名" required />
        <input v-model="form.password" type="password" placeholder="密码"   required />
        <p v-if="err" class="err">{{ err }}</p>
        <button type="submit">登录</button>
      </form>
      <NuxtLink to="/auth/register">没有账号？去注册</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; }
.auth-wrap { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#0d1b2a; }
.card { background:#16213e; padding:2.5rem 2rem; border-radius:12px; width:360px; display:flex; flex-direction:column; gap:1.2rem; }
h1 { text-align:center; font-size:1.5rem; color:#eee; margin:0; }
input { width:100%; padding:.85rem 1rem; border-radius:8px; border:1px solid #444; background:#0f3460; color:#eee; font-size:1rem; outline:none; }
input:focus { border-color:#4fc3f7; }
button { width:100%; padding:.85rem; border-radius:8px; border:none; background:#e94560; color:#fff; cursor:pointer; font-size:1rem; font-weight:600; margin-top:.3rem; }
button:hover { background:#c73652; }
.err { color:#e94560; font-size:.85rem; margin:0; }
a { text-align:center; color:#4fc3f7; font-size:.9rem; }
</style>

