// games/shader-playground.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ShaderParams = {
  toonLevels: number;
  glowIntensity: number;
  outlineWidth: number;
  windStrength: number;
  hue: number;
};

export type ShaderHandle = {
  setParam: <K extends keyof ShaderParams>(key: K, value: ShaderParams[K]) => void;
  destroy: () => void;
};

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
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
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  vec3 hueShift(vec3 color, float hue) {
    const vec3 k = vec3(0.57735);
    float c = cos(hue);
    return vec3(
      color * c + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - c)
    );
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vec3(0.6, 0.9, 0.4));
    vec3 V = normalize(cameraPosition - vWorldPos);

    float diff = max(dot(N, L), 0.0);
    diff = floor(diff * uToonLevels) / uToonLevels;

    vec3 base = hueShift(vec3(0.0, 0.85, 1.0), uHue);
    vec3 color = base * (0.2 + 0.8 * diff);

    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
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

export function initShaderPlayground(
  container: HTMLElement,
  initial: ShaderParams
): ShaderHandle {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x08080f, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0.5, 5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 8;

  const geo = new THREE.TorusKnotGeometry(1.1, 0.35, 200, 32);

  const uniforms = {
    uTime: { value: 0 },
    uWind: { value: initial.windStrength },
    uToonLevels: { value: initial.toonLevels },
    uGlow: { value: initial.glowIntensity },
    uHue: { value: (initial.hue * Math.PI) / 180 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
  });

  const mesh = new THREE.Mesh(geo, material);
  scene.add(mesh);

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
  scene.add(outline);

  let raf = 0;
  const clock = new THREE.Clock();
  const animate = () => {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    mesh.rotation.y = t * 0.15;
    outline.rotation.y = mesh.rotation.y;
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
      }
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      geo.dispose();
      material.dispose();
      outlineMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}