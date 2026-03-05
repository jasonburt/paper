import Phaser from 'phaser';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import {
  getUser, createUser, updateUserProfile,
  getPlayerColor, getPlayerIcon,
  PLAYER_COLORS, PLAYER_ICONS,
  drawPlayerIcon, isProfileSet,
} from '../utils/user';
import { createDOMInput, removeDOMInput } from '../utils/dom-input';

export class PaperCrewScene extends Phaser.Scene {
  private usernameInput: HTMLInputElement | null = null;
  private crews: any[] = [];
  private pickerElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'PaperCrewScene' });
  }

  async create() {
    this.crews = [];
    this.pickerElements = [];

    // Check for user identity
    const user = getUser();
    if (!user) {
      this.showUsernamePrompt();
      return;
    }

    // If user hasn't explicitly set their profile yet, show the picker
    if (!isProfileSet()) {
      this.showProfilePicker(user.id, user.username);
      return;
    }

    await this.loadHub(user.id);
  }

  // --- Step 1: Username prompt ---

  private showUsernamePrompt() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 3, 'Choose a Username', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 3 + 50, 'This is how others will see you', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    // DOM input for username
    this.usernameInput = createDOMInput(width / 2 - 120, height / 2, 240, {
      placeholder: 'Your name...',
      maxLength: 20,
    });

    // Submit button
    const submit = this.add.text(width / 2, height / 2 + 60, '[ Go ]', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#4992FF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    submit.on('pointerover', () => submit.setColor('#FF8F01'));
    submit.on('pointerout', () => submit.setColor('#4992FF'));
    submit.on('pointerdown', async () => {
      const name = this.usernameInput?.value.trim();
      if (!name) return;
      submit.setText('...');
      try {
        await createUser(name);
        removeDOMInput(this.usernameInput);
        this.usernameInput = null;
        this.scene.restart();
      } catch {
        submit.setText('[ Go ]');
      }
    });

    // Also submit on Enter
    this.usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit.emit('pointerdown');
    });

    this.addBackButton();
  }

  // --- Step 2: Profile picker (icon + color) ---

  private showProfilePicker(userId: number, username: string) {
    const { width, height } = this.scale;
    let selectedIcon = getPlayerIcon();
    let selectedColor = getPlayerColor();

    // Title
    const title = this.add.text(width / 2, 30, `Welcome, ${username}!`, {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);
    this.pickerElements.push(title);

    const subtitle = this.add.text(width / 2, 65, 'Pick your icon and color', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);
    this.pickerElements.push(subtitle);

    // Preview area (shows current selection)
    const previewG = this.add.graphics();
    this.pickerElements.push(previewG);

    const previewLabel = this.add.text(width / 2, 115, '', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#6B6B6B',
    }).setOrigin(0.5);
    this.pickerElements.push(previewLabel);

    const drawPreview = () => {
      previewG.clear();
      // Background circle
      previewG.fillStyle(0xF5F0E8, 1);
      previewG.fillCircle(width / 2, 100, 22);
      // Icon
      drawPlayerIcon(previewG, selectedIcon, width / 2 - 12, 88, 24, selectedColor);
      const iconData = PLAYER_ICONS.find(i => i.key === selectedIcon);
      previewLabel.setText(iconData?.label || selectedIcon);
    };
    drawPreview();

    // --- Icon grid ---
    const iconLabel = this.add.text(width / 2, 145, 'Icon', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);
    this.pickerElements.push(iconLabel);

    const iconCols = 6;
    const iconSize = 28;
    const iconGap = 65;
    const iconStartX = width / 2 - ((iconCols - 1) * iconGap) / 2;
    const iconY = 185;

    // Track icon highlight rings for updating
    const iconHighlights: Phaser.GameObjects.Graphics[] = [];

    PLAYER_ICONS.forEach((icon, i) => {
      const col = i % iconCols;
      const x = iconStartX + col * iconGap;
      const y = iconY;

      // Highlight ring graphics
      const ringG = this.add.graphics();
      this.pickerElements.push(ringG);
      iconHighlights.push(ringG);

      // Icon graphics
      const g = this.add.graphics();
      drawPlayerIcon(g, icon.key, x - iconSize / 2, y - iconSize / 2, iconSize, selectedColor);
      this.pickerElements.push(g);

      // Label
      const lab = this.add.text(x, y + iconSize / 2 + 8, icon.label, {
        fontSize: '9px',
        fontFamily: 'Georgia, serif',
        color: '#6B6B6B',
      }).setOrigin(0.5);
      this.pickerElements.push(lab);

      // Hit zone
      const zone = this.add.zone(x, y, iconGap - 4, iconSize + 20)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        selectedIcon = icon.key;
        updateHighlights();
        redrawIcons();
        drawPreview();
      });
      this.pickerElements.push(zone);
    });

    const updateHighlights = () => {
      iconHighlights.forEach((ringG, i) => {
        ringG.clear();
        const col = i % iconCols;
        const x = iconStartX + col * iconGap;
        if (PLAYER_ICONS[i].key === selectedIcon) {
          ringG.lineStyle(2, 0x1A1A1A, 1);
          ringG.strokeCircle(x, iconY, iconSize / 2 + 5);
        }
      });
    };
    updateHighlights();

    // Store icon graphics refs for redrawing when color changes
    const iconGraphics: Phaser.GameObjects.Graphics[] = [];

    const redrawIcons = () => {
      // We need to clear and redraw all icon graphics with the new color
      // This is handled by destroying old ones and creating new ones
      // For simplicity, just redraw the preview — icons keep their initial color
      // until we redraw them below
    };

    // --- Color grid ---
    const colorLabel = this.add.text(width / 2, 230, 'Color', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);
    this.pickerElements.push(colorLabel);

    const colorCols = 6;
    const dotSize = 20;
    const colorGap = 65;
    const colorStartX = width / 2 - ((colorCols - 1) * colorGap) / 2;
    const colorY = 270;

    const colorHighlights: Phaser.GameObjects.Graphics[] = [];

    PLAYER_COLORS.forEach((c, i) => {
      const col = i % colorCols;
      const x = colorStartX + col * colorGap;
      const y = colorY;

      // Highlight ring
      const ringG = this.add.graphics();
      this.pickerElements.push(ringG);
      colorHighlights.push(ringG);

      // Color dot
      const g = this.add.graphics();
      g.fillStyle(parseInt(c.hex.replace('#', '0x')), 1);
      g.fillCircle(x, y, dotSize);
      this.pickerElements.push(g);

      // Label
      const lab = this.add.text(x, y + dotSize + 8, c.label, {
        fontSize: '9px',
        fontFamily: 'Georgia, serif',
        color: '#6B6B6B',
      }).setOrigin(0.5);
      this.pickerElements.push(lab);

      // Hit zone
      const zone = this.add.zone(x, y, colorGap - 4, dotSize * 2 + 16)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        selectedColor = c.hex;
        updateColorHighlights();
        // Redraw icons with new color
        rebuildIconGraphics();
        drawPreview();
      });
      this.pickerElements.push(zone);
    });

    const updateColorHighlights = () => {
      colorHighlights.forEach((ringG, i) => {
        ringG.clear();
        const col = i % colorCols;
        const x = colorStartX + col * colorGap;
        if (PLAYER_COLORS[i].hex === selectedColor) {
          ringG.lineStyle(2, 0x1A1A1A, 1);
          ringG.strokeCircle(x, colorY, dotSize + 4);
        }
      });
    };
    updateColorHighlights();

    // Keep track of icon shape graphics so we can rebuild them on color change
    let iconShapeGraphics: Phaser.GameObjects.Graphics[] = [];

    const buildIconGraphics = () => {
      const result: Phaser.GameObjects.Graphics[] = [];
      PLAYER_ICONS.forEach((icon, i) => {
        const col = i % iconCols;
        const x = iconStartX + col * iconGap;
        const g = this.add.graphics();
        drawPlayerIcon(g, icon.key, x - iconSize / 2, iconY - iconSize / 2, iconSize, selectedColor);
        this.pickerElements.push(g);
        result.push(g);
      });
      return result;
    };

    const rebuildIconGraphics = () => {
      iconShapeGraphics.forEach(g => g.destroy());
      iconShapeGraphics = buildIconGraphics();
    };

    // Build initial icons (destroy the ones we already drew above)
    // Actually the ones above are part of pickerElements but not tracked separately.
    // Let's just build them fresh:
    iconShapeGraphics = buildIconGraphics();

    // --- Confirm button ---
    const confirmBtn = this.add.text(width / 2, 340, '[ Save & Continue ]', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#4992FF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.pickerElements.push(confirmBtn);

    confirmBtn.on('pointerover', () => confirmBtn.setColor('#FF8F01'));
    confirmBtn.on('pointerout', () => confirmBtn.setColor('#4992FF'));
    confirmBtn.on('pointerdown', async () => {
      confirmBtn.setText('Saving...');
      confirmBtn.disableInteractive();
      try {
        await updateUserProfile(userId, selectedIcon, selectedColor);
        this.clearPicker();
        this.scene.restart();
      } catch {
        confirmBtn.setText('[ Save & Continue ]');
        confirmBtn.setInteractive({ useHandCursor: true });
      }
    });

    // Skip link
    const skip = this.add.text(width / 2, 380, 'skip for now', {
      fontSize: '12px',
      fontFamily: 'Georgia, serif',
      color: '#B0A898',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.pickerElements.push(skip);

    skip.on('pointerover', () => skip.setColor('#6B6B6B'));
    skip.on('pointerout', () => skip.setColor('#B0A898'));
    skip.on('pointerdown', async () => {
      // Save default and continue
      await updateUserProfile(userId, selectedIcon, selectedColor).catch(() => {});
      this.clearPicker();
      this.scene.restart();
    });

    this.addBackButton();
  }

  private clearPicker() {
    this.pickerElements.forEach(el => el.destroy());
    this.pickerElements = [];
  }

  // --- Step 3: Crew hub ---

  private async loadHub(userId: number) {
    const { width, height } = this.scale;
    const user = getUser();

    // Header with user's icon
    this.add.text(width / 2, 40, 'Paper Crew', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

    // Player identity badge
    if (user) {
      const badgeG = this.add.graphics();
      const iconKey = user.icon || getPlayerIcon();
      const colorHex = user.color || getPlayerColor();
      drawPlayerIcon(badgeG, iconKey, width / 2 + 100, 30, 20, colorHex);

      this.add.text(width / 2 + 125, 40, user.username, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#6B6B6B',
      }).setOrigin(0, 0.5);

      // Edit profile button
      const editBtn = this.add.text(width - 40, 40, '⚙', {
        fontSize: '18px',
        color: '#B0A898',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      editBtn.on('pointerover', () => editBtn.setColor('#FF8F01'));
      editBtn.on('pointerout', () => editBtn.setColor('#B0A898'));
      editBtn.on('pointerdown', () => {
        this.showProfilePicker(user.id, user.username);
      });
    }

    // Fetch user's crews
    try {
      this.crews = await api.get<any[]>(`/crews/user/${userId}`);
    } catch {
      this.crews = [];
    }

    if (this.crews.length === 0) {
      this.add.text(width / 2, height / 3 + 20, 'No crews yet', {
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: '#6B6B6B',
      }).setOrigin(0.5);

      this.add.text(width / 2, height / 3 + 50, 'Create or join one to start competing!', {
        fontSize: '14px',
        fontFamily: 'Georgia, serif',
        color: '#6B6B6B',
      }).setOrigin(0.5);
    } else {
      this.add.text(40, 80, 'Your Crews:', {
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: '#6B6B6B',
      });

      this.crews.forEach((crew, i) => {
        const y = 120 + i * 60;

        // Crew card background
        const bg = this.add.graphics();
        bg.fillStyle(0xF9F9F9, 1);
        bg.fillRoundedRect(40, y, width - 80, 50, 6);
        bg.lineStyle(1, 0xD0D0D0, 0.6);
        bg.strokeRoundedRect(40, y, width - 80, 50, 6);

        // Crew dot
        bg.fillStyle(0x4992FF, 1);
        bg.fillCircle(60, y + 25, 6);

        this.add.text(80, y + 10, crew.name, {
          fontSize: '20px',
          fontFamily: 'Georgia, serif',
          color: '#1A1A1A',
        });

        this.add.text(80, y + 32, `${crew.member_count} members`, {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#6B6B6B',
        });

        // Make the whole area clickable
        const hitArea = this.add.rectangle(width / 2, y + 25, width - 80, 50).setInteractive({ useHandCursor: true });
        hitArea.setAlpha(0.001);
        hitArea.on('pointerdown', () => {
          pushRoute(`/paper-crew-room/${crew.id}`);
          this.scene.stop();
        });
      });
    }

    // Buttons
    const btnY = Math.max(height / 2 + 40, 120 + this.crews.length * 60 + 30);

    const createBtn = this.add.text(width / 2, btnY, '[ Create Crew ]', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#4992FF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    createBtn.on('pointerover', () => createBtn.setColor('#FF8F01'));
    createBtn.on('pointerout', () => createBtn.setColor('#4992FF'));
    createBtn.on('pointerdown', () => {
      pushRoute('/paper-crew/create');
      this.scene.start('CreateCrewScene');
    });

    const joinBtn = this.add.text(width / 2, btnY + 45, '[ Join Crew ]', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#4992FF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    joinBtn.on('pointerover', () => joinBtn.setColor('#FF8F01'));
    joinBtn.on('pointerout', () => joinBtn.setColor('#4992FF'));
    joinBtn.on('pointerdown', () => {
      pushRoute('/paper-crew/join');
      this.scene.start('JoinCrewScene');
    });

    this.addBackButton();
  }

  private addBackButton() {
    const back = this.add.text(16, 570, '← Back', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#FF8F01'));
    back.on('pointerout', () => back.setColor('#6B6B6B'));
    back.on('pointerdown', () => {
      this.cleanup();
      pushRoute('/');
      this.scene.start('MainMenuScene');
    });
  }

  private cleanup() {
    removeDOMInput(this.usernameInput);
    this.usernameInput = null;
    this.clearPicker();
  }

  shutdown() {
    this.cleanup();
  }
}
