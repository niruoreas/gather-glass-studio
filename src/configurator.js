import * as THREE from 'three';
import {
  makeRenderer, studioEnvironment, glassMaterial, vesselGeometry, setTint, capacityMl, CM_PER_UNIT, TINTS, prefersReducedMotion,
} from './glass.js';

const ICE = '#E8EEF1';

export const DEFAULT_CUSTOM = { h: 2.2, base: 0.4, belly: 0.7, bellyPos: 0.34, neck: 0.22, lip: 0.34 };

export function priceFor(p) {
  const cm = p.h * CM_PER_UNIT;
  const ml = capacityMl(p);
  return Math.round((70 + cm * 2.6 + ml * 0.028) / 2) * 2;
}

export function initConfigurator(canvas, { onChange } = {}) {
  const reduce = prefersReducedMotion();
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ICE);
  scene.environment = studioEnvironment(renderer);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.2, 7.6);
  camera.lookAt(0, 0, 0);

  // backdrop: a measuring grid so the size reads as size
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = gridCanvas.height = 1024;
  const g = gridCanvas.getContext('2d');
  g.fillStyle = ICE;
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(31,53,196,0.16)';
  g.lineWidth = 2;
  for (let i = 0; i <= 1024; i += 64) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke();
  }
  const gridTex = new THREE.CanvasTexture(gridCanvas);
  gridTex.colorSpace = THREE.SRGBColorSpace;
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  // 64px cell = 5 cm. Backdrop is 10 units tall at z=-2.5
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: gridTex, toneMapped: false }));
  // cells read as 5 cm at the vessel's depth, not the backdrop's
  const depthScale = (camera.position.z + 2.5) / camera.position.z;
  const cellWorld = (5 / CM_PER_UNIT) * depthScale;
  gridTex.repeat.set(14 / (16 * cellWorld), 14 / (16 * cellWorld));
  back.position.z = -2.5;
  scene.add(back);

  const state = { shape: { ...DEFAULT_CUSTOM }, tint: 'seafoam' };
  const mat = glassMaterial(state.tint);
  const mesh = new THREE.Mesh(vesselGeometry(state.shape), mat);
  scene.add(mesh);

  let dirty = true;
  function rebuild() {
    mesh.geometry.dispose();
    mesh.geometry = vesselGeometry(state.shape);
    mesh.position.y = 0;
    dirty = true;
    onChange?.({
      shape: { ...state.shape },
      tint: state.tint,
      heightCm: state.shape.h * CM_PER_UNIT,
      ml: capacityMl(state.shape),
      price: priceFor(state.shape),
    });
  }

  // drag to turn
  let rotY = 0.5, velocity = 0, dragging = false, lastX = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    velocity = dx * 0.01; rotY += velocity; dirty = true;
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { rotY -= 0.2; dirty = true; }
    if (e.key === 'ArrowRight') { rotY += 0.2; dirty = true; }
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.9 ? 36 : 30;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(canvas);

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);

  function tick() {
    if (visible) {
      if (!dragging) {
        velocity *= 0.94;
        rotY += velocity + (reduce ? 0 : 0.003);
        if (!reduce || Math.abs(velocity) > 0.0001) dirty = true;
      }
      if (dirty) {
        mesh.rotation.y = rotY;
        renderer.render(scene, camera);
        dirty = false;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  rebuild();

  return {
    set(key, value) { state.shape[key] = value; rebuild(); },
    setTint(key) { state.tint = key; setTint(mat, key); rebuild(); },
    get state() { return { shape: { ...state.shape }, tint: state.tint }; },
    tints: TINTS,
  };
}
