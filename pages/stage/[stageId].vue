<script setup lang="ts">
import { connect, emit, disconnect, gameState } from '~/game/network/GameClient'

const route = useRoute()
const { userId, username, headers } = useAuth()
const gameRef = ref<HTMLElement | null>(null)
let phaserGame: any = null
const result = ref<any>(null)
const stageId = Number(route.params.stageId)

onMounted(async () => {
  if (!useAuth().token.value) { navigateTo('/auth/login'); return }
  const config = useRuntimeConfig()
  connect(config.public.socketServerUrl)

  const { char, fetch } = useCharacter(); await fetch()
  const c = char.value

  emit('room:create', {
    opts: { mode: 'pve', stageId },
    player: { userId: userId.value, username: username.value,
      stats: { damage: c.statDamage, hp: c.statHp, speed: Number(c.statSpeed) } }
  })

  // Wait for roomCreated then auto-ready
  const unwatch = watch(() => gameState.events, (evs) => {
    const ev = evs[evs.length - 1]
    if (ev?.type === 'roomCreated') { unwatch(); emit('room:ready') }
    if (ev?.type === 'stageClear') {
      // Submit result to server
      $fetch('/api/stage/result', {
        method: 'POST', headers: headers.value,
        body: { stageId, kills: ev.kills?.length ?? 0, duration: ev.duration }
      }).then(r => { result.value = r })
    }
  }, { deep: true })

  const { createGame } = await import('~/game/index')
  phaserGame = createGame(gameRef.value!)
})

onUnmounted(() => { phaserGame?.destroy(true); disconnect() })
</script>

<template>
  <div class="game-page">
    <div ref="gameRef" class="game-canvas" />
    <div v-if="result" class="overlay">
      <div class="result-card">
        <h2>🎉 Stage Clear!</h2>
        <p>EXP +{{ result.expGained }}</p>
        <p v-if="result.drop">Drop: <b>{{ result.drop }}</b></p>
        <p v-if="result.levelUp">🆙 Level Up → Lv {{ result.newLevel }}</p>
        <div class="btns">
          <button @click="navigateTo('/stage')">Stage List</button>
          <button @click="navigateTo(`/stage/${stageId + 1}`)">Next Stage →</button>
        </div>
      </div>
    </div>
    <div class="dpad">
      <button @touchstart.prevent="emit('game:input',{type:'move',direction:'up'})"    class="u">▲</button>
      <button @touchstart.prevent="emit('game:input',{type:'move',direction:'left'})"  class="l">◀</button>
      <button @touchstart.prevent="emit('game:input',{type:'bomb'})"                   class="c">💣</button>
      <button @touchstart.prevent="emit('game:input',{type:'move',direction:'right'})" class="r">▶</button>
      <button @touchstart.prevent="emit('game:input',{type:'move',direction:'down'})"  class="d">▼</button>
    </div>
  </div>
</template>

<style scoped>
.game-page { position:relative; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
.game-canvas { width:800px; max-width:100vw; }
.overlay { position:fixed; inset:0; background:rgba(0,0,0,.8); display:flex; align-items:center; justify-content:center; z-index:10; }
.result-card { background:#16213e; padding:2rem; border-radius:12px; text-align:center; display:flex; flex-direction:column; gap:.75rem; min-width:280px; }
.btns { display:flex; gap:.5rem; justify-content:center; margin-top:.5rem; }
button { padding:.6rem 1.2rem; border-radius:8px; border:none; background:#e94560; color:#fff; cursor:pointer; }
.dpad { display:none; position:fixed; bottom:1rem; right:1rem;
  grid-template-areas:". u ." "l c r" ". d ."; gap:.25rem; }
@media (pointer:coarse) { .dpad { display:grid; } }
.dpad button { width:48px; height:48px; border-radius:50%; border:none; background:#0f3460cc; color:#fff; font-size:1.1rem; touch-action:none; }
.dpad .u{grid-area:u} .dpad .l{grid-area:l} .dpad .c{grid-area:c;background:#e94560cc}
.dpad .r{grid-area:r} .dpad .d{grid-area:d}
</style>
