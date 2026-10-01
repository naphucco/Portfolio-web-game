// games/battle-city-3d.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

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

// 0 = empty, 1 = brick, 2 = steel, 9 = base
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
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // ===== SCENE =====
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0a14, 18, 32);

        // ⭐ WORLD GROUP — xoay để grid khớp màn hình
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

        // ===== GROUND (trong worldGroup) =====
        const groundGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x14141e,
            roughness: 0.95,
            metalness: 0.05,
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

        const brickMat = new THREE.MeshStandardMaterial({
            color: 0xd2691e, roughness: 0.85, metalness: 0.1,
        });
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0xa0a8b8, roughness: 0.3, metalness: 0.7,
        });
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xffd700, roughness: 0.4, metalness: 0.3,
            emissive: 0xffd700, emissiveIntensity: 0.3,
        });

        const walls: boolean[][] = Array.from({ length: MAP_SIZE }, () =>
            Array(MAP_SIZE).fill(false)
        );

        for (let r = 0; r < MAP_SIZE; r++) {
            for (let c = 0; c < MAP_SIZE; c++) {
                const cell = MAP_TEMPLATE[r][c];
                if (cell === 0) continue;

                walls[r][c] = true;

                const mat = cell === 2 ? steelMat : cell === 9 ? baseMat : brickMat;
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
            }
        }

        // ===== LOAD TANK =====
        const tankPivot = await loadTank({
            body: '/models/tankbody.fbx',
            tower: '/models/tanktower.fbx',
            gun: '/models/tankgun.fbx',
        });
        tankPivot.position.set(0, 0, half - 1.5);
        worldGroup.add(tankPivot);

        // ===== INPUT =====
        const keys: Record<string, boolean> = {};
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                keys[k] = true;
                e.preventDefault();
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // ===== COLLISION (dùng local coords của worldGroup) =====
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

        // ===== LOOP =====
        let speed = initial.moveSpeed;
        let raf = 0;
        const clock = new THREE.Clock();
        const tankWorldPos = new THREE.Vector3();

        const animate = () => {
            raf = requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.05);

            // Input — giờ trực tiếp là worldGroup local direction
            // W = -Z (lên trên màn hình), D = +X (phải trên màn hình)
            let dx = 0;
            let dz = 0;
            if (keys['w'] || keys['arrowup']) dz -= 1;
            if (keys['s'] || keys['arrowdown']) dz += 1;
            if (keys['a'] || keys['arrowleft']) dx -= 1;
            if (keys['d'] || keys['arrowright']) dx += 1;

            if (dx !== 0 || dz !== 0) {
                const len = Math.hypot(dx, dz);
                dx /= len;
                dz /= len;

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

                // Xoay tank về hướng di chuyển
                const targetAngle = Math.atan2(dx, dz);
                let diff = targetAngle - tankPivot.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                tankPivot.rotation.y += diff * Math.min(1, dt * 12);
            }

            // Camera follow — dùng world position của tank
            tankPivot.getWorldPosition(tankWorldPos);
            const targetPos = tankWorldPos.clone().add(CAMERA_OFFSET);
            camera.position.lerp(targetPos, Math.min(1, dt * 6));
            camera.lookAt(tankWorldPos.x, 0, tankWorldPos.z);

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

        // ===== RETURN HANDLE =====
        return {
            setParam: (key, value) => {
                if (key === 'moveSpeed') speed = value as number;
            },
            destroy: () => {
                cancelAnimationFrame(raf);
                ro.disconnect();
                window.removeEventListener('resize', onResize);
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);
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