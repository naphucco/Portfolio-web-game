// games/flappy.js
import Phaser from 'phaser';

export class FlappyScene extends Phaser.Scene {
  constructor() { super('FlappyScene'); }

  create() {
    this.W = 640; this.H = 360;
    this.alive = true; this.started = false;
    this.score = 0; this.vy = 0; this.py = this.H / 2;
    this.gap = 132; this.speed = 155;
    this.spawnAcc = 0; this.nextSpawn = 1500; this.pipes = [];

    for (let i = 0; i < 40; i++) {
      this.add.rectangle(
        Phaser.Math.Between(0, 640), Phaser.Math.Between(0, 360),
        1.5, 1.5, 0xffffff, Phaser.Math.FloatBetween(0.06, 0.35)
      );
    }

    this.bird = this.add.rectangle(140, this.py, 26, 26, 0x00e5ff);
    this.hud = this.add.text(12, 8, '0', {
      fontFamily: 'monospace', fontSize: '22px', color: '#7ef9ff'
    });

    this.hint = this.add.text(320, 190, 'Nhấn SPACE hoặc Click để bay', {
      fontFamily: 'monospace', fontSize: '15px', color: '#8a8aa8'
    }).setOrigin(0.5);

    this.input.keyboard.addCapture('SPACE,UP');
    this.input.keyboard.on('keydown-SPACE', () => this.flap());
    this.input.on('pointerdown', () => this.flap());
  }

  flap() {
    if (!this.alive) { this.scene.restart(); return; }
    if (!this.started) { this.started = true; this.hint.destroy(); }
    this.vy = -255;
  }

  spawnPipe() {
    const margin = 46;
    const gapY = Phaser.Math.Between(margin + this.gap / 2, this.H - margin - this.gap / 2);
    const topH = gapY - this.gap / 2;
    const botY = gapY + this.gap / 2;
    const top = this.add.rectangle(this.W + 32, topH / 2, 54, topH, 0x8b5cf6);
    const bot = this.add.rectangle(this.W + 32, botY + (this.H - botY) / 2, 54, this.H - botY, 0x8b5cf6);
    this.pipes.push({ top, bot, scored: false });
  }

  update(_, delta) {
    const d = Math.min(delta, 50) / 1000;
    if (!this.alive) return;

    if (!this.started) {
      this.bird.y = this.py + Math.sin(this.time.now / 320) * 7;
      return;
    }

    this.vy += 900 * d;
    this.py += this.vy * d;
    this.bird.y = this.py;
    this.bird.setAngle(Phaser.Math.Clamp(this.vy * 0.06, -25, 72));

    if (this.py < 8 || this.py > this.H - 8) return this.die();

    this.spawnAcc += delta;
    if (this.spawnAcc >= this.nextSpawn) { this.spawnAcc = 0; this.spawnPipe(); }

    const bb = this.bird.getBounds();
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.top.x -= this.speed * d;
      p.bot.x -= this.speed * d;

      if (!p.scored && p.top.x + 27 < 140) {
        p.scored = true; this.score++;
        this.hud.setText(String(this.score));
      }
      if (p.top.x < -40) {
        p.top.destroy(); p.bot.destroy();
        this.pipes.splice(i, 1); continue;
      }
      if (Phaser.Geom.Intersects.RectangleToRectangle(bb, p.top.getBounds()) ||
          Phaser.Geom.Intersects.RectangleToRectangle(bb, p.bot.getBounds())) return this.die();
    }
  }

  die() {
    this.alive = false;
    this.add.rectangle(320, 180, 640, 360, 0x000000, 0.68);
    this.add.text(320, 142, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '30px', color: '#ff2e88'
    }).setOrigin(0.5);
    this.add.text(320, 190, 'Điểm: ' + this.score, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(320, 226, 'Nhấn SPACE / Click để chơi lại', {
      fontFamily: 'monospace', fontSize: '14px', color: '#8a8aa8'
    }).setOrigin(0.5);
  }
}