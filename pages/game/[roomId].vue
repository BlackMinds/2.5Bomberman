<script setup lang="ts">
import { connect, emit, disconnect, gameState } from '~/game/network/GameClient'

const route  = useRoute()
const { userId, username } = useAuth()
const gameRef = ref<HTMLElement | null>(null)
let phaserGame: any = null
const result = ref<string | null>(null)

onMounted(async () => {
  if (!useAuth().token.value) { navigateTo('/auth/login'); return }
  const config = useRuntimeConfig()
  connect(config.public.socketServerUrl)

  const { char, fetch } = useCharacter(); await fetch()
  const c = char.value
  emit('room:join', {
    roomId: route.params.roomId,
    player: { userId: userId.value, username: username.value,
      stats: { damage: c.statDamage, hp: c.statHp, speed: Number(c.statSpeed) } }
  })
  emit('room:ready')

  const { createGame } = await import('~/game/index')
  phaserGame = createGame(gameRef.value!)

  watch(() => gameState.events, (evs) => {
    const ev = evs[evs.length - 1]
    if (ev?.type === 'end')
      result.value = ev.winner === userId.value ? '🏆 You Win!' : ev.winner === 'draw' ? '🤝 Draw' : '💀 You Lose'
  }, { deep: true })
})

onUnmounted(() => { phaserGame?.destroy(true); disconnect() })
</script>

<template>
  <div class="game-page">
    <div ref="gameRef" class="game-canvas" />
    <div v-if="result" class="overlay">
      <div class="result-card">
        <h2>{{ result }}</h2>
        <button @click="navigateTo('/lobby')">Back to Lobby</button>
      </div>
    </div>
    <!-- Mobile controls -->
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
.overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); display:flex; align-items:center; justify-content:center; z-index:10; }
.result-card { background:#16213e; padding:2rem; border-radius:12px; text-align:center; display:flex; flex-direction:column; gap:1rem; }
.result-card button { padding:.75rem 2rem; border-radius:8px; border:none; background:#e94560; color:#fff; cursor:pointer; }
.dpad { display:none; position:fixed; bottom:1rem; right:1rem;
  grid-template-areas:". u ." "l c r" ". d ."; gap:.25rem; }
@media (pointer:coarse) { .dpad { display:grid; } }
.dpad button { width:48px; height:48px; border-radius:50%; border:none; background:#0f3460cc; color:#fff; font-size:1.1rem; touch-action:none; }
.dpad .u{grid-area:u} .dpad .l{grid-area:l} .dpad .c{grid-area:c;background:#e94560cc}
.dpad .r{grid-area:r} .dpad .d{grid-area:d}
</style>
