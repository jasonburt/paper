import Phaser from 'phaser';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser, getPlayerColor, setPlayerColor, PLAYER_COLORS } from '../utils/user';

type GameState = 'COLOR_PICK' | 'WAVE_INTRO' | 'SHOOTING' | 'WAVE_END' | 'PLACE_OBSTACLE' | 'GAME_OVER';

const MULTI_MAX_WAVES = 3;

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const GROUND_Y = 480;
const GRID_SIZE = 40;
const HIT_RADIUS = 44;
const BASE_CREATURES = 3;
const BASE_SPEED_MIN = 150;
const BASE_SPEED_MAX = 350;
const SPEED_INCREASE = 30; // per wave
const SPAWN_MARGIN = 60; // vertical margin from top/ground

export class OrigamiTrailScene extends Phaser.Scene {
  // Mode
  private mode: 'single' | 'multi' = 'single';
  private crewId: number | null = null;
  private userId: number | null = null;
  private playerColor = '#FF4F36';

  private gameState: GameState = 'WAVE_INTRO';
  private wave = 0;
  private score = 0;
  private combo = 0;
  private creaturesAlive = 0;
  private creaturesTotal = 0;

  // Groups
  private creatures: Phaser.Physics.Arcade.Sprite[] = [];
  private obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles: Phaser.GameObjects.GameObject[] = [];

  // Ghost obstacle for placement
  private ghostObstacle: Phaser.GameObjects.Graphics | null = null;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private backText!: Phaser.GameObjects.Text;

  // Crosshair
  private crosshair!: Phaser.GameObjects.Graphics;

  // Color picker elements
  private colorPickElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'OrigamiTrailScene' });
  }

  init(data: any) {
    this.mode = data?.mode === 'multi' ? 'multi' : 'single';
    this.crewId = data?.crew_id || null;
    this.userId = data?.user_id || getUser()?.id || null;
    this.playerColor = getPlayerColor();
    this.wave = 0;
    this.score = 0;
    this.combo = 0;
    this.creatures = [];
    this.obstacles = [];
    this.colorPickElements = [];
  }

  create() {
    this.gameState = 'WAVE_INTRO';
    this.creaturesAlive = 0;
    this.creaturesTotal = 0;

    this.drawBirdTexture();
    this.drawWallTexture();
    this.setupWorld();
    this.setupHUD();
    this.setupCrosshair();
    this.setupInput();

    if (this.mode === 'multi') {
      this.startMultiGame();
    } else {
      this.startNextWave();
    }
  }

  // --- Color picker (multi mode) ---

  private showColorPicker() {
    this.gameState = 'COLOR_PICK';
    const { width, height } = this.scale;

    this.scoreText.setVisible(false);
    this.waveText.setVisible(false);
    this.backText.setVisible(false);

    const title = this.add.text(width / 2, height / 4, 'Choose Your Color', {
      fontSize: '28px', fontFamily: 'Georgia, serif', color: '#1A1A1A',
    }).setOrigin(0.5).setDepth(200);
    this.colorPickElements.push(title);

    const subtitle = this.add.text(width / 2, height / 4 + 40, 'Your obstacles will be this color', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
    }).setOrigin(0.5).setDepth(200);
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

      const g = this.add.graphics().setDepth(200);
      if (c.hex === this.playerColor) {
        g.lineStyle(3, 0x1A1A1A, 1);
        g.strokeCircle(x, y, dotSize + 4);
      }
      g.fillStyle(parseInt(c.hex.replace('#', '0x')), 1);
      g.fillCircle(x, y, dotSize);
      this.colorPickElements.push(g);

      const label = this.add.text(x, y + dotSize + 10, c.label, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
      }).setOrigin(0.5).setDepth(200);
      this.colorPickElements.push(label);

      const hitZone = this.add.zone(x, y, dotSize * 2.5, dotSize * 2.5)
        .setDepth(201).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        this.playerColor = c.hex;
        setPlayerColor(c.hex);
        this.colorPickElements.forEach(el => el.destroy());
        this.colorPickElements = [];
        this.startMultiGame();
      });
      this.colorPickElements.push(hitZone);
    });
  }

  private async startMultiGame() {
    this.scoreText.setVisible(true);
    this.waveText.setVisible(true);

    // Load existing obstacles from server
    if (this.crewId) {
      try {
        const serverObstacles = await api.get<any[]>(`/obstacles/origami-trail?crew_id=${this.crewId}`);
        for (const o of serverObstacles) {
          const obstacle = this.obstacleGroup.create(o.x, o.y, 'trail_wall') as Phaser.Physics.Arcade.Sprite;
          obstacle.setOrigin(0, 0);
          obstacle.refreshBody();
          obstacle.setTint(parseInt(o.color.replace('#', '0x')));
          this.obstacles.push(obstacle);
        }
      } catch { /* continue without */ }
    }

    this.startNextWave();
  }

  // --- Textures ---

  private drawBirdTexture() {
    if (this.textures.exists('bird')) return;
    const g = this.add.graphics();
    // Origami bird — triangular body
    g.fillStyle(0xFF4F36, 1);
    g.fillTriangle(0, 12, 32, 0, 32, 24); // body
    // Wing accent
    g.fillStyle(0xFDE801, 1);
    g.fillTriangle(8, 12, 24, 5, 24, 12); // top wing highlight
    g.generateTexture('bird', 34, 26);
    g.destroy();
  }

  private drawWallTexture() {
    if (this.textures.exists('trail_wall')) return;
    const g = this.add.graphics();
    g.fillStyle(0xE8E8E8, 1);
    g.fillRect(0, 0, 40, 40);
    g.lineStyle(1, 0xD0D0D0, 1);
    g.strokeRect(0, 0, 40, 40);
    g.lineBetween(20, 0, 20, 40);
    g.lineBetween(0, 20, 40, 20);
    g.generateTexture('trail_wall', 40, 40);
    g.destroy();
  }

  // --- World ---

  private setupWorld() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.obstacleGroup = this.physics.add.staticGroup();

    // Ground
    const ground = this.add.graphics();
    ground.fillStyle(0xF5F0E8, 1);
    ground.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    ground.lineStyle(2, 0xD0D0D0, 0.8);
    ground.lineBetween(0, GROUND_Y, WORLD_WIDTH, GROUND_Y);

    // Subtle landscape elements (paper trees)
    this.drawTree(120, GROUND_Y);
    this.drawTree(380, GROUND_Y);
    this.drawTree(620, GROUND_Y);
  }

  private drawTree(x: number, groundY: number) {
    const g = this.add.graphics();
    // Trunk
    g.fillStyle(0xC8B89A, 1);
    g.fillRect(x - 3, groundY - 40, 6, 40);
    // Canopy (triangle — origami style)
    g.fillStyle(0xB8D8B8, 0.6);
    g.fillTriangle(x, groundY - 70, x - 20, groundY - 30, x + 20, groundY - 30);
    g.fillTriangle(x, groundY - 90, x - 15, groundY - 55, x + 15, groundY - 55);
  }

  // --- HUD ---

  private setupHUD() {
    const mono = (size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontSize: `${size}px`,
      fontFamily: 'monospace',
      color,
    });

    this.scoreText = this.add.text(16, 12, 'SCORE: 0', mono(18, '#1A1A1A'))
      .setDepth(100);

    this.waveText = this.add.text(784, 12, 'Wave 1', mono(16, '#6B6B6B'))
      .setOrigin(1, 0).setDepth(100);

    this.comboText = this.add.text(16, 36, '', mono(14, '#FF8F01'))
      .setDepth(100);

    this.hintText = this.add.text(400, 555, '', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5, 0).setDepth(100);

    // Back button
    this.backText = this.add.text(16, 570, '← Back', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setDepth(100).setInteractive({ useHandCursor: true });
    this.backText.on('pointerover', () => this.backText.setColor('#FF8F01'));
    this.backText.on('pointerout', () => this.backText.setColor('#6B6B6B'));
    this.backText.on('pointerdown', () => {
      if (this.mode === 'multi' && this.crewId) {
        pushRoute(`/paper-crew-room/${this.crewId}`);
        this.scene.stop();
      } else {
        pushRoute('/');
        this.scene.stop();
      }
    });
  }

  private setupCrosshair() {
    this.crosshair = this.add.graphics().setDepth(150);
    this.crosshair.setVisible(false);
  }

  private drawCrosshairAt(x: number, y: number) {
    this.crosshair.clear();
    this.crosshair.lineStyle(2, 0x1A1A1A, 0.5);
    const r = 16;
    this.crosshair.strokeCircle(x, y, r);
    this.crosshair.lineBetween(x - r - 4, y, x - r + 6, y);
    this.crosshair.lineBetween(x + r - 6, y, x + r + 4, y);
    this.crosshair.lineBetween(x, y - r - 4, x, y - r + 6);
    this.crosshair.lineBetween(x, y + r - 6, x, y + r + 4);
  }

  // --- Input ---

  private setupInput() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState === 'SHOOTING') {
        this.crosshair.setVisible(true);
        this.drawCrosshairAt(pointer.x, pointer.y);
      } else if (this.gameState === 'PLACE_OBSTACLE' && this.ghostObstacle) {
        const gridX = Math.floor(pointer.x / GRID_SIZE) * GRID_SIZE;
        const gridY = Math.floor(pointer.y / GRID_SIZE) * GRID_SIZE;
        this.ghostObstacle.setPosition(gridX, gridY);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState === 'SHOOTING') {
        this.handleShot(pointer.x, pointer.y);
      } else if (this.gameState === 'PLACE_OBSTACLE') {
        this.confirmObstaclePlacement(pointer.x, pointer.y);
      }
    });
  }

  // --- Wave flow ---

  private startNextWave() {
    this.wave++;
    const waveLabel = this.mode === 'multi'
      ? `Wave ${this.wave}/${MULTI_MAX_WAVES}`
      : `Wave ${this.wave}`;
    this.waveText.setText(waveLabel);

    // Show wave intro
    this.gameState = 'WAVE_INTRO';
    this.crosshair.setVisible(false);

    const introText = this.add.text(400, 250, `Wave ${this.wave}`, {
      fontSize: '48px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: introText,
      alpha: 0,
      y: 220,
      duration: 1200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        introText.destroy();
        this.beginWave();
      },
    });
  }

  private beginWave() {
    this.gameState = 'SHOOTING';
    this.hintText.setText('Click to shoot!');

    const count = BASE_CREATURES + Math.floor(this.wave * 0.7);
    this.creaturesTotal = count;
    this.creaturesAlive = count;

    // Spawn creatures staggered over time
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * Phaser.Math.Between(600, 1200), () => {
        if (this.gameState === 'SHOOTING') {
          this.spawnCreature();
        }
      });
    }
  }

  private spawnCreature() {
    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? -30 : WORLD_WIDTH + 30;
    const y = Phaser.Math.Between(SPAWN_MARGIN, GROUND_Y - SPAWN_MARGIN);

    const speedMin = BASE_SPEED_MIN + (this.wave - 1) * SPEED_INCREASE;
    const speedMax = BASE_SPEED_MAX + (this.wave - 1) * SPEED_INCREASE;
    const speed = Phaser.Math.Between(speedMin, speedMax);
    const vx = fromLeft ? speed : -speed;

    const bird = this.physics.add.sprite(x, y, 'bird');
    bird.setDepth(10);
    bird.setFlipX(!fromLeft);
    const body = bird.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, 0);
    body.setAllowGravity(false);

    // Slight vertical wobble via tween
    this.tweens.add({
      targets: bird,
      y: y + Phaser.Math.Between(-30, 30),
      duration: Phaser.Math.Between(800, 1500),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Collision with obstacles
    this.physics.add.overlap(bird, this.obstacleGroup, (_bird, _obstacle) => {
      this.destroyCreature(bird, true);
    });

    this.creatures.push(bird);
  }

  private destroyCreature(bird: Phaser.Physics.Arcade.Sprite, fromObstacle: boolean) {
    if (!bird.active) return;

    // Hit effect — small burst
    const burst = this.add.graphics().setDepth(20);
    burst.fillStyle(0xFDE801, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      burst.fillCircle(
        bird.x + Math.cos(angle) * 12,
        bird.y + Math.sin(angle) * 12,
        3
      );
    }
    this.tweens.add({
      targets: burst,
      alpha: 0,
      duration: 400,
      onComplete: () => burst.destroy(),
    });

    // Score
    if (fromObstacle) {
      this.score += 5;
    }

    bird.destroy();
    this.creaturesAlive--;

    const idx = this.creatures.indexOf(bird);
    if (idx !== -1) this.creatures.splice(idx, 1);

    this.scoreText.setText(`SCORE: ${this.score}`);
    this.checkWaveEnd();
  }

  private handleShot(x: number, y: number) {
    // Draw shot indicator
    const shotMarker = this.add.graphics().setDepth(20);
    shotMarker.fillStyle(0xFF4F36, 0.4);
    shotMarker.fillCircle(x, y, 8);
    this.tweens.add({
      targets: shotMarker,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => shotMarker.destroy(),
    });

    // Check hits
    let hit = false;
    for (const bird of [...this.creatures]) {
      if (!bird.active) continue;
      const dist = Phaser.Math.Distance.Between(x, y, bird.x, bird.y);
      if (dist < HIT_RADIUS) {
        hit = true;
        this.combo++;
        const multiplier = Math.min(this.combo, 5);
        const points = 10 * multiplier;
        this.score += points;

        // Show points popup
        const popup = this.add.text(bird.x, bird.y - 20, `+${points}`, {
          fontSize: '18px',
          fontFamily: 'monospace',
          color: '#FF4F36',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({
          targets: popup,
          y: popup.y - 30,
          alpha: 0,
          duration: 700,
          onComplete: () => popup.destroy(),
        });

        this.destroyCreature(bird, false);
        break; // one hit per click
      }
    }

    if (!hit) {
      this.combo = 0;
    }

    // Update HUD
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.comboText.setText(this.combo >= 2 ? `COMBO x${Math.min(this.combo, 5)}` : '');
  }

  private checkWaveEnd() {
    // Wave ends when no creatures are alive or on screen
    if (this.creaturesAlive <= 0 && this.creatures.length === 0) {
      this.endWave();
    }
  }

  private endWave() {
    if (this.gameState !== 'SHOOTING') return;
    this.gameState = 'WAVE_END';
    this.crosshair.setVisible(false);
    this.hintText.setText('');

    // In multi mode, check if we've hit the wave limit
    const isLastWave = this.mode === 'multi' && this.wave >= MULTI_MAX_WAVES;

    if (isLastWave) {
      // Post score then go to obstacle placement as final action
      if (this.userId) {
        api.post('/scores', {
          user_id: this.userId,
          game: 'origami-trail',
          score: this.score,
          crew_id: this.crewId,
        }).catch(() => {});
      }
    }

    const clearText = this.add.text(400, 280, isLastWave ? 'Game Over!' : 'Wave Clear!', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: isLastWave ? '#FF4F36' : '#4992FF',
    }).setOrigin(0.5).setDepth(200);

    const finalScoreText = isLastWave
      ? this.add.text(400, 320, `Final Score: ${this.score}`, {
          fontSize: '20px', fontFamily: 'Georgia, serif', color: '#1A1A1A',
        }).setOrigin(0.5).setDepth(200)
      : null;

    this.tweens.add({
      targets: [clearText, finalScoreText].filter(Boolean),
      alpha: 0,
      duration: isLastWave ? 2000 : 1500,
      onComplete: () => {
        clearText.destroy();
        finalScoreText?.destroy();
        this.enterPlaceObstacle();
      },
    });
  }

  private enterPlaceObstacle() {
    this.gameState = 'PLACE_OBSTACLE';
    this.hintText.setText('Click to place a paper wall');

    this.ghostObstacle = this.add.graphics().setDepth(50).setAlpha(0.5);
    const ghostColor = parseInt(this.playerColor.replace('#', '0x'));
    this.ghostObstacle.fillStyle(ghostColor, 0.3);
    this.ghostObstacle.fillRect(0, 0, 40, 40);
    this.ghostObstacle.lineStyle(2, ghostColor, 0.8);
    this.ghostObstacle.strokeRect(0, 0, 40, 40);
  }

  private confirmObstaclePlacement(x: number, y: number) {
    const gridX = Math.floor(x / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.floor(y / GRID_SIZE) * GRID_SIZE;

    // Don't place below ground or at very top
    if (gridY >= GROUND_Y || gridY < 20) return;

    // Remove ghost
    if (this.ghostObstacle) {
      this.ghostObstacle.destroy();
      this.ghostObstacle = null;
    }

    // Create obstacle
    const obstacle = this.obstacleGroup.create(gridX, gridY, 'trail_wall') as Phaser.Physics.Arcade.Sprite;
    obstacle.setOrigin(0, 0);
    obstacle.refreshBody();
    obstacle.setTint(parseInt(this.playerColor.replace('#', '0x')));
    this.obstacles.push(obstacle);

    this.hintText.setText('');

    const isLastWave = this.mode === 'multi' && this.wave >= MULTI_MAX_WAVES;

    // Save obstacle to server in multi mode
    if (this.mode === 'multi' && this.crewId) {
      api.post('/obstacles', {
        crew_id: this.crewId,
        game: 'origami-trail',
        user_id: this.userId,
        type: 'wall',
        x: gridX,
        y: gridY,
        color: this.playerColor,
      }).catch(() => {});

      if (isLastWave) {
        this.hintText.setText('Obstacle placed! Returning...');
        this.backText.setVisible(false);
        this.time.delayedCall(1200, () => {
          pushRoute(`/paper-crew-room/${this.crewId}`);
          this.scene.stop();
        });
        return;
      }
    }

    // Next wave after short delay
    this.time.delayedCall(800, () => {
      this.startNextWave();
    });
  }

  // --- Update ---

  update() {
    if (this.gameState === 'SHOOTING') {
      // Remove creatures that have gone off-screen
      for (let i = this.creatures.length - 1; i >= 0; i--) {
        const bird = this.creatures[i];
        if (!bird.active) {
          this.creatures.splice(i, 1);
          continue;
        }
        if (bird.x < -60 || bird.x > WORLD_WIDTH + 60) {
          bird.destroy();
          this.creatures.splice(i, 1);
          this.creaturesAlive--;
          // Missed — reset combo
          this.combo = 0;
          this.comboText.setText('');
          this.checkWaveEnd();
        }
      }
    }
  }
}
