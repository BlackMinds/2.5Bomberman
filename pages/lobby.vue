<script setup lang="ts">
const { username, headers, logout } = useAuth()
const roomId = ref('')
const err = ref('')
const config = useRuntimeConfig()

onMounted(() => { if (!useAuth().token.value) navigateTo('/auth/login') })

async function createPvp() {
  const { connect, emit, gameState } = await import('~/game/network/GameClient')
  connect(config.public.socketServerUrl)
  const { char } = useCharacter(); await char.value || useCharacter().fetch()
  const c = useCharacter().char.value
  emit('room:create', { opts: { mode: 'pvp' }, player: { userId: useAuth().userId.value, username: username.value, stats: charStats(c) } })
  // Wait for roomCreated event
  const unwatch = watch(() => gameState.events, (evs) => {
    const ev = evs.find((e: any) => e.type === 'roomCreated')
    if (ev) { unwatch(); navigateTo(`/game/${ev.roomId}`) }
  }, { deep: true })
}

async function joinRoom() {
  if (!roomId.value) return
  navigateTo(`/game/${roomId.value.toUpperCase()}`)
}

function charStats(c: any) {
  if (!c) return { damage: 20, hp: 100, speed: 3.0 }
  const { EQUIP } = (window as any).__EQUIP__ ?? { EQUIP: { bomb: {normal:0}, clothes: {cloth:0}, shoes: {sandals:0} } }
  return {
    damage: c.statDamage + (EQUIP.bomb[c.equipment?.bombType] ?? 0),
    hp:     c.statHp     + (EQUIP.clothes[c.equipment?.clothesType] ?? 0),
    speed:  Number(c.statSpeed) + (EQUIP.shoes[c.equipment?.shoesType] ?? 0),
  }
}
</script>

<template>
  <div class="lobby">
    <header>
      <h1>💣 BomberVerse</h1>
      <nav>
        <NuxtLink to="/stage">🗺 Stage Mode</NuxtLink>
        <NuxtLink to="/profile">👤 Profile</NuxtLink>
        <button @click="logout">Logout</button>
      </nav>
    </header>
    <main>
      <div class="card">
        <h2>PVP Battle</h2>
        <button @click="createPvp">Create Room</button>
        <div class="join-row">
          <input v-model="roomId" placeholder="Room Code" maxlength="6" />
          <button @click="joinRoom">Join</button>
        </div>
        <p v-if="err" class="err">{{ err }}</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.lobby { min-height:100vh; display:flex; flex-direction:column; }
header { display:flex; justify-content:space-between; align-items:center; padding:1rem 2rem; background:#16213e; }
nav { display:flex; gap:1rem; align-items:center; }
a { color:#4fc3f7; }
button { padding:.5rem 1.2rem; border-radius:8px; border:none; background:#e94560; color:#fff; cursor:pointer; }
main { display:flex; justify-content:center; align-items:center; flex:1; }
.card { background:#16213e; padding:2rem; border-radius:12px; width:320px; display:flex; flex-direction:column; gap:1rem; }
h2 { text-align:center; }
.join-row { display:flex; gap:.5rem; }
input { flex:1; padding:.5rem; border-radius:8px; border:1px solid #444; background:#0f3460; color:#eee; }
.err { color:#e94560; }
</style>

