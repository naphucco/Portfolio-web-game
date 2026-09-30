// games/boids.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ⭐⭐⭐ CHỈNH UV Ở ĐÂY — save file (Ctrl+S) là thấy kết quả ngay ⭐⭐⭐
const UV_TWEAK = {
    scaleX: 1.0,       // 0.25 = thu nhỏ 4×, 1 = giữ nguyên, 2 = phóng to 2×
    scaleY: 1.0,
    offsetX: 0.0,      // dịch ngang (-1 → 1)
    offsetY: 10.0,      // dịch dọc (-1 → 1)
    flipX: false,      // đảo ngang
    flipY: false,      // đảo dọc
};

export type BoidParams = {
    count: number;
    speed: number;
    swirl: number;
    size: number;
};

export type BoidHandle = {
    setParam: <K extends keyof BoidParams>(key: K, value: BoidParams[K]) => void;
    getFps: () => number;
    destroy: () => void;
};

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const VERT = /* glsl */ `
${NOISE}

uniform float uTime;
uniform float uSpeed;
uniform float uSwirl;
uniform float uSize;

attribute vec3 aOffset;
attribute float aScale;
attribute float aPhase;

varying vec2 vUv;
varying vec3 vColor;
varying float vSpeed;

vec3 vectorNoise(vec3 p) {
  return vec3(
    snoise(p + vec3(100.0, 0.0, 0.0)),
    snoise(p + vec3(0.0, 100.0, 0.0)),
    snoise(p + vec3(0.0, 0.0, 100.0))
  );
}

vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);

  // Chỉ dùng 2 trục → 4 vectorNoise calls (12 snoise)
  vec3 f1 = vectorNoise(p + dy);
  vec3 f2 = vectorNoise(p - dy);
  vec3 f3 = vectorNoise(p + dx);
  vec3 f4 = vectorNoise(p - dx);

  float cx = (f1.z - f2.z) / (2.0 * e);
  float cy = 0.0;
  float cz = (f3.y - f4.y) / (2.0 * e);

  return vec3(cx, cy, cz);
}

void main() {
  vUv = uv;

  vec3 home = aOffset;
  vec3 noisePos = home * 0.45 + vec3(0.0, uTime * uSpeed * 0.15, 0.0);
  noisePos += vec3(aPhase * 0.3);

  vec3 flow = curlNoise(noisePos) * uSwirl;
  vec3 instanceCenter = home + flow;

  vec3 localPos = position * uSize * aScale;
  localPos.xy += vec2(sin(uTime * 3.0 + aPhase), cos(uTime * 2.3 + aPhase)) * 0.02;

  vec3 worldPos = instanceCenter + localPos;

  float mag = length(flow);
  vSpeed = mag;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uTexture;
uniform float uHasTexture;

varying vec2 vUv;
varying vec3 vColor;
varying float vSpeed;

void main() {
  vec4 tex = texture2D(uTexture, vUv);

  vec3 finalColor = mix(
    vec3(0.0, 0.9, 1.0),
    tex.rgb,
    uHasTexture
  );

  float alpha = mix(1.0, tex.a, uHasTexture);
  if (alpha < 0.5) discard;

  gl_FragColor = vec4(finalColor, alpha);
}
`;

async function loadBoidAsset(url: string): Promise<{
    geometry: THREE.BufferGeometry;
    texture: THREE.Texture | null;
}> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);

    // Tìm mesh lớn nhất
    let sourceMesh: THREE.Mesh | null = null;
    let maxVol = 0;

    gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.geometry.computeBoundingBox();
            const bb = m.geometry.boundingBox;
            if (!bb) return;
            const s = bb.getSize(new THREE.Vector3());
            const vol = s.x * s.y * s.z;
            if (vol > maxVol) {
                maxVol = vol;
                sourceMesh = m;
            }
        }
    });

    if (!sourceMesh) throw new Error('GLB has no mesh');

    const mesh = sourceMesh as THREE.Mesh;
    const geo = mesh.geometry.clone();
    geo.computeVertexNormals();
    geo.computeBoundingBox();

    // ===== AUTO SCALE + CENTER =====
    const bb = geo.boundingBox!;
    const center = bb.getCenter(new THREE.Vector3());
    const size = bb.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    geo.translate(-center.x, -center.y, -center.z);
    geo.scale(1 / maxDim, 1 / maxDim, 1 / maxDim);
    geo.rotateX(-Math.PI / 2);

    // Đổi orientation nếu plane bay sai hướng
    // geo.rotateY(Math.PI);
    // geo.rotateX(-Math.PI / 2);

    // ===== UV TWEAK — chỉnh trực tiếp lên geometry =====
    let uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute | undefined;

    if (!uvAttr) {
        const count = geo.getAttribute('position').count;
        const fakeUV = new Float32Array(count * 2);
        geo.setAttribute('uv', new THREE.BufferAttribute(fakeUV, 2));
        uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute;
        console.warn('[UV] No UV found — created placeholder');
    }

    // Log UV range gốc
    let minU = Infinity, maxU = -Infinity;
    let minV = Infinity, maxV = -Infinity;
    for (let i = 0; i < uvAttr.count; i++) {
        const u = uvAttr.getX(i);
        const v = uvAttr.getY(i);
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
    }
    console.log('[UV raw range]', { minU, maxU, minV, maxV });

    // Apply UV_TWEAK
    for (let i = 0; i < uvAttr.count; i++) {
        let u = uvAttr.getX(i);
        let v = uvAttr.getY(i);

        if (UV_TWEAK.flipX) u = 1 - u;
        if (UV_TWEAK.flipY) v = 1 - v;

        u = u * UV_TWEAK.scaleX + UV_TWEAK.offsetX;
        v = v * UV_TWEAK.scaleY + UV_TWEAK.offsetY;

        uvAttr.setXY(i, u, v);
    }
    uvAttr.needsUpdate = true;

    // ===== LẤY TEXTURE TỪ MATERIAL =====
    let texture: THREE.Texture | null = null;
    const origMat = mesh.material;
    const mats = Array.isArray(origMat) ? origMat : [origMat];

    for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        if (std.map) {
            texture = std.map;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            break;
        }
    }

    if (!geo.getAttribute('normal')) geo.computeVertexNormals();

    return { geometry: geo, texture };
}

function buildInstances(count: number): {
    offsets: Float32Array;
    scales: Float32Array;
    phases: Float32Array;
} {
    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = 2.5 + Math.random() * 1.5;

        offsets[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        offsets[i * 3 + 1] = r * Math.cos(phi);
        offsets[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        scales[i] = 0.6 + Math.random() * 0.8;
        phases[i] = Math.random() * Math.PI * 2;
    }

    return { offsets, scales, phases };
}

export async function initBoidSwarm(
    container: HTMLElement,
    initial: BoidParams
): Promise<BoidHandle> {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
    });
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x08080f, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    if (!isMobile) {
        scene.fog = new THREE.FogExp2(0x08080f, 0.055);
    }

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 9);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.autoRotate = !isMobile;
    controls.autoRotateSpeed = 0.4;

    const { geometry: baseGeo, texture } = await loadBoidAsset('/models/fish.glb');

    const uniforms = {
        uTime: { value: 0 },
        uSpeed: { value: initial.speed },
        uSwirl: { value: initial.swirl },
        uSize: { value: initial.size },
        uTexture: { value: texture ?? new THREE.Texture() },
        uHasTexture: { value: texture ? 1 : 0 },
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: false,
        depthWrite: true,
        depthTest: true,
        blending: THREE.NormalBlending,
        side: THREE.FrontSide,
    });

    let mesh: THREE.Mesh | null = null;
    let instGeo: THREE.InstancedBufferGeometry | null = null;

    const buildMesh = (count: number) => {
        if (mesh) {
            scene.remove(mesh);
            instGeo?.dispose();
        }

        const inst = new THREE.InstancedBufferGeometry();

        const posAttr = baseGeo.getAttribute('position') as THREE.BufferAttribute;
        const nrmAttr = baseGeo.getAttribute('normal') as THREE.BufferAttribute;
        const uvAttr = baseGeo.getAttribute('uv') as THREE.BufferAttribute;

        inst.setAttribute('position', posAttr);
        inst.setAttribute('normal', nrmAttr);
        if (uvAttr) inst.setAttribute('uv', uvAttr);
        if (baseGeo.index) inst.setIndex(baseGeo.index);

        const { offsets, scales, phases } = buildInstances(count);
        inst.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
        inst.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
        inst.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

        inst.instanceCount = count;

        const m = new THREE.Mesh(inst, material);
        m.frustumCulled = false;
        scene.add(m);

        mesh = m;
        instGeo = inst;
    };

    buildMesh(initial.count);

    let frames = 0;
    let lastFpsTime = performance.now();
    let fps = 60;

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        uniforms.uTime.value = t;
        controls.update();
        renderer.render(scene, camera);

        frames++;
        const now = performance.now();
        if (now - lastFpsTime >= 500) {
            fps = (frames * 1000) / (now - lastFpsTime);
            frames = 0;
            lastFpsTime = now;
        }
    };
    animate();

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
    window.addEventListener('orientationchange', onResize);
    setTimeout(onResize, 50);
    setTimeout(onResize, 300);

    return {
        setParam: (key, value) => {
            switch (key) {
                case 'count':
                    buildMesh(value as number);
                    break;
                case 'speed':
                    uniforms.uSpeed.value = value as number;
                    break;
                case 'swirl':
                    uniforms.uSwirl.value = value as number;
                    break;
                case 'size':
                    uniforms.uSize.value = value as number;
                    break;
            }
        },
        getFps: () => fps,
        destroy: () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
            controls.dispose();
            baseGeo.dispose();
            instGeo?.dispose();
            texture?.dispose();
            material.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        },
    };
}