<script setup lang="ts">
definePageMeta({ layout: false })
const { save } = useAuth()
const form = reactive({ email: '', username: '', password: '' })
const err = ref('')

async function submit() {
  try {
    const data = await $fetch('/api/auth/register', { method: 'POST', body: form })
    save(data); navigateTo('/lobby')
  } catch (e: any) { err.value = e.data?.message ?? '注册失败，请重试' }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="card">
      <h1>💣 注册账号</h1>
      <form @submit.prevent="submit">
        <input v-model="form.email"    type="email"    placeholder="邮箱"   required />
        <input v-model="form.username" type="text"     placeholder="用户名" required />
        <input v-model="form.password" type="password" placeholder="密码"   required />
        <p v-if="err" class="err">{{ err }}</p>
        <button type="submit">创建账号</button>
      </form>
      <NuxtLink to="/auth/login">已有账号？去登录</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.auth-wrap { display:flex; align-items:center; justify-content:center; min-height:100vh; }
.card { background:#16213e; padding:2rem; border-radius:12px; width:320px; display:flex; flex-direction:column; gap:1rem; }
h1 { text-align:center; font-size:1.5rem; }
input { width:100%; padding:.75rem; border-radius:8px; border:1px solid #444; background:#0f3460; color:#eee; }
button { width:100%; padding:.75rem; border-radius:8px; border:none; background:#e94560; color:#fff; cursor:pointer; font-size:1rem; }
.err { color:#e94560; font-size:.85rem; }
a { text-align:center; color:#4fc3f7; font-size:.9rem; }
</style>

