<script setup lang="ts">
import { connect, emit, disconnect, gameState } from '~/game/network/GameClient'

const route  = useRoute()
const { userId, username, headers } = useAuth()
const gameRef = ref<HTMLElement | null>(null)
let phaserGame: any = null
const result = ref<string | null>(null)
const reward = ref<any>(null)
let submittedStageResult = false
const touchInput = reactive({ left: false, right: false, jump: false, bomb: false })

function sendInput(patch: Partial<typeof touchInput>) {
  Object.assign(touchInput, patch)
  emit('game:input', { ...touchInput })
  if (patch.bomb) touchInput.bomb = false
}

onMounted(async () => {
  if (!useAuth().token.value) { navigateTo('/auth/login'); return }
  const config = useRuntimeConfig()
  connect(config.public.socketServerUrl)

  const { char, fetch } = useCharacter(); await fetch()
  const c = char.value
  emit('room:join', {
    roomId: route.params.roomId,
    player: { userId: userId.value, username: username.value,
      stats: charStats(c) }
  })
  emit('room:ready')

  const { createGame } = await import('~/game/index')
  phaserGame = createGame(gameRef.value!)

  watch(() => gameState.events, (evs) => {
    const ev = evs[evs.length - 1]
    if (ev?.type === 'end')
      result.value = ev.winner === userId.value ? '🏆 You Win!' : ev.winner === 'draw' ? '🤝 Draw' : '💀 You Lose'
    if (ev?.type === 'stageClear' && !submittedStageResult) {
      submittedStageResult = true
      const stageId = ev.stageId ?? gameState.stageId
      const partner = gameState.players.find((p: any) => p.userId !== userId.value && !(p as any).aiState)
      $fetch('/api/stage/result', {
        method: 'POST',
        headers: headers.value,
        body: { stageId, kills: ev.kills ?? 0, duration: ev.duration, partnerId: partner?.userId ?? null },
      }).then((r) => {
        reward.value = r
        result.value = '🎉 Stage Clear!'
      })
    }
  }, { deep: true })
})

onUnmounted(() => { phaserGame?.destroy(true); disconnect() })

function charStats(c: any) {
  if (!c) return { damage: 20, hp: 100, speed: 3.0 }
  const { EQUIP } = (window as any).__EQUIP__ ?? { EQUIP: { bomb: {normal:0}, clothes: {cloth:0}, shoes: {sandals:0} } }
  return {
    damage: c.statDamage + (EQUIP.bomb[c.equipment?.bombType] ?? 0),
    hp: c.statHp + (EQUIP.clothes[c.equipment?.clothesType] ?? 0),
    speed: Number(c.statSpeed) + (EQUIP.shoes[c.equipment?.shoesType] ?? 0),
  }
}
</script>

<template>
  <div class="game-page">
    <div ref="gameRef" class="game-canvas" />
    <div v-if="result" class="overlay">
      <div class="result-card">
        <h2>{{ result }}</h2>
        <ul v-if="reward" class="rewards">
          <li><span>EXP</span><b>+{{ reward.expGained }}</b></li>
          <li v-if="reward.drop"><span>Drop</span><b>{{ reward.drop }}</b></li>
          <li v-if="reward.levelUp"><span>Level</span><b>Lv {{ reward.newLevel }}</b></li>
        </ul>
        <button @click="navigateTo(gameState.mode === 'pve' ? '/stage' : '/lobby')">
          {{ gameState.mode === 'pve' ? 'Back to Stages' : 'Back to Lobby' }}
        </button>
      </div>
    </div>
    <!-- Mobile controls -->
    <div class="dpad">
      <button @touchstart.prevent="sendInput({ jump: true })" @touchend.prevent="sendInput({ jump: false })" class="u">▲</button>
      <button @touchstart.prevent="sendInput({ left: true })" @touchend.prevent="sendInput({ left: false })" class="l">◀</button>
      <button @touchstart.prevent="sendInput({ bomb: true })" class="c">●</button>
      <button @touchstart.prevent="sendInput({ right: true })" @touchend.prevent="sendInput({ right: false })" class="r">▶</button>
    </div>
  </div>
</template>

<style scoped>
.game-page { position:relative; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
.game-canvas { width:800px; max-width:100vw; }
.overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); display:flex; align-items:center; justify-content:center; z-index:10; }
.result-card { background:#16213e; padding:2rem; border-radius:12px; text-align:center; display:flex; flex-direction:column; gap:1rem; }
.rewards { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.45rem; }
.rewards li { display:flex; justify-content:space-between; gap:1.5rem; padding:.45rem .75rem; border-radius:8px; background:#0b1022; }
.result-card button { padding:.75rem 2rem; border-radius:8px; border:none; background:#e94560; color:#fff; cursor:pointer; }
.dpad { display:none; position:fixed; bottom:1rem; right:1rem;
  grid-template-areas:". u ." "l c r"; gap:.25rem; }
@media (pointer:coarse) { .dpad { display:grid; } }
.dpad button { width:48px; height:48px; border-radius:50%; border:none; background:#0f3460cc; color:#fff; font-size:1.1rem; touch-action:none; }
.dpad .u{grid-area:u} .dpad .l{grid-area:l} .dpad .c{grid-area:c;background:#e94560cc}
.dpad .r{grid-area:r}
</style>
