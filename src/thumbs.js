import * as THREE from 'three';
import { makeRenderer, studioEnvironment, glassMaterial, vesselGeometry } from './glass.js';

/**
 * Renders every product once with the real glass material in front of
 * its own name, then hands back PNG data URLs for plain <img> tags.
 */
export async function renderThumbs(products, { width = 720, height = 900 } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = makeRenderer(canvas, { preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50);

  const backCanvas = document.createElement('canvas');
  backCanvas.width = 1024;
  backCanvas.height = 1280;
  const backTex = new THREE.CanvasTexture(backCanvas);
  backTex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false }));
  scene.add(back);

  // a soft floor shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 256;
  const sctx = shadowCanvas.getContext('2d');
  const grd = sctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(14,26,74,0.32)');
  grd.addColorStop(1, 'rgba(14,26,74,0)');
  sctx.fillStyle = grd;
  sctx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false, toneMapped: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const out = {};
  for (const p of products) {
    // backdrop: product colour with its first word set huge, so the glass bends it
    const ctx = backCanvas.getContext('2d');
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, 1024, 1280);
    ctx.fillStyle = 'rgba(14,26,74,0.14)';
    ctx.textAlign = 'center';

    const word = p.name.split(' ')[0];
    let size = 600;
    ctx.font = `italic 500 ${size}px "Bodoni Moda", serif`;
    size = Math.floor(size * Math.min(1, 980 / ctx.measureText(word).width));
    ctx.font = `italic 500 ${size}px "Bodoni Moda", serif`;
    ctx.fillText(word, 512, 640 + size * 0.34);
    backTex.needsUpdate = true;

    const h = p.shape.h;
    const r = Math.max(p.shape.belly, p.shape.lip, p.shape.base);
    const span = Math.max(h * 1.45, r * 2 * 1.5 * (height / width));
    const dist = span / 2 / Math.tan(THREE.MathUtils.degToRad(15));
    camera.position.set(0, h * 0.08, dist);
    camera.lookAt(0, 0, 0);

    const backZ = -2.2;
    const vh = 2 * (dist - backZ) * Math.tan(THREE.MathUtils.degToRad(15));
    back.position.set(0, 0, backZ);
    back.scale.set(vh * camera.aspect * 1.05, vh * 1.05, 1);

    shadow.position.set(0, -h / 2 + 0.005, 0);
    shadow.scale.setScalar(r * 3.2);

    const mesh = new THREE.Mesh(vesselGeometry(p.shape), glassMaterial(p.tint));
    mesh.rotation.y = 0.6;
    scene.add(mesh);
    renderer.render(scene, camera);
    out[p.id] = canvas.toDataURL('image/webp', 0.9);
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    await new Promise((r) => requestAnimationFrame(r));
  }
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}

/** Renders one custom vessel for cart thumbnails. */
export async function renderSingle(product) {
  const res = await renderThumbs([product], { width: 240, height: 300 });
  return res[product.id];
}
