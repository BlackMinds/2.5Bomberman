import Phaser from 'phaser'
import { toScreen, TW, TH, COLS, ROWS } from '../constants'

export class TileMap {
  private sprites: Phaser.GameObjects.Image[][] = []

  constructor(private scene: Phaser.Scene) {}

  build(tiles: number[][]) {
    this.sprites.forEach(row => row.forEach(s => s.destroy()))
    this.sprites = []
    for (let r = 0; r < ROWS; r++) {
      this.sprites.push([])
      for (let c = 0; c < COLS; c++) {
        const { x, y } = toScreen(c, r)
        const key = tiles[r][c] === 1 ? 'tile-hard' : tiles[r][c] === 2 ? 'tile-soft' : 'tile-floor'
        const s = this.scene.add.image(x, y, key).setOrigin(0.5, 1)
        s.setDepth(r * COLS + c)
        this.sprites[r].push(s)
      }
    }
  }

  updateTile(x: number, y: number, type: number) {
    if (!this.sprites[y]?.[x]) return
    const key = type === 1 ? 'tile-hard' : type === 2 ? 'tile-soft' : 'tile-floor'
    this.sprites[y][x].setTexture(key)
  }

  getDepth(tx: number, ty: number) { return (ty + 1) * COLS * 10 }
}
