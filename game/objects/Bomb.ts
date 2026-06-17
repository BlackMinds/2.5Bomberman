import Phaser from 'phaser'
import { toScreen } from '../constants'
import { TileMap } from './TileMap'

export class BombSprite {
  private img: Phaser.GameObjects.Image
  constructor(scene: Phaser.Scene, public id: string, tx: number, ty: number, map: TileMap) {
    const { x, y } = toScreen(tx, ty)
    this.img = scene.add.image(x, y - 16, 'bomb').setDepth(map.getDepth(tx, ty) + 1)
  }
  flash() { this.img.setTint(0xff4444) }
  destroy() { this.img.destroy() }
}
