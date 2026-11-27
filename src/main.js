
import * as THREE from "three";

/* =========================================
   RISE TO LEGEND
   3D COURT — FIRST BUILD
   ========================================= */

"use strict";

/* ---------- DOM ---------- */

const container = document.getElementById("game-container");
const loadingScreen = document.getElementById("loading-screen");

if (!container) {
  throw new Error("Game container not found");
}

/* ---------- Renderer ---------- */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

/* ---------- Scene ---------- */

const scene = new THREE.Scene();

scene.background = new THREE.Color("#101820");
scene.fog = new THREE.Fog("#101820", 35, 95);

/* ---------- Camera ---------- */

const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  150
);

camera.position.set(25, 22, 29);
camera.lookAt(0, 0, 0);

/* ---------- Lighting ---------- */

const ambientLight = new THREE.HemisphereLight(
  "#dceeff",
  "#20202a",
  1.5
);

scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(
  "#fff0d8",
  3.2
);

mainLight.position.set(-10, 24, 12);
mainLight.castShadow = true;

mainLight.shadow.mapSize.set(1024, 1024);
mainLight.shadow.camera.left = -25;
mainLight.shadow.camera.right = 25;
mainLight.shadow.camera.top = 25;
mainLight.shadow.camera.bottom = -25;
mainLight.shadow.bias = -0.0004;

scene.add(mainLight);

/* Arena spotlights */

const spotlightPositions = [
  [-16, 18, -12],
  [16, 18, -12],
  [-16, 18, 12],
  [16, 18, 12]
];

for (const position of spotlightPositions) {
  const light = new THREE.SpotLight(
    "#fff4df",
    950,
    55,
    Math.PI / 5,
    0.45,
    1.5
  );

  light.position.set(...position);
  light.target.position.set(0, 0, 0);

  scene.add(light);
  scene.add(light.target);
}

/* ---------- Materials ---------- */

const darkMaterial = new THREE.MeshStandardMaterial({
  color: "#17232d",
  roughness: 0.85
});

const metalMaterial = new THREE.MeshStandardMaterial({
  color: "#64717c",
  metalness: 0.75,
  roughness: 0.3
});

const whiteMaterial = new THREE.MeshStandardMaterial({
  color: "#f2f2f2",
  roughness: 0.55
});

const orangeMaterial = new THREE.MeshStandardMaterial({
  color: "#ff7920",
  roughness: 0.65
});

/* ---------- Court Texture ---------- */

function createCourtTexture() {
  const canvas = document.createElement("canvas");

  canvas.width = 2048;
  canvas.height = 1024;

  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;

  /* Wooden floor */

  ctx.fillStyle = "#b97843";
  ctx.fillRect(0, 0, width, height);

  const plankHeight = 64;

  for (let row = 0; row < height / plankHeight; row++) {
    const shade = row % 2 === 0 ? "#c58a52" : "#b77a43";

    ctx.fillStyle = shade;
    ctx.fillRect(0, row * plankHeight, width, plankHeight);

    ctx.strokeStyle = "#7f4d2d";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, row * plankHeight);
    ctx.lineTo(width, row * plankHeight);
    ctx.stroke();

    const offset = row % 2 === 0 ? 0 : 180;

    for (let x = offset; x < width; x += 360) {
      ctx.strokeStyle = "#8f5c35";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x, row * plankHeight);
      ctx.lineTo(x, (row + 1) * plankHeight);
      ctx.stroke();
    }
  }

  /* Court markings */

  const scaleX = width / 28;
  const scaleZ = height / 15;

  function mapX(x) {
    return (x + 14) * scaleX;
  }

  function mapZ(z) {
    return (z + 7.5) * scaleZ;
  }

  function line(x1, z1, x2, z2) {
    ctx.beginPath();
    ctx.moveTo(mapX(x1), mapZ(z1));
    ctx.lineTo(mapX(x2), mapZ(z2));
    ctx.stroke();
  }

  function circle(x, z, radius) {
    ctx.beginPath();

    ctx.ellipse(
      mapX(x),
      mapZ(z),
      radius * scaleX,
      radius * scaleZ,
      0,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }

  ctx.strokeStyle = "#f9f1df";
  ctx.lineWidth = 9;

  /* Outer boundary */

  ctx.strokeRect(
    mapX(-14),
    mapZ(-7.5),
    28 * scaleX,
    15 * scaleZ
  );

  /* Center line and circle */

  line(0, -7.5, 0, 7.5);
  circle(0, 0, 1.8);

  /* Free throw areas */

  for (const side of [-1, 1]) {
    const hoopX = side * 12.5;

    ctx.strokeRect(
      mapX(side * 8.2),
      mapZ(-2.45),
      4.1 * scaleX,
      4.9 * scaleZ
    );

    circle(side * 10.5, 0, 1.8);

    /* Three-point arc */

    ctx.beginPath();

    ctx.ellipse(
      mapX(hoopX),
      mapZ(0),
      6.75 * scaleX,
      6.75 * scaleZ,
      0,
      side === 1 ? Math.PI / 2 : -Math.PI / 2,
      side === 1 ? Math.PI * 1.5 : Math.PI / 2,
      side === -1
    );

    ctx.stroke();

    /* Backboard target area */

    ctx.strokeRect(
      mapX(side * 13.15),
      mapZ(-0.6),
      0.12 * scaleX,
      1.2 * scaleZ
    );
  }

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  return texture;
}

/* ---------- Floor ---------- */

const floorTexture = createCourtTexture();

const courtMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,
  roughness: 0.72,
  metalness: 0.02
});

const court = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 15),
  courtMaterial
);

court.rotation.x = -Math.PI / 2;
court.receiveShadow = true;

scene.add(court);

/* ---------- Arena Ground ---------- */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  darkMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
ground.receiveShadow = true;

scene.add(ground);

/* ---------- Arena Walls ---------- */

function createBox(
  width,
  height,
  depth,
  material,
  x,
  y,
  z
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);

  return mesh;
}

/* Side walls */

createBox(48, 10, 1, darkMaterial, 0, 5, -21);
createBox(48, 10, 1, darkMaterial, 0, 5, 21);

createBox(1, 10, 42, darkMaterial, -23, 5, 0);
createBox(1, 10, 42, darkMaterial, 23, 5, 0);

/* Arena light strips */

const stripMaterial = new THREE.MeshStandardMaterial({
  color: "#ff8a24",
  emissive: "#ff6a12",
  emissiveIntensity: 2.2
});

createBox(35, 0.12, 0.18, stripMaterial, 0, 8.5, -20.4);
createBox(35, 0.12, 0.18, stripMaterial, 0, 8.5, 20.4);

/* ---------- Stadium Seating ---------- */

function createSeats() {
  const seatGeometry = new THREE.BoxGeometry(
    0.62,
    0.34,
    0.5
  );

  const seatMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.8
  });

  const seats = new THREE.InstancedMesh(
    seatGeometry,
    seatMaterial,
    900
  );

  const dummy = new THREE.Object3D();

  const palette = [
    new THREE.Color("#243746"),
    new THREE.Color("#334b5a"),
    new THREE.Color("#ff8a24"),
    new THREE.Color("#17232d")
  ];

  let index = 0;

  /* Long-side stands */

  for (const side of [-1, 1]) {
    for (let row = 0; row < 8; row++) {
      const z = side * (9 + row * 0.85);
      const y = 0.35 + row * 0.28;

      for (let x = -13; x <= 13; x += 0.85) {
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();

        seats.setMatrixAt(index, dummy.matrix);

        const color = palette[
          (index * 7 + row) % palette.length
        ];

        seats.setColorAt(index, color);

        index++;
      }
    }
  }

  /* Baseline stands */

  for (const side of [-1, 1]) {
    for (let row = 0; row < 8; row++) {
      const x = side * (16 + row * 0.85);
      const y = 0.35 + row * 0.28;

      for (let z = -7; z <= 7; z += 0.85) {
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();

        seats.setMatrixAt(index, dummy.matrix);

        const color = palette[
          (index * 5 + row) % palette.length
        ];

        seats.setColorAt(index, color);

        index++;
      }
    }
  }

  seats.count = index;
  seats.instanceMatrix.needsUpdate = true;

  if (seats.instanceColor) {
    seats.instanceColor.needsUpdate = true;
  }

  seats.castShadow = false;
  seats.receiveShadow = false;

  scene.add(seats);
}

createSeats();

/* ---------- Basketball Hoops ---------- */

function createHoop(side) {
  const x = side * 13.25;

  /* Support structure */

  createBox(
    0.25,
    3.6,
    0.25,
    metalMaterial,
    side * 14.4,
    1.8,
    0
  );

  createBox(
    1.5,
    0.18,
    0.18,
    metalMaterial,
    side * 13.8,
    3.3,
    0
  );

  /* Backboard */

  const board = createBox(
    0.12,
    1.05,
    1.8,
    whiteMaterial,
    side * 13.55,
    3.05,
    0
  );

  /* Transparent board look */

  board.material = new THREE.MeshStandardMaterial({
    color: "#dceaf0",
    transparent: true,
    opacity: 0.78,
    roughness: 0.2
  });

  /* Backboard target */

  createBox(
    0.025,
    0.45,
    0.65,
    orangeMaterial,
    side * 13.47,
    2.95,
    0
  );

  /* Rim */

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.025, 12, 40),
    orangeMaterial
  );

  rim.rotation.x = Math.PI / 2;
  rim.position.set(side * 12.95, 3.05, 0);

  rim.castShadow = true;

  scene.add(rim);

  /* Net rings */

  const netMaterial = new THREE.MeshStandardMaterial({
    color: "#eeeeee",
    roughness: 0.85
  });

  for (let i = 0; i < 5; i++) {
    const netRing = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.2 - i * 0.025,
        0.008,
        6,
        24
      ),
      netMaterial
    );

    netRing.rotation.x = Math.PI / 2;

    netRing.position.set(
      side * 12.95,
      2.98 - i * 0.11,
      0
    );

    scene.add(netRing);
  }
}

createHoop(-1);
createHoop(1);

/* ---------- Basketball ---------- */

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.24, 32, 24),
  orangeMaterial
);

ball.position.set(0, 0.24, 0);
ball.castShadow = true;

scene.add(ball);

/* Basketball seams */

const seamMaterial = new THREE.MeshStandardMaterial({
  color: "#241710",
  roughness: 0.8
});

const seam1 = new THREE.Mesh(
  new THREE.TorusGeometry(0.242, 0.009, 8, 48),
  seamMaterial
);

seam1.rotation.x = Math.PI / 2;
seam1.position.copy(ball.position);

scene.add(seam1);

const seam2 = new THREE.Mesh(
  new THREE.TorusGeometry(0.242, 0.009, 8, 48),
  seamMaterial
);

seam2.rotation.y = Math.PI / 2;
seam2.position.copy(ball.position);

scene.add(seam2);

/* ---------- Responsive Camera ---------- */

function resizeGame() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;

  if (width < height) {
    camera.fov = 58;
    camera.position.set(30, 27, 34);
  } else {
    camera.fov = 48;
    camera.position.set(25, 22, 29);
  }

  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
}

window.addEventListener("resize", resizeGame);

resizeGame();

/* ---------- Start ---------- */

function startGameScene() {
  if (loadingScreen) {
    loadingScreen.classList.add("hidden");

    setTimeout(() => {
      loadingScreen.remove();
    }, 700);
  }
}

startGameScene();

/* ---------- Render Loop ---------- */

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();
        
