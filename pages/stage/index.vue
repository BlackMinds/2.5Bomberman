<script setup lang="ts">
const { headers } = useAuth()
const stages = ref<any[]>([])
const err = ref('')
const loading = ref(true)

onMounted(async () => {
  if (!useAuth().token.value) { navigateTo('/auth/login'); return }
  try { stages.value = await $fetch('/api/stage/list', { headers: headers.value }) }
  catch { err.value = '关卡列表加载失败' }
  finally { loading.value = false }
})

const DIFF = [
  null,
  { label: '入门', cls: 'd1' },
  { label: '普通', cls: 'd2' },
  { label: '困难', cls: 'd3' },
  { label: '精英', cls: 'd4' },
]
const clearedCount = computed(() => stages.value.filter(s => s.cleared).length)
</script>

<template>
  <div class="stage-page">
    <header class="bar">
      <NuxtLink to="/lobby" class="back">← 返回大厅</NuxtLink>
      <div class="titles">
        <h1>关卡模式</h1>
        <p class="sub">逐关挑战 AI 守卫，通关解锁下一关</p>
      </div>
      <div v-if="!loading" class="progress">
        <span class="big">{{ clearedCount }}</span> / {{ stages.length }} 已通关
      </div>
    </header>

    <p v-if="err" class="err">{{ err }}</p>

    <div v-if="loading" class="grid">
      <div v-for="n in 8" :key="n" class="stage-card skeleton" />
    </div>

    <div v-else class="grid">
      <NuxtLink
        v-for="s in stages" :key="s.id"
        :to="s.unlocked ? `/stage/${s.id}` : ''"
        :class="['stage-card', `lvl-${DIFF[s.difficulty]?.cls}`, { cleared: s.cleared, locked: !s.unlocked }]"
      >
        <span v-if="s.cleared" class="ribbon">✓ 通关</span>
        <div class="num">{{ s.id }}</div>
        <div v-if="DIFF[s.difficulty]" class="diff">{{ DIFF[s.difficulty]!.label }}</div>
        <div v-if="s.cleared" class="best">⏱ 最佳 {{ s.bestTime }}s</div>
        <div v-if="!s.unlocked" class="lockmask"><span>🔒</span></div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.stage-page {
  min-height: 100vh; padding: 2rem 1.5rem 3rem;
  background:
    radial-gradient(1200px 500px at 50% -10%, #1b2550 0%, transparent 60%),
    linear-gradient(180deg, #0e1430 0%, #05070f 100%);
}
.bar {
  display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;
  max-width: 980px; margin: 0 auto 2rem;
}
.back {
  color: #9fb3c8; text-decoration: none; font-size: .9rem;
  padding: .45rem .8rem; border: 1px solid #2a3656; border-radius: 999px;
  transition: .2s; white-space: nowrap;
}
.back:hover { color: #eaf6ff; border-color: #4fc3f7; background: #4fc3f71a; }
.titles { flex: 1; }
h1 {
  font-size: 1.8rem; font-weight: 800; letter-spacing: .04em;
  background: linear-gradient(90deg, #4fc3f7, #b388ff); -webkit-background-clip: text;
  background-clip: text; color: transparent;
}
.sub { color: #8aa0b8; font-size: .85rem; margin-top: .25rem; }
.progress { color: #9fb3c8; font-size: .85rem; }
.progress .big { color: #69f0ae; font-size: 1.5rem; font-weight: 800; }

.grid {
  max-width: 980px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 1rem;
}
.stage-card {
  position: relative; overflow: hidden; aspect-ratio: 1 / 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .35rem;
  border-radius: 16px; text-decoration: none; color: #eaf6ff;
  background: linear-gradient(160deg, #1a2342 0%, #121a33 100%);
  border: 1px solid #2a3656;
  box-shadow: 0 8px 24px -12px #000a;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.stage-card::before {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 4px;
  background: var(--accent, #4fc3f7);
}
.lvl-d1 { --accent: #69f0ae; }
.lvl-d2 { --accent: #4fc3f7; }
.lvl-d3 { --accent: #ffb74d; }
.lvl-d4 { --accent: #ff5252; }
.stage-card:hover:not(.locked) {
  transform: translateY(-4px); border-color: var(--accent, #4fc3f7);
  box-shadow: 0 14px 30px -10px #000c, 0 0 0 1px var(--accent, #4fc3f7) inset;
}
.num { font-size: 2.1rem; font-weight: 800; line-height: 1; }
.diff {
  font-size: .72rem; font-weight: 700; padding: .12rem .55rem; border-radius: 999px;
  color: var(--accent, #4fc3f7); background: color-mix(in srgb, var(--accent, #4fc3f7) 16%, transparent);
}
.best { font-size: .72rem; color: #a5d6a7; }
.ribbon {
  position: absolute; top: 8px; right: 8px; font-size: .65rem; font-weight: 700;
  color: #05140c; background: #69f0ae; padding: .12rem .45rem; border-radius: 999px;
}
.cleared { border-color: #69f0ae66; }
.locked { cursor: not-allowed; }
.lockmask {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: #0a0e1cd0; backdrop-filter: blur(1px); font-size: 1.6rem;
}
.skeleton { animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: .5 } 50% { opacity: .85 } }
.err { text-align: center; color: #ff8a80; margin: 1rem 0; }
</style>
