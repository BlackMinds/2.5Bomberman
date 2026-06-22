<script setup lang="ts">
const { headers } = useAuth()
const stages = ref<any[]>([])
const err = ref('')

onMounted(async () => {
  if (!useAuth().token.value) { navigateTo('/auth/login'); return }
  try { stages.value = await $fetch('/api/stage/list', { headers: headers.value }) }
  catch { err.value = 'Failed to load stages' }
})

const diffLabel = (d: number) => ['','🟢 Beginner','🟡 Medium','🟠 Hard','🔴 Elite'][d]
</script>

<template>
  <div class="stage-page">
    <header>
      <NuxtLink to="/lobby">← Back</NuxtLink>
      <h1>Stage Mode</h1>
    </header>
    <p v-if="err" class="err">{{ err }}</p>
    <div class="grid">
      <NuxtLink
        v-for="s in stages" :key="s.id"
        :to="s.unlocked ? `/stage/${s.id}` : ''"
        :class="['stage-card', { cleared: s.cleared, locked: !s.unlocked }]"
      >
        <div class="num">{{ s.id }}</div>
        <div class="diff">{{ diffLabel(s.difficulty) }}</div>
        <div v-if="s.cleared" class="best">⏱ {{ s.bestTime }}s</div>
        <div v-if="!s.unlocked" class="lock">🔒</div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.stage-page { padding:2rem; }
header { display:flex; align-items:center; gap:1rem; margin-bottom:2rem; }
h1 { font-size:1.5rem; }
a { color:#4fc3f7; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:1rem; }
.stage-card { background:#16213e; border-radius:10px; padding:1rem; text-align:center; text-decoration:none; color:#eee; transition:.2s; }
.stage-card:hover:not(.locked) { transform:scale(1.05); }
.cleared { border:2px solid #4caf50; }
.locked { opacity:.4; cursor:not-allowed; }
.num { font-size:1.5rem; font-weight:bold; }
.diff { font-size:.75rem; margin:.25rem 0; }
.best { font-size:.75rem; color:#a5d6a7; }
.lock { font-size:1.2rem; }
</style>

