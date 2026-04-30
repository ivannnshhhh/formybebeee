// ═══════════════════════════════════════════
//   STATE
// ═══════════════════════════════════════════
let currentScene = 1;
let memDetailOpen = false;
let s4accepted = false;
let canAdvance = false;
let mouseX = 0;
let mouseY = 0;

const memories = [
  {
    title: "First chat",
    body: "It started simple. A few messages, maybe a laugh. But something felt different — like a door opening to a room I didn't know I'd been looking for."
  },
  {
    title: "First late-night call",
    body: "The world went quiet and it was just your voice and mine. I didn't want to hang up. I think that's when I knew."
  },
  {
    title: "First time I missed you",
    body: "I noticed your absence before I understood its weight. That's when I realized — you had become someone I actually needed in my days."
  }
];

// ═══════════════════════════════════════════
//   THREE.JS SETUP
// ═══════════════════════════════════════════
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x03020a, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(0, 0, 28);

// ── STARS ──
function makeStars(count, spread, size, color) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size, color, transparent: true, opacity: 0.7 });
  return new THREE.Points(geo, mat);
}
const stars1 = makeStars(2000, 350, 0.15, 0xffffff);
const stars2 = makeStars(800, 250, 0.08, 0xc0b8ff);
scene.add(stars1, stars2);

// ── SHOOTING STAR ──
const shootStarGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-3, 1.5, 0)
]);
const shootStarMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
const shootingStar = new THREE.Line(shootStarGeo, shootStarMat);
scene.add(shootingStar);

let shootActive = false;
function triggerShootingStar() {
  if (shootActive) return;
  shootActive = true;
  const startX = (Math.random() - 0.5) * 40;
  const startY = (Math.random() * 20);
  shootingStar.position.set(startX, startY, -10);
  shootStarMat.opacity = 0.8;
  
  const duration = 0.8;
  const start = performance.now();
  function move(now) {
    const elapsed = (now - start) / 1000;
    const t = elapsed / duration;
    shootingStar.position.x += 0.8;
    shootingStar.position.y -= 0.4;
    shootStarMat.opacity = 0.8 * (1 - t);
    if (t < 1) requestAnimationFrame(move);
    else { shootActive = false; shootStarMat.opacity = 0; }
  }
  requestAnimationFrame(move);
}
setInterval(() => { if (Math.random() > 0.7) triggerShootingStar(); }, 4000);

// ── SCENE 1: Heart ──
const heartGroup = new THREE.Group();
scene.add(heartGroup);

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);
  return new THREE.Vector2(x * 0.065, y * 0.065);
}
const heartShape = new THREE.Shape();
const pts = [];
for (let i = 0; i <= 100; i++) pts.push(heartPoint((i/100)*Math.PI*2));
heartShape.setFromPoints(pts);
const extSettings = { depth: 0.4, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4 };
const heartGeo = new THREE.ExtrudeGeometry(heartShape, extSettings);
const heartMat = new THREE.MeshStandardMaterial({
  color: 0xf472b6,
  emissive: 0xf472b6,
  emissiveIntensity: 0.35,
  roughness: 0.3,
  metalness: 0.2,
  transparent: true,
  opacity: 0.88,
});
const heartMesh = new THREE.Mesh(heartGeo, heartMat);
heartMesh.geometry.center();
heartGroup.add(heartMesh);

// Wireframe overlay
const wfMat = new THREE.MeshBasicMaterial({ color:0xf472b6, wireframe:true, transparent:true, opacity:0.08 });
const wfMesh = new THREE.Mesh(heartGeo, wfMat);
heartGroup.add(wfMesh);

// Heart glow particles
const hpGeo = new THREE.BufferGeometry();
const hpPos = [];
for (let i = 0; i < 300; i++) {
  const t = Math.random() * Math.PI * 2;
  const p = heartPoint(t);
  const r = 0.5 + Math.random() * 1.5;
  const θ = Math.random() * Math.PI * 2;
  hpPos.push(p.x + Math.cos(θ)*r*0.3, p.y + Math.sin(θ)*r*0.3, (Math.random()-0.5)*0.8);
}
hpGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hpPos), 3));
const hpMat = new THREE.PointsMaterial({ size:0.06, color:0xffc8e8, transparent:true, opacity:0.5 });
const heartParticles = new THREE.Points(hpGeo, hpMat);
heartGroup.add(heartParticles);

// Lights
const ambLight = new THREE.AmbientLight(0x1a1035, 3);
scene.add(ambLight);
const pLight1 = new THREE.PointLight(0xf472b6, 4, 30);
pLight1.position.set(5, 5, 10);
scene.add(pLight1);
const pLight2 = new THREE.PointLight(0x818cf8, 3, 30);
pLight2.position.set(-5, -3, 8);
scene.add(pLight2);

// ── SCENE 2: Memory Orbs ──
const orbGroup = new THREE.Group();
orbGroup.visible = false;
scene.add(orbGroup);

const orbColors = [0xf472b6, 0x818cf8, 0xfbbf24];
const orbMeshes = [];
orbColors.forEach((col, i) => {
  const angle = (i/3) * Math.PI * 2;
  const r = 6;
  const geo = new THREE.SphereGeometry(0.9, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: col, emissive: col, emissiveIntensity: 0.3,
    roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.55,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(Math.cos(angle)*r, Math.sin(angle)*2, Math.sin(angle)*r*0.5);
  orbGroup.add(m);
  orbMeshes.push(m);

  // Glow ring
  const rGeo = new THREE.TorusGeometry(1.1, 0.02, 8, 64);
  const rMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4 });
  const ring = new THREE.Mesh(rGeo, rMat);
  ring.rotation.x = Math.PI/2;
  m.add(ring);
});

// ── SCENE 3: Distance ──
const distGroup = new THREE.Group();
distGroup.visible = false;
scene.add(distGroup);

// Two glowing spheres
const bPos = new THREE.Vector3(-8, 0, 0);
const sPos = new THREE.Vector3(8, 0, 0);

function makeGlowSphere(color) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 32, 32),
    new THREE.MeshBasicMaterial({ color })
  );
  g.add(core);
  [0.6, 0.9, 1.3].forEach((r,i) => {
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshBasicMaterial({ color, transparent:true, opacity: 0.07 - i*0.02, side: THREE.BackSide })
    );
    g.add(halo);
  });
  return g;
}

const sphereB = makeGlowSphere(0x818cf8);
sphereB.position.copy(bPos);
const sphereS = makeGlowSphere(0xf472b6);
sphereS.position.copy(sPos);
distGroup.add(sphereB, sphereS);

// Connection line
const lineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent:true, opacity:0.4 });
const lineGeo = new THREE.BufferGeometry().setFromPoints([bPos, sPos]);
const connLine = new THREE.Line(lineGeo, lineMat);
distGroup.add(connLine);

// Line particles
const lpCount = 120;
const lpGeo = new THREE.BufferGeometry();
const lpPos = new Float32Array(lpCount * 3);
const lpProgress = new Float32Array(lpCount);
for (let i = 0; i < lpCount; i++) {
  lpProgress[i] = Math.random();
  const p = bPos.clone().lerp(sPos, lpProgress[i]);
  lpPos[i*3] = p.x; lpPos[i*3+1] = p.y + (Math.random()-0.5)*0.3; lpPos[i*3+2] = p.z + (Math.random()-0.5)*0.3;
}
lpGeo.setAttribute('position', new THREE.BufferAttribute(lpPos, 3));
const lpMat = new THREE.PointsMaterial({ size:0.1, color:0xfbbf24, transparent:true, opacity:0.65 });
const lineParticles = new THREE.Points(lpGeo, lpMat);
distGroup.add(lineParticles);

// ── SCENE 4: Convergence ──
const s4Group = new THREE.Group();
s4Group.visible = false;
scene.add(s4Group);

const convCount = 600;
const convGeo = new THREE.BufferGeometry();
const convPos = new Float32Array(convCount * 3);
const convTarget = new Float32Array(convCount * 3);
const convColors = new Float32Array(convCount * 3);

for (let i = 0; i < convCount; i++) {
  const fromBlue = Math.random() > 0.5;
  const start = fromBlue ? bPos.clone() : sPos.clone();
  start.x += (Math.random()-0.5)*4;
  start.y += (Math.random()-0.5)*4;
  start.z += (Math.random()-0.5)*4;
  convPos[i*3] = start.x; convPos[i*3+1] = start.y; convPos[i*3+2] = start.z;

  const angle = Math.random()*Math.PI*2;
  const r = Math.random()*2.5;
  convTarget[i*3] = Math.cos(angle)*r * 0.3;
  convTarget[i*3+1] = Math.sin(angle)*r * 0.3;
  convTarget[i*3+2] = (Math.random()-0.5)*1.5;

  const c = fromBlue ? new THREE.Color(0x818cf8) : new THREE.Color(0xf472b6);
  convColors[i*3] = c.r; convColors[i*3+1] = c.g; convColors[i*3+2] = c.b;
}
convGeo.setAttribute('position', new THREE.BufferAttribute(convPos, 3));
convGeo.setAttribute('color', new THREE.BufferAttribute(convColors, 3));
const convMat = new THREE.PointsMaterial({ size:0.12, vertexColors:true, transparent:true, opacity:0.75 });
const convParticles = new THREE.Points(convGeo, convMat);
s4Group.add(convParticles);

// Central glow for s4
const s4Core = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 32, 32),
  new THREE.MeshBasicMaterial({ color:0xffc8e8, transparent:true, opacity:0 })
);
s4Group.add(s4Core);

// ═══════════════════════════════════════════
//   SCENE STATE VARS
// ═══════════════════════════════════════════
let convProgress = 0;
let s4CoreOpacity = 0;
let s4running = false;

// ═══════════════════════════════════════════
//   TYPING ANIMATION
// ═══════════════════════════════════════════
function typeText(el, text, speed = 55) {
  return new Promise(resolve => {
    el.textContent = '';
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(t); setTimeout(resolve, 400); }
    }, speed);
  });
}

// ═══════════════════════════════════════════
//   SCENE TRANSITIONS
// ═══════════════════════════════════════════
async function showScene(n) {
  currentScene = n;
  updateNavDots();

  if (n === 1) {
    document.getElementById('scene1').classList.add('active');
    await typeText(document.getElementById('s1-text'), 'Hi Bebe… I made this for you.', 70);
    document.getElementById('s1-sub').classList.add('show');
    setTimeout(() => canAdvance = true, 600);
  }

  if (n === 2) {
    document.getElementById('scene1').classList.remove('active');
    heartGroup.visible = false;
    orbGroup.visible = true;
    document.getElementById('s2-memories').classList.add('active');

    setTimeout(() => {
      document.getElementById('s2-hint').classList.add('show');
      canAdvance = true;
    }, 1200);

    gsmoothCamera({ x:0, y:0, z:22 }, 1.2);
  }

  if (n === 3) {
    document.getElementById('s2-memories').classList.remove('active');
    document.getElementById('s2-hint').classList.remove('show');
    orbGroup.visible = false;
    distGroup.visible = true;
    document.getElementById('s3-overlay').classList.add('active');
    gsmoothCamera({ x:0, y:0, z:26 }, 1.2);

    setTimeout(() => { document.getElementById('s3-dist').classList.add('vis'); }, 1000);
    const lines = ['s3l0','s3l1','s3l2'];
    lines.forEach((id, i) => {
      setTimeout(() => document.getElementById(id).classList.add('vis'), 1200 + i*900);
    });
    setTimeout(() => { canAdvance = true; }, 4500);
  }

  if (n === 4) {
    document.getElementById('s3-overlay').classList.remove('active');
    distGroup.visible = false;
    s4Group.visible = true;
    s4running = true;
    document.getElementById('s4-overlay').classList.add('active');
    gsmoothCamera({ x:0, y:0, z:22 }, 1.2);

    setTimeout(() => document.getElementById('s4-question').classList.add('vis'), 800);
    setTimeout(() => document.querySelector('.s4-btn-group').classList.add('vis'), 1600);
  }
}

// ── Camera smooth motion ──
let camTarget = { x:0, y:0, z:28 };
function gsmoothCamera(to, duration) {
  const from = { x:camera.position.x, y:camera.position.y, z:camera.position.z };
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start)/(duration*1000), 1);
    const e = t < 0.5 ? 2*t*t : 1-(Math.pow(-2*t+2,2)/2);
    camera.position.x = from.x + (to.x - from.x)*e;
    camera.position.y = from.y + (to.y - from.y)*e;
    camera.position.z = from.z + (to.z - from.z)*e;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ═══════════════════════════════════════════
//   MEMORY DETAIL
// ═══════════════════════════════════════════
document.querySelectorAll('.memory-label').forEach((el, i) => {
  el.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('mem-detail-title').textContent = memories[i].title;
    document.getElementById('mem-detail-body').textContent = memories[i].body;
    document.getElementById('mem-detail').classList.add('show');
    memDetailOpen = true;
  });
});
document.getElementById('mem-close').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('mem-detail').classList.remove('show');
  memDetailOpen = false;
});
document.getElementById('mem-detail').addEventListener('click', e => {
  if (e.target === document.getElementById('mem-detail')) {
    document.getElementById('mem-detail').classList.remove('show');
    memDetailOpen = false;
  }
});

// ═══════════════════════════════════════════
//   NAV DOTS
// ═══════════════════════════════════════════
function updateNavDots() {
  document.querySelectorAll('.ndot').forEach((d,i) => {
    d.classList.toggle('active', i+1 === currentScene);
  });
  document.getElementById('nav-dots').classList.add('show');
}

// ═══════════════════════════════════════════
//   GLOBAL CLICK ADVANCE
// ═══════════════════════════════════════════
document.addEventListener('click', e => {
  if (memDetailOpen) return;
  if (e.target.classList.contains('memory-label') || e.target.closest('.memory-label')) return;
  if (e.target.id === 's4-btn') return;
  if (e.target.id === 's4-btn-no') return;
  if (!canAdvance) return;
  if (currentScene < 4) {
    canAdvance = false;
    showScene(currentScene + 1);
  }
});

// ── S4 "No" Logic ──
document.getElementById('s4-btn-no').addEventListener('click', e => {
  e.stopPropagation();
  const overlay = document.getElementById('s4-overlay');
  const question = document.getElementById('s4-question');
  const dialog = document.getElementById('s4-dialog');
  
  if (!overlay.classList.contains('state-sure-ka')) {
    overlay.classList.add('state-sure-ka');
    question.classList.remove('vis');
    dialog.classList.add('vis');
  } else {
    overlay.classList.remove('state-sure-ka');
    dialog.classList.remove('vis');
    question.classList.add('vis');
  }
});

// ── S4 Button ──
document.getElementById('s4-btn').addEventListener('click', e => {
  e.stopPropagation();
  if (s4accepted) return;
  s4accepted = true;

  document.getElementById('s4-overlay').style.transition = 'opacity 1s ease';
  document.getElementById('s4-overlay').style.opacity = '0';
  s4running = false;

  // bloom
  convProgress = 0;
  s4CoreOpacity = 1;
  s4Core.material.opacity = 1;

  // If Yes is tapped while "Sure ka?" is active, show only the background
  if (document.getElementById('s4-overlay').classList.contains('state-sure-ka')) {
    document.getElementById('accepted').innerHTML = '';
  }
  pLight1.intensity = 12;
  pLight2.intensity = 8;

  setTimeout(() => {
    document.getElementById('accepted').classList.add('show');
  }, 800);
});

// ═══════════════════════════════════════════
//   CURSOR GLOW
// ═══════════════════════════════════════════
const cursorEl = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top = e.clientY + 'px';
  mouseX = (e.clientX / window.innerWidth) - 0.5;
  mouseY = (e.clientY / window.innerHeight) - 0.5;
});

// ═══════════════════════════════════════════
//   ANIMATION LOOP
// ═══════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Stars drift
  stars1.rotation.y = t * 0.01;
  stars2.rotation.y = -t * 0.005;
  stars1.rotation.x = Math.sin(t*0.05) * 0.04;

  // Camera breathe & Parallax
  if (currentScene < 4) {
    camera.position.x += (mouseX * 2 + Math.sin(t*0.3)*1.2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 + Math.cos(t*0.25)*0.8 - camera.position.y) * 0.02;
  }

  // SCENE 1 — Heart
  if (currentScene === 1) {
    heartGroup.rotation.y = t * 0.4;
    heartGroup.rotation.x = Math.sin(t*0.3)*0.15;
    const pulse = 1 + Math.sin(t*1.4)*0.04;
    heartGroup.scale.set(pulse, pulse, pulse);
    pLight1.intensity = 4 + Math.sin(t*1.2)*0.8;
  }

  // SCENE 2 — Orbs
  if (currentScene === 2) {
    orbMeshes.forEach((m, i) => {
      const baseAngle = (i/3)*Math.PI*2;
      const angle = baseAngle + t * 0.25;
      const r = 6;
      m.position.x = Math.cos(angle)*r;
      m.position.z = Math.sin(angle)*r*0.5;
      m.position.y = Math.sin(angle + i)*1.2;
      m.rotation.y = t*0.6;
    });
  }

  // SCENE 3 — Line particles
  if (currentScene === 3) {
    const pos = lineParticles.geometry.attributes.position.array;
    for (let i = 0; i < lpCount; i++) {
      lpProgress[i] = (lpProgress[i] + 0.002) % 1;
      const p = bPos.clone().lerp(sPos, lpProgress[i]);
      pos[i*3] = p.x + Math.sin(lpProgress[i]*Math.PI*3 + t)*0.15;
      pos[i*3+1] = p.y + Math.cos(lpProgress[i]*Math.PI*2 + t*0.7)*0.2;
      pos[i*3+2] = p.z;
    }
    lineParticles.geometry.attributes.position.needsUpdate = true;
    lineMat.opacity = 0.3 + Math.sin(t*0.8)*0.1;
    sphereB.rotation.y = t*0.5;
    sphereS.rotation.y = -t*0.5;
  }

  // SCENE 4 — Convergence
  if (s4running || s4accepted) {
    if (!s4accepted && s4running) {
      convProgress = Math.min(convProgress + 0.003, 1);
    } else if (s4accepted) {
      convProgress = Math.min(convProgress + 0.015, 1);
    }

    const cpos = convParticles.geometry.attributes.position.array;
    for (let i = 0; i < convCount; i++) {
      const tx = convTarget[i*3], ty = convTarget[i*3+1], tz = convTarget[i*3+2];
      const ox = convPos[i*3], oy = convPos[i*3+1], oz = convPos[i*3+2];
      const e = convProgress < 0.5 ? 2*convProgress*convProgress : 1-Math.pow(-2*convProgress+2,2)/2;
      cpos[i*3] = ox + (tx-ox)*e + Math.sin(t*2 + i*0.1)*0.05*(1-e);
      cpos[i*3+1] = oy + (ty-oy)*e + Math.cos(t*1.5 + i*0.08)*0.05*(1-e);
      cpos[i*3+2] = oz + (tz-oz)*e;
    }
    convParticles.geometry.attributes.position.needsUpdate = true;
    convMat.opacity = 0.5 + convProgress * 0.5;
    s4Core.material.opacity = s4accepted ? Math.min(s4Core.material.opacity + 0.01, 0.35) : 0;
    pLight1.intensity = s4accepted ? Math.min(pLight1.intensity, 12) : 4 + convProgress*2;
  }

  renderer.render(scene, camera);
}

// ═══════════════════════════════════════════
//   RESIZE
// ═══════════════════════════════════════════
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════════
//   INIT
// ═══════════════════════════════════════════
animate();
showScene(1);