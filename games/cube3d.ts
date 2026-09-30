// games/cube3d.ts
import * as THREE from 'three';

export function initCube3D(container: HTMLElement): () => void {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0b16);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 0, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const geo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff, emissive: 0x004455, metalness: 0.5, roughness: 0.2,
  });
  const cube = new THREE.Mesh(geo, mat);
  scene.add(cube);

  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(
    edges, new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  cube.add(line);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const l1 = new THREE.PointLight(0xff2e88, 2, 10); l1.position.set(3, 3, 3);
  const l2 = new THREE.PointLight(0x8b5cf6, 2, 10); l2.position.set(-3, -3, 3);
  scene.add(l1, l2);

  let mx = 0, my = 0;
  const onMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  container.addEventListener('pointermove', onMove);

  const onResize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  let raf = 0;
  const clock = new THREE.Clock();
  const animate = () => {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    cube.rotation.x = t * 0.5 + my * 0.5;
    cube.rotation.y = t * 0.7 + mx * 0.5;
    renderer.render(scene, camera);
  };
  animate();

  return () => {
    cancelAnimationFrame(raf);
    container.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    geo.dispose();
    mat.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}