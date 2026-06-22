import Phaser from 'phaser'
import { toScreen, PLAYER_COLORS, ENEMY_COLOR, COLS, ROWS } from '../constants'
import { TileMap } from '../objects/TileMap'
import { PlayerSprite } from '../objects/Player'
import { BombSprite } from '../objects/Bomb'
import { gameState, emit, getSocketId } from '../network/GameClient'
import { watch } from 'vue'

const OFFSET_X = 420
const OFFSET_Y = 60

export class GameScene extends Phaser.Scene {
  private map!: TileMap
  private players = new Map<string, PlayerSprite>()
  private bombs   = new Map<string, BombSprite>()
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys & { w: any; a: any; s: any; d: any; f: any }
  private lastInputAt = 0

  constructor() { super('Game') }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e')
    this.scene.launch('UI')   // UIScene is registered inactive; run it alongside the game
    this.map = new TileMap(this)
    this.cameras.main.setScroll(-OFFSET_X, -OFFSET_Y)

    const kb = this.input.keyboard!
    this.keys = {
      ...this.input.keyboard!.createCursorKeys(),
      w: kb.addKey('W'), a: kb.addKey('A'), s: kb.addKey('S'),
      d: kb.addKey('D'), f: kb.addKey('F'),
    } as any

    // React to state changes
    watch(() => gameState.tiles, (tiles) => {
      if (tiles.length) this.map.build(tiles)
    }, { immediate: true })

    watch(() => gameState.events, (evs) => {
      const ev = evs[evs.length - 1]
      if (!ev) return
      if (ev.type === 'explosion') {
        for (const t of ev.tiles)
          this.map.updateTile(t.x, t.y, gameState.tiles[t.y]?.[t.x] ?? 0)
        this.cameras.main.shake(120, 0.004)
      }
      if (ev.type === 'end' || ev.type === 'stageClear')
        this.scene.pause()
    }, { deep: true })
  }

  update() {
    this.syncSprites()
    this.handleInput()
  }

  private syncSprites() {
    const myId = getSocketId()
    // Players
    for (const p of gameState.players) {
      if (!(p as any).aiState) {
        // Human player
        if (!this.players.has(p.id)) {
          const idx = gameState.players.filter(x => !(x as any).aiState).indexOf(p)
          const color = p.id === myId ? PLAYER_COLORS[0] : PLAYER_COLORS[(idx % 3) + 1]
          this.players.set(p.id, new PlayerSprite(this, p.id, p.x, p.y, color, p.username, this.map))
        }
        const sp = this.players.get(p.id)!
        sp.update(p.x, p.y, p.hp, p.maxHp)
        sp.setDepth(this.map.getDepth(p.x, p.y) + 2)
        if (!p.alive) sp.die()
      } else {
        // Enemy
        if (!this.players.has(p.id)) {
          this.players.set(p.id, new PlayerSprite(this, p.id, p.x, p.y, ENEMY_COLOR, p.username, this.map))
        }
        const sp = this.players.get(p.id)!
        sp.update(p.x, p.y, p.hp, p.maxHp)
        if (!p.alive) sp.die()
      }
    }

    // Bombs
    const activeBombIds = new Set(gameState.bombs.map((b: any) => b.id))
    for (const [id, sp] of this.bombs) {
      if (!activeBombIds.has(id)) { sp.destroy(); this.bombs.delete(id) }
    }
    for (const b of gameState.bombs) {
      if (!this.bombs.has(b.id))
        this.bombs.set(b.id, new BombSprite(this, b.id, b.x, b.y, this.map))
    }
  }

  private handleInput() {
    const now = Date.now()
    if (now - this.lastInputAt < 80) return
    const k = this.keys
    let dir: string | null = null
    if      (k.up.isDown    || k.w.isDown) dir = 'up'
    else if (k.down.isDown  || k.s.isDown) dir = 'down'
    else if (k.left.isDown  || k.a.isDown) dir = 'left'
    else if (k.right.isDown || k.d.isDown) dir = 'right'
    if (dir) { emit('game:input', { type: 'move', direction: dir }); this.lastInputAt = now }
    if (k.f.isDown) { emit('game:input', { type: 'bomb' }); this.lastInputAt = now }
  }
}
