import Phaser from 'phaser';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser } from '../utils/user';
import { createDOMInput, removeDOMInput } from '../utils/dom-input';

export class CreateCrewScene extends Phaser.Scene {
  private nameInput: HTMLInputElement | null = null;
  private pendingCode: { crewId: number; crewName: string; inviteCode: string } | null = null;

  constructor() {
    super({ key: 'CreateCrewScene' });
  }

  create() {
    if (this.pendingCode) {
      const { crewId, crewName, inviteCode } = this.pendingCode;
      this.pendingCode = null;
      this.showCodeScreen(crewId, crewName, inviteCode);
    } else {
      this.showForm();
    }
  }

  private showForm() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 4, 'Create a Crew', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 4 + 50, 'Crew Name:', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    this.nameInput = createDOMInput(width / 2 - 140, height / 2 - 30, 280, {
      placeholder: 'e.g. Lunch Squad',
      maxLength: 24,
    });

    const submit = this.add.text(width / 2, height / 2 + 40, '[ Create ]', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#FF4F36',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    submit.on('pointerover', () => submit.setColor('#FF8F01'));
    submit.on('pointerout', () => submit.setColor('#FF4F36'));
    submit.on('pointerdown', async () => {
      const name = this.nameInput?.value.trim();
      if (!name) return;
      const user = getUser();
      if (!user) return;

      submit.setText('...');
      try {
        const crew = await api.post<any>('/crews', { name, created_by: user.id });
        this.cleanup();
        this.scene.restart({ crewId: crew.id, crewName: crew.name, inviteCode: crew.invite_code });
      } catch (e: any) {
        submit.setText('[ Create ]');
      }
    });

    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit.emit('pointerdown');
    });

    this.addBackButton('/paper-crew', 'PaperCrewScene');
  }

  init(data: any) {
    if (data?.inviteCode) {
      this.pendingCode = { crewId: data.crewId, crewName: data.crewName, inviteCode: data.inviteCode };
    } else {
      this.pendingCode = null;
    }
  }

  private showCodeScreen(crewId: number, crewName: string, inviteCode: string) {
    const { width, height } = this.scale;

    this.cameras.main.fadeIn(200);

    this.add.text(width / 2, height / 5, 'Crew Created!', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 5 + 45, crewName, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 3 + 40, 'Your invite code:', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    // Code display
    const codeBg = this.add.graphics();
    codeBg.fillStyle(0xF9F9F9, 1);
    codeBg.fillRoundedRect(width / 2 - 100, height / 2 - 30, 200, 60, 8);
    codeBg.lineStyle(2, 0x4992FF, 1);
    codeBg.strokeRoundedRect(width / 2 - 100, height / 2 - 30, 200, 60, 8);

    this.add.text(width / 2, height / 2, inviteCode, {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#1A1A1A',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 50, 'Share this code with friends', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    // Copy button
    const copyBtn = this.add.text(width / 2, height / 2 + 90, '[ Copy Code ]', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#4992FF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    copyBtn.on('pointerover', () => copyBtn.setColor('#FF8F01'));
    copyBtn.on('pointerout', () => copyBtn.setColor('#4992FF'));
    copyBtn.on('pointerdown', () => {
      navigator.clipboard.writeText(inviteCode).then(() => {
        copyBtn.setText('Copied!');
        this.time.delayedCall(1500, () => copyBtn.setText('[ Copy Code ]'));
      });
    });

    // Done button
    const done = this.add.text(width / 2, height / 2 + 135, '[ Go to Crew ]', {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#FF4F36',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    done.on('pointerover', () => done.setColor('#FF8F01'));
    done.on('pointerout', () => done.setColor('#FF4F36'));
    done.on('pointerdown', () => {
      pushRoute(`/paper-crew-room/${crewId}`);
      this.scene.stop();
    });
  }

  private addBackButton(route: string, scene: string) {
    const back = this.add.text(16, 570, '← Back', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#FF8F01'));
    back.on('pointerout', () => back.setColor('#6B6B6B'));
    back.on('pointerdown', () => {
      this.cleanup();
      pushRoute(route);
      this.scene.start(scene);
    });
  }

  private cleanup() {
    removeDOMInput(this.nameInput);
    this.nameInput = null;
  }

  shutdown() {
    this.cleanup();
  }
}
