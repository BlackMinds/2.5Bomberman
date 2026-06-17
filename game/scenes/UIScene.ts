import Phaser from 'phaser'
import { gameState } from '../network/GameClient'
import { watch } from 'vue'

export class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text

  constructor() { super({ key: 'UI', active: false }) }

  create() {
    this.timerText = this.add.text(10, 10, '', { fontSize: '20px', color: '#fff', stroke: '#000', strokeThickness: 4 })
    this.statusText = this.add.text(400, 300, '', { fontSize: '32px', color: '#ffeb3b', stroke: '#000', strokeThickness: 5 })
      .setOrigin(0.5).setVisible(false)

    watch(() => gameState.events, (evs) => {
      const last = evs[evs.length - 1]
      if (!last) return
      if (last.type === 'end') {
        this.statusText.setText(last.winner === 'draw' ? 'DRAW!' : 'WINNER!').setVisible(true)
      }
      if (last.type === 'stageClear') {
        this.statusText.setText('STAGE CLEAR! ✓').setVisible(true)
      }
    }, { deep: true })
  }

  update() {
    const s = gameState.timeLeft
    const m = Math.floor(s / 60000), sec = Math.floor((s % 60000) / 1000)
    this.timerText.setText(`${m}:${sec.toString().padStart(2, '0')}`)
  }
}
