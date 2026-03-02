import Phaser from 'phaser';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser } from '../utils/user';

interface CrewData {
  id: number;
  name: string;
  invite_code: string;
  members: Array<{ id: number; username: string }>;
  game_count: number;
}

export class CrewDetailScene extends Phaser.Scene {
  private crewId = 0;
  private crew: CrewData | null = null;

  constructor() {
    super({ key: 'CrewDetailScene' });
  }

  init(data: any) {
    this.crewId = data?.crewId || 0;
  }

  async create() {
    const { width, height } = this.scale;

    if (!this.crewId) {
      this.add.text(width / 2, height / 2, 'No crew selected', {
        fontSize: '20px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
      }).setOrigin(0.5);
      this.addBackButton();
      return;
    }

    // Loading
    const loading = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
    }).setOrigin(0.5);

    try {
      this.crew = await api.get<CrewData>(`/crews/${this.crewId}`);
      loading.destroy();
      this.renderCrew();
    } catch {
      loading.setText('Failed to load crew');
      this.addBackButton();
    }
  }

  private renderCrew() {
    if (!this.crew) return;
    const { width, height } = this.scale;

    // Header
    this.add.text(width / 2, 30, this.crew.name, {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

    // Invite code badge
    const codeBg = this.add.graphics();
    codeBg.fillStyle(0xF9F9F9, 1);
    codeBg.fillRoundedRect(width / 2 - 55, 55, 110, 28, 4);
    codeBg.lineStyle(1, 0xD0D0D0, 0.8);
    codeBg.strokeRoundedRect(width / 2 - 55, 55, 110, 28, 4);

    const codeText = this.add.text(width / 2, 69, this.crew.invite_code, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#4992FF',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    codeText.on('pointerdown', () => {
      navigator.clipboard.writeText(this.crew!.invite_code).then(() => {
        codeText.setText('Copied!');
        this.time.delayedCall(1200, () => codeText.setText(this.crew!.invite_code));
      });
    });

    // Members section
    this.add.text(40, 100, 'Members', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
    });

    const memberNames = this.crew.members.map(m => m.username).join(', ');
    this.add.text(40, 122, memberNames, {
      fontSize: '14px', fontFamily: 'monospace', color: '#1A1A1A',
      wordWrap: { width: width - 80 },
    });

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xD0D0D0, 0.6);
    divider.lineBetween(40, 155, width - 40, 155);

    // Leaderboard
    this.add.text(40, 168, 'Leaderboard — Toss Paper', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
    });

    this.loadLeaderboard('toss-paper', 190);

    // Play buttons
    const playY = Math.max(380, height - 140);

    const playToss = this.add.text(width / 2, playY, '[ Play Toss Paper ]', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#FF4F36',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    playToss.on('pointerover', () => playToss.setColor('#FF8F01'));
    playToss.on('pointerout', () => playToss.setColor('#FF4F36'));
    playToss.on('pointerdown', () => {
      const user = getUser();
      pushRoute(`/toss-paper/multi/${this.crewId}`);
      this.scene.start('TossPaperScene', {
        mode: 'multi',
        crew_id: this.crewId,
        user_id: user?.id,
      });
    });

    // Invite code display
    this.add.text(width / 2, playY + 50, `Invite: ${this.crew.invite_code}`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    this.addBackButton();
  }

  private async loadLeaderboard(game: string, startY: number) {
    try {
      const scores = await api.get<any[]>(`/scores/${game}?crew_id=${this.crewId}`);
      if (scores.length === 0) {
        this.add.text(40, startY, 'No scores yet — be the first!', {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
        });
      } else {
        scores.slice(0, 8).forEach((s, i) => {
          const y = startY + i * 22;
          const rank = `${i + 1}.`;
          const color = i === 0 ? '#FDE801' : i === 1 ? '#FF8F01' : i === 2 ? '#FF4F36' : '#1A1A1A';

          this.add.text(50, y, rank, {
            fontSize: '14px', fontFamily: 'monospace', color,
          });
          this.add.text(80, y, s.username, {
            fontSize: '14px', fontFamily: 'monospace', color: '#1A1A1A',
          });
          this.add.text(300, y, `${s.score}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#6B6B6B',
          });
        });
      }
    } catch {
      this.add.text(40, startY, 'Could not load scores', {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#6B6B6B',
      });
    }
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
      pushRoute('/paper-crew');
      this.scene.start('PaperCrewScene');
    });
  }
}
