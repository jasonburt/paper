import Phaser from 'phaser';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser, createUser } from '../utils/user';
import { createDOMInput, removeDOMInput } from '../utils/dom-input';

export class PaperCrewScene extends Phaser.Scene {
  private usernameInput: HTMLInputElement | null = null;
  private crews: any[] = [];

  constructor() {
    super({ key: 'PaperCrewScene' });
  }

  async create() {
    const { width, height } = this.scale;
    this.crews = [];

    // Check for user identity
    const user = getUser();
    if (!user) {
      this.showUsernamePrompt();
      return;
    }

    await this.loadHub(user.id);
  }

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
        const user = await createUser(name);
        removeDOMInput(this.usernameInput);
        this.usernameInput = null;
        this.scene.restart();
      } catch (e: any) {
        submit.setText('[ Go ]');
      }
    });

    // Also submit on Enter
    this.usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit.emit('pointerdown');
    });

    this.addBackButton();
  }

  private async loadHub(userId: number) {
    const { width, height } = this.scale;

    this.add.text(width / 2, 40, 'Paper Crew', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

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

        const crewText = this.add.text(80, y + 10, crew.name, {
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
          this.scene.start('CrewDetailScene', { crewId: crew.id });
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
  }

  shutdown() {
    this.cleanup();
  }
}
