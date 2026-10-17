// games/memory-grid.ts
// ============================================================
// MEMORY GRID — Canvas thuần, không phụ thuộc React
// Đặt cùng cấp với flappy.ts để giữ cấu trúc games/<slug>.ts
// ============================================================

const GRID_N = 4;
const CELL_GAP = 8;
const SHOW_DURATION = 1500;
const MAX_MISTAKES = 3;
const FOOTER_H = 40;

type CellState = 'idle' | 'highlight' | 'correct' | 'wrong';
type GameState = 'idle' | 'showing' | 'input' | 'won' | 'lost';

interface Cell {
    gx: number; gy: number;
    x: number; y: number; w: number; h: number;
    state: CellState;
}

export class MemoryGrid {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private observer: ResizeObserver | null = null;
    private rafId = 0;
    private destroyed = false;

    private W = 0;
    private H = 0;
    private gridH = 0;

    private state: GameState = 'idle';
    private cells: Cell[] = [];
    private targets = new Set<number>();
    private mistakes = 0;

    private showTimer = 0;
    private lastTime = 0;

    private loopBound = this.loop.bind(this);

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;

        this.buildGrid();
        this.bindInput();

        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(canvas.parentElement!);
        this.resize();

        this.rafId = requestAnimationFrame(this.loopBound);
    }

    destroy() {
        this.destroyed = true;
        cancelAnimationFrame(this.rafId);
        this.observer?.disconnect();
        this.canvas.removeEventListener('mousedown', this.onClick);
        this.canvas.removeEventListener('touchstart', this.onClick);
    }

    private resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const parentW = parent.clientWidth || 480;    // fallback nếu chưa layout
        const W = Math.max(200, Math.min(parentW, 480));
        const H = W + FOOTER_H;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = W * dpr;
        this.canvas.height = H * dpr;
        this.canvas.style.width = W + 'px';
        this.canvas.style.height = H + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.W = W;
        this.H = H;
        this.gridH = W;
        this.recomputeCellPositions();
    }

    private recomputeCellPositions() {
        const size = (this.W - CELL_GAP * (GRID_N - 1)) / GRID_N;
        this.cells.forEach(c => {
            c.x = c.gx * (size + CELL_GAP);
            c.y = c.gy * (size + CELL_GAP);
            c.w = size; c.h = size;
        });
    }

    private buildGrid() {
        this.cells = [];
        for (let gy = 0; gy < GRID_N; gy++)
            for (let gx = 0; gx < GRID_N; gx++)
                this.cells.push({ gx, gy, x: 0, y: 0, w: 0, h: 0, state: 'idle' });
    }

    private onClick = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        if (this.state === 'idle' || this.state === 'won' || this.state === 'lost') {
            this.startRound();
            return;
        }
        if (this.state !== 'input') return;

        const r = this.canvas.getBoundingClientRect();
        const src = 'touches' in e ? e.touches[0] : e;
        const x = src.clientX - r.left;
        const y = src.clientY - r.top;
        this.handleClick(x, y);
    };

    private bindInput() {
        this.canvas.addEventListener('mousedown', this.onClick);
        this.canvas.addEventListener('touchstart', this.onClick, { passive: false });
    }

    private handleClick(x: number, y: number) {
        for (let i = 0; i < this.cells.length; i++) {
            const c = this.cells[i];
            if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
                if (c.state !== 'idle') return;
                if (this.targets.has(i)) {
                    c.state = 'correct';
                    this.targets.delete(i);
                    if (this.targets.size === 0) this.state = 'won';
                } else {
                    c.state = 'wrong';
                    this.mistakes++;
                    if (this.mistakes >= MAX_MISTAKES) this.state = 'lost';
                }
                return;
            }
        }
    }

    private loop(t: number) {
        if (this.destroyed) return;
        const dt = this.lastTime ? t - this.lastTime : 16;
        this.lastTime = t;

        this.update(dt);
        this.render();

        this.rafId = requestAnimationFrame(this.loopBound);
    }

    private update(dt: number) {
        if (this.state === 'showing') {
            this.showTimer += dt;
            if (this.showTimer >= SHOW_DURATION) {
                this.cells.forEach(c => { if (c.state === 'highlight') c.state = 'idle'; });
                this.state = 'input';
            }
        }
    }

    private render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0b0b16';
        ctx.fillRect(0, 0, this.W, this.H);

        this.cells.forEach(c => {
            ctx.fillStyle = this.colorFor(c.state);
            this.roundRect(ctx, c.x, c.y, c.w, c.h, 8);  // thêm ctx
            ctx.fill();
        });

        const msg = this.footerMessage();
        ctx.fillStyle = msg.color;
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(msg.text, this.W / 2, this.H - 14);
    }

    private footerMessage(): { text: string; color: string } {
        switch (this.state) {
            case 'idle': return { text: 'Click to start', color: '#8b949e' };
            case 'showing': return { text: 'Memorize the highlighted cells...', color: '#ffcc00' };
            case 'input': return { text: `Click them — Mistakes: ${this.mistakes}/${MAX_MISTAKES}`, color: '#c9d1d9' };
            case 'won': return { text: '✓ You win! Click to play again', color: '#22cc66' };
            case 'lost': return { text: '✗ Game over — Click to retry', color: '#cc2233' };
        }
    }

    private colorFor(s: CellState): string {
        switch (s) {
            case 'highlight': return '#ffcc00';
            case 'correct': return '#22cc66';
            case 'wrong': return '#cc2233';
            default: return '#334466';
        }
    }

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    private startRound() {
        this.cells.forEach(c => c.state = 'idle');
        this.targets.clear();
        this.mistakes = 0;
        this.showTimer = 0;

        const total = this.cells.length;
        while (this.targets.size < GRID_N) {
            const i = Math.floor(Math.random() * total);
            this.targets.add(i);
            this.cells[i].state = 'highlight';
        }
        this.state = 'showing';
    }
}