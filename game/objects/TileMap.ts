import Phaser from 'phaser'
import { toScreen, COLS, ROWS } from '../constants'

export class TileMap {
  private sprites: Phaser.GameObjects.Image[][] = []

  constructor(private scene: Phaser.Scene) {}

  /** Pick the texture key for a tile type, with a checkerboard for floors. */
  private keyFor(type: number, c: number, r: number) {
    if (type === 1) return 'tile-hard'
    if (type === 2) return 'tile-soft'
    return (c + r) % 2 === 0 ? 'tile-floor' : 'tile-floor-2'
  }

  build(tiles: number[][]) {
    this.sprites.forEach(row => row.forEach(s => s.destroy()))
    this.sprites = []
    for (let r = 0; r < ROWS; r++) {
      this.sprites.push([])
      for (let c = 0; c < COLS; c++) {
        const { x, y } = toScreen(c, r)
        const s = this.scene.add.image(x, y, this.keyFor(tiles[r][c], c, r)).setOrigin(0.5, 1)
        // Isometric painter's order: tiles further "front" (larger c+r) draw on top,
        // so raised wall blocks correctly occlude the floor behind them.
        s.setDepth(c + r)
        this.sprites[r].push(s)
      }
    }
  }

  updateTile(x: number, y: number, type: number) {
    if (!this.sprites[y]?.[x]) return
    this.sprites[y][x].setTexture(this.keyFor(type, x, y))
  }

  getDepth(tx: number, ty: number) { return (ty + 1) * COLS * 10 }
}
