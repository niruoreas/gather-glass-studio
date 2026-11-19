import * as THREE from 'three';
import {
  makeRenderer, studioEnvironment, glassMaterial, vesselGeometry, lerpParams, setTint, TINTS, prefersReducedMotion,
} from './glass.js';
import { PRODUCTS } from './products.js';

const SKY = '#8ED1FC';
const INK = '#0B2540';

/**
 * Headline sits on the left (top on phones) so it stays readable;
 * the glass stands beside it and only bends the edge of the type.
 */
function drawHeadline(canvas, aspect) {
  const W = 2048;
  const H = Math.round(W / aspect);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, W, H);

  const wide = aspect > 1.1;
  const lines = ['Shaped by', 'breath,', 'finished', 'by hand.'];
  // a hot-pink sun behind the glass, so the refraction has colour to bend
  const cx = wide ? W * 0.74 : W * 0.7;
  const cy = wide ? H * 0.44 : H * 0.6;
  const r = wide ? H * 0.2 : W * 0.24;
  ctx.fillStyle = '#FF3D9A';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = W * 0.004;
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, r + i * W * 0.022, 0, Math.PI * 2); ctx.stroke(); }

  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const font = (s) => `800 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`;

  let size = 400;
  ctx.font = font(size);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${-size * 0.02}px`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const maxW = W * (wide ? 0.5 : 0.84);
  const maxH = H * (wide ? 0.62 : 0.4);
  size = Math.floor(size * Math.min(maxW / widest, maxH / (lines.length * 400 * 0.98)));
  ctx.font = font(size);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${-size * 0.02}px`;

  const lh = size * 0.98;
  const x = W * 0.075;
  let y = wide ? (H - lh * lines.length) / 2 - H * 0.04 + size * 0.82 : H * 0.13 + size * 0.82;
  for (const l of lines) {
    ctx.fillText(l, x, y);
    y += lh;
  }
}

export function initHero(canvas) {
  const reduce = prefersReducedMotion();
  const renderer = makeRenderer(canvas);
  renderer.setClearColor(SKY);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
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
  const clarity = 3; // hero glass is thinner-looking than the shop renders
  mat.attenuationDistance *= clarity;
  const fromAtt = new THREE.Color(TINTS[shapes[0].tint].attenuation);
  const toAtt = fromAtt.clone();
  let fromDist = TINTS[shapes[0].tint].dist * clarity;
  let toDist = fromDist;

  const vessel = new THREE.Mesh(vesselGeometry(current), mat);
  const pivot = new THREE.Group();
  pivot.add(vessel);
  scene.add(pivot);

  let vesselScale = 1;
  const base = { x: 0, y: 0 };
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
    const vh0 = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const vw0 = vh0 * camera.aspect;
    if (camera.aspect > 1.1) {
      vesselScale = 0.95;
      base.x = vw0 * 0.24; base.y = -vh0 * 0.02;
    } else {
      vesselScale = camera.aspect < 0.6 ? 0.5 : 0.62;
      base.x = vw0 * 0.2; base.y = -vh0 * 0.1;
    }
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
    toDist = TINTS[shapes[idx].tint].dist * clarity;
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
      pivot.position.x = base.x + pointer.x * 0.25;
      pivot.position.y = base.y - scrollProgress * 1.4;
      pivot.scale.setScalar(vesselScale * (1 + scrollProgress * 0.35));
      render();
    }
    requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);

  const ready = document.fonts ? document.fonts.load('800 100px "Plus Jakarta Sans"') : Promise.resolve();
  ready.finally(() => {
    resize();
    requestAnimationFrame(tick);
  });

  return {
    onShapeChange(fn) { onShape = fn; fn(shapes[idx]); },
  };
}

export { setTint };
