// games/dodge.ts
import Phaser from 'phaser';

export class DodgeScene extends Phaser.Scene {
  private W = 640;
  private H = 360;
  private alive = true;
  private t = 0;
  private score = 0;
  private px = 320;
  private py = 332;
  private spawnAcc = 0;
  private nextSpawn = 620;
  private blocks: Phaser.GameObjects.Rectangle[] = [];
  private stars: Phaser.GameObjects.Rectangle[] = [];
  private keys!: Record<'l' | 'r' | 'a' | 'd', Phaser.Input.Keyboard.Key>;
  private player!: Phaser.GameObjects.Rectangle;
  private glow!: Phaser.GameObjects.Rectangle;
  private hud!: Phaser.GameObjects.Text;

  constructor() {
    super('DodgeScene');
  }

  create() {
    this.alive = true;
    this.t = 0;
    this.score = 0;
    this.px = this.W / 2;
    this.py = this.H - 28;
    this.spawnAcc = 0;
    this.nextSpawn = 620;
    this.blocks = [];
    this.stars = [];

    for (let i = 0; i < 50; i++) {
      const s = this.add.rectangle(
        Phaser.Math.Between(0, this.W),
        Phaser.Math.Between(0, this.H),
        1.5, 1.5, 0xffffff,
        Phaser.Math.FloatBetween(0.08, 0.45)
      );
      (s as any).vy = Phaser.Math.Between(15, 55);
      this.stars.push(s);
    }

    this.glow = this.add.rectangle(this.px, this.py, 36, 36, 0x00e5ff, 0.16);
    this.player = this.add.rectangle(this.px, this.py, 26, 26, 0x00e5ff);
    this.hud = this.add.text(12, 8, '0', {
      fontFamily: 'monospace', fontSize: '22px', color: '#7ef9ff',
    });

    this.keys = this.input.keyboard!.addKeys({
      l: 'LEFT', r: 'RIGHT', a: 'A', d: 'D',
    }) as Record<'l' | 'r' | 'a' | 'd', Phaser.Input.Keyboard.Key>;

    this.input.keyboard!.addCapture('LEFT,RIGHT,UP,DOWN,SPACE');
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.alive) this.px = Phaser.Math.Clamp(p.x, 14, this.W - 14);
    });
  }

  private spawn() {
    const w = Phaser.Math.Between(22, 56);
    const x = Phaser.Math.Between(w / 2 + 6, this.W - w / 2 - 6);
    const b = this.add.rectangle(x, -20, w, 16, 0xff2e88);
    (b as any).vy = Phaser.Math.Between(115, 175) + this.t * 10;
    this.blocks.push(b);
  }

  update(_: number, delta: number) {
    const d = Math.min(delta, 50) / 1000;
    const { W, H } = this;

    for (const s of this.stars) {
      s.y += ((s as any).vy as number) * d;
      if (s.y > H) { s.y = -2; s.x = Phaser.Math.Between(0, W); }
    }
    if (!this.alive) return;

    const dir =
      ((this.keys.r.isDown || this.keys.d.isDown) ? 1 : 0) -
      ((this.keys.l.isDown || this.keys.a.isDown) ? 1 : 0);
    if (dir) this.px = Phaser.Math.Clamp(this.px + dir * 400 * d, 14, W - 14);

    this.t += d;
    this.score = Math.floor(this.t * 10);
    this.hud.setText(String(this.score));
    this.player.x = this.px;
    this.glow.x = this.px;

    this.spawnAcc += delta;
    if (this.spawnAcc >= this.nextSpawn) {
      this.spawnAcc = 0;
      this.spawn();
      this.nextSpawn = Math.max(190, 620 - this.t * 18);
    }

    const pb = new Phaser.Geom.Rectangle(this.px - 13, this.py - 13, 26, 26);
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      b.y += ((b as any).vy as number) * d;
      if (b.y > H + 30) { b.destroy(); this.blocks.splice(i, 1); continue; }
      if (Phaser.Geom.Intersects.RectangleToRectangle(pb, b.getBounds())) {
        return this.die();
      }
    }
  }

  private die() {
    this.alive = false;
    this.add.rectangle(320, 180, 640, 360, 0x000000, 0.68);
    this.add.text(320, 142, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '30px', color: '#ff2e88',
    }).setOrigin(0.5);
    this.add.text(320, 190, 'Điểm: ' + this.score, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);
    this.add.text(320, 226, 'Nhấn SPACE để chơi lại', {
      fontFamily: 'monospace', fontSize: '14px', color: '#8a8aa8',
    }).setOrigin(0.5);

    this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
  }
}