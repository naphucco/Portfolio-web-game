// games/shader-playground.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export type ShaderMode = 'model' | 'procedural';

export type ShaderParams = {
    toonLevels: number;
    glowIntensity: number;
    outlineWidth: number;
    windStrength: number;
    hue: number;
    softness: number;
};

export type ShaderHandle = {
    setParam: <K extends keyof ShaderParams>(key: K, value: ShaderParams[K]) => void;
    setUseTexture: (on: boolean) => void;
    destroy: () => void;
};

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float y = (position.y + 1.0) * 0.5;
    float sway = sin(uTime * 1.6 + position.y * 3.0 + position.x * 1.8) * uWind * 0.35;
    pos.x += sway * y;
    pos.z += sway * y * 0.5;

    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const FRAG = /* glsl */ `
  uniform float uToonLevels;
  uniform float uGlow;
  uniform float uHue;
  uniform float uSoftness;
  uniform sampler2D uTexture;
  uniform float uUseTexture;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  vec3 hueShift(vec3 color, float hue) {
    const vec3 k = vec3(0.57735);
    float c = cos(hue);
    return vec3(
      color * c + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - c)
    );
  }

  float toonStep(float x, float levels, float softness) {
    float v = x * levels;
    float f = floor(v);
    float frac = v - f;
    float s = smoothstep(0.0, 1.0, frac);
    float toon = (f + s) / levels;
    return mix(toon, x, softness);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L1 = normalize(vec3(0.6, 0.9, 0.4));
    vec3 L2 = normalize(vec3(-0.7, 0.2, -0.5));
    vec3 V = normalize(cameraPosition - vWorldPos);

    float rawDiff = abs(dot(N, L1)) * 0.7 + abs(dot(N, L2)) * 0.3;
    float diff = toonStep(rawDiff, uToonLevels, uSoftness);

    vec3 texColor = texture2D(uTexture, vUv).rgb;
    vec3 neonBase = hueShift(vec3(0.0, 0.85, 1.0), uHue);
    vec3 base = mix(neonBase, texColor, uUseTexture);

    vec3 color = base * (0.45 + 0.55 * diff);

    float rim = pow(1.0 - abs(dot(N, V)), 3.0);
    color += rim * uGlow * vec3(0.4, 1.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const OUTLINE_VERT = /* glsl */ `
  uniform float uWidth;
  void main() {
    vec3 pos = position + normal * uWidth;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const OUTLINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, 1.0); }
`;

function makeFallbackTexture(): THREE.Texture {
    const data = new Uint8Array([255, 255, 255, 255]);
    const t = new THREE.DataTexture(data, 1, 1);
    t.needsUpdate = true;
    return t;
}

export async function initShaderPlayground(
    container: HTMLElement,
    initial: ShaderParams,
    mode: ShaderMode = 'model',
    useTextureDefault = true
): Promise<ShaderHandle> {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x08080f, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;

    // ===== GEOMETRY =====
    let geo: THREE.BufferGeometry;
    let texture: THREE.Texture;
    const center = new THREE.Vector3();

    if (mode === 'model') {
        const fbxLoader = new FBXLoader();
        const fbx = await fbxLoader.loadAsync('/models/plane.fbx');

        let sourceMesh: THREE.Mesh | null = null;
        let maxVolume = 0;
        fbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.geometry.computeBoundingBox();
                const bb = m.geometry.boundingBox;
                if (!bb) return;
                const s = bb.getSize(new THREE.Vector3());
                const vol = s.x * s.y * s.z;
                if (vol > maxVolume) {
                    maxVolume = vol;
                    sourceMesh = m;
                }
            }
        });
        if (!sourceMesh) throw new Error('FBX has no mesh');

        geo = (sourceMesh as THREE.Mesh).geometry;
        geo.computeVertexNormals();
        geo.computeBoundingBox();

        const bb = geo.boundingBox!;
        bb.getCenter(center);

        try {
            const texLoader = new THREE.TextureLoader();
            texture = await texLoader.loadAsync('/textures/plane.png');
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.flipY = false;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
        } catch {
            texture = makeFallbackTexture();
        }
    } else {
        // Procedural: TorusKnot
        geo = new THREE.TorusKnotGeometry(1.1, 0.35, 200, 32);
        geo.computeVertexNormals();
        geo.computeBoundingBox();

        const bb = geo.boundingBox!;
        bb.getCenter(center);
        texture = makeFallbackTexture();
    }

    // ===== AUTO SCALE =====
    const bb = geo.boundingBox!;
    const size = bb.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2;
    const scale = targetSize / maxDim;

    const modelGroup = new THREE.Group();
    modelGroup.scale.setScalar(scale);
    scene.add(modelGroup);

    // ===== SHADER =====
    const uniforms = {
        uTime: { value: 0 },
        uWind: { value: initial.windStrength },
        uToonLevels: { value: initial.toonLevels },
        uGlow: { value: initial.glowIntensity },
        uHue: { value: (initial.hue * Math.PI) / 180 },
        uSoftness: { value: initial.softness },
        uTexture: { value: texture },
        uUseTexture: { value: mode === 'model' && useTextureDefault ? 1 : 0 },
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(-center.x, -center.y, -center.z);
    modelGroup.add(mesh);

    // ===== OUTLINE =====
    const outlineUniforms = {
        uWidth: { value: initial.outlineWidth },
        uColor: { value: new THREE.Color(0x00e5ff) },
    };
    const outlineMat = new THREE.ShaderMaterial({
        uniforms: outlineUniforms,
        vertexShader: OUTLINE_VERT,
        fragmentShader: OUTLINE_FRAG,
        side: THREE.BackSide,
    });
    const outline = new THREE.Mesh(geo, outlineMat);
    outline.position.copy(mesh.position);
    modelGroup.add(outline);

    // ===== CAMERA =====
    camera.position.set(0, 0.5, 4);
    controls.target.set(0, 0, 0);
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controls.update();

    // ===== LOOP =====
    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        uniforms.uTime.value = t;
        modelGroup.rotation.y = t * 0.3;
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return {
        setParam: (key, value) => {
            switch (key) {
                case 'toonLevels':
                    uniforms.uToonLevels.value = value as number;
                    break;
                case 'glowIntensity':
                    uniforms.uGlow.value = value as number;
                    break;
                case 'outlineWidth':
                    outlineUniforms.uWidth.value = value as number;
                    break;
                case 'windStrength':
                    uniforms.uWind.value = value as number;
                    break;
                case 'hue':
                    uniforms.uHue.value = ((value as number) * Math.PI) / 180;
                    break;
                case 'softness':
                    uniforms.uSoftness.value = value as number;
                    break;
            }
        },
        setUseTexture: (on: boolean) => {
            uniforms.uUseTexture.value = on ? 1 : 0;
        },
        destroy: () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            controls.dispose();
            geo.dispose();
            material.dispose();
            outlineMat.dispose();
            texture.dispose();
            renderer.dispose();

            // Kiểm tra parent trước khi remove
            const canvas = renderer.domElement;
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        },
    };
}