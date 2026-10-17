// games/memory-grid.ts
// ============================================================
// MEMORY GRID — Canvas thuần, không engine, không React trong logic
// ============================================================
//
// NGƯỜI ĐỌC GIẢ ĐỊNH: đã biết Unity (C#) và/hoặc Angular (TS).
// File này cố tình giải thích mọi thứ KHÁC so với 2 môi trường đó.
//
// ------------------------------------------------------------
// BỐI CẢNH: Unity có engine, ở đây không có engine
// ------------------------------------------------------------
// Trong Unity, bạn viết:
//
//     void Update() {
//         transform.Translate(speed * Time.deltaTime, 0, 0);
//     }
//
// và engine tự gọi Update() ~60 lần/giây. Bạn KHÔNG BAO GIỜ thấy
// vòng lặp. Bạn cũng không thấy "ai gọi Update", "gọi lúc nào".
// Tất cả engine lo.
//
// Trong trình duyệt, KHÔNG có engine nào làm việc đó. Trình duyệt
// chỉ có một hàm tên là requestAnimationFrame(fn) nghĩa là:
// "khoảng 16ms nữa, gọi fn giúp tao". Bạn phải tự viết vòng lặp:
// gọi requestAnimationFrame → bên trong fn lại gọi requestAnimationFrame
// → lặp mãi. Đó là "game loop" — thứ Unity giấu, còn ở đây bạn tự viết.
//
// ------------------------------------------------------------
// BỐI CẢNH: Angular có DI, ở đây không có
// ------------------------------------------------------------
// Trong Angular, component được tạo bởi framework. Bạn không bao giờ
// viết `new MyComponent()`. Ở đây, class này được tạo bằng tay:
// `new MemoryGrid(canvasElement)`. Nên constructor phải tự lo mọi thứ:
// khởi tạo state, gắn sự kiện, khởi động loop, dọn dẹp khi xong.
// Không có Angular lifecycle (ngOnInit, ngOnDestroy) — phải tự viết
// hàm destroy() và gọi nó từ useEffect của React bên ngoài.
//
// ------------------------------------------------------------
// TẠI SAO TÁCH LOGIC KHỎI REACT COMPONENT?
// ------------------------------------------------------------
// - Class này là TypeScript thuần, không import React, không import
//   bất kỳ UI library nào. Nghĩa là có thể chạy trong Node, có thể
//   unit test bằng Jest/Vitest mà không cần render DOM.
// - React component (CanvasMemoryGrid.tsx) chỉ làm 2 việc:
//   (1) mount canvas vào DOM, (2) new MemoryGrid(canvas) rồi destroy()
//   khi unmount. Nó không chứa logic game.
// - Nếu interviewer hỏi "làm sao test game này?" — câu trả lời là:
//   "game logic tách khỏi React, có thể test pure functions và mock
//   canvas context, giống như tách business logic khỏi component
//   trong Angular."
// ============================================================


// ============================================================
// HẰNG SỐ CẤU HÌNH
// ============================================================
// Đặt ở đầu file thay vì rải trong code. Nếu là Angular, đây giống
// như các hằng số trong file environment.ts hoặc constants.ts.
const GRID_N = 4;              // Lưới 4x4 = 16 ô
const CELL_GAP = 8;            // Khoảng cách giữa các ô, tính bằng px logic
const SHOW_DURATION = 1500;    // Thời gian highlight ô vàng, tính bằng ms
const MAX_MISTAKES = 3;        // Sai 3 lần là thua
const FOOTER_H = 40;           // Vùng dưới grid để hiển thị text trạng thái


// ============================================================
// TYPE — dùng union type thay vì string
// ============================================================
// Trong C#, bạn có enum:
//     enum CellState { Idle, Highlight, Correct, Wrong }
//
// TypeScript không có enum thật sự gọn như C# (enum của TS sinh ra
// object runtime, không phải compile-time only). Nên dùng union type
// — tương đương với việc giới hạn giá trị. Cái lợi: nếu bạn gõ sai
// 'higlight' (thiếu h), TypeScript báo lỗi ngay, giống như C# báo
// lỗi khi gán sai enum.
type CellState = 'idle' | 'highlight' | 'correct' | 'wrong';
type GameState = 'idle' | 'showing' | 'input' | 'won' | 'lost';


// ============================================================
// INTERFACE Cell — tương đương class/struct trong C#
// ============================================================
// Mỗi ô trong grid cần 2 loại toạ độ:
//   1. Toạ độ LOGIC (gx, gy): vị trí trong grid, kiểu 0..N-1.
//      Đây là "danh tính" của ô — không đổi khi resize.
//   2. Toạ độ PIXEL (x, y, w, h): vị trí thực tế trên canvas.
//      Phải tính lại mỗi khi canvas đổi kích thước.
//
// TẠI SAO TÁCH 2 LOẠI?
// Khi user xoay điện thoại, canvas đổi size, nhưng ô (1,2) vẫn là
// ô (1,2) — chỉ vị trí pixel của nó thay đổi. Nếu chỉ lưu toạ độ pixel,
// resize xong bạn không biết ô nào là ô nào → phải tạo lại grid từ đầu
// → mất state (ô nào đang highlight, ô nào đã click đúng).
// Tách 2 loại cho phép resize chỉ cần recompute pixel, giữ nguyên state.
interface Cell {
    gx: number; gy: number;        // grid coordinate (0..N-1) — không đổi
    x: number; y: number;          // pixel coordinate — đổi khi resize
    w: number; h: number;          // pixel size — đổi khi resize
    state: CellState;
}


export class MemoryGrid {
    // ---------------------------------------------------------
    // DEPENDENCY — nhận từ constructor, không tự tạo
    // ---------------------------------------------------------
    // Trong Angular, bạn inject service qua constructor:
    //     constructor(private http: HttpClient) {}
    // Ở đây tương tự: nhận canvas từ bên ngoài thay vì tự tạo.
    // Lợi ích:
    //   - Không phụ thuộc DOM bên trong class → dễ test
    //   - React component kiểm soát vòng đời canvas (mount/unmount)
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    // ---------------------------------------------------------
    // RESOURCE CẦN DỌN DẸP — tương đương ngOnDestroy / OnDestroy
    // ---------------------------------------------------------
    // Trong Unity, khi scene unload, engine tự dọn. Trong Angular,
    // ngOnDestroy được gọi tự động khi component bị hủy.
    // Ở đây KHÔNG có gì tự động. Nếu không dọn tay:
    //   - RAF loop vẫn chạy mãi → CPU 100% âm thầm
    //   - ResizeObserver vẫn quan sát → memory leak
    //   - Event listener vẫn gắn → click ở nơi khác vẫn trigger
    // Nên phải tự viết destroy() và gọi nó từ useEffect cleanup.
    private observer: ResizeObserver | null = null;
    private rafId = 0;
    private destroyed = false;

    // ---------------------------------------------------------
    // KÍCH THƯỚC CANVAS
    // ---------------------------------------------------------
    // W, H là "CSS pixel" — đơn vị bạn thấy trong DevTools.
    // Không nhầm với "device pixel" (retina) — giải thích ở resize().
    private W = 0;
    private H = 0;
    private gridH = 0;

    // ---------------------------------------------------------
    // GAME STATE
    // ---------------------------------------------------------
    // Tương đương các field trong MonoBehaviour của Unity.
    private state: GameState = 'idle';
    private cells: Cell[] = [];

    // TẠI SAO Set THAY VÌ Array?
    // Trong C#, HashSet<int> cho phép kiểm tra "có chứa" và "xóa"
    // trong O(1). Array phải duyệt tuần tự O(n). Ở đây grid 16 ô thì
    // không quan trọng, nhưng dùng Set là thói quen tốt, và interviewer
    // senior sẽ để ý bạn chọn đúng cấu trúc dữ liệu.
    // Set lưu INDEX của ô cần click (không phải toạ độ).
    private targets = new Set<number>();
    private mistakes = 0;

    // ---------------------------------------------------------
    // TIMING
    // ---------------------------------------------------------
    // showTimer: đồng hồ đếm thời gian đã highlight trong phase 'showing'
    // lastTime: timestamp của frame trước, để tính delta time (giải thích ở loop)
    private showTimer = 0;
    private lastTime = 0;


    // ============================================================
    // LOOP BOUND — giải thích từ gốc vì đây là điểm khác biệt LỚN
    // NHẤT giữa JS và C#/Angular
    // ============================================================
    //
    // ------------------------------------------------------------
    // VẤN ĐỀ: `this` trong JS không tự động gắn với object
    // ------------------------------------------------------------
    // Trong C#, method luôn biết nó thuộc instance nào:
    //
    //     class Player {
    //         int hp = 100;
    //         void TakeDamage() { this.hp -= 10; }
    //     }
    //
    //     var p = new Player();
    //     Action a = p.TakeDamage;   // delegate `a` mang theo `p`
    //     a();                       // bên trong, this = p → OK
    //
    // Trong JS, KHÔNG như vậy. Hàm là object độc lập, không mang theo
    // instance. `this` bên trong hàm phụ thuộc vào CÁCH GỌI, không
    // phụ thuộc vào nơi hàm được định nghĩa:
    //
    //     const p = new Player();
    //     p.takeDamage();              // this = p → OK
    //
    //     const f = p.takeDamage;      // lấy hàm ra khỏi object
    //     f();                         // this = undefined → CRASH
    //
    // Đây là lý do lỗi "Cannot read properties of undefined" xuất hiện
    // rất nhiều trong JS mà trong C#/Unity gần như không bao giờ gặp.
    //
    // ------------------------------------------------------------
    // LIÊN HỆ VỚI ANGULAR
    // ------------------------------------------------------------
    // Angular tránh được vấn đề này bằng arrow function property:
    //
    //     export class MyComponent {
    //         value = 0;
    //         onClick = () => { this.value++; }   // arrow → this cố định
    //     }
    //
    // Arrow function trong JS đặc biệt: `this` bên trong nó LUÔN LUÔN
    // là `this` ở scope bên ngoài, không bao giờ bị đổi bởi cách gọi.
    // Đó là lý do Angular khuyên dùng arrow cho mọi hàm callback.
    //
    // `bind()` là cách khác để làm điều tương tự, nhưng áp dụng cho
    // method có sẵn (thay vì viết lại thành arrow). Hai cách tương
    // đương về kết quả:
    //
    //     // Cách 1: arrow
    //     onClick = () => { ... };
    //
    //     // Cách 2: bind method
    //     onClick = this.onClickImpl.bind(this);
    //     onClickImpl() { ... }
    //
    // ------------------------------------------------------------
    // VẤN ĐỀ CỤ THỂ TRONG CODE NÀY
    // ------------------------------------------------------------
    // Hàm `loop` (bên dưới) sẽ được truyền vào requestAnimationFrame:
    //
    //     requestAnimationFrame(this.loop);    // ❌ SAI
    //
    // requestAnimationFrame KHÔNG gọi kiểu `object.method()`. Nó nhận
    // hàm rồi gọi kiểu `fn(timestamp)` — như biến `f()` ở trên.
    // Nghĩa là bên trong `loop`, `this` = undefined → dòng đầu tiên
    // `if (this.destroyed)` crash ngay frame đầu tiên.
    //
    // Cách sửa: tạo bản sao của `loop` với `this` đã khóa cứng:
    //
    //     private loopBound = this.loop.bind(this);
    //
    // `bind(this)` nghĩa là "tạo hàm mới từ loop, trong đó this luôn
    // = MemoryGrid instance hiện tại, dù ai gọi kiểu gì". Xong rồi
    // dùng loopBound thay vì loop khi truyền cho requestAnimationFrame.
    //
    // ------------------------------------------------------------
    // TẠI SAO BIND 1 LẦN Ở ĐÂY, KHÔNG BIND MỖI FRAME?
    // ------------------------------------------------------------
    // Cả 2 cách đều chạy đúng, nhưng khác nhau về garbage:
    //
    //     // SAI (tạo rác mỗi frame):
    //     loop(t) {
    //         ...
    //         requestAnimationFrame(this.loop.bind(this));  // bind mỗi lần
    //     }
    //     // → mỗi 16ms tạo 1 function mới → 60 function/giây
    //     // → GC phải dọn liên tục → có thể gây giật
    //
    //     // ĐÚNG (bind 1 lần):
    //     loopBound = this.loop.bind(this);
    //     loop(t) {
    //         ...
    //         requestAnimationFrame(this.loopBound);   // dùng lại
    //     }
    //     // → chỉ 1 function duy nhất suốt vòng đời
    //
    // Thêm nữa, cách đúng giúp cancelAnimationFrame hoạt động chính xác
    // vì ID trả về luôn tương ứng với cùng một function reference.
    //
    // ------------------------------------------------------------
    // CÁCH KHÁC: CÓ THỂ DÙNG ARROW PROPERTY
    // ------------------------------------------------------------
    // Thay vì bind, có thể viết:
    //     private loop = (t: number) => { ... }
    // Arrow property tự khóa `this` y như bind. Mình chọn bind vì
    // `loop` là method thực sự của class (dùng được prototype, mock
    // dễ hơn trong test), còn arrow property sẽ biến nó thành instance
    // field — mỗi instance có 1 bản riêng, tốn memory hơn.
    // ============================================================
    private loopBound = this.loop.bind(this);


    // ============================================================
    // CONSTRUCTOR — tương đương ngOnInit
    // ============================================================
    // Thứ tự các bước RẤT quan trọng. Giải thích từng bước bên dưới.
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Lấy 2D context từ canvas. Trong Unity tương đương việc lấy
        // Camera.main hoặc Renderer — mọi lệnh vẽ đều đi qua object này.
        //
        // `!` ở cuối là "non-null assertion" của TypeScript — nói với
        // compiler "tin tôi, không null". Thực tế có thể null nếu canvas
        // đã bị dispose. Production code nên check:
        //     const ctx = canvas.getContext('2d');
        //     if (!ctx) throw new Error('Cannot get 2D context');
        //     this.ctx = ctx;
        this.ctx = canvas.getContext('2d')!;

        // BƯỚC 1: Tạo cấu trúc dữ liệu grid (chưa cần kích thước)
        this.buildGrid();

        // BƯỚC 2: Gắn event listener (chưa cần kích thước)
        this.bindInput();

        // BƯỚC 3: Tính kích thước thật của canvas
        //
        // TẠI SAO DÙNG ResizeObserver THAY VÌ window.addEventListener('resize')?
        //
        // window 'resize' event CHỈ bắn khi browser window đổi size.
        // Nhưng canvas có thể bị đổi size mà window không đổi:
        //   - User mở sidebar → container hẹp lại
        //   - Modal xuất hiện → canvas bị ép nhỏ
        //   - Responsive layout đổi breakpoint
        //   - DevTools mở (đôi khi thay đổi layout)
        // → window event KHÔNG bắt được những trường hợp này.
        //
        // ResizeObserver theo dõi trực tiếp kích thước của MỘT element
        // cụ thể (ở đây là parent của canvas). Khi element đó đổi size
        // — vì bất kỳ lý do gì — observer bắn callback. Chính xác hơn
        // nhiều so với window.resize.
        //
        // Angular không có khái niệm tương đương built-in, thường phải
        // dùng @HostListener('window:resize') → cũng có hạn chế y hệt
        // window.resize ở trên. ResizeObserver là API trình duyệt hiện đại.
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(canvas.parentElement!);

        // Gọi resize() MỘT LẦN ngay bây giờ.
        // Lý do: ResizeObserver chỉ báo khi có THAY ĐỔI. Lần đầu tiên,
        // khi chưa có gì thay đổi, observer không báo gì cả → canvas
        // vẫn size 0 → không vẽ được. Nên phải tự gọi resize() một lần
        // để set kích thước ban đầu.
        this.resize();

        // BƯỚC 4: KHỞI ĐỘNG GAME LOOP — "bấm nút Play"
        //
        // Đây là dòng quan trọng nhất của constructor. Trước dòng này,
        // chưa có gì chạy. Sau dòng này, chuỗi loop tự duy trì mãi:
        //
        //   requestAnimationFrame hẹn gọi loopBound ở frame kế (~16ms)
        //      → loopBound chạy vào loop()
        //      → cuối loop() lại gọi requestAnimationFrame(this.loopBound)
        //      → hẹn frame tiếp
        //      → lặp mãi cho đến khi destroy() được gọi
        //
        // Trong Unity, dòng này KHÔNG CẦN vì engine tự chạy. Ở đây,
        // đây chính là "nút Play" thủ công.
        //
        // Lưu `rafId` để destroy() có thể cancelAnimationFrame(rafId)
        // → hủy frame đang chờ, chuỗi loop dừng lại.
        //
        // Dùng `this.loopBound` (đã bind ở trên) chứ KHÔNG dùng
        // `this.loop` — đã giải thích ở block loopBound.
        this.rafId = requestAnimationFrame(this.loopBound);
    }


    // ============================================================
    // DESTROY — tương đương ngOnDestroy
    // ============================================================
    // React component (CanvasMemoryGrid.tsx) gọi hàm này trong useEffect
    // cleanup khi unmount. Nếu quên gọi:
    //   - RAF loop chạy mãi dù game đã bị remove khỏi DOM → CPU 100%
    //   - ResizeObserver giữ reference tới canvas đã bị xóa → memory leak
    //   - Event listener vẫn gắn trên canvas cũ → click không được dọn
    //
    // Trong Unity, OnDestroy tự được engine gọi khi scene unload.
    // Trong Angular, ngOnDestroy tự được gọi khi component bị hủy.
    // Ở đây phải tự gọi từ bên ngoài (useEffect của React).
    //
    // Đây là điểm interviewer senior LUÔN hỏi: "làm sao cleanup?"
    destroy() {
        this.destroyed = true;              // flag để loop tự dừng ở frame kế
        cancelAnimationFrame(this.rafId);   // hủy frame đang chờ
        this.observer?.disconnect();        // ngắt theo dõi resize
        // removeEventListener phải dùng CÙNG reference đã addEventListener.
        // Vì onClick là arrow property (không phải method thường), reference
        // không đổi → remove hoạt động đúng. Nếu onClick là method thường
        // (protected onClick() {...}), mỗi lần đọc this.onClick sẽ trả về
        // function khác nhau → removeEventListener không tìm thấy → leak.
        this.canvas.removeEventListener('mousedown', this.onClick);
        this.canvas.removeEventListener('touchstart', this.onClick);
    }


    // ============================================================
    // RESIZE — tính kích thước canvas, xử lý màn hình retina
    // ============================================================
    private resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        // parent.clientWidth = chiều rộng khả dụng của parent.
        // Có thể = 0 nếu layout chưa xong (ví dụ: render lần đầu khi
        // parent display:none). Fallback 480 để canvas không bị size 0.
        const parentW = parent.clientWidth || 480;

        // Giới hạn: không nhỏ hơn 200 (mobile), không lớn hơn 480 (desktop).
        // Grid 4x4 ô nhỏ hơn 200px sẽ khó click.
        const W = Math.max(200, Math.min(parentW, 480));
        const H = W + FOOTER_H;      // grid vuông + vùng footer

        // ------------------------------------------------------------
        // TẠI SAO devicePixelRatio?
        // ------------------------------------------------------------
        // Trên màn hình retina (MacBook, iPhone), 1 CSS pixel = 2 hoặc
        // 3 physical pixel. Trình duyệt sẽ tự upscale canvas nếu bạn
        // không xử lý → hình mờ.
        //
        // Cách đúng: set canvas vật lý = W * dpr (số pixel thật),
        // nhưng set style CSS = W (để layout đúng). Trình duyệt không
        // cần upscale → hình sắc nét.
        //
        // Ví dụ màn 2x: canvas.width = 480 * 2 = 960, style.width = 480px.
        // Nhìn bằng mắt vẫn là 480px, nhưng có 960 pixel thật để vẽ.
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = W * dpr;
        this.canvas.height = H * dpr;
        this.canvas.style.width = W + 'px';
        this.canvas.style.height = H + 'px';

        // ------------------------------------------------------------
        // TẠI SAO setTransform THAY VÌ ctx.scale?
        // ------------------------------------------------------------
        // scale(dpr, dpr) sẽ CỘNG DỒN mỗi lần gọi. Nếu resize() được gọi
        // 3 lần, scale sẽ thành 3*dpr → canvas vẽ sai.
        //
        // setTransform(dpr, 0, 0, dpr, 0, 0) RESET transform matrix về
        // giá trị mới, không cộng dồn. An toàn khi gọi nhiều lần.
        //
        // Sau lệnh này, mọi lệnh vẽ (fillRect, arc, ...) đều tính theo
        // đơn vị CSS pixel (W, H) — code vẽ không cần biết dpr là gì.
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.W = W;
        this.H = H;
        this.gridH = W;
        this.recomputeCellPositions();
    }


    // ============================================================
    // TÍNH LẠI VỊ TRÍ PIXEL CỦA TỪNG Ô
    // ============================================================
    // Tách riêng khỏi buildGrid() để resize() KHÔNG phải tạo lại mảng
    // cell từ đầu. Chỉ đọc (gx, gy) có sẵn rồi tính (x, y, w, h) mới.
    // Nhờ vậy, state của từng ô (idle/correct/wrong/highlight) vẫn
    // được giữ nguyên khi user xoay màn hình.
    private recomputeCellPositions() {
        // (W - tổng gap) / N = cạnh mỗi ô vuông
        // Có (N-1) khoảng gap vì giữa N ô chỉ có N-1 khoảng trống
        const size = (this.W - CELL_GAP * (GRID_N - 1)) / GRID_N;
        this.cells.forEach(c => {
            c.x = c.gx * (size + CELL_GAP);
            c.y = c.gy * (size + CELL_GAP);
            c.w = size;
            c.h = size;
        });
    }


    // ============================================================
    // BUILD GRID — tạo mảng cell với toạ độ logic
    // ============================================================
    // Chỉ chạy 1 lần trong constructor. Toạ độ pixel (x, y, w, h) để
    // 0 vì chưa biết kích thước — resize() sẽ tính sau.
    private buildGrid() {
        this.cells = [];
        for (let gy = 0; gy < GRID_N; gy++)
            for (let gx = 0; gx < GRID_N; gx++)
                this.cells.push({ gx, gy, x: 0, y: 0, w: 0, h: 0, state: 'idle' });
    }


    // ============================================================
    // ON CLICK — arrow function để giữ `this` (giống Angular pattern)
    // ============================================================
    // TẠI SAO LÀ ARROW PROPERTY, KHÔNG PHẢI METHOD?
    // Vì onClick được truyền cho addEventListener. Nếu là method thường:
    //     addEventListener('click', this.onClick);  // this.onClick đọc = function
    // Khi browser gọi, `this` = canvas element, KHÔNG phải MemoryGrid
    // → this.state, this.canvas đều undefined → crash.
    //
    // Đây chính là pattern Angular khuyên dùng:
    //     onClick = () => { ... }   // arrow khóa this
    private onClick = (e: MouseEvent | TouchEvent) => {
        // Chặn browser scroll khi user chạm trên canvas mobile.
        // Không có dòng này, vuốt trên canvas sẽ scroll trang thay vì
        // trigger game event.
        e.preventDefault();

        // Phase idle/won/lost → click = bắt đầu ván mới
        if (this.state === 'idle' || this.state === 'won' || this.state === 'lost') {
            this.startRound();
            return;
        }

        // Phase showing → click không có tác dụng (đang trong 1.5s highlight)
        if (this.state !== 'input') return;

        // ------------------------------------------------------------
        // TẠI SAO getBoundingClientRect()?
        // ------------------------------------------------------------
        // e.clientX / e.clientY là toạ độ so với VIEWPORT (góc trên trái
        // của browser window), không phải so với canvas.
        //
        // Nếu canvas nằm ở giữa trang (top: 200px), click vào chính giữa
        // canvas sẽ có clientY ≈ 400 (200 + 200 canvas height/2).
        // Nhưng trong canvas, toạ độ đúng phải là ~200.
        //
        // getBoundingClientRect() trả về vị trí canvas so với viewport.
        // Trừ đi → ra toạ độ thực trong canvas. Quên bước này → hit-test
        // sai hoàn toàn (click đúng ô mà code bảo click sai).
        const r = this.canvas.getBoundingClientRect();

        // MouseEvent có .clientX trực tiếp; TouchEvent có .touches[0].clientX.
        // Dùng 'touches' in e để phân biệt 2 loại event tại runtime.
        const src = 'touches' in e ? e.touches[0] : e;
        const x = src.clientX - r.left;
        const y = src.clientY - r.top;
        this.handleClick(x, y);
    };


    // ============================================================
    // BIND INPUT — gắn event listener
    // ============================================================
    private bindInput() {
        this.canvas.addEventListener('mousedown', this.onClick);
        // `passive: false` cần thiết để preventDefault() hoạt động.
        // Mặc định từ Chrome 56+, touchstart listener là passive →
        // preventDefault() bị ignore → browser scroll dù bạn gọi preventDefault.
        // Set passive: false để tắt hành vi mặc định đó.
        this.canvas.addEventListener('touchstart', this.onClick, { passive: false });
    }


    // ============================================================
    // HANDLE CLICK — hit-test và cập nhật state
    // ============================================================
    private handleClick(x: number, y: number) {
        // Linear search qua 16 ô. Với grid nhỏ, đủ nhanh.
        // Với grid lớn (100x100), nên tính index trực tiếp từ toạ độ:
        //     gx = Math.floor(x / (size + gap))
        //     gy = Math.floor(y / (size + gap))
        //     index = gy * N + gx
        // → O(1) thay vì O(n). Đây là điểm interviewer có thể hỏi nếu
        // grid lớn.
        for (let i = 0; i < this.cells.length; i++) {
            const c = this.cells[i];

            // AABB hit-test (Axis-Aligned Bounding Box):
            // click phải nằm trong hình chữ nhật (x, y, w, h).
            // Đây là cách kiểm tra va chạm cơ bản nhất, tương đương
            // Collider với BoxCollider2D trong Unity.
            if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
                // Ô đã được click trước đó (đã correct hoặc wrong) → bỏ qua
                if (c.state !== 'idle') return;

                if (this.targets.has(i)) {
                    // Click đúng ô đã được highlight
                    c.state = 'correct';
                    this.targets.delete(i);
                    // Xóa hết target rồi → thắng
                    if (this.targets.size === 0) this.state = 'won';
                } else {
                    // Click sai ô
                    c.state = 'wrong';
                    this.mistakes++;
                    if (this.mistakes >= MAX_MISTAKES) this.state = 'lost';
                }
                return;   // Chỉ xử lý 1 ô mỗi click, thoát ngay
            }
        }
    }


    // ============================================================
    // LOOP — GAME LOOP thay thế Update() của Unity
    // ============================================================
    // Đây là hàm được requestAnimationFrame gọi ~60 lần/giây.
    // Trong Unity, bạn viết Update() và engine gọi. Ở đây, hàm này
    // tự gọi lại chính nó qua requestAnimationFrame ở cuối.
    private loop(t: number) {
        // Flag check — nếu destroy() đã gọi thì dừng hẳn, không schedule
        // frame mới. Không có dòng này, destroy() chỉ hủy frame hiện tại,
        // nhưng nếu frame đang chạy dở và cuối hàm lại gọi RAF → loop
        // sống lại. Flag đảm bảo loop dừng vĩnh viễn.
        if (this.destroyed) return;

        // ------------------------------------------------------------
        // DELTA TIME — tại sao cần?
        // ------------------------------------------------------------
        // t = timestamp hiện tại (ms) do requestAnimationFrame truyền vào.
        // dt = t - lastTime = thời gian thực giữa 2 frame liên tiếp.
        //
        // Nếu máy mạnh chạy 60fps → dt ≈ 16ms.
        // Nếu máy yếu chạy 30fps → dt ≈ 33ms.
        //
        // Nếu bạn cộng showTimer += 16 (cứng) mỗi frame:
        //   - 60fps: 16*60 = 960ms/giây thật → SHOW_DURATION 1500ms
        //           mất 1.56 giây thật → gần đúng
        //   - 30fps: 16*30 = 480ms/giây thật → SHOW_DURATION 1500ms
        //           mất 3.1 giây thật → CHẬM GẤP ĐÔI
        //
        // Nếu bạn cộng dt (động):
        //   - 60fps: 16*60 = 960ms/giây thật
        //   - 30fps: 33*30 = 990ms/giây thật
        //   Cả hai đều ~1 giây thật → đúng tốc độ.
        //
        // Trong Unity, Time.deltaTime làm đúng việc này. Ở đây bạn tự tính.
        //
        // Frame đầu: lastTime = 0 → t - 0 = timestamp khổng lồ →
        // animation nhảy vọt. Nên fallback 16ms cho frame đầu.
        const dt = this.lastTime ? t - this.lastTime : 16;
        this.lastTime = t;

        // Tách update (logic) và render (vẽ):
        // - update() thay đổi state, không đụng canvas
        // - render() đọc state, không đổi state
        // Pattern này giúp update có thể test độc lập không cần DOM.
        // Giống như tách Model/View trong MVC.
        this.update(dt);
        this.render();

        // Schedule frame tiếp theo. Lưu ra this.rafId để destroy() hủy được.
        this.rafId = requestAnimationFrame(this.loopBound);
    }


    // ============================================================
    // UPDATE — chỉ logic, không vẽ
    // ============================================================
    // Tương đương Update() của Unity nhưng tách phần vẽ ra ngoài.
    // Có thể test hàm này bằng cách mock state, không cần canvas.
    private update(dt: number) {
        if (this.state === 'showing') {
            this.showTimer += dt;
            if (this.showTimer >= SHOW_DURATION) {
                // Hết thời gian highlight → ẩn hết, chuyển sang phase input
                // KHÔNG xóa targets — vì user vẫn phải nhớ vị trí các ô
                // đã highlight để click lại.
                this.cells.forEach(c => {
                    if (c.state === 'highlight') c.state = 'idle';
                });
                this.state = 'input';
            }
        }
    }


    // ============================================================
    // RENDER — chỉ vẽ, không đổi state
    // ============================================================
    private render() {
        const ctx = this.ctx;

        // TẠI SAO PHẢI CLEAR/REDRAW?
        // Canvas KHÔNG tự xóa frame cũ trước khi vẽ frame mới. Khác với
        // Unity, khi camera render lại toàn bộ scene. Ở đây bạn phải
        // tự fill một hình chữ nhật phủ kín để "xóa" frame cũ. Không
        // làm → hình mới chồng lên hình cũ → hiệu ứng "vệt" (trail).
        ctx.fillStyle = '#0b0b16';
        ctx.fillRect(0, 0, this.W, this.H);

        // Vẽ từng ô với màu tương ứng state
        this.cells.forEach(c => {
            ctx.fillStyle = this.colorFor(c.state);
            // roundRect() chỉ TẠO PATH (đường vẽ), không vẽ thật.
            // fill() sau đó mới thực sự tô màu path. Đây là cách Canvas
            // hoạt động: xây path → fill/stroke.
            this.roundRect(ctx, c.x, c.y, c.w, c.h, 8);
            ctx.fill();
        });

        // Vẽ text trạng thái ở footer
        const msg = this.footerMessage();
        ctx.fillStyle = msg.color;
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';   // căn giữa text quanh toạ độ x
        ctx.fillText(msg.text, this.W / 2, this.H - 14);
    }


    // ============================================================
    // FOOTER MESSAGE — map state → text hiển thị
    // ============================================================
    // Tách riêng vì:
    // - render() chỉ quan tâm "vẽ cái gì", không quan tâm "text là gì"
    // - Thêm state mới → chỉ sửa hàm này, không đụng render()
    // - Test dễ: gọi footerMessage() với state cụ thể → so sánh text
    private footerMessage(): { text: string; color: string } {
        switch (this.state) {
            case 'idle': return { text: 'Click to start', color: '#8b949e' };
            case 'showing': return { text: 'Memorize the highlighted cells...', color: '#ffcc00' };
            case 'input': return { text: `Click them — Mistakes: ${this.mistakes}/${MAX_MISTAKES}`, color: '#c9d1d9' };
            case 'won': return { text: '✓ You win! Click to play again', color: '#22cc66' };
            case 'lost': return { text: '✗ Game over — Click to retry', color: '#cc2233' };
        }
    }


    // ============================================================
    // COLOR FOR — map CellState → màu
    // ============================================================
    private colorFor(s: CellState): string {
        switch (s) {
            case 'highlight': return '#ffcc00';   // vàng: đang sáng
            case 'correct': return '#22cc66';     // xanh: click đúng
            case 'wrong': return '#cc2233';       // đỏ: click sai
            default: return '#334466';            // xám xanh: idle
        }
    }


    // ============================================================
    // ROUND RECT — helper vẽ hình chữ nhật bo góc
    // ============================================================
    // TẠI SAO DÙNG arcTo THAY VÌ arc?
    // - arc(cx, cy, r, start, end) vẽ cung tròn quanh tâm → phải tính
    //   4 tâm riêng cho 4 góc → code dài, dễ sai.
    // - arcTo(x1, y1, x2, y2, r) vẽ cung nối 2 đường thẳng, tự động
    //   tính tâm → gọn hơn nhiều.
    //
    // Canvas không có hàm roundRect() built-in (trước 2023), nên đây
    // là helper mọi dev Canvas đều phải biết. Interviewer có thể yêu
    // cầu viết lại để test kỹ năng Canvas API.
    private roundRect(
        ctx: CanvasRenderingContext2D,
        x: number, y: number,
        w: number, h: number,
        r: number,
    ) {
        ctx.beginPath();                        // bắt đầu path mới
        ctx.moveTo(x + r, y);                   // di chuyển tới góc trên trái (bỏ qua góc bo)
        ctx.arcTo(x + w, y, x + w, y + h, r);   // góc trên phải
        ctx.arcTo(x + w, y + h, x, y + h, r);   // góc dưới phải
        ctx.arcTo(x, y + h, x, y, r);           // góc dưới trái
        ctx.arcTo(x, y, x + w, y, r);           // góc trên trái
        ctx.closePath();                        // đóng path (về điểm đầu)
    }


    // ============================================================
    // START ROUND — bắt đầu ván mới
    // ============================================================
    private startRound() {
        // Reset toàn bộ state về mặc định
        this.cells.forEach(c => c.state = 'idle');
        this.targets.clear();
        this.mistakes = 0;
        this.showTimer = 0;

        // Chọn N ô ngẫu nhiên KHÔNG TRÙNG làm target.
        // Dùng Set: khi add() một giá trị đã có, Set không thêm và không
        // báo lỗi → loop tiếp tục cho đến khi đủ N ô khác nhau.
        // Tương đương trong C#: dùng HashSet<int> với thuộc tính
        // tự động dedupe.
        //
        // LƯU Ý: nếu GRID_N > total (16), loop sẽ chạy vô hạn vì không
        // thể có >16 phần tử phân biệt từ 16 phần tử. Production nên
        // guard: if (GRID_N > total) throw new Error(...).
        // Ở đây GRID_N = 4 < 16 → an toàn.
        const total = this.cells.length;
        while (this.targets.size < GRID_N) {
            const i = Math.floor(Math.random() * total);
            this.targets.add(i);
            this.cells[i].state = 'highlight';
        }

        // Chuyển sang phase 'showing' — update() sẽ đếm 1.5s rồi tự
        // ẩn highlight và chuyển sang 'input'.
        this.state = 'showing';
    }
}
