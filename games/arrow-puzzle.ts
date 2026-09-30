// games/arrow-puzzle.ts
import Phaser from 'phaser';

export type ArrowPuzzleParams = {
    cols: number;
    rows: number;
    arrowCount: number;
    seed: number;
};

export type ArrowPuzzleHandle = {
    setParams: (p: ArrowPuzzleParams) => void;
    destroy: () => void;
};

const DIRS = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
];

type Cell = { c: number; r: number };
type Point = { x: number; y: number };

type Arrow = {
    id: number;
    cells: Cell[];
    dir: number;
    tipC: number;
    tipR: number;
    color: number;
    gfx?: Phaser.GameObjects.Graphics;
    flying?: boolean;
    points?: Point[];
    trail?: Point[];
    accumulator?: number;
};

function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const PALETTE = [
    0x00e5ff, 0xff2e88, 0x8b5cf6, 0x34d399, 0xfbbf24,
    0xf97316, 0x22d3ee, 0xa3e635, 0xec4899, 0x60a5fa,
];

function generateLevel(
    cols: number,
    rows: number,
    target: number,
    seed: number
): Arrow[] {
    const rnd = mulberry32(seed);
    const grid: (number | null)[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(null)
    );
    const arrows: Arrow[] = [];
    let attempts = 0;
    const maxAttempts = target * 400;

    while (arrows.length < target && attempts < maxAttempts) {
        attempts++;
        const startC = Math.floor(rnd() * cols);
        const startR = Math.floor(rnd() * rows);
        if (grid[startR][startC] !== null) continue;

        const segmentCount = 2 + Math.floor(rnd() * 2);
        let dir = Math.floor(rnd() * 4);
        const cells: Cell[] = [{ c: startC, r: startR }];
        let curC = startC;
        let curR = startR;
        let ok = true;

        for (let s = 0; s < segmentCount; s++) {
            const segLen = 1 + Math.floor(rnd() * 3);
            const { dx, dy } = DIRS[dir];
            for (let i = 0; i < segLen; i++) {
                curC += dx;
                curR += dy;
                if (curC < 0 || curC >= cols || curR < 0 || curR >= rows) {
                    ok = false;
                    break;
                }
                if (grid[curR][curC] !== null) {
                    ok = false;
                    break;
                }
                cells.push({ c: curC, r: curR });
            }
            if (!ok) break;
            if (s < segmentCount - 1) {
                const turn = rnd() < 0.5 ? 1 : 3;
                dir = (dir + turn) % 4;
            }
        }
        if (!ok || cells.length < 2) continue;

        const tip = cells[cells.length - 1];
        const { dx, dy } = DIRS[dir];
        let fc = tip.c + dx;
        let fr = tip.r + dy;
        let pathClear = true;
        while (fc >= 0 && fc < cols && fr >= 0 && fr < rows) {
            if (grid[fr][fc] !== null) {
                pathClear = false;
                break;
            }
            fc += dx;
            fr += dy;
        }
        if (!pathClear) continue;

        const id = arrows.length;
        for (const cell of cells) grid[cell.r][cell.c] = id;
        arrows.push({
            id,
            cells,
            dir,
            tipC: tip.c,
            tipR: tip.r,
            color: PALETTE[id % PALETTE.length],
        });
    }

    return arrows;
}

const SPEED = 400;
const STEP = 2.5;
const LINE_WIDTH = 5;
const ROUND_RADIUS = LINE_WIDTH / 2;

class ArrowPuzzleScene extends Phaser.Scene {
    private W = 640;
    private H = 440;
    private cellSize = 40;
    private offsetX = 0;
    private offsetY = 0;

    private params: ArrowPuzzleParams = {
        cols: 12,
        rows: 9,
        arrowCount: 20,
        seed: 1,
    };

    private grid: (number | null)[][] = [];
    private arrows: Arrow[] = [];
    private flyingArrows: Arrow[] = [];
    private bgGfx!: Phaser.GameObjects.Graphics;
    private hudText!: Phaser.GameObjects.Text;
    private winText!: Phaser.GameObjects.Text;

    private remaining = 0;
    private level = 1;
    private hasInitialized = false;

    constructor() {
        super('ArrowPuzzleScene');
    }

    setParams(p: ArrowPuzzleParams) {
        this.params = { ...p };
        if (this.hasInitialized) this.resetLevel();
    }

    create() {
        this.bgGfx = this.add.graphics();
        this.hudText = this.add.text(14, 10, '', {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#7ef9ff',
        });
        this.winText = this.add
            .text(this.W / 2, this.H / 2, '', {
                fontFamily: 'monospace',
                fontSize: '32px',
                color: '#34d399',
                fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setVisible(false);

        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));

        this.layout();
        this.resetLevel();
        this.hasInitialized = true;
    }

    private layout() {
        const padX = 20;
        const padTop = 40;
        const padBottom = 20;
        const availW = this.W - padX * 2;
        const availH = this.H - padTop - padBottom;
        this.cellSize = Math.floor(
            Math.min(availW / this.params.cols, availH / this.params.rows)
        );
        const gridW = this.cellSize * this.params.cols;
        const gridH = this.cellSize * this.params.rows;
        this.offsetX = Math.round((this.W - gridW) / 2);
        this.offsetY = Math.round(padTop + (availH - gridH) / 2);
        this.drawBg();
    }

    private drawBg() {
        this.bgGfx.clear();
        const x0 = this.offsetX;
        const y0 = this.offsetY;
        const w = this.cellSize * this.params.cols;
        const h = this.cellSize * this.params.rows;
        this.bgGfx.fillStyle(0x0e0e1a, 1);
        this.bgGfx.fillRoundedRect(x0 - 4, y0 - 4, w + 8, h + 8, 10);
        this.bgGfx.fillStyle(0x1a1a2e, 1);
        for (let r = 0; r <= this.params.rows; r++) {
            for (let c = 0; c <= this.params.cols; c++) {
                this.bgGfx.fillCircle(
                    x0 + c * this.cellSize,
                    y0 + r * this.cellSize,
                    1
                );
            }
        }
    }

    private cellCenter(c: number, r: number): Point {
        return {
            x: this.offsetX + c * this.cellSize + this.cellSize / 2,
            y: this.offsetY + r * this.cellSize + this.cellSize / 2,
        };
    }

    private resetLevel() {
        for (const a of this.arrows) a.gfx?.destroy();
        this.arrows = [];
        this.flyingArrows = [];

        this.layout();
        this.winText.setVisible(false);

        const { cols, rows, arrowCount, seed } = this.params;
        this.arrows = generateLevel(cols, rows, arrowCount, seed);

        this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
        for (const a of this.arrows) {
            for (const cell of a.cells) this.grid[cell.r][cell.c] = a.id;
        }

        for (const a of this.arrows) {
            a.gfx = this.add.graphics();
            this.redrawStatic(a);
        }

        this.remaining = this.arrows.length;
        this.updateHud();
    }

    private redrawStatic(a: Arrow) {
        const g = a.gfx;
        if (!g) return;
        g.clear();

        const centers = a.cells.map((cell) => this.cellCenter(cell.c, cell.r));
        const dense = this.densifyPoints(centers, 4);

        this.drawPolyline(g, dense, a.color, true);
        this.drawHead(g, dense[dense.length - 1], a.dir, a.color);
    }

    private densifyPoints(centers: Point[], stepPx: number): Point[] {
        if (centers.length === 0) return [];
        const result: Point[] = [{ x: centers[0].x, y: centers[0].y }];
        for (let i = 1; i < centers.length; i++) {
            const p1 = centers[i - 1];
            const p2 = centers[i];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const n = Math.max(1, Math.ceil(dist / stepPx));
            for (let k = 1; k <= n; k++) {
                result.push({
                    x: p1.x + (p2.x - p1.x) * (k / n),
                    y: p1.y + (p2.y - p1.y) * (k / n),
                });
            }
        }
        return result;
    }

    private drawPolyline(
        g: Phaser.GameObjects.Graphics,
        points: Point[],
        color: number,
        drawStartDot: boolean
    ) {
        if (points.length < 2) return;

        g.lineStyle(LINE_WIDTH, color, 1);
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.strokePath();

        g.fillStyle(color, 1);
        for (let i = 1; i < points.length - 1; i++) {
            const p0 = points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const v1x = p1.x - p0.x;
            const v1y = p1.y - p0.y;
            const v2x = p2.x - p1.x;
            const v2y = p2.y - p1.y;
            const m1 = Math.hypot(v1x, v1y);
            const m2 = Math.hypot(v2x, v2y);
            if (m1 < 1e-3 || m2 < 1e-3) continue;
            const cos = (v1x * v2x + v1y * v2y) / (m1 * m2);
            if (cos < 0.95) {
                g.fillCircle(p1.x, p1.y, ROUND_RADIUS);
            }
        }

        g.fillCircle(points[0].x, points[0].y, ROUND_RADIUS);
        if (drawStartDot) {
            g.fillCircle(
                points[points.length - 1].x,
                points[points.length - 1].y,
                ROUND_RADIUS
            );
        }
    }

    private drawHead(
        g: Phaser.GameObjects.Graphics,
        p: Point,
        dir: number,
        color: number
    ) {
        const { dx, dy } = DIRS[dir];
        const perpX = -dy;
        const perpY = dx;
        const headLen = 14;
        const headWid = 9;
        g.fillStyle(color, 1);
        g.beginPath();
        g.moveTo(p.x + dx * headLen, p.y + dy * headLen);
        g.lineTo(p.x + perpX * headWid, p.y + perpY * headWid);
        g.lineTo(p.x - perpX * headWid, p.y - perpY * headWid);
        g.closePath();
        g.fillPath();
    }

    /** Blend 2 màu hex theo t (0..1) */
    private lerpColor(c1: number, c2: number, t: number): number {
        const r1 = (c1 >> 16) & 0xff;
        const g1 = (c1 >> 8) & 0xff;
        const b1 = c1 & 0xff;
        const r2 = (c2 >> 16) & 0xff;
        const g2 = (c2 >> 8) & 0xff;
        const b2 = c2 & 0xff;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return (r << 16) | (g << 8) | b;
    }

    private onDown(pointer: Phaser.Input.Pointer) {
        const col = Math.floor((pointer.x - this.offsetX) / this.cellSize);
        const row = Math.floor((pointer.y - this.offsetY) / this.cellSize);
        if (col < 0 || col >= this.params.cols) return;
        if (row < 0 || row >= this.params.rows) return;
        const id = this.grid[row][col];
        if (id === null) return;
        const arrow = this.arrows.find((a) => a.id === id);
        if (!arrow || arrow.flying) return;
        this.tryFly(arrow);
    }

    /** Đếm số ô từ tip đến block đầu tiên (không kể tip). -1 nếu không có block */
    private getBlockCells(arrow: Arrow): number {
        const { dx, dy } = DIRS[arrow.dir];
        let c = arrow.tipC + dx;
        let r = arrow.tipR + dy;
        let count = 0;
        while (c >= 0 && c < this.params.cols && r >= 0 && r < this.params.rows) {
            if (this.grid[r][c] !== null && this.grid[r][c] !== arrow.id) {
                return count;
            }
            count++;
            c += dx;
            r += dy;
        }
        return -1;
    }

    private tryFly(arrow: Arrow) {
        const blockCells = this.getBlockCells(arrow);

        if (blockCells !== -1) {
            this.blockedFeedback(arrow, blockCells);
            return;
        }

        for (const cell of arrow.cells) this.grid[cell.r][cell.c] = null;
        this.remaining--;
        this.updateHud();

        const centers = arrow.cells.map((cell) => this.cellCenter(cell.c, cell.r));
        const dense = this.densifyPoints(centers, STEP);

        arrow.points = dense.slice().reverse().map((p) => ({ x: p.x, y: p.y }));
        arrow.trail = arrow.points.map((p) => ({ x: p.x, y: p.y }));
        arrow.accumulator = 0;
        arrow.flying = true;

        this.flyingArrows.push(arrow);
    }

    private blockedFeedback(arrow: Arrow, blockCells: number) {
        const g = arrow.gfx;
        if (!g) return;

        const { dx, dy } = DIRS[arrow.dir];
        const centers = arrow.cells.map((cell) => this.cellCenter(cell.c, cell.r));

        const HEAD_LEN = 14;
        const EXTRA = this.cellSize * 0.7;   // ← tăng số này nếu muốn đâm sâu hơn
        const maxPush = Math.max(
            this.cellSize * 0.5,
            blockCells * this.cellSize + EXTRA - HEAD_LEN
        );

        const duration = 420;
        const blinkCycles = 1;
        const startTime = this.time.now;

        const evt = this.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
                const t = (this.time.now - startTime) / duration;
                if (t >= 1) {
                    evt.remove();
                    g.setAlpha(1);
                    this.redrawStatic(arrow);
                    return;
                }

                const push = Math.sin(t * Math.PI) * maxPush;

                const pts = centers.map((p, i) => {
                    if (i === centers.length - 1) {
                        return { x: p.x + dx * push, y: p.y + dy * push };
                    }
                    return { x: p.x, y: p.y };
                });

                const dense = this.densifyPoints(pts, 4);

                const blink = 0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * blinkCycles));
                g.setAlpha(blink);

                const flash = Math.max(0, 1 - Math.abs(t - 0.5) * 2);
                const color = this.lerpColor(arrow.color, 0xff4466, flash);

                g.clear();
                this.drawPolyline(g, dense, color, true);
                this.drawHead(g, dense[dense.length - 1], arrow.dir, color);
            },
        });
    }

    update(_time: number, delta: number) {
        const dt = Math.min(delta, 50) / 1000;

        for (let i = this.flyingArrows.length - 1; i >= 0; i--) {
            const a = this.flyingArrows[i];
            if (!a.points || !a.trail || !a.flying) continue;

            const { dx, dy } = DIRS[a.dir];

            a.accumulator = (a.accumulator ?? 0) + SPEED * dt;
            const numSteps = Math.floor(a.accumulator / STEP);
            a.accumulator -= numSteps * STEP;

            for (let s = 0; s < numSteps; s++) {
                const head = a.points[0];
                head.x += dx * STEP;
                head.y += dy * STEP;
                a.trail.unshift({ x: head.x, y: head.y });
            }

            for (let k = 1; k < a.points.length; k++) {
                const idx = Math.min(k, a.trail.length - 1);
                a.points[k].x = a.trail[idx].x;
                a.points[k].y = a.trail[idx].y;
            }

            const maxTrail = a.points.length + 20;
            while (a.trail.length > maxTrail) a.trail.pop();

            const g = a.gfx;
            if (g) {
                g.clear();
                this.drawPolyline(g, a.points, a.color, false);
                this.drawHead(g, a.points[0], a.dir, a.color);
            }

            const head = a.points[0];
            if (
                head.x < -200 ||
                head.x > this.W + 200 ||
                head.y < -200 ||
                head.y > this.H + 200
            ) {
                a.gfx?.destroy();
                a.flying = false;
                this.flyingArrows.splice(i, 1);
                if (this.remaining === 0 && this.flyingArrows.length === 0) {
                    this.onWin();
                }
            }
        }
    }

    private onWin() {
        this.winText.setText('LEVEL CLEAR!').setVisible(true);
        this.time.delayedCall(900, () => {
            this.level++;
            this.params = { ...this.params, seed: this.params.seed + 1 };
            this.resetLevel();
        });
    }

    private updateHud() {
        this.hudText.setText(`Lv ${this.level}  ·  ${this.remaining} left`);
    }
}

export function initArrowPuzzle(
    container: HTMLElement,
    initialParams: ArrowPuzzleParams
): ArrowPuzzleHandle {
    const scene = new ArrowPuzzleScene();
    scene.setParams(initialParams);

    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width: 640,
        height: 440,
        backgroundColor: '#0b0b16',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [scene],
    });

    return {
        setParams: (p) => scene.setParams(p),
        destroy: () => {
            try {
                game.destroy(true);
            } catch {
                /* ignore */
            }
        },
    };
}