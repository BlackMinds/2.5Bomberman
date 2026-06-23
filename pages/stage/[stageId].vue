<script setup lang="ts">
import { connect, emit, gameState } from '~/game/network/GameClient'

const route = useRoute()
const config = useRuntimeConfig()
const { userId, username } = useAuth()
const stageId = Number(route.params.stageId)
const err = ref('')

onMounted(async () => {
  if (!useAuth().token.value) { navigateTo('/auth/login'); return }
  try {
    connect(config.public.socketServerUrl)
    const { char, fetch } = useCharacter()
    await fetch()
    const start = gameState.events.length
    const stop = watch(() => gameState.events.slice(start), (events) => {
      const created = events.find((ev: any) => ev.type === 'roomCreated' && ev.mode === 'pve')
      const failed = events.find((ev: any) => ev.type === 'error')
      if (created) {
        stop()
        navigateTo(`/game/${created.roomId}`)
      } else if (failed) {
        stop()
        err.value = failed.msg ?? '创建房间失败'
      }
    }, { deep: true })

    emit('room:create', {
      opts: { mode: 'pve', stageId },
      player: { userId: userId.value, username: username.value, stats: charStats(char.value) },
    })
  } catch {
    err.value = '创建房间失败'
  }
})

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
  <div class="stage-bridge">
    <div class="panel">
      <p class="eyebrow">Stage {{ stageId }}</p>
      <h1>{{ err || '正在创建 PvE 房间...' }}</h1>
      <button v-if="err" @click="navigateTo('/stage')">返回关卡列表</button>
    </div>
  </div>
</template>

<style scoped>
.stage-bridge {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #05070f; color: #eaf6ff;
}
.panel {
  width: min(360px, calc(100vw - 2rem)); padding: 2rem; border-radius: 8px;
  background: #16213e; border: 1px solid #2a3656; text-align: center;
}
.eyebrow { margin: 0 0 .5rem; color: #4fc3f7; font-weight: 700; }
h1 { margin: 0; font-size: 1.15rem; }
button {
  margin-top: 1.25rem; padding: .65rem 1.2rem; border: none; border-radius: 8px;
  background: #e94560; color: #fff; cursor: pointer;
}
</style>
