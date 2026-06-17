<script setup lang="ts">
const { headers, logout } = useAuth()
const { char, fetch, allocate, equip } = useCharacter()
const leaderboard = ref<any[]>([])
const err = ref('')

onMounted(async () => {
  if (!useAuth().token.value) { navigateTo('/auth/login'); return }
  await fetch()
  leaderboard.value = await $fetch('/api/leaderboard', { headers: headers.value }).catch(() => [])
})

const BOMB_ITEMS    = ['normal','strong','super','mighty']
const CLOTHES_ITEMS = ['cloth','leather','chain','holy']
const SHOES_ITEMS   = ['sandals','runners','swift','extreme']

const ITEM_NAMES: Record<string,string> = {
  normal:'普通', strong:'强力', super:'超级', mighty:'威猛',
  cloth:'布衣', leather:'皮甲', chain:'锁甲', holy:'圣甲',
  sandals:'凉鞋', runners:'跑鞋', swift:'疾风靴', extreme:'极速靴',
}

const EQUIP_BONUS: Record<string,Record<string,number>> = {
  bomb:    { normal:0, strong:15, super:35, mighty:60 },
  clothes: { cloth:0, leather:50, chain:120, holy:200 },
  shoes:   { sandals:0, runners:0.5, swift:1.0, extreme:1.5 },
}

async function doAllocate(attr: string) {
  await allocate(attr, 1).catch(e => { err.value = e.data?.message ?? 'Error' })
}

async function doEquip(slot: string, item: string) {
  await equip(slot, item).catch(e => { err.value = e.data?.message })
}

const expPct = computed(() => {
  if (!char.value) return 0
  const needed = char.value.level * 100
  return Math.round(char.value.exp / needed * 100)
})
</script>

<template>
  <div class="profile">
    <header>
      <NuxtLink to="/lobby">← 大厅</NuxtLink>
      <h1>👤 个人资料</h1>
      <button @click="logout">退出登录</button>
    </header>

    <div v-if="char" class="content">
      <!-- Stats -->
      <section class="card">
        <h2>Lv {{ char.level }} — {{ char.exp }} / {{ char.level * 100 }} 经验值</h2>
        <div class="exp-bar"><div :style="{width: expPct+'%'}" /></div>
        <p v-if="char.freePoints > 0" class="points">{{ char.freePoints }} 点可分配</p>

        <div class="stats">
          <div class="stat">
            <span>💣 伤害：{{ char.statDamage }}</span>
            <button v-if="char.freePoints" @click="doAllocate('damage')">+5</button>
          </div>
          <div class="stat">
            <span>❤️ 生命值：{{ char.statHp }}</span>
            <button v-if="char.freePoints" @click="doAllocate('hp')">+20</button>
          </div>
          <div class="stat">
            <span>👟 速度：{{ Number(char.statSpeed).toFixed(1) }}</span>
            <button v-if="char.freePoints" @click="doAllocate('speed')">+0.3</button>
          </div>
        </div>
        <p v-if="err" class="err">{{ err }}</p>
      </section>

      <!-- Equipment -->
      <section class="card">
        <h2>装备</h2>
        <div class="equip-slots">
          <div class="slot">
            <label>💣 炸弹（+伤害）</label>
            <div class="items">
              <button v-for="item in BOMB_ITEMS" :key="item"
                :class="{ active: char.equipment?.bombType === item }"
                @click="doEquip('bomb', item)">
                {{ ITEM_NAMES[item] }}<br><small>+{{ EQUIP_BONUS.bomb[item] }}</small>
              </button>
            </div>
          </div>
          <div class="slot">
            <label>👕 衣服（+生命值）</label>
            <div class="items">
              <button v-for="item in CLOTHES_ITEMS" :key="item"
                :class="{ active: char.equipment?.clothesType === item }"
                @click="doEquip('clothes', item)">
                {{ ITEM_NAMES[item] }}<br><small>+{{ EQUIP_BONUS.clothes[item] }}</small>
              </button>
            </div>
          </div>
          <div class="slot">
            <label>👟 鞋子（+速度）</label>
            <div class="items">
              <button v-for="item in SHOES_ITEMS" :key="item"
                :class="{ active: char.equipment?.shoesType === item }"
                @click="doEquip('shoes', item)">
                {{ ITEM_NAMES[item] }}<br><small>+{{ EQUIP_BONUS.shoes[item] }}</small>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Leaderboard -->
      <section class="card">
        <h2>🏆 排行榜</h2>
        <table>
          <thead><tr><th>#</th><th>玩家</th><th>等级</th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in leaderboard" :key="i">
              <td>{{ i + 1 }}</td><td>{{ row.username }}</td><td>{{ row.level }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile { padding:2rem; max-width:800px; margin:0 auto; }
header { display:flex; align-items:center; gap:1rem; margin-bottom:2rem; }
h1 { flex:1; font-size:1.5rem; }
header button { padding:.4rem 1rem; border-radius:8px; border:none; background:#444; color:#eee; cursor:pointer; }
a { color:#4fc3f7; }
.content { display:flex; flex-direction:column; gap:1.5rem; }
.card { background:#16213e; padding:1.5rem; border-radius:12px; }
h2 { margin-bottom:1rem; }
.exp-bar { height:8px; background:#333; border-radius:4px; overflow:hidden; margin-bottom:.5rem; }
.exp-bar div { height:100%; background:#4fc3f7; transition:.3s; }
.points { color:#ffeb3b; margin-bottom:1rem; }
.stats { display:flex; flex-direction:column; gap:.5rem; }
.stat { display:flex; align-items:center; justify-content:space-between; }
.stat button { padding:.2rem .6rem; border-radius:6px; border:none; background:#e94560; color:#fff; cursor:pointer; }
.equip-slots { display:flex; flex-direction:column; gap:1rem; }
.slot label { display:block; margin-bottom:.5rem; color:#aaa; }
.items { display:flex; gap:.5rem; flex-wrap:wrap; }
.items button { padding:.4rem .8rem; border-radius:8px; border:2px solid #333; background:#0f3460; color:#eee; cursor:pointer; font-size:.8rem; text-align:center; }
.items button.active { border-color:#4fc3f7; background:#1a4a7a; }
table { width:100%; border-collapse:collapse; }
th,td { padding:.5rem; text-align:left; border-bottom:1px solid #333; }
.err { color:#e94560; margin-top:.5rem; }
</style>

