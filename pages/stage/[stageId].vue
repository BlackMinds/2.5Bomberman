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
    <div class="topbar">
      <NuxtLink to="/stage" class="back">← 关卡列表</NuxtLink>
      <span class="stage-tag">第 {{ stageId }} 关</span>
      <span class="hint">方向键 / WASD 移动 · F / 💣 放炸弹</span>
    </div>

    <div class="stage-frame">
      <div ref="gameRef" class="game-canvas" />
    </div>

    <div v-if="result" class="overlay">
      <div class="result-card">
        <div class="burst">🎉</div>
        <h2>关卡通关！</h2>
        <ul class="rewards">
          <li><span>经验值</span><b class="exp">+{{ result.expGained }}</b></li>
          <li v-if="result.drop"><span>掉落道具</span><b class="drop">{{ result.drop }}</b></li>
          <li v-if="result.levelUp"><span>升级</span><b class="lvl">🆙 Lv {{ result.newLevel }}</b></li>
        </ul>
        <div class="btns">
          <button class="ghost" @click="navigateTo('/stage')">关卡列表</button>
          <button class="primary" @click="navigateTo(`/stage/${stageId + 1}`)">下一关 →</button>
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
.game-page {
  position: relative; display: flex; flex-direction: column; align-items: center;
  min-height: 100vh; padding: 1rem;
  background:
    radial-gradient(900px 400px at 50% 0%, #1a2550 0%, transparent 55%),
    linear-gradient(180deg, #0c1228 0%, #05070f 100%);
}
.topbar {
  width: 100%; max-width: 820px; display: flex; align-items: center; gap: 1rem;
  margin-bottom: .9rem; color: #9fb3c8; font-size: .85rem; flex-wrap: wrap;
}
.back {
  color: #9fb3c8; text-decoration: none; padding: .35rem .75rem;
  border: 1px solid #2a3656; border-radius: 999px; transition: .2s;
}
.back:hover { color: #eaf6ff; border-color: #4fc3f7; background: #4fc3f71a; }
.stage-tag {
  font-weight: 800; color: #eaf6ff; padding: .3rem .7rem; border-radius: 8px;
  background: linear-gradient(90deg, #4fc3f733, #b388ff33); border: 1px solid #4fc3f755;
}
.hint { margin-left: auto; opacity: .7; }

.stage-frame {
  padding: 8px; border-radius: 18px;
  background: linear-gradient(160deg, #1a2342, #0d1226);
  border: 1px solid #2a3656;
  box-shadow: 0 24px 60px -24px #000, 0 0 0 1px #4fc3f722 inset;
}
.game-canvas { width: 800px; max-width: calc(100vw - 2.5rem); border-radius: 12px; overflow: hidden; }

.overlay {
  position: fixed; inset: 0; background: rgba(5, 7, 15, .82); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.result-card {
  position: relative; min-width: 300px; padding: 2rem 2.25rem; text-align: center;
  display: flex; flex-direction: column; gap: .65rem; border-radius: 20px;
  background: linear-gradient(165deg, #1b2444 0%, #121a33 100%);
  border: 1px solid #4fc3f755;
  box-shadow: 0 30px 80px -24px #000, 0 0 36px -8px #4fc3f755;
  animation: pop .45s cubic-bezier(.2, 1.3, .4, 1) both;
}
@keyframes pop { from { transform: scale(.8); opacity: 0 } to { transform: scale(1); opacity: 1 } }
.burst { font-size: 2.6rem; line-height: 1; }
.result-card h2 {
  font-size: 1.5rem; font-weight: 800;
  background: linear-gradient(90deg, #69f0ae, #4fc3f7); -webkit-background-clip: text;
  background-clip: text; color: transparent;
}
.rewards { list-style: none; display: flex; flex-direction: column; gap: .5rem; margin: .4rem 0; }
.rewards li {
  display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
  padding: .55rem .9rem; border-radius: 10px; background: #0b1022aa; border: 1px solid #2a3656;
}
.rewards span { color: #9fb3c8; font-size: .85rem; }
.rewards b { font-size: 1rem; }
.exp { color: #4fc3f7; }
.drop { color: #ffd54f; }
.lvl { color: #69f0ae; }
.btns { display: flex; gap: .6rem; justify-content: center; margin-top: .5rem; }
button {
  padding: .65rem 1.3rem; border-radius: 10px; border: none; cursor: pointer;
  font-weight: 700; font-size: .9rem; transition: transform .15s, filter .15s;
}
button:hover { transform: translateY(-2px); filter: brightness(1.1); }
.primary { background: linear-gradient(90deg, #4fc3f7, #b388ff); color: #06122a; }
.ghost { background: #0b1022; color: #cfe3f5; border: 1px solid #2a3656; }

.dpad {
  display: none; position: fixed; bottom: 1rem; right: 1rem;
  grid-template-areas: ". u ." "l c r" ". d ."; gap: .3rem;
}
@media (pointer: coarse) { .dpad { display: grid; } }
.dpad button {
  width: 52px; height: 52px; border-radius: 50%; border: 1px solid #ffffff22;
  background: #0f3460cc; color: #fff; font-size: 1.1rem; touch-action: none;
  backdrop-filter: blur(4px);
}
.dpad .u { grid-area: u } .dpad .l { grid-area: l }
.dpad .c { grid-area: c; background: #e94560cc } .dpad .r { grid-area: r } .dpad .d { grid-area: d }
</style>
