export interface StageConfig {
  difficulty: 1 | 2 | 3 | 4
  enemyMin: number; enemyMax: number
  enemyHp: number; enemyDamage: number; enemySpeed: number; senseRange: number
  killExp: number; clearExp: number
}

const D: Record<1|2|3|4, StageConfig> = {
  1: { difficulty:1, enemyMin:2, enemyMax:3,  enemyHp:40,  enemyDamage:10, enemySpeed:2.0, senseRange:3, killExp:15, clearExp:50  },
  2: { difficulty:2, enemyMin:3, enemyMax:5,  enemyHp:80,  enemyDamage:18, enemySpeed:2.5, senseRange:4, killExp:25, clearExp:80  },
  3: { difficulty:3, enemyMin:5, enemyMax:7,  enemyHp:140, enemyDamage:28, enemySpeed:3.0, senseRange:5, killExp:40, clearExp:120 },
  4: { difficulty:4, enemyMin:7, enemyMax:10, enemyHp:220, enemyDamage:40, enemySpeed:3.5, senseRange:6, killExp:60, clearExp:180 },
}

export const STAGE_CONFIG: Record<number, StageConfig> = Object.fromEntries(
  Array.from({ length: 20 }, (_, i) => [i + 1, D[Math.ceil((i + 1) / 5) as 1|2|3|4]])
)
