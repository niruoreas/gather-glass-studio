# Gather Glass Studio

A concept e-commerce site for a fictional glassblowing studio. Built as a portfolio piece.

## What makes it different

- **The headline refracts through real glass.** The hero is a live WebGL scene. The headline is set on a plane behind a glass vessel rendered with physically based transmission (IOR 1.52, attenuation tint). As the vessel turns and follows your cursor, the type bends through it. The vessel also morphs between the shapes in the shop.
- **Product photos are made by code, not shot on camera.** Every vessel is generated procedurally from a lathe profile. The same glass material renders each one in front of its own name, then the frames are saved as images for the shop grid.
- **Shape your own vase.** Sliders control height, belly, neck and lip. Capacity is calculated from the inner wall profile, the price updates live, and the finished vessel goes into the cart with its own rendered thumbnail.
- **Process timeline.** Five glassblowing stages, from 1,150 °C to room temperature, laid over a color-coded heat scale.

## Stack

Vite, Three.js (MeshPhysicalMaterial transmission, LatheGeometry, PMREM environment) and Lenis smooth scroll. Written in vanilla JS with no framework.

Accessibility: keyboard focus styles, a focus-managed cart dialog, `prefers-reduced-motion` support, and a no-WebGL fallback.

## Run it

```bash
npm install
npm run dev
```

The studio, makers and products are fictional. Checkout is turned off, and no orders are placed.
