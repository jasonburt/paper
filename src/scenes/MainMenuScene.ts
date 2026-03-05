import Phaser from 'phaser';
import { pushRoute } from '../router';

const ROUTE_MAP: Record<string, string> = {
  TossPaperScene: '/toss-paper/single',
  OrigamiTrailScene: '/origami-trail',
  PaperCrewScene: '/paper-crew',
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Title
    this.add.text(width / 2, height / 3, '✈ PAPER ✈', {
      fontSize: '64px',
      fontFamily: 'Georgia, serif',
      color: '#1A1A1A',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 3 + 70, 'origami games collection', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B',
    }).setOrigin(0.5);

    // Divider line (fold crease)
    const line = this.add.graphics();
    line.lineStyle(1, 0xD0D0D0, 0.6);
    line.lineBetween(width / 2 - 120, height / 2 + 30, width / 2 + 120, height / 2 + 30);

    // Menu items with origami brand colors
    const menuItems = [
      { label: 'Toss Paper', scene: 'TossPaperScene', color: '#FDE801' },
      { label: 'Origami Trail', scene: 'OrigamiTrailScene', color: '#FF4F36' },
      { label: 'Paper Crew', scene: 'PaperCrewScene', color: '#4992FF' },
    ];

    menuItems.forEach((item, i) => {
      const y = height / 2 + 70 + i * 55;

      // Color dot
      const dot = this.add.graphics();
      dot.fillStyle(parseInt(item.color.replace('#', '0x')), 1);
      dot.fillCircle(width / 2 - 90, y, 6);

      const text = this.add.text(width / 2, y, item.label, {
        fontSize: '28px',
        fontFamily: 'Georgia, serif',
        color: '#1A1A1A',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => text.setColor('#FF8F01'));
      text.on('pointerout', () => text.setColor('#1A1A1A'));
      text.on('pointerdown', () => {
        const route = ROUTE_MAP[item.scene];
        if (route) {
          pushRoute(route);
          const data = item.scene === 'TossPaperScene' ? { mode: 'single' } : {};
          this.scene.start(item.scene, data);
        } else {
          console.log(`Navigate to: ${item.scene} (not yet implemented)`);
        }
      });
    });
  }
}
