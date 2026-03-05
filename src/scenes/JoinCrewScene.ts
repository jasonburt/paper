import Phaser from 'phaser';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser } from '../utils/user';
import { createDOMInput, removeDOMInput } from '../utils/dom-input';

export class JoinCrewScene extends Phaser.Scene {
  private codeInput: HTMLInputElement | null = null;
  private errorText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'JoinCrewScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 4, 'Join a Crew', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 4 + 50, 'Enter invite code:', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    this.codeInput = createDOMInput(width / 2 - 100, height / 2 - 30, 200, {
      placeholder: 'ABC123',
      maxLength: 6,
      uppercase: true,
      fontSize: '24px',
    });
    this.codeInput.style.textAlign = 'center';
    this.codeInput.style.letterSpacing = '4px';
    this.codeInput.style.fontFamily = 'monospace';

    this.errorText = this.add.text(width / 2, height / 2 + 20, '', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#FF4F36',
    }).setOrigin(0.5);

    const submit = this.add.text(width / 2, height / 2 + 50, '[ Join ]', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#4992FF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    submit.on('pointerover', () => submit.setColor('#FF8F01'));
    submit.on('pointerout', () => submit.setColor('#4992FF'));
    submit.on('pointerdown', () => this.handleJoin(submit));

    this.codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleJoin(submit);
    });

    // Back button
    const back = this.add.text(16, 570, '← Back', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#FF8F01'));
    back.on('pointerout', () => back.setColor('#6B6B6B'));
    back.on('pointerdown', () => {
      this.cleanup();
      pushRoute('/paper-crew');
      this.scene.start('PaperCrewScene');
    });
  }

  private async handleJoin(submitBtn: Phaser.GameObjects.Text) {
    const code = this.codeInput?.value.trim().toUpperCase();
    if (!code || code.length < 4) {
      this.errorText.setText('Enter a valid code');
      return;
    }
    const user = getUser();
    if (!user) return;

    submitBtn.setText('...');
    this.errorText.setText('');

    try {
      const result = await api.post<any>('/crews/join', { invite_code: code, user_id: user.id });
      this.cleanup();
      pushRoute(`/paper-crew-room/${result.crew_id}`);
      this.scene.stop();
    } catch (e: any) {
      this.errorText.setText(e.message || 'Failed to join');
      submitBtn.setText('[ Join ]');
    }
  }

  private cleanup() {
    removeDOMInput(this.codeInput);
    this.codeInput = null;
  }

  shutdown() {
    this.cleanup();
  }
}
