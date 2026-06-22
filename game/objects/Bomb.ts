import Phaser from 'phaser'
import { toScreen } from '../constants'
import { TileMap } from './TileMap'

export class BombSprite {
  private img: Phaser.GameObjects.Image
  private pulse: Phaser.Tweens.Tween

  constructor(scene: Phaser.Scene, public id: string, tx: number, ty: number, map: TileMap) {
    const { x, y } = toScreen(tx, ty)
    this.img = scene.add.image(x, y - 6, 'bomb')
      .setOrigin(0.5, 0.82)
      .setDepth(map.getDepth(tx, ty) + 1)
    // breathing squash/stretch so the bomb reads as "armed"
    this.pulse = scene.tweens.add({
      targets: this.img, scaleX: 1.12, scaleY: 0.9,
      duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  flash() { this.img.setTint(0xff4444) }

  destroy() { this.pulse?.remove(); this.img.destroy() }
}
