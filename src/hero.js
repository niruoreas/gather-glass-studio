import * as THREE from 'three';
import {
  makeRenderer, studioEnvironment, glassMaterial, vesselGeometry, lerpParams, setTint, TINTS, prefersReducedMotion,
} from './glass.js';
import { PRODUCTS } from './products.js';

const COBALT = '#1F35C4';
const ICE = '#E8EEF1';

function drawHeadline(canvas, aspect) {
  const W = 2048;
  const H = Math.round(W / aspect);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COBALT;
  ctx.fillRect(0, 0, W, H);

  const lines = aspect > 1.15 ? ['Shaped by breath,', 'finished by hand.'] : ['Shaped', 'by breath,', 'finished', 'by hand.'];
  ctx.fillStyle = ICE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';


  // fit the longest line to ~94% of the width
  let size = 400;
  const font = (s) => `500 ${s}px "Bodoni Moda", Didot, serif`;
  ctx.font = font(size);
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  size = Math.floor(size * Math.min((W * 0.84) / widest, (H * 0.86) / (lines.length * 400 * 0.92)));
  ctx.font = font(size);
  const lh = size * 1.0;
  const total = lh * lines.length;
  let y = (H - total) / 2 + size * 0.8;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += lh;
  }
}

export function initHero(canvas) {
  const reduce = prefersReducedMotion();
  const renderer = makeRenderer(canvas);
  renderer.setClearColor(COBALT);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COBALT);
  scene.environment = studioEnvironment(renderer);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 6);

  // headline plane behind the glass: this is what refracts
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ toneMapped: false })
  );
  plane.position.z = -3;
  scene.add(plane);

  const shapes = PRODUCTS.filter((p) => p.shape.h > 1.4);
  let idx = 0;
  let from = shapes[0].shape;
  let to = shapes[0].shape;
  let morphT = 1;
  let current = { ...from };

  const mat = glassMaterial(shapes[0].tint);
  const fromAtt = new THREE.Color(TINTS[shapes[0].tint].attenuation);
  const toAtt = fromAtt.clone();
  let fromDist = TINTS[shapes[0].tint].dist;
  let toDist = fromDist;

  const vessel = new THREE.Mesh(vesselGeometry(current), mat);
  const pivot = new THREE.Group();
  pivot.add(vessel);
  scene.add(pivot);

  let vesselScale = 1;
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const dist = camera.position.z - plane.position.z;
    const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    plane.scale.set(vh * camera.aspect * 1.06, vh * 1.06, 1);
    // a texture can't change size after upload, so rebuild it
    const fresh = document.createElement('canvas');
    drawHeadline(fresh, camera.aspect);
    const tex = new THREE.CanvasTexture(fresh);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    plane.material.map?.dispose();
    plane.material.map = tex;
    plane.material.needsUpdate = true;
    vesselScale = camera.aspect < 0.6 ? 0.6 : camera.aspect < 0.8 ? 0.72 : camera.aspect < 1.2 ? 0.85 : 1;
    pivot.scale.setScalar(vesselScale);
    render();
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollProgress = 0;
  window.addEventListener('scroll', () => {
    scrollProgress = Math.min(window.scrollY / window.innerHeight, 1);
  }, { passive: true });

  function nextShape() {
    idx = (idx + 1) % shapes.length;
    from = { ...current };
    to = shapes[idx].shape;
    fromAtt.copy(mat.attenuationColor);
    toAtt.set(TINTS[shapes[idx].tint].attenuation);
    fromDist = mat.attenuationDistance;
    toDist = TINTS[shapes[idx].tint].dist;
    morphT = 0;
    onShape?.(shapes[idx]);
  }

  let onShape = null;
  let visible = true;
  let last = performance.now();
  let hold = 0;
  let spin = 0;

  function render() {
    renderer.render(scene, camera);
  }

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (visible) {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      if (!reduce) {
        spin += dt * 0.35;
        if (morphT >= 1) {
          hold += dt;
          if (hold > 3.4) { hold = 0; nextShape(); }
        } else {
          morphT = Math.min(morphT + dt / 1.4, 1);
          const e = morphT < 0.5 ? 4 * morphT ** 3 : 1 - (-2 * morphT + 2) ** 3 / 2;
          current = lerpParams(from, to, e);
          vessel.geometry.dispose();
          vessel.geometry = vesselGeometry(current, 80);
          mat.attenuationColor.copy(fromAtt).lerp(toAtt, e);
          mat.attenuationDistance = THREE.MathUtils.lerp(fromDist, toDist, e);
        }
      }

      pivot.rotation.y = spin + pointer.x * 0.6;
      pivot.rotation.x = pointer.y * 0.18 + scrollProgress * 0.5;
      pivot.rotation.z = -pointer.x * 0.08;
      pivot.position.x = pointer.x * 0.35;
      pivot.position.y = -scrollProgress * 1.4;
      pivot.scale.setScalar(vesselScale * (1 + scrollProgress * 0.35));
      render();
    }
    requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);

  const ready = document.fonts ? document.fonts.load('500 100px "Bodoni Moda"') : Promise.resolve();
  ready.finally(() => {
    resize();
    requestAnimationFrame(tick);
  });

  return {
    onShapeChange(fn) { onShape = fn; fn(shapes[idx]); },
  };
}

export { setTint };
