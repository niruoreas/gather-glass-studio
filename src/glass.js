import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** 1 world unit = 12.5 cm */
export const CM_PER_UNIT = 12.5;

export const TINTS = {
  clear:    { name: 'Clear',    hex: '#ffffff', attenuation: '#f4fbff', dist: 6 },
  seafoam:  { name: 'Seafoam',  hex: '#ffffff', attenuation: '#5fc9b0', dist: 0.9 },
  amber:    { name: 'Amber',    hex: '#ffffff', attenuation: '#ff8a1f', dist: 0.7 },
  cobalt:   { name: 'Cobalt',   hex: '#ffffff', attenuation: '#2a46ff', dist: 0.55 },
  smoke:    { name: 'Smoke',    hex: '#ffffff', attenuation: '#5a5e66', dist: 0.8 },
  rose:     { name: 'Rose',     hex: '#ffffff', attenuation: '#ff7fa6', dist: 0.9 },
};

/**
 * Vessel shape parameters (world units):
 * h height, base foot radius, belly radius, bellyPos (0..1), neck radius, lip radius
 */
export function profilePoints(p, wall = 0.055) {
  const h = p.h;
  const ctrl = [
    new THREE.Vector2(p.base, 0.06),
    new THREE.Vector2(p.belly, h * p.bellyPos),
    new THREE.Vector2(THREE.MathUtils.lerp(p.belly, p.neck, 0.62), h * (p.bellyPos + (0.84 - p.bellyPos) * 0.55)),
    new THREE.Vector2(p.neck, h * 0.84),
    new THREE.Vector2(p.lip, h),
  ];
  const outer = new THREE.SplineCurve(ctrl).getPoints(70).map((v) => new THREE.Vector2(Math.max(v.x, 0.07), v.y));

  const pts = [new THREE.Vector2(0.0001, 0), new THREE.Vector2(p.base * 0.88, 0)];
  pts.push(...outer);
  const top = outer[outer.length - 1];
  pts.push(new THREE.Vector2(top.x - wall * 0.5, top.y + wall * 0.32));
  const inner = [];
  for (let i = outer.length - 1; i >= 0; i--) {
    const o = outer[i];
    if (o.y < wall * 2.2) break;
    inner.push(new THREE.Vector2(Math.max(o.x - wall, 0.035), o.y));
  }
  pts.push(...inner);
  const floorY = inner.length ? inner[inner.length - 1].y : wall * 2.2;
  pts.push(new THREE.Vector2(0.0001, floorY));
  return { pts, inner, floorY };
}

export function vesselGeometry(p, segments = 96) {
  const { pts } = profilePoints(p);
  const g = new THREE.LatheGeometry(pts, segments);
  g.translate(0, -p.h / 2, 0);
  return g;
}

/** Interior capacity in millilitres (cm³), integrated from the inner wall. */
export function capacityMl(p) {
  const { inner } = profilePoints(p);
  let v = 0;
  for (let i = 0; i < inner.length - 1; i++) {
    const a = inner[i], b = inner[i + 1];
    const r = ((a.x + b.x) / 2) * CM_PER_UNIT;
    const dy = Math.abs(a.y - b.y) * CM_PER_UNIT;
    v += Math.PI * r * r * dy;
  }
  return v;
}

export function glassMaterial(tintKey = 'clear') {
  const t = TINTS[tintKey];
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(t.hex),
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.35,
    ior: 1.52,
    attenuationColor: new THREE.Color(t.attenuation),
    attenuationDistance: t.dist,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
  });
}

export function setTint(mat, tintKey) {
  const t = TINTS[tintKey];
  mat.attenuationColor.set(t.attenuation);
  mat.attenuationDistance = t.dist;
}

export function makeRenderer(canvas, opts = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, ...opts });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  r.toneMapping = THREE.NeutralToneMapping;
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

export function studioEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();
  return env;
}

export function lerpParams(a, b, t) {
  const o = {};
  for (const k of Object.keys(a)) o[k] = THREE.MathUtils.lerp(a[k], b[k], t);
  return o;
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
