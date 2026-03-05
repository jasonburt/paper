import Phaser from 'phaser';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser, getPlayerColor, setPlayerColor, PLAYER_COLORS } from '../utils/user';
import { createDOMInput, removeDOMInput } from '../utils/dom-input';
import { TOSS_PAPER_OBJECTS, searchObjects, type PlaceableObject } from '../data/placeable-objects';

type GameState = 'COLOR_PICK' | 'PRE_THROW' | 'DRAGGING' | 'FLYING' | 'LANDED' | 'PLACE_OBSTACLE' | 'OBJECT_PICKER';

const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 600;
const GROUND_Y = 480;
const LAUNCH_X = 120;
const LAUNCH_Y = 400;
const MAX_DRAG_DISTANCE = 160;
const MAX_SPEED = 950;
const GRAVITY = 200;
const GRID_SIZE = 40;
const MAX_OBSTACLES = 20;

export class TossPaperScene extends Phaser.Scene {
  // Mode: 'single' = solo practice, 'multi' = crew multiplayer
  private mode: 'single' | 'multi' = 'single';
  private crewId: number | null = null;
  private userId: number | null = null;
  private playerColor = '#FF4F36';

  // State
  private gameState: GameState = 'PRE_THROW';
  private totalScore = 0;
  private throwCount = 0;
  private windStrength = 0;
  private selectedObject: PlaceableObject | null = null;

  // Physics objects
  private plane!: Phaser.Physics.Arcade.Sprite;
  private obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles: Phaser.GameObjects.GameObject[] = [];

  // Graphics
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private slingshotGraphics!: Phaser.GameObjects.Graphics;
  private groundGraphics!: Phaser.GameObjects.Graphics;
  private ghostObstacle: Phaser.GameObjects.Graphics | null = null;

  // Drag tracking
  private launchOrigin!: Phaser.Math.Vector2;
  private dragHandle!: Phaser.Math.Vector2;
  private launchVelocity!: Phaser.Math.Vector2;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private windText!: Phaser.GameObjects.Text;
  private throwText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;
  private stateHintText!: Phaser.GameObjects.Text;

  // Back button
  private backText!: Phaser.GameObjects.Text;

  // Color picker elements (cleaned up after selection)
  private colorPickElements: Phaser.GameObjects.GameObject[] = [];

  // Object picker elements
  private pickerElements: Phaser.GameObjects.GameObject[] = [];
  private searchInput: HTMLInputElement | null = null;
  private pickerJustClosed = false;

  constructor() {
    super({ key: 'TossPaperScene' });
  }

  init(data: any) {
    this.mode = data?.mode === 'multi' ? 'multi' : 'single';
    this.crewId = data?.crew_id || null;
    this.userId = data?.user_id || getUser()?.id || null;
    this.playerColor = getPlayerColor();
  }

  create() {
    // Reset state
    this.gameState = 'PRE_THROW';
    this.totalScore = 0;
    this.throwCount = 0;
    this.selectedObject = null;
    this.obstacles = [];
    this.colorPickElements = [];
    this.pickerElements = [];
    this.searchInput = null;

    this.launchOrigin = new Phaser.Math.Vector2(LAUNCH_X, LAUNCH_Y);
    this.dragHandle = new Phaser.Math.Vector2(LAUNCH_X, LAUNCH_Y);
    this.launchVelocity = new Phaser.Math.Vector2(0, 0);

    this.setupWorld();
    this.drawPlaneTexture();
    this.drawObstacleTextures();
    this.setupPlane();
    this.setupGround();
    this.setupHUD();
    this.setupInput();

    if (this.mode === 'multi') {
      this.startMultiGame();
    } else {
      this.enterPreThrow();
    }
  }

  // --- Color picker (multi mode) ---

  private showColorPicker() {
    this.gameState = 'COLOR_PICK';
    const { width, height } = this.scale;

    // Hide game HUD during color pick
    this.scoreText.setVisible(false);
    this.windText.setVisible(false);
    this.throwText.setVisible(false);
    this.backText.setVisible(false);
    this.plane.setVisible(false);

    const title = this.add.text(width / 2, height / 4, 'Choose Your Color', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.colorPickElements.push(title);

    const subtitle = this.add.text(width / 2, height / 4 + 40, 'Your obstacles will be this color', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.colorPickElements.push(subtitle);

    const cols = 3;
    const dotSize = 28;
    const gap = 80;
    const startX = width / 2 - ((cols - 1) * gap) / 2;
    const startY = height / 2 - 20;

    PLAYER_COLORS.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * gap;
      const y = startY + row * 70;

      const g = this.add.graphics().setScrollFactor(0).setDepth(200);
      // Highlight ring if this is the current color
      if (c.hex === this.playerColor) {
        g.lineStyle(3, 0x1A1A1A, 1);
        g.strokeCircle(x, y, dotSize + 4);
      }
      g.fillStyle(parseInt(c.hex.replace('#', '0x')), 1);
      g.fillCircle(x, y, dotSize);
      this.colorPickElements.push(g);

      const label = this.add.text(x, y + dotSize + 10, c.label, {
        fontSize: '11px',
        fontFamily: 'Georgia, serif',
        color: '#6B6B6B',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      this.colorPickElements.push(label);

      // Invisible hit area
      const hitZone = this.add.zone(x, y, dotSize * 2.5, dotSize * 2.5)
        .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        this.playerColor = c.hex;
        setPlayerColor(c.hex);
        this.clearColorPicker();
        this.startMultiGame();
      });
      this.colorPickElements.push(hitZone);
    });
  }

  private clearColorPicker() {
    this.colorPickElements.forEach(el => el.destroy());
    this.colorPickElements = [];
  }

  private async startMultiGame() {
    // Show HUD
    this.scoreText.setVisible(true);
    this.windText.setVisible(true);
    this.throwText.setVisible(true);
    this.plane.setVisible(true);

    // Load existing obstacles from the server
    if (this.crewId) {
      try {
        const serverObstacles = await api.get<any[]>(`/obstacles/toss-paper?crew_id=${this.crewId}`);
        for (const o of serverObstacles) {
          this.placeServerObstacle(o.type, o.x, o.y, o.color);
        }
      } catch {
        // Failed to load — continue without
      }
    }

    this.enterPreThrow();
  }

  private placeServerObstacle(type: string, x: number, y: number, color: string) {
    const obstacle = this.obstacleGroup.create(x, y, type) as Phaser.Physics.Arcade.Sprite;
    obstacle.setOrigin(0, 0);
    obstacle.refreshBody();
    obstacle.setData('type', type);
    // Tint with player color
    obstacle.setTint(parseInt(color.replace('#', '0x')));
    this.obstacles.push(obstacle);
  }

  // --- World setup ---

  private setupWorld() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setScroll(0, 0);

    this.obstacleGroup = this.physics.add.staticGroup();
    this.previewGraphics = this.add.graphics();
    this.slingshotGraphics = this.add.graphics();
  }

  private drawPlaneTexture() {
    if (this.textures.exists('plane')) return;
    const g = this.add.graphics();
    // Paper airplane shape
    g.fillStyle(0x1A1A1A, 1);
    g.fillTriangle(40, 10, 0, 0, 5, 10);   // top wing
    g.fillTriangle(40, 10, 0, 20, 5, 10);   // bottom wing
    // Red accent stripe
    g.fillStyle(0xFF4F36, 1);
    g.fillTriangle(12, 10, 5, 7, 5, 13);
    g.generateTexture('plane', 44, 22);
    g.destroy();
  }

  private drawObstacleTextures() {
    // Paper Wall texture
    if (!this.textures.exists('wall')) {
      const g = this.add.graphics();
      g.fillStyle(0xE8E8E8, 1);
      g.fillRect(0, 0, 80, 40);
      g.lineStyle(1, 0xD0D0D0, 1);
      g.strokeRect(0, 0, 80, 40);
      g.lineBetween(40, 0, 40, 40);
      g.generateTexture('wall', 80, 40);
      g.destroy();
    }

    // Crumpled Ball texture
    if (!this.textures.exists('ball')) {
      const g = this.add.graphics();
      g.fillStyle(0xD0D0D0, 1);
      g.fillCircle(20, 20, 18);
      g.lineStyle(1, 0xA0A0A0, 0.6);
      g.lineBetween(10, 12, 28, 18);
      g.lineBetween(14, 28, 26, 14);
      g.lineBetween(20, 8, 18, 32);
      g.generateTexture('ball', 40, 40);
      g.destroy();
    }

    // Paper Fan texture
    if (!this.textures.exists('fan')) {
      const g = this.add.graphics();
      g.fillStyle(0xEEF4FF, 1);
      g.fillRect(0, 0, 40, 80);
      g.lineStyle(2, 0x4992FF, 1);
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        g.lineBetween(20, 40, 20 + Math.cos(angle) * 16, 40 + Math.sin(angle) * 16);
      }
      g.lineStyle(1, 0x4992FF, 0.3);
      g.strokeRect(0, 0, 40, 80);
      g.generateTexture('fan', 40, 80);
      g.destroy();
    }

    // Sticky Note texture
    if (!this.textures.exists('sticky_note')) {
      const g = this.add.graphics();
      g.fillStyle(0xFFF59D, 1);
      g.fillRect(0, 0, 40, 40);
      g.lineStyle(1, 0xE6DB80, 1);
      g.strokeRect(0, 0, 40, 40);
      // Fold corner
      g.fillStyle(0xE6DB80, 1);
      g.fillTriangle(28, 0, 40, 0, 40, 12);
      // Lines
      g.lineStyle(1, 0xD4C960, 0.5);
      g.lineBetween(4, 12, 36, 12);
      g.lineBetween(4, 20, 36, 20);
      g.lineBetween(4, 28, 28, 28);
      g.generateTexture('sticky_note', 40, 40);
      g.destroy();
    }

    // Tape Roll texture
    if (!this.textures.exists('tape_roll')) {
      const g = this.add.graphics();
      g.fillStyle(0xE8DCC8, 1);
      g.fillRect(0, 0, 40, 80);
      g.lineStyle(1, 0xC8B898, 1);
      g.strokeRect(0, 0, 40, 80);
      // Tape ring circles
      g.lineStyle(2, 0xC8B898, 0.8);
      g.strokeCircle(20, 20, 14);
      g.strokeCircle(20, 60, 14);
      // Inner holes
      g.fillStyle(0xFAF5EC, 1);
      g.fillCircle(20, 20, 6);
      g.fillCircle(20, 60, 6);
      g.generateTexture('tape_roll', 40, 80);
      g.destroy();
    }

    // Paper Cup texture
    if (!this.textures.exists('paper_cup')) {
      const g = this.add.graphics();
      // Cup body (trapezoid)
      g.fillStyle(0xF0F0F0, 1);
      g.fillTriangle(4, 0, 36, 0, 32, 40);
      g.fillTriangle(4, 0, 8, 40, 32, 40);
      g.lineStyle(1, 0xCCCCCC, 1);
      g.lineBetween(4, 0, 36, 0);
      g.lineBetween(4, 0, 8, 40);
      g.lineBetween(36, 0, 32, 40);
      g.lineBetween(8, 40, 32, 40);
      // Rim
      g.lineStyle(2, 0xCCCCCC, 1);
      g.lineBetween(2, 0, 38, 0);
      // Stripe
      g.lineStyle(1, 0x4992FF, 0.4);
      g.lineBetween(6, 14, 34, 14);
      g.generateTexture('paper_cup', 40, 40);
      g.destroy();
    }

    // Origami Crane texture
    if (!this.textures.exists('origami_crane')) {
      const g = this.add.graphics();
      // Body
      g.fillStyle(0xFF8F01, 1);
      g.fillTriangle(20, 4, 4, 28, 36, 28);
      // Wings
      g.fillStyle(0xFFA030, 1);
      g.fillTriangle(20, 12, 0, 24, 20, 24);
      g.fillTriangle(20, 12, 40, 24, 20, 24);
      // Head
      g.fillStyle(0xFF8F01, 1);
      g.fillTriangle(20, 4, 16, 12, 24, 12);
      // Tail
      g.fillStyle(0xE07800, 1);
      g.fillTriangle(16, 28, 24, 28, 20, 38);
      g.generateTexture('origami_crane', 40, 40);
      g.destroy();
    }

    // Coming soon placeholder (gray silhouette)
    if (!this.textures.exists('coming_soon')) {
      const g = this.add.graphics();
      g.fillStyle(0xE0E0E0, 1);
      g.fillRoundedRect(4, 4, 32, 32, 4);
      g.lineStyle(1, 0xCCCCCC, 1);
      g.strokeRoundedRect(4, 4, 32, 32, 4);
      // Question mark
      g.fillStyle(0xBBBBBB, 1);
      g.fillCircle(20, 16, 4);
      g.fillRect(18, 20, 4, 6);
      g.fillCircle(20, 30, 2);
      g.generateTexture('coming_soon', 40, 40);
      g.destroy();
    }
  }

  private setupPlane() {
    this.plane = this.physics.add.sprite(LAUNCH_X, LAUNCH_Y, 'plane');
    this.plane.setOrigin(0.1, 0.5);
    this.plane.setCollideWorldBounds(true);
    this.plane.body!.setGravityY(0); // Disabled until flying
    (this.plane.body as Phaser.Physics.Arcade.Body).setSize(36, 16);

    // Collider with obstacles
    this.physics.add.collider(this.plane, this.obstacleGroup, this.handleCollision as any, undefined, this);
  }

  private setupGround() {
    this.groundGraphics = this.add.graphics();
    // Ground fill
    this.groundGraphics.fillStyle(0xF5F0E8, 1);
    this.groundGraphics.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    // Ground line (fold crease)
    this.groundGraphics.lineStyle(2, 0xD0D0D0, 0.8);
    this.groundGraphics.lineBetween(0, GROUND_Y, WORLD_WIDTH, GROUND_Y);
    // Subtle grid dots on ground
    this.groundGraphics.fillStyle(0xD8D0C8, 0.4);
    for (let x = 0; x < WORLD_WIDTH; x += GRID_SIZE * 5) {
      this.groundGraphics.fillCircle(x, GROUND_Y + 2, 1.5);
    }

    // Distance markers along the ground
    const markerInterval = GRID_SIZE * 5; // every 5 grid units = every 200px
    for (let x = LAUNCH_X + markerInterval; x < WORLD_WIDTH; x += markerInterval) {
      const dist = Math.floor((x - LAUNCH_X) / GRID_SIZE);
      // Tick mark
      this.groundGraphics.lineStyle(1, 0xC0B8B0, 0.6);
      this.groundGraphics.lineBetween(x, GROUND_Y, x, GROUND_Y + 8);
      // Distance label
      this.add.text(x, GROUND_Y + 10, `${dist}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#B0A898',
      }).setOrigin(0.5, 0);
    }
  }

  private setupHUD() {
    const textStyle = (size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontSize: `${size}px`,
      fontFamily: 'monospace',
      color,
    });

    this.scoreText = this.add.text(16, 12, 'SCORE: 0', textStyle(18, '#1A1A1A'))
      .setScrollFactor(0).setDepth(100);

    this.windText = this.add.text(400, 12, '', textStyle(18, '#4992FF'))
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.throwText = this.add.text(784, 12, 'Throw 1', textStyle(16, '#6B6B6B'))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    this.distanceText = this.add.text(16, 570, '', textStyle(16, '#1A1A1A'))
      .setScrollFactor(0).setDepth(100).setVisible(false);

    this.powerText = this.add.text(784, 570, '', textStyle(16, '#FF8F01'))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    this.stateHintText = this.add.text(400, 555, '', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Back button
    this.backText = this.add.text(16, 570, '← Back', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
    this.backText.on('pointerover', () => this.backText.setColor('#FF8F01'));
    this.backText.on('pointerout', () => this.backText.setColor('#6B6B6B'));
    this.backText.on('pointerdown', () => {
      this.cameras.main.stopFollow();
      if (this.mode === 'multi' && this.crewId) {
        pushRoute(`/paper-crew-room/${this.crewId}`);
        this.scene.stop();
      } else {
        pushRoute('/');
        this.scene.stop();
      }
    });
  }

  private setupInput() {
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  // --- State transitions ---

  private enterPreThrow() {
    this.gameState = 'PRE_THROW';
    this.throwCount++;

    // Roll wind
    this.windStrength = Phaser.Math.Between(-3, 3) * 20;
    this.updateWindDisplay();

    // Reset plane
    this.plane.setPosition(LAUNCH_X, LAUNCH_Y);
    this.plane.setRotation(0);
    this.plane.setVisible(true);
    const body = this.plane.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setGravityY(0);
    body.setAccelerationX(0);
    body.enable = true;

    // Reset camera
    this.cameras.main.stopFollow();
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: 0,
      scrollY: 0,
      duration: 400,
      ease: 'Sine.easeInOut',
    });

    // Update HUD
    this.throwText.setText(this.mode === 'multi' ? 'Your Turn' : `Throw ${this.throwCount}`);
    this.scoreText.setText(`SCORE: ${this.totalScore}`);
    this.distanceText.setVisible(false);
    this.powerText.setVisible(false);
    this.stateHintText.setText('Drag the plane to throw');
    this.backText.setVisible(true);

    // Clear preview graphics
    this.previewGraphics.clear();
    this.slingshotGraphics.clear();
  }

  private launchPlane() {
    this.gameState = 'FLYING';

    // Calculate launch velocity (inverse of drag direction)
    const dx = this.launchOrigin.x - this.dragHandle.x;
    const dy = this.launchOrigin.y - this.dragHandle.y;
    const dragDist = Math.hypot(dx, dy);
    const power = Math.min(dragDist / MAX_DRAG_DISTANCE, 1);
    const angle = Math.atan2(dy, dx);

    const speed = power * MAX_SPEED;
    this.launchVelocity.set(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Clamp components
    this.launchVelocity.x = Phaser.Math.Clamp(this.launchVelocity.x, -900, 900);
    this.launchVelocity.y = Phaser.Math.Clamp(this.launchVelocity.y, -500, 500);

    // Apply to plane
    const body = this.plane.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.launchVelocity.x, this.launchVelocity.y);
    body.setGravityY(GRAVITY);
    body.setAccelerationX(this.windStrength);

    // Camera follow
    this.cameras.main.startFollow(this.plane, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(200, 100);

    // Clear drag visuals
    this.previewGraphics.clear();
    this.slingshotGraphics.clear();

    // Update HUD
    this.powerText.setVisible(false);
    this.distanceText.setVisible(true);
    this.stateHintText.setText('');
    this.backText.setVisible(false);
  }

  private triggerLanded() {
    if (this.gameState !== 'FLYING') return;
    this.gameState = 'LANDED';

    const body = this.plane.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setGravityY(0);
    body.setAccelerationX(0);

    // Ensure plane is on or above ground
    if (this.plane.y > GROUND_Y) {
      this.plane.y = GROUND_Y;
    }

    // Calculate score
    const distance = Math.max(0, Math.floor((this.plane.x - LAUNCH_X) / GRID_SIZE));
    this.totalScore += distance;

    // Show results
    this.scoreText.setText(`SCORE: ${this.totalScore}`);
    this.distanceText.setText(`DIST: ${distance} pts`);
    this.stateHintText.setText(`+${distance} points!`);

    // Post score to server in multi mode
    if (this.mode === 'multi' && this.userId) {
      api.post('/scores', {
        user_id: this.userId,
        game: 'toss-paper',
        score: this.totalScore,
        crew_id: this.crewId,
      }).catch(() => {}); // fire and forget
    }

    // Distance marker in the world
    this.add.text(this.plane.x, GROUND_Y + 8, `${distance}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FF4F36',
    }).setOrigin(0.5, 0);

    // Transition to obstacle placement after a delay
    this.time.delayedCall(1500, () => {
      this.enterPlaceObstacle();
    });
  }

  private enterPlaceObstacle() {
    this.gameState = 'OBJECT_PICKER';
    this.selectedObject = null;

    // Stop following
    this.cameras.main.stopFollow();

    // Scroll camera back
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: 0,
      scrollY: 0,
      duration: 600,
      ease: 'Sine.easeInOut',
    });

    this.distanceText.setVisible(false);
    this.backText.setVisible(false);
    this.stateHintText.setText('');

    // Show object picker after camera scrolls back
    this.time.delayedCall(650, () => {
      this.showObjectPicker();
    });
  }

  // --- Object Picker UI ---

  private showObjectPicker(filterQuery = '') {
    // Clear previous picker elements
    this.clearObjectPicker();

    const { width, height } = this.scale;
    const panelY = height * 0.35;
    const panelH = height - panelY;

    // Semi-transparent background overlay
    const overlay = this.add.graphics().setScrollFactor(0).setDepth(300);
    overlay.fillStyle(0x000000, 0.2);
    overlay.fillRect(0, 0, width, panelY);
    this.pickerElements.push(overlay);

    // Panel background
    const panel = this.add.graphics().setScrollFactor(0).setDepth(300);
    panel.fillStyle(0xFFFFFF, 1);
    panel.fillRoundedRect(0, panelY - 12, width, panelH + 12, { tl: 12, tr: 12, bl: 0, br: 0 });
    panel.lineStyle(1, 0xE0E0E0, 1);
    panel.lineBetween(0, panelY - 12, width, panelY - 12);
    this.pickerElements.push(panel);

    // Title
    const title = this.add.text(width / 2, panelY + 8, 'Place something for the next player', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(301);
    this.pickerElements.push(title);

    // Search input (DOM overlay)
    if (!this.searchInput) {
      this.searchInput = createDOMInput(160, panelY + 32, 480, {
        placeholder: 'Search objects...',
        maxLength: 30,
      });
      this.searchInput.addEventListener('input', () => {
        this.showObjectPicker(this.searchInput?.value || '');
      });
    }

    // Filter objects
    const allObjects = TOSS_PAPER_OBJECTS;
    const filtered = searchObjects(allObjects, filterQuery);
    const available = filtered.filter(o => o.status === 'available');
    const comingSoon = filtered.filter(o => o.status === 'coming_soon');
    const sorted = [...available, ...comingSoon];

    // Grid layout
    const cols = 4;
    const cellW = 100;
    const cellH = 80;
    const gridStartX = (width - cols * cellW) / 2;
    const gridStartY = panelY + 80;

    if (sorted.length === 0) {
      const empty = this.add.text(width / 2, gridStartY + 40, 'No objects found', {
        fontSize: '14px',
        fontFamily: 'Georgia, serif',
        color: '#AAAAAA',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
      this.pickerElements.push(empty);
    }

    sorted.forEach((obj, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = gridStartX + col * cellW + cellW / 2;
      const cy = gridStartY + row * cellH;

      if (cy + cellH > height) return; // off-screen

      const isComingSoon = obj.status === 'coming_soon';
      const spriteKey = isComingSoon ? 'coming_soon' : obj.spriteKey;

      // Thumbnail sprite
      if (this.textures.exists(spriteKey)) {
        const thumb = this.add.image(cx, cy + 12, spriteKey)
          .setScrollFactor(0).setDepth(302);
        // Scale to fit 40x40 box
        const tex = this.textures.get(spriteKey).getSourceImage();
        const scale = Math.min(40 / tex.width, 40 / tex.height);
        thumb.setScale(scale);
        if (isComingSoon) thumb.setAlpha(0.4);
        this.pickerElements.push(thumb);
      }

      // Name label
      const label = this.add.text(cx, cy + 38, obj.name, {
        fontSize: '11px',
        fontFamily: 'Georgia, serif',
        color: isComingSoon ? '#BBBBBB' : '#1A1A1A',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(302);
      this.pickerElements.push(label);

      // "Coming Soon" sub-label
      if (isComingSoon) {
        const soon = this.add.text(cx, cy + 52, 'Coming Soon', {
          fontSize: '9px',
          fontFamily: 'Georgia, serif',
          color: '#CCCCCC',
          fontStyle: 'italic',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(302);
        this.pickerElements.push(soon);
      }

      // Hit zone
      const hitZone = this.add.zone(cx, cy + 20, cellW - 8, cellH - 4)
        .setScrollFactor(0).setDepth(303).setInteractive({ useHandCursor: !isComingSoon });

      if (isComingSoon) {
        hitZone.on('pointerdown', () => {
          this.showToast('Coming soon!');
        });
      } else {
        // Hover highlight
        const highlight = this.add.graphics().setScrollFactor(0).setDepth(301).setAlpha(0);
        highlight.fillStyle(0x4992FF, 0.1);
        highlight.fillRoundedRect(cx - cellW / 2 + 4, cy - 8, cellW - 8, cellH - 4, 6);
        this.pickerElements.push(highlight);

        hitZone.on('pointerover', () => highlight.setAlpha(1));
        hitZone.on('pointerout', () => highlight.setAlpha(0));
        hitZone.on('pointerdown', () => {
          this.selectObject(obj);
        });
      }
      this.pickerElements.push(hitZone);
    });

    // Skip button
    const skipBtn = this.add.text(width / 2, height - 20, 'Skip', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#AAAAAA',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302)
      .setInteractive({ useHandCursor: true });
    skipBtn.on('pointerover', () => skipBtn.setColor('#FF8F01'));
    skipBtn.on('pointerout', () => skipBtn.setColor('#AAAAAA'));
    skipBtn.on('pointerdown', () => {
      this.clearObjectPicker();
      if (this.mode === 'multi' && this.crewId) {
        this.stateHintText.setText('Skipped! Returning...');
        this.time.delayedCall(800, () => {
          pushRoute(`/paper-crew-room/${this.crewId}`);
          this.scene.stop();
        });
      } else {
        this.enterPreThrow();
      }
    });
    this.pickerElements.push(skipBtn);
  }

  private clearObjectPicker() {
    this.pickerElements.forEach(el => el.destroy());
    this.pickerElements = [];
    removeDOMInput(this.searchInput);
    this.searchInput = null;
  }

  private selectObject(obj: PlaceableObject) {
    this.selectedObject = obj;
    this.clearObjectPicker();

    this.gameState = 'PLACE_OBSTACLE';
    this.pickerJustClosed = true;

    // Create ghost obstacle
    this.ghostObstacle = this.add.graphics();
    this.drawGhostObstacle(this.ghostObstacle, obj.spriteKey);
    this.ghostObstacle.setAlpha(0.5);
    this.ghostObstacle.setDepth(50);

    this.stateHintText.setText(`Click to place: ${obj.name}`);
    this.backText.setVisible(true);
    this.distanceText.setVisible(false);
  }

  private showToast(message: string) {
    const { width } = this.scale;
    const toast = this.add.text(width / 2, 20, message, {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#FFFFFF',
      backgroundColor: '#333333',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(400);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      delay: 1200,
      duration: 400,
      onComplete: () => toast.destroy(),
    });
  }

  private confirmObstaclePlacement(worldX: number, worldY: number) {
    if (!this.selectedObject) return;
    const obj = this.selectedObject;

    // Snap to grid
    const gridX = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;

    // Don't place in launch zone or below ground
    if (gridX < 200 || gridY >= GROUND_Y) return;

    // Remove ghost
    if (this.ghostObstacle) {
      this.ghostObstacle.destroy();
      this.ghostObstacle = null;
    }

    // Remove oldest if at max
    if (this.obstacles.length >= MAX_OBSTACLES) {
      const oldest = this.obstacles.shift();
      if (oldest) oldest.destroy();
    }

    // Create the obstacle sprite and add to static group
    const obstacle = this.obstacleGroup.create(gridX, gridY, obj.spriteKey) as Phaser.Physics.Arcade.Sprite;
    obstacle.setOrigin(0, 0);
    obstacle.refreshBody();
    obstacle.setData('type', obj.id);
    // Tint with player's color
    obstacle.setTint(parseInt(this.playerColor.replace('#', '0x')));
    this.obstacles.push(obstacle);

    this.selectedObject = null;

    if (this.mode === 'multi' && this.crewId) {
      // Save obstacle to server, then navigate back to crew room
      api.post('/obstacles', {
        crew_id: this.crewId,
        game: 'toss-paper',
        user_id: this.userId,
        type: obj.id,
        x: gridX,
        y: gridY,
        color: this.playerColor,
      }).catch(() => {}); // fire and forget

      this.stateHintText.setText('Obstacle placed! Returning...');
      this.backText.setVisible(false);

      this.time.delayedCall(1200, () => {
        pushRoute(`/paper-crew-room/${this.crewId}`);
        this.scene.stop();
      });
    } else {
      // Single mode: continue playing
      this.enterPreThrow();
    }
  }

  // --- Input handlers ---

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.gameState === 'OBJECT_PICKER') {
      // Picker UI handles its own clicks via zones
      return;
    }
    if (this.gameState === 'PRE_THROW') {
      // Check if near the plane
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const dist = Phaser.Math.Distance.Between(
        worldPoint.x, worldPoint.y,
        this.launchOrigin.x, this.launchOrigin.y
      );
      if (dist < 80) {
        this.gameState = 'DRAGGING';
        this.dragHandle.set(worldPoint.x, worldPoint.y);
        this.powerText.setVisible(true);
        this.stateHintText.setText('Pull back and release!');
      }
    } else if (this.gameState === 'PLACE_OBSTACLE') {
      if (this.pickerJustClosed) {
        this.pickerJustClosed = false;
        return;
      }
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.confirmObstaclePlacement(worldPoint.x, worldPoint.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.gameState === 'DRAGGING') {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const dx = worldPoint.x - this.launchOrigin.x;
      const dy = worldPoint.y - this.launchOrigin.y;
      const dragDist = Math.min(Math.hypot(dx, dy), MAX_DRAG_DISTANCE);
      const angle = Math.atan2(dy, dx);
      this.dragHandle.set(
        this.launchOrigin.x + Math.cos(angle) * dragDist,
        this.launchOrigin.y + Math.sin(angle) * dragDist
      );
    } else if ((this.gameState === 'PLACE_OBSTACLE') && this.ghostObstacle) {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const gridX = Math.floor(worldPoint.x / GRID_SIZE) * GRID_SIZE;
      const gridY = Math.floor(worldPoint.y / GRID_SIZE) * GRID_SIZE;
      this.ghostObstacle.setPosition(gridX, gridY);
    }
  }

  private onPointerUp() {
    if (this.gameState === 'DRAGGING') {
      // Check if there's enough power to throw
      const dx = this.launchOrigin.x - this.dragHandle.x;
      const dy = this.launchOrigin.y - this.dragHandle.y;
      const dragDist = Math.hypot(dx, dy);
      if (dragDist > 15) {
        this.launchPlane();
      } else {
        // Too weak, reset to pre-throw
        this.gameState = 'PRE_THROW';
        this.previewGraphics.clear();
        this.slingshotGraphics.clear();
        this.powerText.setVisible(false);
        this.stateHintText.setText('Drag the plane to throw');
      }
    }
  }

  // --- Update loop ---

  update(_time: number, _delta: number) {
    if (this.gameState === 'DRAGGING') {
      this.updateDragPreview();
    } else if (this.gameState === 'FLYING') {
      this.updateFlight();
    }
  }

  private updateDragPreview() {
    // Draw slingshot rubber band
    this.slingshotGraphics.clear();
    this.slingshotGraphics.lineStyle(2, 0xFF8F01, 0.8);
    this.slingshotGraphics.lineBetween(
      this.launchOrigin.x, this.launchOrigin.y,
      this.dragHandle.x, this.dragHandle.y
    );

    // Draw power circle at drag handle
    this.slingshotGraphics.fillStyle(0xFF8F01, 0.4);
    this.slingshotGraphics.fillCircle(this.dragHandle.x, this.dragHandle.y, 8);

    // Move plane to drag handle for visual feedback
    this.plane.setPosition(this.dragHandle.x, this.dragHandle.y);
    const pullAngle = Math.atan2(
      this.launchOrigin.y - this.dragHandle.y,
      this.launchOrigin.x - this.dragHandle.x
    );
    this.plane.setRotation(pullAngle);

    // Calculate power for HUD
    const dx = this.launchOrigin.x - this.dragHandle.x;
    const dy = this.launchOrigin.y - this.dragHandle.y;
    const dragDist = Math.hypot(dx, dy);
    const power = Math.min(dragDist / MAX_DRAG_DISTANCE, 1);
    this.powerText.setText(`PWR: ${Math.round(power * 100)}%`);

    // Draw trajectory preview
    this.previewGraphics.clear();
    if (power > 0.05) {
      const angle = Math.atan2(dy, dx);
      const speed = power * MAX_SPEED;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;

      const dt = 0.04;
      let px = this.launchOrigin.x;
      let py = this.launchOrigin.y;

      this.previewGraphics.fillStyle(0xD0D0D0, 0.6);
      for (let i = 0; i < 40; i++) {
        px += vx * dt;
        py += vy * dt;
        vy += GRAVITY * dt;
        vx += this.windStrength * dt;
        vx *= 0.995;
        vy *= 0.999;
        if (py > GROUND_Y) break;
        if (i % 2 === 0) {
          this.previewGraphics.fillCircle(px, py, 2);
        }
      }
    }
  }

  private updateFlight() {
    const body = this.plane.body as Phaser.Physics.Arcade.Body;

    // Air drag
    body.velocity.x *= 0.9985;
    body.velocity.y *= 0.9995;

    // Rotate plane nose to follow velocity
    if (body.speed > 10) {
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      this.plane.setRotation(angle);
    }

    // Update distance display
    const dist = Math.max(0, Math.floor((this.plane.x - LAUNCH_X) / GRID_SIZE));
    this.distanceText.setText(`DIST: ${dist}`);

    // Check landing conditions
    if (this.plane.y >= GROUND_Y) {
      this.plane.y = GROUND_Y;
      this.triggerLanded();
    } else if (body.speed < 15 && this.plane.x > LAUNCH_X + 40) {
      this.triggerLanded();
    } else if (this.plane.x <= 5 && body.velocity.x < 0) {
      // Flew backwards and hit left wall
      this.triggerLanded();
    }
  }

  // --- Collision ---

  private handleCollision(
    plane: Phaser.Physics.Arcade.Sprite,
    obstacle: Phaser.Physics.Arcade.Sprite
  ) {
    if (this.gameState !== 'FLYING') return;

    const type = obstacle.getData('type');
    const body = plane.body as Phaser.Physics.Arcade.Body;

    // Look up the object definition for its effect category
    const objDef = TOSS_PAPER_OBJECTS.find(o => o.id === type);
    const effect = objDef?.effect;

    if (effect === 'cosmetic') {
      // No gameplay effect
      return;
    }

    if (type === 'wall' || type === 'sticky_note' || type === 'tape_roll') {
      // Blockers — stop the plane
      this.triggerLanded();
    } else if (type === 'ball' || type === 'paper_cup') {
      // Bouncy deflection
      body.velocity.x *= -0.6;
      body.velocity.y += Phaser.Math.Between(-80, 80);
    } else if (type === 'fan') {
      // Wind gust
      body.velocity.x += Phaser.Math.Between(-120, 120);
      body.velocity.y += Phaser.Math.Between(-60, 60);
    } else if (effect === 'blocker') {
      // Fallback for any future blocker
      this.triggerLanded();
    } else if (effect === 'environmental') {
      // Fallback for any future environmental
      body.velocity.x += Phaser.Math.Between(-80, 80);
      body.velocity.y += Phaser.Math.Between(-40, 40);
    }
  }

  // --- Helpers ---

  private updateWindDisplay() {
    const windUnits = this.windStrength / 20;
    let arrow = '—';
    if (windUnits > 0) arrow = '→';
    else if (windUnits < 0) arrow = '←';
    const absWind = Math.abs(windUnits);
    this.windText.setText(`Wind: ${arrow} ${absWind > 0 ? absWind : 'calm'}`);
  }

  private drawGhostObstacle(g: Phaser.GameObjects.Graphics, spriteKey: string) {
    const colorInt = parseInt(this.playerColor.replace('#', '0x'));
    const objDef = TOSS_PAPER_OBJECTS.find(o => o.spriteKey === spriteKey);
    const w = (objDef?.gridWidth || 1) * GRID_SIZE;
    const h = (objDef?.gridHeight || 1) * GRID_SIZE;

    g.fillStyle(colorInt, 0.3);
    g.fillRect(0, 0, w, h);
    g.lineStyle(2, colorInt, 1);
    g.strokeRect(0, 0, w, h);
  }
}
