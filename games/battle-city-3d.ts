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
const BULLET_POOL_SIZE = 24;

// Wall
const BRICK_HP = 2;
const FLASH_DURATION = 0.12;   // seconds
const FLASH_EMISSIVE = 0xffffff;
const FLASH_INTENSITY = 3.0;

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
};

type WallData = {
  mesh: THREE.Mesh;
  hp: number;
  maxHp: number;
  type: number;         // 1 = brick, 2 = steel, 9 = base
  flashUntil: number;
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
        wallData[r][c] = {
          mesh,
          hp,
          maxHp: hp,
          type: cell,
          flashUntil: 0,
        };
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

    // ===== BULLET POOL =====
    const bulletGeo = new THREE.SphereGeometry(BULLET_RADIUS, 8, 6);
    const bulletMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.0,
      roughness: 0.3,
    });

    const bullets: Bullet[] = [];
    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(bulletGeo, bulletMat);
      mesh.visible = false;
      mesh.castShadow = false;
      worldGroup.add(mesh);
      bullets.push({ mesh, dx: 0, dz: 0, life: 0, alive: false });
    }

    let lastFireTime = -999;

    // ===== INPUT =====
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) {
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

    // ===== FIRE =====
    function fireBullet(elapsed: number) {
      if (elapsed - lastFireTime < FIRE_COOLDOWN) return;
      lastFireTime = elapsed;

      const angle = tankPivot.rotation.y;
      const fx = Math.sin(angle);
      const fz = Math.cos(angle);

      const b = bullets.find((x) => !x.alive);
      if (!b) return;

      const spawnDist = 0.55;
      b.mesh.position.set(
        tankPivot.position.x + fx * spawnDist,
        0.4,
        tankPivot.position.z + fz * spawnDist
      );
      b.mesh.visible = true;

      b.dx = fx;
      b.dz = fz;
      b.life = BULLET_LIFETIME;
      b.alive = true;
    }

    // ===== WALL DAMAGE =====
    function damageWall(r: number, c: number, now: number) {
      const w = wallData[r][c];
      if (!w) return;

      // Steel và base không phá được
      if (w.type !== 1) return;

      w.hp -= 1;

      // Flash
      const mat = w.mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(FLASH_EMISSIVE);
      mat.emissiveIntensity = FLASH_INTENSITY;
      w.flashUntil = now + FLASH_DURATION;

      // Hết HP → phá
      if (w.hp <= 0) {
        worldGroup.remove(w.mesh);
        (w.mesh.material as THREE.Material).dispose();
        wallData[r][c] = null;
        walls[r][c] = false;
      }
    }

    // ===== UPDATE WALL FLASHES =====
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

    // ===== UPDATE BULLETS =====
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

        // Out of bounds
        if (gc < 0 || gc >= MAP_SIZE || gr < 0 || gr >= MAP_SIZE) {
          b.alive = false;
          b.mesh.visible = false;
          continue;
        }

        // Hit wall
        if (walls[gr][gc]) {
          damageWall(gr, gc, now);
          b.alive = false;
          b.mesh.visible = false;
          continue;
        }

        b.mesh.position.x = nx;
        b.mesh.position.z = nz;
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

      // ===== MOVE =====
      let dx = 0;
      let dz = 0;
      if (keys['w'] || keys['arrowup']) dz -= 1;
      if (keys['s'] || keys['arrowdown']) dz += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      if (dx !== 0 || dz !== 0) {
        if (Math.abs(dx) > Math.abs(dz)) {
          dz = 0;
          dx = Math.sign(dx);
        } else {
          dx = 0;
          dz = Math.sign(dz);
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

      // ===== ROTATE =====
      let diff = targetAngle - tankPivot.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      tankPivot.rotation.y += diff * Math.min(1, dt * 10);

      // ===== FIRE =====
      if (keys[' ']) fireBullet(now);

      // ===== UPDATE =====
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
        bulletMat.dispose();
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