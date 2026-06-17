# BomberVerse 技术架构文档

> 版本：v1.1 | 日期：2026-06-17

---

## 一、技术选型总览

| 层次 | 技术 | 选型理由 |
|------|------|----------|
| 前端框架 | **Nuxt 3** (Vue 3 + SSR) | 可直接部署 Vercel，SSR+SPA 混合 |
| 游戏引擎 | **Phaser 3** | Canvas/WebGL，等距地图支持完善 |
| 实时通信 | **Socket.io** | WebSocket，联机核心 |
| 后端 API | **Nuxt Server Routes** (H3) | 零额外服务，Serverless 兼容 |
| 数据库 | **Neon** (PostgreSQL Serverless) | 与 Vercel 同架构，冷启动快 |
| ORM | **Drizzle ORM** | 轻量、Serverless 友好、类型安全 |
| 认证 | **nuxt-auth-utils** + JWT | 轻量 Session 管理 |
| Socket 服务 | **Railway** (独立部署) | Vercel 不支持长连接，Railway 免费额度够用 |
| 移动端 | **PWA** (Capacitor 可选) | 无需额外代码即可安装到手机 |
| 部署 | **Vercel** + **Railway** + **Neon** | 全 Serverless，免费额度起步 |

---

## 二、整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     客户端 (Browser / PWA)                   │
│                                                             │
│   ┌──────────────────┐     ┌───────────────────────────┐   │
│   │   Nuxt 3 UI      │     │     Phaser 3 游戏引擎      │   │
│   │   登录 / 注册     │     │  2.5D 等距地图 + 物理      │   │
│   │   大厅 / 背包     │     │  玩家移动 + 跳跃 + 炸弹    │   │
│   │   排行榜 / 个人页 │     │  客户端预测 + 服务端校正   │   │
│   └────────┬─────────┘     └─────────────┬─────────────┘   │
│            │ HTTPS REST                  │ WebSocket        │
└────────────┼─────────────────────────────┼─────────────────┘
             │                             │
    ┌────────▼──────────┐        ┌─────────▼──────────────┐
    │  Vercel (REST API) │        │  Railway (Socket.io)   │
    │                   │        │                        │
    │  /api/auth/*      │        │  PVP 房间管理          │
    │  /api/character/* │        │  PVE 敌人 AI tick      │
    │  /api/match/*     │        │  游戏状态同步          │
    │  /api/equipment/* │        │  权威碰撞检测          │
    │  /api/stage/*     │        │  胜负/通关判定         │
    └────────┬──────────┘        └────────────────────────┘
             │
    ┌────────▼──────────┐
    │   Neon (PostgreSQL)│
    │                   │
    │   users           │
    │   characters      │
    │   equipment       │
    │   matches         │
    │   match_players   │
    │   stage_progress  │
    │   stage_records   │
    └───────────────────┘
```

---

## 三、目录结构

```
2.5Bomberman/
├── nuxt.config.ts
├── .env.example
│
├── docs/
│   ├── GAME_DESIGN.md
│   └── TECH_ARCHITECTURE.md
│
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.post.ts
│   │   │   ├── login.post.ts
│   │   │   └── logout.post.ts
│   │   ├── character/
│   │   │   ├── index.get.ts      # 获取角色信息
│   │   │   ├── allocate.post.ts  # 分配属性点
│   │   │   └── equip.post.ts     # 更换装备
│   │   ├── match/
│   │   │   ├── history.get.ts
│   │   │   └── result.post.ts
│   │   ├── stage/
│   │   │   ├── list.get.ts         # 获取关卡列表（含解锁状态）
│   │   │   ├── progress.get.ts     # 获取通关进度
│   │   │   └── result.post.ts      # 提交通关结果（经验+装备）
│   │   └── leaderboard/
│   │       └── index.get.ts
│   ├── db/
│   │   ├── index.ts              # Drizzle + Neon 连接
│   │   └── schema.ts             # 数据库 Schema
│   ├── utils/
│   │   ├── auth.ts               # JWT 工具
│   │   └── exp.ts                # 经验/等级计算
│   └── middleware/
│       └── auth.ts               # API 鉴权中间件
│
├── socket-server/                # 独立 Socket.io 服务（部署到 Railway）
│   ├── index.ts
│   ├── RoomManager.ts
│   ├── GameEngine.ts
│   ├── StageEngine.ts            # PVE 闯关逻辑（敌人生成/判定通关）
│   ├── EnemyAI.ts                # 敌人 AI（巡逻/追击/逃跑状态机）
│   └── package.json
│
├── game/                         # Phaser 3 游戏引擎代码
│   ├── index.ts
│   ├── config.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── GameScene.ts
│   │   └── UIScene.ts
│   ├── objects/
│   │   ├── Player.ts
│   │   ├── Enemy.ts              # 敌人对象（同步服务端权威位置）
│   │   ├── Bomb.ts
│   │   ├── Explosion.ts
│   │   └── TileMap.ts
│   └── network/
│       └── GameClient.ts
│
├── pages/
│   ├── index.vue
│   ├── auth/
│   │   ├── login.vue
│   │   └── register.vue
│   ├── lobby.vue
│   ├── stage.vue                 # 闯关关卡选择界面
│   ├── game/[roomId].vue
│   ├── stage/[stageId].vue       # 闯关游戏房间
│   └── profile.vue
│
├── components/
│   ├── lobby/
│   │   ├── RoomList.vue
│   │   └── CreateRoomModal.vue
│   └── profile/
│       ├── CharacterStats.vue
│       ├── EquipmentSlot.vue
│       └── MatchHistory.vue
│
└── composables/
    ├── useAuth.ts
    ├── useCharacter.ts
    └── useSocket.ts
```

---

## 四、数据库设计（Drizzle Schema）

```typescript
// server/db/schema.ts

// 用户表
users {
  id          uuid        PK  DEFAULT gen_random_uuid()
  email       varchar(255) UNIQUE NOT NULL
  username    varchar(50)  UNIQUE NOT NULL
  password    text         NOT NULL   -- bcrypt hash
  created_at  timestamp    DEFAULT now()
}

// 角色表（每个用户一个角色）
characters {
  id          uuid  PK
  user_id     uuid  FK → users.id  UNIQUE
  level       int   DEFAULT 1
  exp         int   DEFAULT 0
  free_points int   DEFAULT 0       -- 未分配属性点
  stat_damage int   DEFAULT 20      -- 炸弹伤害
  stat_hp     int   DEFAULT 100     -- 最大血量
  stat_speed  numeric(4,1) DEFAULT 3.0
}

// 装备表
equipment {
  id           uuid  PK
  character_id uuid  FK → characters.id  UNIQUE
  bomb_type    varchar(50) DEFAULT 'normal'
  clothes_type varchar(50) DEFAULT 'cloth'
  shoes_type   varchar(50) DEFAULT 'sandals'
}

// 对战记录
matches {
  id        uuid  PK
  room_id   varchar(20) NOT NULL
  winner_id uuid  FK → users.id  NULLABLE   -- NULL = 平局
  duration  int                             -- 秒
  map_id    varchar(50)
  played_at timestamp DEFAULT now()
}

// 对战参与者（多对多）
match_players {
  match_id   uuid  FK → matches.id
  user_id    uuid  FK → users.id
  kills      int   DEFAULT 0
  survived   bool  DEFAULT false
  exp_gained int   DEFAULT 0
  PRIMARY KEY (match_id, user_id)
}

// 闯关进度（每个角色解锁了哪些关卡）
stage_progress {
  id            uuid  PK
  character_id  uuid  FK → characters.id
  stage_id      int   NOT NULL          -- 1~20
  unlocked      bool  DEFAULT false
  best_time     int   NULLABLE          -- 最快通关秒数
  cleared_at    timestamp NULLABLE
  UNIQUE (character_id, stage_id)
}

// 闯关记录（每次通关日志）
stage_records {
  id           uuid  PK
  stage_id     int   NOT NULL
  user_id      uuid  FK → users.id
  partner_id   uuid  FK → users.id  NULLABLE   -- 2人合作时的队友
  kills        int   DEFAULT 0
  duration     int                              -- 秒
  exp_gained   int   DEFAULT 0
  drop_item    varchar(50) NULLABLE             -- 掉落装备名
  played_at    timestamp DEFAULT now()
}
```

---

## 五、Socket.io 通信协议

### 客户端 → 服务端

| 事件 | 数据 | 说明 |
|------|------|------|
| `room:create` | `{ isPrivate, password? }` | 创建房间 |
| `room:join` | `{ roomId, password? }` | 加入房间 |
| `room:ready` | — | 玩家准备 |
| `game:input` | `{ type, direction?, seq }` | 输入（move/jump/bomb）|
| `room:leave` | — | 离开房间 |

### 服务端 → 客户端

| 事件 | 数据 | 说明 |
|------|------|------|
| `room:state` | `{ players, status }` | 房间状态更新 |
| `game:state` | `{ players, bombs, tiles, tick }` | 权威状态（100ms/帧）|
| `game:event` | `{ type, data }` | 离散事件（爆炸/死亡/道具）|
| `game:end` | `{ winner, results[] }` | 游戏结束 |

### 同步策略（服务端权威）

```
1. 客户端发送输入指令（携带序列号防丢包）
2. 服务端计算权威游戏状态
3. 服务端每 100ms 广播权威状态给房间所有玩家
4. 客户端本地预测 + 收到服务端状态后校正
```

---

## 五点五、PVE 闯关通信协议

### 客户端 → 服务端（PVE 专用）

| 事件 | 数据 | 说明 |
|------|------|------|
| `stage:start` | `{ stageId, partnerId? }` | 开始闯关 |
| `pve:input` | `{ type, direction?, seq }` | 玩家输入 |
| `stage:leave` | — | 放弃本关 |

### 服务端 → 客户端（PVE 专用）

| 事件 | 数据 | 说明 |
|------|------|------|
| `pve:state` | `{ players, enemies, bombs, tiles, tick }` | 权威状态（100ms/帧）|
| `pve:event` | `{ type, data }` | 敌人死亡/道具/爆炸 |
| `stage:clear` | `{ duration, exp, drop? }` | 通关结算 |
| `stage:fail` | — | 全员阵亡 |

### 敌人 AI 状态机（服务端 EnemyAI.ts）

```
PATROL ──(玩家进入感知范围)──► CHASE
  ▲                               │
  │(玩家离开感知范围×2)        (炸弹即将爆炸)
  │                               ▼
  └───────────────────────── FLEE
                  (安全后恢复 CHASE 或 PATROL)
```

- **AI tick**：每 200ms 重新计算一次状态和移动方向
- **放炸弹逻辑**：CHASE 状态下，与玩家处于同行或同列且距离 ≤ 3 格时放炸弹

---

## 六、2.5D 渲染方案（Phaser 3）

### 等距坐标转换

```typescript
// 世界坐标 → 屏幕坐标（等距投影）
function worldToScreen(tileX: number, tileY: number, tileZ = 0) {
  return {
    x: (tileX - tileY) * (TILE_W / 2),
    y: (tileX + tileY) * (TILE_H / 4) - tileZ * TILE_H,
  }
}
```

### 跳跃视觉效果

```
- jumpZ: 0 → 2 → 0（抛物线，0.4s）
- 阴影 sprite 固定在 Z=0，透明度随高度降低
- 渲染位置 = worldToScreen(x, y, jumpZ)
```

### 深度排序（正确遮挡）

```typescript
// Y 坐标越大越靠前渲染
sprite.setDepth(tileY * 100 + tileX)
```

---

## 七、认证流程

```
注册：
POST /api/auth/register
→ 校验邮箱/用户名唯一
→ bcrypt 哈希密码
→ 创建 user + character + equipment
→ 返回 JWT（7 天有效）

登录：
POST /api/auth/login
→ 校验密码
→ 返回 JWT

API 鉴权：
Authorization: Bearer <token>
server/middleware/auth.ts 校验 JWT → 注入 event.context.userId
```

---

## 八、部署配置

### Vercel（前端 + REST API）

```json
// vercel.json
{
  "buildCommand": "nuxt build",
  "outputDirectory": ".output",
  "framework": "nuxtjs"
}
```

**环境变量**

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/bomberverse?sslmode=require
JWT_SECRET=<随机 32 位字符串>
SOCKET_SERVER_URL=https://bomberverse-socket.railway.app
```

### Railway（Socket.io 服务器）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

### PWA（移动端安装）

```typescript
// nuxt.config.ts pwa 配置
{
  manifest: {
    name: 'BomberVerse',
    short_name: 'Bomber',
    display: 'standalone',
    orientation: 'landscape',
  }
}
```

---

## 九、开发启动

```bash
# 安装依赖
npm install

# 启动 Nuxt（前端 + REST API）
npm run dev                # http://localhost:3000

# 启动 Socket.io 服务（另开终端）
cd socket-server && npm run dev   # http://localhost:3001

# 同步数据库 Schema
npx drizzle-kit push
```

---

## 十、开发路线图

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | Nuxt3 初始化、Neon 连接、登录注册 | 1 周 |
| Phase 2 | Phaser 3 集成、2.5D 地图、移动/跳跃/炸弹 | 2 周 |
| Phase 3 | Socket.io PVP 联机、房间、状态同步 | 1.5 周 |
| Phase 4 | 经验等级、装备系统、属性加成 | 1 周 |
| Phase 5 | PVE 闯关：敌人 AI、关卡配置、通关结算 | 1.5 周 |
| Phase 6 | Vercel+Railway 部署、PWA 优化 | 0.5 周 |

**总预估：7.5 周**

---

## 十一、技术决策说明

**Socket.io 为何不放 Vercel？**
Vercel Serverless 函数最长执行 30s，不支持持久 WebSocket。Socket.io 独立部署在 Railway（支持长连接，免费 500 小时/月）。

**Phaser 3 vs Three.js？**
2.5D 等距本质是 2D 渲染 + 视觉技巧，Phaser 3 内置物理/动画/碰撞，开发效率比 Three.js 高 3x，且游戏体积更小。

**Drizzle vs Prisma？**
Drizzle 在 Serverless/Edge 无连接池问题，Prisma 在 Vercel 冷启动慢，Drizzle 更适合本项目架构。

**Neon 免费套餐**
存储 0.5GB + 计算 191.9 小时/月，满足个人项目需求。
