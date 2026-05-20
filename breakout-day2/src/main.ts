import Phaser from 'phaser'

enum GameState {
      Playing =1,
      Paused =2,
      GameOver=3,
      Win=4,
      LevelTransition=5,
    }

class GameScene extends Phaser.Scene {
    paddle!: Phaser.GameObjects.Rectangle
    ball!: Phaser.GameObjects.Arc
    blocks: Phaser.GameObjects.Rectangle[] = []

    cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    keys!: any

    score = 0
    lives = 3
    level = 1
    maxLevel = 3

    gameState: GameState = GameState.Playing;
    
    scoreText!: Phaser.GameObjects.Text
    livesText!: Phaser.GameObjects.Text
    messageText!: Phaser.GameObjects.Text
    levelText!: Phaser.GameObjects.Text

    ballVelocity = {
        x: 4,
        y: -4
    }

    constructor() {
        super('game')
    }

    create() {
        this.createObjects()
        this.createBlocks()
        this.createTexts()
        this.createInputs()
        this.resetBall()
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
            this.togglePause()
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.resetGame()
        }

        if (this.gameState !== GameState.Playing) {
            return
        }

        this.movePaddle()
        this.moveBall()
        this.checkWallCollision()
        this.checkPaddleCollision()
        this.checkBlockCollision()
        this.checkLoseLife()
        this.checkWin()
    }

    createObjects() {
        this.paddle = this.add.rectangle(400, 550, 120, 20, 0xffcc00)
        this.ball = this.add.circle(400, 520, 10, 0xffffff)
    }

    createBlocks() {
        this.blocks.forEach(b => b.destroy())
        this.blocks = []

        const rows = 3 + this.level
        const columns = 8 + this.level

        const blockWidth = 60
        const blockHeight = 24
        const gap = 8

        const totalWidth = columns * blockWidth + (columns -1) * gap
        const startX = (800 - totalWidth) /2 + blockWidth / 2
        const startY = 80

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const x = startX + col * (blockWidth + gap)
                const y = startY + row * (blockHeight + gap)

                const block = this.add.rectangle(
                    x,
                    y,
                    blockWidth,
                    blockHeight,
                    0xff884d
                )

                this.blocks.push(block)
            }
          }
    }

    createTexts() {
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff'
        })

        this.livesText = this.add.text(650, 20, 'Lives: 3', {
            fontSize: '24px',
            color: '#ffffff'
        })

        this.messageText = this.add.text(250, 280, '', {
            fontSize: '44px',
            color: '#ffffff'
        })

        this.levelText = this.add.text(350, 20, `Level: ${this.level}`, {
            fontSize: '24px',
            color: '#ffffff'
        })

        this.messageText.setVisible(false)
    }

    createInputs() {
        this.cursors = this.input.keyboard!.createCursorKeys()

        this.keys = this.input.keyboard!.addKeys({
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            R: Phaser.Input.Keyboard.KeyCodes.R,
            P: Phaser.Input.Keyboard.KeyCodes.P,
            N: Phaser.Input.Keyboard.KeyCodes.N
        })
    }

    movePaddle() {
        const speed = 7

        if (this.keys.A.isDown || this.cursors.left.isDown) {
            this.paddle.x -= speed
        }

        if (this.keys.D.isDown || this.cursors.right.isDown) {
            this.paddle.x += speed
        }

        this.paddle.x = Phaser.Math.Clamp(this.paddle.x, 60, 740)
    }

    moveBall() {
        this.ball.x += this.ballVelocity.x
        this.ball.y += this.ballVelocity.y
    }

    checkWallCollision() {
        if (this.ball.x <= 10 || this.ball.x >= 790) {
            this.ballVelocity.x *= -1
        }

        if (this.ball.y <= 10) {
            this.ballVelocity.y *= -1
        }
    }

    checkPaddleCollision() {
        if (!this.isColliding(this.ball, this.paddle)) {
            return
        }

        this.ballVelocity.y = -Math.abs(this.ballVelocity.y)

        const distanceFromCenter = this.ball.x - this.paddle.x
        this.ballVelocity.x = distanceFromCenter * 0.08

        this.ball.y = this.paddle.y - 20
    }

    checkBlockCollision() {
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i]

            if (this.isColliding(this.ball, block)) {
                block.destroy()
                this.blocks.splice(i, 1)

                this.score += 10
                this.scoreText.setText(`Score: ${this.score}`)

                this.ballVelocity.y *= -1

                this.createHitEffect(block.x, block.y)

                break
            }
        }
    }

    checkLoseLife() {
        if (this.ball.y <= 620) {
            return
        }

        this.lives--
        this.livesText.setText(`Lives: ${this.lives}`)

        if (this.lives <= 0) {
            this.gameOver()
            return
        }

        this.resetBall()
    }

    checkWin() {
      if (this.blocks.length > 0) {
        return
      }

        if (this.level >= this.maxLevel) {
          this.gameState = GameState.Win
          this.messageText.setText('YOU WIN!')
          this.messageText.setVisible(true)
          return
        }

      this.nextLevel()
    }

    resetBall() {
        this.ball.x = 400
        this.ball.y = 520

        this.ballVelocity.x = Phaser.Math.Between(-4, 4)
        this.ballVelocity.y = -4

        if (this.ballVelocity.x === 0) {
            this.ballVelocity.x = 3
        }
    }

    resetNumber(){
      this.score = 0
      this.scoreText.setText(`Score: ${this.score}`)
      this.lives = 3
      this.livesText.setText(`Lives: ${this.lives}`)
      this.level = 1
      this.messageText.setVisible(false)
    }

    gameOver() {
        this.gameState = GameState.GameOver
        this.messageText.setText('GAME OVER')
        this.messageText.setVisible(true)
    }

    togglePause() {
        if(this.gameState === GameState.Playing){
            this.gameState = GameState.Paused
            this.messageText.setText('PAUSED')
            this.messageText.setVisible(true)
            return
        }

        if (this.gameState === GameState.Paused){
            this.gameState = GameState.Playing
            this.messageText.setVisible(false)
        }
    }

    resetGame(){
      this.gameState = GameState.Playing
      this.resetBall()
      this.resetNumber()
      this.createBlocks()
    }

    createHitEffect(x: number, y: number) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 4, 0xffcc00)

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
            const speed = Phaser.Math.Between(2, 5)

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed * 20,
                y: y + Math.sin(angle) * speed * 20,
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => {
                    particle.destroy()
                }
            })
        }
    }

    isColliding(
        ball: Phaser.GameObjects.Arc,
        object: Phaser.GameObjects.Rectangle
    ) {
        const ballBounds = ball.getBounds()
        const objectBounds = object.getBounds()

        return Phaser.Geom.Intersects.RectangleToRectangle(
            ballBounds,
            objectBounds
        )
    }

    nextLevel() {
      this.gameState = GameState.LevelTransition

      this.level++
      console.log(this.level)

      this.messageText.setText(`LEVEL ${this.level}`)
      this.messageText.setVisible(true)
      this.levelText.setText(`Level: ${this.level}`)

      this.time.delayedCall(1200, () => {
          this.messageText.setVisible(false)
          this.createBlocks()
          this.resetBall()
          this.lives++
          this.livesText.setText(`Lives: ${this.lives}`)
          this.gameState = GameState.Playing
      })
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    scene: GameScene
}

new Phaser.Game(config)