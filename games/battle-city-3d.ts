// games/battle-city-3d.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

if (typeof window !== 'undefined') {
    const _origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
        if (typeof args[0] === 'string' && args[0].includes('Z-UP coordinate system')) return;
        _origWarn(...args);
    };
}

export type BattleCityParams = {
    moveSpeed: number;
};

export type BattleCityHandle = {
    setParam: <K extends keyof BattleCityParams>(key: K, value: BattleCityParams[K]) => void;
    destroy: () => void;
};

const MAP_SIZE = 13;
const CELL = 1;
const TANK_RADIUS = 0.35;
const CAMERA_OFFSET = new THREE.Vector3(9, 11, 9);

// Bullet
const BULLET_SPEED = 9;
const BULLET_RADIUS = 0.12;
const BULLET_LIFETIME = 2.0;
const FIRE_COOLDOWN = 0.35;
const BULLET_POOL_SIZE = 32;

// Wall
const BRICK_HP = 2;
const FLASH_DURATION = 0.12;
const FLASH_EMISSIVE = 0xffffff;
const FLASH_INTENSITY = 3.0;

// Enemy
const ENEMY_SPEED = 2.2;
const ENEMY_HP = 2;
const ENEMY_FIRE_COOLDOWN = 1.2;
const ENEMY_MOVE_DURATION = 0.6;    // mỗi lần đi 1 ô, dừng 0.6s rồi đi tiếp
const ENEMY_PATH_RECOMPUTE = 0.5;   // recompute path mỗi 0.5s

const MAP_TEMPLATE: number[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 2, 0, 2, 0, 1, 1, 0, 0, 0],
    [0, 1, 1, 0, 2, 0, 2, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

type Bullet = {
    mesh: THREE.Mesh;
    dx: number;
    dz: number;
    life: number;
    alive: boolean;
    owner: 'player' | 'enemy';
};

type WallData = {
    mesh: THREE.Mesh;
    hp: number;
    maxHp: number;
    type: number;
    flashUntil: number;
};

type Enemy = {
    pivot: THREE.Group;
    x: number;
    z: number;
    targetAngle: number;
    currentAngle: number;
    hp: number;
    alive: boolean;
    path: { c: number; r: number }[];
    pathIndex: number;
    lastRecomputeTime: number;
    lastPathVersion: number;
    lastFireTime: number;
    moveTimer: number;      // dừng giữa các bước
    moving: boolean;
};

async function loadModel(url: string): Promise<THREE.Object3D> {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'glb' || ext === 'gltf') {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        return gltf.scene;
    }
    if (ext === 'fbx') {
        const loader = new FBXLoader();
        const fbx = await loader.loadAsync(url);
        return fbx;
    }
    throw new Error(`Unsupported format: ${ext}`);
}

function normalizeModel(root: THREE.Object3D, targetSize: number) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    root.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(targetSize / maxDim);
    return wrapper;
}

async function loadTank(url: { body: string; tower: string; gun: string }): Promise<THREE.Group> {
    const [bodyModel, towerModel, gunModel] = await Promise.all([
        loadModel(url.body),
        loadModel(url.tower),
        loadModel(url.gun),
    ]);

    const root = new THREE.Group();

    const body = normalizeModel(bodyModel, 0.9);
    root.add(body);

    const turret = new THREE.Group();
    turret.position.y = 0.25;
    root.add(turret);

    const tower = normalizeModel(towerModel, 0.55);
    turret.add(tower);

    const gun = normalizeModel(gunModel, 0.7);
    gun.position.set(0, 0.05, 0.35);
    turret.add(gun);

    root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    return root;
}

export function initBattleCity(
    container: HTMLElement,
    initial: BattleCityParams
): { ready: Promise<BattleCityHandle> } {
    const ready = (async (): Promise<BattleCityHandle> => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        // ===== RENDERER =====
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(width, height);
        renderer.setClearColor(0x0a0a14, 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        container.appendChild(renderer.domElement);

        // ===== SCENE =====
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0a14, 18, 32);

        const camYaw = Math.atan2(CAMERA_OFFSET.x, CAMERA_OFFSET.z);
        const worldGroup = new THREE.Group();
        worldGroup.rotation.y = camYaw;
        scene.add(worldGroup);

        // ===== CAMERA =====
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

        // ===== LIGHTS =====
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));

        const sun = new THREE.DirectionalLight(0xffffff, 1.1);
        sun.position.set(6, 12, 4);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.left = -12;
        sun.shadow.camera.right = 12;
        sun.shadow.camera.top = 12;
        sun.shadow.camera.bottom = -12;
        scene.add(sun);

        const rim = new THREE.PointLight(0x00e5ff, 1.2, 15);
        rim.position.set(-5, 4, -5);
        scene.add(rim);

        // ===== GROUND =====
        const groundGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x14141e, roughness: 0.95, metalness: 0.05,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        worldGroup.add(ground);

        const grid = new THREE.GridHelper(MAP_SIZE, MAP_SIZE, 0x2a2a4a, 0x1a1a2e);
        grid.position.y = 0.001;
        worldGroup.add(grid);

        // ===== WALLS =====
        const half = MAP_SIZE / 2;
        const wallGeo = new THREE.BoxGeometry(CELL * 0.95, 0.7, CELL * 0.95);

        const brickMatBase = new THREE.MeshStandardMaterial({
            color: 0xd2691e, roughness: 0.85, metalness: 0.1,
        });
        const steelMatBase = new THREE.MeshStandardMaterial({
            color: 0xa0a8b8, roughness: 0.3, metalness: 0.7,
        });
        const baseMatBase = new THREE.MeshStandardMaterial({
            color: 0xffd700, roughness: 0.4, metalness: 0.3,
            emissive: 0xffd700, emissiveIntensity: 0.3,
        });

        const walls: boolean[][] = Array.from({ length: MAP_SIZE }, () =>
            Array(MAP_SIZE).fill(false)
        );
        const wallData: (WallData | null)[][] = Array.from({ length: MAP_SIZE }, () =>
            Array(MAP_SIZE).fill(null)
        );

        // ⭐ Track wall version — enemy dùng để biết khi nào cần recompute path
        let wallVersion = 0;

        for (let r = 0; r < MAP_SIZE; r++) {
            for (let c = 0; c < MAP_SIZE; c++) {
                const cell = MAP_TEMPLATE[r][c];
                if (cell === 0) continue;

                walls[r][c] = true;

                const baseMat = cell === 2 ? steelMatBase : cell === 9 ? baseMatBase : brickMatBase;
                const mat = baseMat.clone();
                const mesh = new THREE.Mesh(wallGeo, mat);
                mesh.position.set(
                    c * CELL - half + CELL / 2,
                    cell === 9 ? 0.6 : 0.35,
                    r * CELL - half + CELL / 2
                );
                if (cell === 9) mesh.scale.set(1, 1.5, 1);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                worldGroup.add(mesh);

                const hp = cell === 1 ? BRICK_HP : Infinity;
                wallData[r][c] = { mesh, hp, maxHp: hp, type: cell, flashUntil: 0 };
            }
        }

        // ===== PLAYER TANK =====
        const tankPivot = await loadTank({
            body: '/models/tankbody.fbx',
            tower: '/models/tanktower.fbx',
            gun: '/models/tankgun.fbx',
        });
        tankPivot.position.set(0, 0, half - 1.5);
        worldGroup.add(tankPivot);

        let playerHp = 3;
        let playerAlive = true;

        // ===== ENEMY =====
        const enemies: Enemy[] = [];

        async function spawnEnemy(c: number, r: number) {
            const pivot = await loadTank({
                body: '/models/tankbody.fbx',
                tower: '/models/tanktower.fbx',
                gun: '/models/tankgun.fbx',
            });

            // Đổi màu enemy — tint đỏ
            pivot.traverse((obj) => {
                if ((obj as THREE.Mesh).isMesh) {
                    const mat = (obj as THREE.Mesh).material;
                    const tint = (m: THREE.Material) => {
                        const std = m as THREE.MeshStandardMaterial;
                        if (std.color) std.color.multiplyScalar(1.0).lerp(new THREE.Color(0xff2e88), 0.55);
                    };
                    if (Array.isArray(mat)) mat.forEach(tint);
                    else tint(mat);
                }
            });

            const x = c * CELL - half + CELL / 2;
            const z = r * CELL - half + CELL / 2;
            pivot.position.set(x, 0, z);
            worldGroup.add(pivot);

            enemies.push({
                pivot,
                x,
                z,
                targetAngle: 0,
                currentAngle: 0,
                hp: ENEMY_HP,
                alive: true,
                path: [],
                pathIndex: 0,
                lastRecomputeTime: -999,
                lastPathVersion: -1,
                lastFireTime: -999,
                moveTimer: 0,
                moving: false,
            });
        }

        // Spawn 1 enemy ban đầu ở góc trên
        await spawnEnemy(0, 0);

        // ===== BULLET POOL =====
        const bulletGeo = new THREE.SphereGeometry(BULLET_RADIUS, 8, 6);
        const bulletMatPlayer = new THREE.MeshStandardMaterial({
            color: 0xffffff, emissive: 0x00e5ff, emissiveIntensity: 2.0, roughness: 0.3,
        });
        const bulletMatEnemy = new THREE.MeshStandardMaterial({
            color: 0xffffff, emissive: 0xff2e88, emissiveIntensity: 2.0, roughness: 0.3,
        });

        const bullets: Bullet[] = [];
        for (let i = 0; i < BULLET_POOL_SIZE; i++) {
            const mesh = new THREE.Mesh(bulletGeo, bulletMatPlayer);
            mesh.visible = false;
            mesh.castShadow = false;
            worldGroup.add(mesh);
            bullets.push({ mesh, dx: 0, dz: 0, life: 0, alive: false, owner: 'player' });
        }

        let lastFireTime = -999;

        // ===== INPUT =====
        const keys: Record<string, boolean> = {};
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
                keys[k] = true;
                e.preventDefault();
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // ===== COLLISION =====
        function canMoveTo(x: number, z: number): boolean {
            const r = TANK_RADIUS;
            const corners = [
                [x - r, z - r],
                [x + r, z - r],
                [x - r, z + r],
                [x + r, z + r],
            ];
            for (const [cx, cz] of corners) {
                const gc = Math.floor(cx + half);
                const gr = Math.floor(cz + half);
                if (gc < 0 || gc >= MAP_SIZE || gr < 0 || gr >= MAP_SIZE) return false;
                if (walls[gr][gc]) return false;
            }
            return true;
        }

        // ===== PATHFINDING — BFS =====
        // Trả về đường đi từ (sc, sr) tới (tc, tr) — mảng cell
        function findPath(sc: number, sr: number, tc: number, tr: number): { c: number; r: number }[] {
            if (sc === tc && sr === tr) return [];

            const visited = Array.from({ length: MAP_SIZE }, () =>
                Array(MAP_SIZE).fill(false)
            );
            const parent: ({ c: number; r: number } | null)[][] = Array.from(
                { length: MAP_SIZE },
                () => Array(MAP_SIZE).fill(null)
            );

            const queue: { c: number; r: number }[] = [{ c: sc, r: sr }];
            visited[sr][sc] = true;

            const dirs = [
                { c: 0, r: -1 },  // up
                { c: 1, r: 0 },   // right
                { c: 0, r: 1 },   // down
                { c: -1, r: 0 },  // left
            ];

            while (queue.length > 0) {
                const cur = queue.shift()!;
                if (cur.c === tc && cur.r === tr) {
                    // Reconstruct path
                    const path: { c: number; r: number }[] = [];
                    let node: { c: number; r: number } | null = cur;
                    while (node && !(node.c === sc && node.r === sr)) {
                        path.unshift(node);
                        node = parent[node.r][node.c];
                    }
                    return path;
                }

                for (const d of dirs) {
                    const nc = cur.c + d.c;
                    const nr = cur.r + d.r;
                    if (nc < 0 || nc >= MAP_SIZE || nr < 0 || nr >= MAP_SIZE) continue;
                    if (visited[nr][nc]) continue;
                    if (walls[nr][nc]) continue;
                    visited[nr][nc] = true;
                    parent[nr][nc] = cur;
                    queue.push({ c: nc, r: nr });
                }
            }

            return [];   // Không tìm thấy
        }

        // ===== LINE OF SIGHT =====
        function hasLineOfSight(x1: number, z1: number, x2: number, z2: number): boolean {
            // Check theo trục chính — đơn giản hoá cho 4 hướng
            const gc1 = Math.floor(x1 + half);
            const gr1 = Math.floor(z1 + half);
            const gc2 = Math.floor(x2 + half);
            const gr2 = Math.floor(z2 + half);

            // Cùng row
            if (gr1 === gr2) {
                const minC = Math.min(gc1, gc2);
                const maxC = Math.max(gc1, gc2);
                for (let c = minC + 1; c < maxC; c++) {
                    if (walls[gr1][c]) return false;
                }
                return true;
            }

            // Cùng col
            if (gc1 === gc2) {
                const minR = Math.min(gr1, gr2);
                const maxR = Math.max(gr1, gr2);
                for (let r = minR + 1; r < maxR; r++) {
                    if (walls[r][gc1]) return false;
                }
                return true;
            }

            return false;
        }

        // ===== FIRE =====
        function fireBullet(
            elapsed: number,
            fromX: number,
            fromZ: number,
            angle: number,
            owner: 'player' | 'enemy'
        ): boolean {
            const fx = Math.sin(angle);
            const fz = Math.cos(angle);

            const b = bullets.find((x) => !x.alive);
            if (!b) return false;

            const spawnDist = 0.55;
            b.mesh.position.set(fromX + fx * spawnDist, 0.4, fromZ + fz * spawnDist);
            b.mesh.material = owner === 'player' ? bulletMatPlayer : bulletMatEnemy;
            b.mesh.visible = true;

            b.dx = fx;
            b.dz = fz;
            b.life = BULLET_LIFETIME;
            b.alive = true;
            b.owner = owner;
            return true;
        }

        // ===== WALL DAMAGE =====
        function damageWall(r: number, c: number, now: number) {
            const w = wallData[r][c];
            if (!w) return;
            if (w.type !== 1) return;   // Chỉ brick phá được

            w.hp -= 1;

            const mat = w.mesh.material as THREE.MeshStandardMaterial;
            mat.emissive.setHex(FLASH_EMISSIVE);
            mat.emissiveIntensity = FLASH_INTENSITY;
            w.flashUntil = now + FLASH_DURATION;

            if (w.hp <= 0) {
                worldGroup.remove(w.mesh);
                (w.mesh.material as THREE.Material).dispose();
                wallData[r][c] = null;
                walls[r][c] = false;
                wallVersion++;   // ⭐ Báo cho enemy biết cần recompute path
            }
        }

        function updateWallFlashes(now: number) {
            for (let r = 0; r < MAP_SIZE; r++) {
                for (let c = 0; c < MAP_SIZE; c++) {
                    const w = wallData[r][c];
                    if (!w || w.flashUntil === 0) continue;
                    if (now >= w.flashUntil) {
                        const mat = w.mesh.material as THREE.MeshStandardMaterial;
                        mat.emissive.setHex(0x000000);
                        mat.emissiveIntensity = 1;
                        w.flashUntil = 0;
                    }
                }
            }
        }

        // ===== BULLET COLLISION =====
        function checkBulletHitTank(
            bullet: Bullet,
            tankX: number,
            tankZ: number
        ): boolean {
            const dx = bullet.mesh.position.x - tankX;
            const dz = bullet.mesh.position.z - tankZ;
            const dist = Math.hypot(dx, dz);
            return dist < TANK_RADIUS + BULLET_RADIUS;
        }

        function updateBullets(dt: number, now: number) {
            for (const b of bullets) {
                if (!b.alive) continue;

                b.life -= dt;
                if (b.life <= 0) {
                    b.alive = false;
                    b.mesh.visible = false;
                    continue;
                }

                const nx = b.mesh.position.x + b.dx * BULLET_SPEED * dt;
                const nz = b.mesh.position.z + b.dz * BULLET_SPEED * dt;

                const gc = Math.floor(nx + half);
                const gr = Math.floor(nz + half);

                if (gc < 0 || gc >= MAP_SIZE || gr < 0 || gr >= MAP_SIZE) {
                    b.alive = false;
                    b.mesh.visible = false;
                    continue;
                }

                if (walls[gr][gc]) {
                    damageWall(gr, gc, now);
                    b.alive = false;
                    b.mesh.visible = false;
                    continue;
                }

                // Check hit player (nếu đạn enemy)
                if (b.owner === 'enemy' && playerAlive) {
                    if (checkBulletHitTank(b, tankPivot.position.x, tankPivot.position.z)) {
                        b.alive = false;
                        b.mesh.visible = false;
                        playerHp -= 1;
                        if (playerHp <= 0) playerAlive = false;
                        continue;
                    }
                }

                // Check hit enemy (nếu đạn player)
                if (b.owner === 'player') {
                    let hit = false;
                    for (const e of enemies) {
                        if (!e.alive) continue;
                        if (checkBulletHitTank(b, e.x, e.z)) {
                            b.alive = false;
                            b.mesh.visible = false;
                            e.hp -= 1;
                            if (e.hp <= 0) {
                                e.alive = false;
                                worldGroup.remove(e.pivot);
                            }
                            hit = true;
                            break;
                        }
                    }
                    if (hit) continue;
                }

                b.mesh.position.x = nx;
                b.mesh.position.z = nz;
            }
        }

        // ===== ENEMY AI =====
        function updateEnemy(e: Enemy, dt: number, now: number) {
            if (!e.alive) return;

            const pCol = Math.floor(tankPivot.position.x + half);
            const pRow = Math.floor(tankPivot.position.z + half);
            const eCol = Math.floor(e.x + half);
            const eRow = Math.floor(e.z + half);

            // Recompute path nếu cần
            const needRecompute =
                e.path.length === 0 ||
                e.lastPathVersion !== wallVersion ||
                now - e.lastRecomputeTime > ENEMY_PATH_RECOMPUTE;

            if (needRecompute) {
                e.path = findPath(eCol, eRow, pCol, pRow);
                e.pathIndex = 0;
                e.lastRecomputeTime = now;
                e.lastPathVersion = wallVersion;
            }

            // Nếu đang "nghỉ" giữa các bước → chờ
            if (!e.moving) {
                e.moveTimer -= dt;
                if (e.moveTimer > 0) {
                    // Vẫn xoay mượt
                    let diff = e.targetAngle - e.currentAngle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    e.currentAngle += diff * Math.min(1, dt * 10);
                    e.pivot.rotation.y = e.currentAngle;
                    return;
                }

                // Bắt đầu bước mới
                e.moving = true;
                e.moveTimer = ENEMY_MOVE_DURATION;
            }

            // Di chuyển theo path
            if (e.path.length === 0 || e.pathIndex >= e.path.length) {
                e.moving = false;
                e.moveTimer = 0;
                return;
            }

            const next = e.path[e.pathIndex];
            const targetX = next.c * CELL - half + CELL / 2;
            const targetZ = next.r * CELL - half + CELL / 2;

            const ddx = targetX - e.x;
            const ddz = targetZ - e.z;
            const dist = Math.hypot(ddx, ddz);

            // Xác định hướng và xoay
            if (Math.abs(ddx) > 0.01 || Math.abs(ddz) > 0.01) {
                // Snap hướng về 4 hướng chính
                let dirX = 0;
                let dirZ = 0;
                if (Math.abs(ddx) > Math.abs(ddz)) dirX = Math.sign(ddx);
                else dirZ = Math.sign(ddz);

                e.targetAngle = Math.atan2(dirX, dirZ);
            }

            // Xoay mượt
            let diff = e.targetAngle - e.currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            e.currentAngle += diff * Math.min(1, dt * 10);
            e.pivot.rotation.y = e.currentAngle;

            // Di chuyển tới cell tiếp theo
            const step = ENEMY_SPEED * dt;
            if (dist <= step) {
                e.x = targetX;
                e.z = targetZ;
                e.pathIndex++;
                e.moving = false;
                e.moveTimer = 0.15;   // nghỉ ngắn giữa các ô
            } else {
                e.x += (ddx / dist) * step;
                e.z += (ddz / dist) * step;
            }

            e.pivot.position.x = e.x;
            e.pivot.position.z = e.z;

            // ===== FIRE — nếu thấy player =====
            if (
                playerAlive &&
                now - e.lastFireTime > ENEMY_FIRE_COOLDOWN &&
                hasLineOfSight(e.x, e.z, tankPivot.position.x, tankPivot.position.z)
            ) {
                // Xoay về phía player trước khi bắn
                const pdx = tankPivot.position.x - e.x;
                const pdz = tankPivot.position.z - e.z;
                let dirX = 0;
                let dirZ = 0;
                if (Math.abs(pdx) > Math.abs(pdz)) dirX = Math.sign(pdx);
                else dirZ = Math.sign(pdz);

                e.targetAngle = Math.atan2(dirX, dirZ);
                e.currentAngle = e.targetAngle;
                e.pivot.rotation.y = e.currentAngle;

                fireBullet(now, e.x, e.z, e.currentAngle, 'enemy');
                e.lastFireTime = now;
            }
        }

        // ===== LOOP =====
        let speed = initial.moveSpeed;
        let raf = 0;
        const timer = new THREE.Timer();
        timer.connect(document);

        let targetAngle = tankPivot.rotation.y;

        const animate = () => {
            raf = requestAnimationFrame(animate);
            timer.update();
            const dt = Math.min(timer.getDelta(), 0.05);
            const now = timer.getElapsed();

            // ===== PLAYER MOVE =====
            if (playerAlive) {
                let dx = 0;
                let dz = 0;
                if (keys['w'] || keys['arrowup']) dz -= 1;
                if (keys['s'] || keys['arrowdown']) dz += 1;
                if (keys['a'] || keys['arrowleft']) dx -= 1;
                if (keys['d'] || keys['arrowright']) dx += 1;

                if (dx !== 0 || dz !== 0) {
                    if (Math.abs(dx) > Math.abs(dz)) {
                        dz = 0; dx = Math.sign(dx);
                    } else {
                        dx = 0; dz = Math.sign(dz);
                    }

                    targetAngle = Math.atan2(dx, dz);

                    const step = speed * dt;
                    const curX = tankPivot.position.x;
                    const curZ = tankPivot.position.z;
                    const tryX = curX + dx * step;
                    const tryZ = curZ + dz * step;

                    if (canMoveTo(tryX, tryZ)) {
                        tankPivot.position.x = tryX;
                        tankPivot.position.z = tryZ;
                    } else if (canMoveTo(tryX, curZ)) {
                        tankPivot.position.x = tryX;
                    } else if (canMoveTo(curX, tryZ)) {
                        tankPivot.position.z = tryZ;
                    }
                }

                let diff = targetAngle - tankPivot.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                tankPivot.rotation.y += diff * Math.min(1, dt * 10);

                if (keys[' '] && now - lastFireTime > FIRE_COOLDOWN) {
                    if (fireBullet(now, tankPivot.position.x, tankPivot.position.z, tankPivot.rotation.y, 'player')) {
                        lastFireTime = now;
                    }
                }
            } else {
                // Player chết — xoay tròn cho vui
                tankPivot.rotation.y += dt * 2;
            }

            // ===== ENEMY UPDATE =====
            for (const e of enemies) updateEnemy(e, dt, now);

            // ===== BULLETS =====
            updateBullets(dt, now);
            updateWallFlashes(now);

            // ===== CAMERA =====
            const targetPos = tankPivot.position.clone().add(CAMERA_OFFSET);
            camera.position.lerp(targetPos, Math.min(1, dt * 6));
            camera.lookAt(tankPivot.position.x, 0, tankPivot.position.z);

            renderer.render(scene, camera);
        };
        animate();

        // ===== RESIZE =====
        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(container);
        window.addEventListener('resize', onResize);
        setTimeout(onResize, 50);

        // ===== RETURN =====
        return {
            setParam: (key, value) => {
                if (key === 'moveSpeed') speed = value as number;
            },
            destroy: () => {
                cancelAnimationFrame(raf);
                timer.disconnect();
                ro.disconnect();
                window.removeEventListener('resize', onResize);
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);

                bulletGeo.dispose();
                bulletMatPlayer.dispose();
                bulletMatEnemy.dispose();
                wallGeo.dispose();
                brickMatBase.dispose();
                steelMatBase.dispose();
                baseMatBase.dispose();

                scene.traverse((obj) => {
                    if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
                    const mat = (obj as THREE.Mesh).material;
                    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
                    else if (mat) (mat as THREE.Material).dispose();
                });
                renderer.dispose();
                if (renderer.domElement.parentNode) {
                    renderer.domElement.parentNode.removeChild(renderer.domElement);
                }
            },
        };
    })();

    return { ready };
}