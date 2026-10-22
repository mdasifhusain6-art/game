// ========================================================
// COSMO VELOCITY 3D - CYBERPUNK ODYSSEY
// High-Octane 3D Endless & Level-Based Racer
// Vehicles: Tron Cyberbike, Cyber Supercar, Cosmo Ship
// Levels: Neo Cyber City, Orbital Starport, Magma Core
// ========================================================

const LANES = [-3.2, 0, 3.2];

const VEHICLE_CONFIGS = {
  real_tiger: {
    name: 'ROYAL BENGAL TIGER',
    icon: '🐅',
    modelKey: 'real_animal_tiger',
    speedMult: 1.15,
    lerpSpeed: 21.0, // Wild beast agility
    jumpForce: 0.48, // Pouncing predator leap!
    scale: [0.85, 0.85, 0.85],
    yOffset: 0.42,
    hasStartShield: false
  },
  animal: {
    name: 'CYBER MECHA PANTHER',
    icon: '🐆',
    modelKey: 'vehicle_animal',
    speedMult: 1.12,
    lerpSpeed: 20.0, // Beast reflexes!
    jumpForce: 0.46, // Pouncing predator leap!
    scale: [0.92, 0.92, 0.92],
    yOffset: 0.42,
    hasStartShield: false
  },
  bike: {
    name: 'TRON CYBERBIKE',
    icon: '🏍️',
    modelKey: 'vehicle_bike',
    speedMult: 1.08,
    lerpSpeed: 18.0,
    jumpForce: 0.38,
    scale: [0.85, 0.85, 0.85],
    yOffset: 0.45,
    hasStartShield: false
  },
  car: {
    name: 'CYBER SUPERCAR',
    icon: '🏎️',
    modelKey: 'vehicle_car',
    speedMult: 1.0,
    lerpSpeed: 14.0,
    jumpForce: 0.36,
    scale: [0.8, 0.8, 0.8],
    yOffset: 0.4,
    hasStartShield: true // Perk: Free Armor Plate
  },
  ship: {
    name: 'COSMO RACER',
    icon: '🛸',
    modelKey: 'player',
    speedMult: 1.04,
    lerpSpeed: 15.0,
    jumpForce: 0.44, // Perk: High float jump
    scale: [0.85, 0.85, 0.85],
    yOffset: 0.5,
    hasStartShield: false
  }
};

const LEVELS = [
  {
    level: 1,
    name: 'LVL 1: NEO CITY',
    targetDist: 800,
    skyColor: 0x050816,
    fogColor: 0x050816,
    hasSkyscrapers: true,
    bonusScore: 1000
  },
  {
    level: 2,
    name: 'LVL 2: ORBITAL PORT',
    targetDist: 1800,
    skyColor: 0x03030c,
    fogColor: 0x03030c,
    hasSkyscrapers: false,
    bonusScore: 2000
  },
  {
    level: 3,
    name: 'LVL 3: MAGMA TRENCH',
    targetDist: 3200,
    skyColor: 0x140307,
    fogColor: 0x140307,
    hasSkyscrapers: false,
    bonusScore: 3500
  }
];

class Game {
  constructor() {
    this.container = document.getElementById('gameCanvasContainer');
    this.state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'WARPING'
    
    // Stats
    this.score = 0;
    this.crystals = 0;
    this.distance = 0;
    this.multiplier = 1;
    this.highScore = parseInt(localStorage.getItem('cosmo_velocity_high') || '0', 10);
    this.currentLevelIdx = 0;
    
    // Object Selection (Real Royal Bengal Tiger by default!)
    this.selectedVehicle = 'real_tiger';
    this.vehConfig = VEHICLE_CONFIGS[this.selectedVehicle];

    // Speeds
    this.baseSpeed = 0.95;
    this.speed = this.baseSpeed;
    this.maxSpeed = 2.6;
    
    // Nitro System
    this.nitro = 100; // 0 - 100
    this.isNitroActive = false;
    this.nitroTimer = 0;

    // Movement & Physics
    this.currentLane = 1;
    this.targetX = 0;
    this.playerY = 0.5;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;

    // Powerups
    this.hasShield = false;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.hasBoost = false;
    this.boostTimer = 0;

    // Object Arrays
    this.trackSegments = [];
    this.sceneryObjects = [];
    this.obstacles = [];
    this.collectibles = [];
    this.powerups = [];
    this.boostRamps = [];
    this.portalGates = [];
    this.particles = [];
    this.lastSpawnZ = -60;
    this.portalSpawnedForLevel = false;

    // 3D Models Cache
    this.models = {};

    this.initThree();
    this.loadAllAssets();
    this.initInputs();
    this.initUI();
    this.updateHUD();

    // Render loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // 1. Scene, Camera & Lighting Setup
  initThree() {
    this.scene = new THREE.Scene();
    this.applyLevelAtmosphere(0);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.updateCameraAspect();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0x00f0ff, 1.3);
    this.dirLight.position.set(6, 18, 12);
    this.dirLight.castShadow = true;
    this.scene.add(this.dirLight);

    this.backLight = new THREE.DirectionalLight(0xff007f, 1.0);
    this.backLight.position.set(-6, 8, -25);
    this.scene.add(this.backLight);

    // Stars & Highway
    this.createStarfield();
    this.buildInitialTrack();

    // Player Root
    this.playerRoot = new THREE.Group();
    this.playerRoot.position.set(0, 0.45, 0);
    this.scene.add(this.playerRoot);

    // Shield Wireframe Sphere
    const shieldGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.playerRoot.add(this.shieldMesh);

    window.addEventListener('resize', () => {
      this.updateCameraAspect();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateCameraAspect();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }, 150);
    });
  }

  updateCameraAspect() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    if (aspect < 1.0) {
      this.camera.fov = 75;
      this.camera.position.set(0, 6.4, 11.2);
    } else {
      this.camera.fov = 60;
      this.camera.position.set(0, 4.8, 8.5);
    }
    this.camera.updateProjectionMatrix();
  }

  applyLevelAtmosphere(lvlIdx) {
    const lvl = LEVELS[lvlIdx] || LEVELS[0];
    this.scene.background = new THREE.Color(lvl.skyColor);
    this.scene.fog = new THREE.FogExp2(lvl.fogColor, 0.011);
  }

  createStarfield() {
    const count = 750;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 450;
      pos[i + 1] = Math.random() * 160 - 20;
      pos[i + 2] = -Math.random() * 400;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x99ccff, size: 1.3, transparent: true, opacity: 0.85 });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  // 2. Load All Futuristic 3D Models
  loadAllAssets() {
    const loader = new THREE.GLTFLoader();
    const assetList = [
      { key: 'real_animal_tiger', url: 'assets/real_animal_tiger.glb' },
      { key: 'vehicle_animal', url: 'assets/vehicle_animal.glb' },
      { key: 'vehicle_bike', url: 'assets/vehicle_bike.glb' },
      { key: 'vehicle_car', url: 'assets/vehicle_car.glb' },
      { key: 'player', url: 'assets/player.glb' },
      { key: 'crystal', url: 'assets/crystal.glb' },
      { key: 'obstacle', url: 'assets/obstacle.glb' },
      { key: 'powerup_shield', url: 'assets/powerup_shield.glb' },
      { key: 'powerup_magnet', url: 'assets/powerup_magnet.glb' },
      { key: 'boost_ramp', url: 'assets/boost_ramp.glb' },
      { key: 'portal_gate', url: 'assets/portal_gate.glb' },
      { key: 'env_skyscraper', url: 'assets/env_skyscraper.glb' }
    ];

    assetList.forEach(item => {
      loader.load(
        item.url,
        (gltf) => {
          this.models[item.key] = gltf.scene;
          if (item.key === this.vehConfig.modelKey) {
            this.equipVehicle(this.selectedVehicle);
          }
        },
        undefined,
        (err) => console.warn(`Asset ${item.url} load note:`, err)
      );
    });
  }

  equipVehicle(vehKey) {
    this.selectedVehicle = vehKey;
    this.vehConfig = VEHICLE_CONFIGS[vehKey];

    // Remove existing vehicle model
    if (this.currentVehicleMesh) {
      this.playerRoot.remove(this.currentVehicleMesh);
    }

    const rawModel = this.models[this.vehConfig.modelKey];
    if (rawModel) {
      const clone = rawModel.clone();
      const s = this.vehConfig.scale;
      clone.scale.set(s[0], s[1], s[2]);
      clone.rotation.y = Math.PI; // Face forward (-Z)
      clone.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      this.currentVehicleMesh = clone;
      this.playerRoot.add(clone);
    } else {
      // Procedural fallback
      const geo = new THREE.BoxGeometry(1.2, 0.4, 2.0);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00f0ff });
      const box = new THREE.Mesh(geo, mat);
      this.currentVehicleMesh = box;
      this.playerRoot.add(box);
    }

    // Update Start Shield Perk if Car
    if (this.vehConfig.hasStartShield) {
      this.hasShield = true;
      this.shieldMesh.material.opacity = 0.45;
    }

    // Update UI elements
    const iconEl = document.getElementById('activeVehicleIcon');
    const nameEl = document.getElementById('activeVehicleName');
    if (iconEl) iconEl.textContent = this.vehConfig.icon;
    if (nameEl) nameEl.textContent = this.vehConfig.name;
  }

  // 3. Infinite Modular Highway & Background Cyber Scenery
  buildInitialTrack() {
    const segmentLength = 40;
    for (let i = 0; i < 9; i++) {
      this.createTrackSegment(-i * segmentLength);
    }
  }

  createTrackSegment(zPos) {
    const segment = new THREE.Group();
    const width = 11;
    const length = 40;

    // Road Surface
    const roadGeo = new THREE.PlaneGeometry(width, length);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x070b16, roughness: 0.28, metalness: 0.65 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI * 0.5;
    road.receiveShadow = true;
    segment.add(road);

    // Neon Lane Dividers
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 });
    [-1.6, 1.6].forEach(x => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, length), lineMat);
      line.rotation.x = -Math.PI * 0.5;
      line.position.set(x, 0.02, 0);
      segment.add(line);
    });

    // Neon Guardrails
    const railMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    [-5.4, 5.4].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, length), railMat);
      rail.position.set(x, 0.2, 0);
      segment.add(rail);
    });

    // Overhead Archway
    const archMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.12, 8, 24, Math.PI), archMat);
    arch.position.set(0, 0, 0);
    segment.add(arch);

    // Cyber Skyscrapers in Level 1
    if (this.models.env_skyscraper && Math.random() < 0.6) {
      [-18, 18].forEach(x => {
        const bldg = this.models.env_skyscraper.clone();
        bldg.position.set(x, 0, 0);
        bldg.scale.set(0.9, 0.9 + Math.random() * 0.4, 0.9);
        segment.add(bldg);
      });
    }

    segment.position.z = zPos;
    this.scene.add(segment);
    this.trackSegments.push(segment);
  }

  // 4. Inputs: Keyboard, Touch Buttons, Nitro
  initInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.state === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startGame();
        return;
      }
      if (this.state === 'GAMEOVER' && (e.code === 'Space' || e.code === 'KeyR')) {
        this.restartGame();
        return;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
        return;
      }
      if (this.state !== 'PLAYING') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLane(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveLane(1);
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.slide();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyN':
          this.activateNitro();
          break;
      }
    });

    // Touch Virtual Buttons
    const bindTouchAction = (id, actionFn) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const trigger = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state === 'START') this.startGame();
        else if (this.state === 'GAMEOVER') this.restartGame();
        else if (this.state === 'PLAYING') actionFn();
      };
      btn.addEventListener('touchstart', trigger, { passive: false });
      btn.addEventListener('mousedown', trigger);
    };

    bindTouchAction('touchLeftBtn', () => this.moveLane(-1));
    bindTouchAction('touchRightBtn', () => this.moveLane(1));
    bindTouchAction('touchJumpBtn', () => this.jump());
    bindTouchAction('touchSlideBtn', () => this.slide());
    bindTouchAction('touchNitroBtn', () => this.activateNitro());

    // Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    const canvasContainer = document.getElementById('gameCanvasContainer');

    canvasContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      if (this.state === 'START') this.startGame();
      if (this.state === 'GAMEOVER') this.restartGame();
    }, { passive: true });

    canvasContainer.addEventListener('touchend', (e) => {
      if (this.state !== 'PLAYING') return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 35) this.moveLane(1);
        else if (dx < -35) this.moveLane(-1);
      } else {
        if (dy < -35) this.jump();
        else if (dy > 35) this.slide();
      }
    }, { passive: true });
  }

  moveLane(dir) {
    const next = this.currentLane + dir;
    if (next >= 0 && next <= 2) {
      this.currentLane = next;
      this.targetX = LANES[this.currentLane];
      window.soundSystem?.playJump();
    }
  }

  jump(forceMult = 1.0) {
    if (!this.isJumping) {
      this.isJumping = true;
      this.velocityY = this.vehConfig.jumpForce * forceMult;
      window.soundSystem?.playJump();
    }
  }

  slide() {
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = 0.55;
      if (this.currentVehicleMesh) {
        this.currentVehicleMesh.scale.set(this.vehConfig.scale[0] * 1.05, this.vehConfig.scale[1] * 0.45, this.vehConfig.scale[2]);
      }
    }
  }

  activateNitro() {
    if (this.nitro >= 25 && !this.isNitroActive) {
      this.isNitroActive = true;
      this.nitroTimer = 3.5; // 3.5 seconds nitro
      window.soundSystem?.playNitro();
      this.createWarpExplosion(this.playerRoot.position, 0x00ff66);
    }
  }

  // 5. Game State Transitions & Garage
  startGame() {
    this.state = 'PLAYING';
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('garageModal').classList.add('hidden');
    document.getElementById('levelClearModal').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');
    window.soundSystem?.startBGM();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pauseOverlay').classList.remove('hidden');
      window.soundSystem?.stopBGM();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pauseOverlay').classList.add('hidden');
      window.soundSystem?.startBGM();
    }
  }

  // Level Clear & Warp Portal Logic
  triggerLevelWarp() {
    this.state = 'WARPING';
    window.soundSystem?.playLevelClear();

    const currLvl = LEVELS[this.currentLevelIdx];
    this.score += currLvl.bonusScore;

    const modal = document.getElementById('levelClearModal');
    document.getElementById('warpBonusScore').textContent = `+${currLvl.bonusScore} PTS`;
    
    const nextLvl = LEVELS[this.currentLevelIdx + 1];
    if (nextLvl) {
      document.getElementById('warpDescText').textContent = `Entering ${nextLvl.name}...`;
    } else {
      document.getElementById('warpDescText').textContent = `Cosmo Master! Infinite High Speed Zone Ahead!`;
    }

    modal.classList.remove('hidden');

    // Warp Vortex Camera zoom
    this.camera.fov = 85;
    this.camera.updateProjectionMatrix();
  }

  advanceToNextLevel() {
    document.getElementById('levelClearModal').classList.add('hidden');
    this.currentLevelIdx = (this.currentLevelIdx + 1) % LEVELS.length;
    this.applyLevelAtmosphere(this.currentLevelIdx);
    this.portalSpawnedForLevel = false;
    this.camera.fov = 60;
    this.updateCameraAspect();

    // Clear immediate obstacles in front of player
    [...this.obstacles, ...this.portalGates].forEach(obj => {
      this.scene.remove(obj.mesh);
    });
    this.obstacles = [];
    this.portalGates = [];

    this.state = 'PLAYING';
    window.soundSystem?.startBGM();
    this.updateHUD();
  }

  gameOver() {
    this.state = 'GAMEOVER';
    window.soundSystem?.stopBGM();
    window.soundSystem?.playCrash();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('cosmo_velocity_high', this.highScore.toString());
    }

    document.getElementById('finalScoreVal').textContent = this.score;
    document.getElementById('finalCrystalsVal').textContent = this.crystals;
    document.getElementById('finalDistanceVal').textContent = Math.floor(this.distance) + 'm';
    document.getElementById('bestScoreVal').textContent = this.highScore;
    document.getElementById('gameOverScreen').classList.remove('hidden');
  }

  restartGame() {
    [...this.obstacles, ...this.collectibles, ...this.powerups, ...this.boostRamps, ...this.portalGates].forEach(o => {
      this.scene.remove(o.mesh);
    });
    this.obstacles = [];
    this.collectibles = [];
    this.powerups = [];
    this.boostRamps = [];
    this.portalGates = [];

    this.score = 0;
    this.crystals = 0;
    this.distance = 0;
    this.multiplier = 1;
    this.speed = this.baseSpeed;
    this.currentLane = 1;
    this.targetX = 0;
    this.playerY = 0.5;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.nitro = 100;
    this.isNitroActive = false;
    this.currentLevelIdx = 0;
    this.portalSpawnedForLevel = false;

    this.applyLevelAtmosphere(0);
    this.equipVehicle(this.selectedVehicle);
    this.updateHUD();
    this.startGame();
  }

  // 6. Spawner Logic (Obstacles, Crystals, Boost Ramps, Portal)
  updateSpawning(delta) {
    if (this.state !== 'PLAYING') return;

    const forwardMove = this.speed * 60 * delta;
    this.trackSegments.forEach((segment) => {
      segment.position.z += forwardMove;
      if (segment.position.z > 40) {
        const furthestZ = Math.min(...this.trackSegments.map(s => s.position.z));
        segment.position.z = furthestZ - 40;
      }
    });

    // Check if ready for Warp Portal Gate
    const currLvl = LEVELS[this.currentLevelIdx];
    if (this.distance >= currLvl.targetDist && !this.portalSpawnedForLevel) {
      this.spawnPortalGate(-160);
      this.portalSpawnedForLevel = true;
    }

    // Spawn road waves
    this.lastSpawnZ += forwardMove;
    if (this.lastSpawnZ > -50) {
      this.spawnRoadWave();
      this.lastSpawnZ = -105;
    }
  }

  spawnRoadWave() {
    const spawnZ = -140;
    const rand = Math.random();

    // 1. Boost Ramp Event
    if (rand < 0.2) {
      const lane = LANES[Math.floor(Math.random() * 3)];
      this.spawnBoostRamp(lane, spawnZ);
      this.spawnCrystalPattern(lane, spawnZ - 20);
    }
    // 2. Obstacle Barrier Wave
    else if (rand < 0.75) {
      const blocked = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.65 ? 1 : 2);
      blocked.forEach(idx => this.spawnObstacle(LANES[idx], spawnZ));
      const free = [0, 1, 2].filter(l => !blocked.includes(l));
      if (free.length > 0) this.spawnCrystalPattern(LANES[free[0]], spawnZ);
    }
    // 3. Powerup Capsule
    else {
      const lane = LANES[Math.floor(Math.random() * 3)];
      this.spawnPowerup(Math.random() < 0.5 ? 'shield' : 'magnet', lane, spawnZ);
      this.spawnCrystalPattern(0, spawnZ - 15);
    }
  }

  spawnBoostRamp(x, z) {
    let mesh;
    if (this.models.boost_ramp) {
      mesh = this.models.boost_ramp.clone();
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.4), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    }
    mesh.position.set(x, 0.1, z);
    this.scene.add(mesh);
    this.boostRamps.push({ mesh, x, z });
  }

  spawnPortalGate(z) {
    let mesh;
    if (this.models.portal_gate) {
      mesh = this.models.portal_gate.clone();
    } else {
      mesh = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.4, 8, 24), new THREE.MeshBasicMaterial({ color: 0x9900ff }));
    }
    mesh.position.set(0, 0, z);
    this.scene.add(mesh);
    this.portalGates.push({ mesh, z });
  }

  spawnObstacle(x, z) {
    let mesh = this.models.obstacle ? this.models.obstacle.clone() : new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xff0055 }));
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
    this.obstacles.push({ mesh, x, z });
  }

  spawnCrystalPattern(x, startZ) {
    for (let i = 0; i < 4; i++) {
      let mesh = this.models.crystal ? this.models.crystal.clone() : new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0x00f0ff }));
      const z = startZ - i * 5;
      mesh.position.set(x, 1.0, z);
      this.scene.add(mesh);
      this.collectibles.push({ mesh, x, z });
    }
  }

  spawnPowerup(type, x, z) {
    const raw = type === 'shield' ? this.models.powerup_shield : this.models.powerup_magnet;
    let mesh = raw ? raw.clone() : new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00aaff }));
    mesh.position.set(x, 1.2, z);
    this.scene.add(mesh);
    this.powerups.push({ mesh, type, x, z });
  }

  // 7. Interactive Physics, Collisions & Items
  updateObjects(delta) {
    const moveZ = this.speed * 60 * delta;
    const playerPos = this.playerRoot.position;

    // 1. Boost Ramps Collision (Launches vehicle & triggers speed blast!)
    for (let i = this.boostRamps.length - 1; i >= 0; i--) {
      const r = this.boostRamps[i];
      r.mesh.position.z += moveZ;

      if (Math.abs(r.mesh.position.z - playerPos.z) < 1.6 && Math.abs(r.mesh.position.x - playerPos.x) < 1.4) {
        this.jump(1.65); // High launch
        this.hasBoost = true;
        this.boostTimer = 3.0;
        this.speed = Math.min(this.speed * 1.45, this.maxSpeed);
        window.soundSystem?.playBoostRamp();
        this.createWarpExplosion(r.mesh.position, 0xffaa00);
      }

      if (r.mesh.position.z > 20) {
        this.scene.remove(r.mesh);
        this.boostRamps.splice(i, 1);
      }
    }

    // 2. Warp Portal Collision (Level Clear Event)
    for (let i = this.portalGates.length - 1; i >= 0; i--) {
      const gate = this.portalGates[i];
      gate.mesh.position.z += moveZ;
      gate.mesh.rotation.z += delta * 1.5;

      if (gate.mesh.position.z >= playerPos.z - 1.0 && this.state === 'PLAYING') {
        this.triggerLevelWarp();
        return;
      }
    }

    // 3. Obstacle Collision
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += moveZ;

      const dz = Math.abs(obs.mesh.position.z - playerPos.z);
      const dx = Math.abs(obs.mesh.position.x - playerPos.x);

      if (dz < 1.4 && dx < 1.25) {
        if (this.playerY < 1.45) {
          if (this.hasShield) {
            this.hasShield = false;
            this.shieldMesh.material.opacity = 0.0;
            this.createWarpExplosion(obs.mesh.position, 0x00f0ff);
            this.scene.remove(obs.mesh);
            this.obstacles.splice(i, 1);
            window.soundSystem?.playCrash();
            continue;
          } else {
            this.gameOver();
            return;
          }
        }
      }

      if (obs.mesh.position.z > 20) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // 4. Collectibles (Crystals)
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.mesh.position.z += moveZ;
      col.mesh.rotation.y += delta * 3.5;

      if (this.hasMagnet) {
        const d = col.mesh.position.distanceTo(playerPos);
        if (d < 18) col.mesh.position.lerp(playerPos, 0.22);
      }

      if (col.mesh.position.distanceTo(playerPos) < 1.6) {
        this.crystals++;
        this.score += 50 * this.multiplier;
        this.multiplier = Math.min(this.multiplier + 0.1, 5.0);
        this.nitro = Math.min(this.nitro + 6, 100); // Recharges Nitro
        window.soundSystem?.playCoin();
        this.createWarpExplosion(col.mesh.position, 0x00f0ff);
        this.scene.remove(col.mesh);
        this.collectibles.splice(i, 1);
        this.updateHUD();
        continue;
      }

      if (col.mesh.position.z > 20) {
        this.scene.remove(col.mesh);
        this.collectibles.splice(i, 1);
      }
    }

    // 5. Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pow = this.powerups[i];
      pow.mesh.position.z += moveZ;
      pow.mesh.rotation.y += delta * 4;

      if (pow.mesh.position.distanceTo(playerPos) < 1.8) {
        if (pow.type === 'shield') {
          this.hasShield = true;
          this.shieldMesh.material.opacity = 0.45;
        } else if (pow.type === 'magnet') {
          this.hasMagnet = true;
          this.magnetTimer = 10.0;
        }
        window.soundSystem?.playPowerup();
        this.scene.remove(pow.mesh);
        this.powerups.splice(i, 1);
        this.updateHUD();
        continue;
      }

      if (pow.mesh.position.z > 20) {
        this.scene.remove(pow.mesh);
        this.powerups.splice(i, 1);
      }
    }
  }

  createWarpExplosion(pos, colorHex) {
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: colorHex }));
      p.position.copy(pos);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 5 + 1, (Math.random() - 0.5) * 8),
        life: 0.4
      });
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.mesh.scale.multiplyScalar(0.91);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  // 8. UI & Garage Listeners
  initUI() {
    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
    document.getElementById('nextLevelBtn').addEventListener('click', () => this.advanceToNextLevel());

    // Garage Modal Buttons
    const garageModal = document.getElementById('garageModal');
    const openGarage = () => garageModal.classList.remove('hidden');
    const closeGarage = () => garageModal.classList.add('hidden');

    document.getElementById('openGarageBtn')?.addEventListener('click', openGarage);
    document.getElementById('garageMenuBtn')?.addEventListener('click', openGarage);
    document.getElementById('garageAfterLossBtn')?.addEventListener('click', openGarage);
    document.getElementById('closeGarageBtn')?.addEventListener('click', closeGarage);
    document.getElementById('confirmVehicleBtn')?.addEventListener('click', closeGarage);

    // Vehicle Selection Cards in Garage
    document.querySelectorAll('.vehicle-card').forEach(card => {
      card.addEventListener('click', () => {
        const vehKey = card.getAttribute('data-vehicle');
        document.querySelectorAll('.vehicle-card').forEach(c => {
          c.classList.remove('active');
          c.querySelector('.btn-select-veh').textContent = 'SELECT';
        });
        card.classList.add('active');
        card.querySelector('.btn-select-veh').textContent = 'SELECTED';
        this.equipVehicle(vehKey);
      });
    });

    const muteBtn = document.getElementById('muteBtn');
    muteBtn.addEventListener('click', () => {
      const isMuted = window.soundSystem?.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Sound';
    });
  }

  updateHUD() {
    const currLvl = LEVELS[this.currentLevelIdx];
    document.getElementById('hudLevelName').textContent = currLvl.name;
    document.getElementById('hudScore').textContent = this.score;
    document.getElementById('hudCrystals').textContent = this.crystals;
    document.getElementById('hudMultiplier').textContent = this.multiplier.toFixed(1) + 'x';
    document.getElementById('hudDistance').textContent = `${Math.floor(this.distance)} / ${currLvl.targetDist}m`;

    // Nitro Fill Bar
    const nitroFill = document.getElementById('nitroBarFill');
    if (nitroFill) nitroFill.style.width = `${Math.floor(this.nitro)}%`;

    // Powerup Badges
    const bShield = document.getElementById('badgeShield');
    const bMag = document.getElementById('badgeMagnet');
    const bBoost = document.getElementById('badgeBoost');
    if (bShield) bShield.style.display = this.hasShield ? 'inline-flex' : 'none';
    if (bMag) bMag.style.display = this.hasMagnet ? 'inline-flex' : 'none';
    if (bBoost) bBoost.style.display = (this.hasBoost || this.isNitroActive) ? 'inline-flex' : 'none';
  }

  // 9. Main Animation Loop
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === 'PLAYING') {
      // Speed calculation with vehicle perks and nitro
      let effectiveSpeed = (this.baseSpeed + this.distance * 0.00035) * this.vehConfig.speedMult;
      
      // Nitro Boost Handler
      if (this.isNitroActive) {
        effectiveSpeed *= 1.55;
        this.nitro = Math.max(0, this.nitro - delta * 25);
        this.nitroTimer -= delta;
        if (this.nitroTimer <= 0 || this.nitro <= 0) {
          this.isNitroActive = false;
        }
      }

      // Ramp Boost Timer
      if (this.hasBoost) {
        effectiveSpeed *= 1.35;
        this.boostTimer -= delta;
        if (this.boostTimer <= 0) this.hasBoost = false;
      }

      this.speed = Math.min(effectiveSpeed, this.maxSpeed);

      // Distance & Score Increment
      this.distance += this.speed * 30 * delta;
      this.score += Math.floor(this.speed * 6 * this.multiplier * delta);

      // Sound update: pitch engine hum with speed
      window.soundSystem?.updateEngineHum(this.speed / this.maxSpeed);

      // Magnet timer
      if (this.hasMagnet) {
        this.magnetTimer -= delta;
        if (this.magnetTimer <= 0) this.hasMagnet = false;
      }

      // Player Movement Lerp (Lane switching)
      this.playerRoot.position.x += (this.targetX - this.playerRoot.position.x) * this.vehConfig.lerpSpeed * delta;

      // Dynamic Banking Tilt & Yaw
      const dx = this.targetX - this.playerRoot.position.x;
      this.playerRoot.rotation.z = -dx * 0.24;
      this.playerRoot.rotation.y = dx * 0.12;

      // Jump Physics
      if (this.isJumping) {
        this.playerY += this.velocityY;
        this.velocityY -= 0.88 * delta;
        if (this.playerY <= this.vehConfig.yOffset) {
          this.playerY = this.vehConfig.yOffset;
          this.isJumping = false;
          this.velocityY = 0;
        }
      }
      this.playerRoot.position.y = this.playerY;

      // Real Animal Tiger & Panther Gallop Stride Oscillation
      if ((this.selectedVehicle === 'real_tiger' || this.selectedVehicle === 'animal') && !this.isJumping && this.currentVehicleMesh) {
        const strideSpeed = this.selectedVehicle === 'real_tiger' ? 0.024 : 0.02;
        this.currentVehicleMesh.position.y = Math.sin(Date.now() * strideSpeed) * 0.06;
        this.currentVehicleMesh.rotation.x = Math.sin(Date.now() * strideSpeed) * 0.045;
      }

      // Slide recovery
      if (this.isSliding) {
        this.slideTimer -= delta;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
          const s = this.vehConfig.scale;
          if (this.currentVehicleMesh) this.currentVehicleMesh.scale.set(s[0], s[1], s[2]);
        }
      }

      if (this.hasShield) {
        this.shieldMesh.rotation.y += delta * 2.2;
      }

      // Spawning & Collision updates
      this.updateSpawning(delta);
      this.updateObjects(delta);
      this.updateParticles(delta);

      // Dynamic Camera follow & nitro warp FOV
      this.camera.position.x += (this.playerRoot.position.x * 0.45 - this.camera.position.x) * 6 * delta;
      
      const targetFov = (this.isNitroActive || this.hasBoost) ? 72 : (window.innerWidth < window.innerHeight ? 75 : 60);
      this.camera.fov += (targetFov - this.camera.fov) * 5 * delta;
      this.camera.updateProjectionMatrix();

      // Starfield drift
      if (this.stars) this.stars.rotation.y += delta * 0.02;

      this.updateHUD();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.cosmoGame = new Game();
});
