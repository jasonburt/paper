import Phaser from 'phaser';
import { resolveRoute } from './router';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TossPaperScene } from './scenes/TossPaperScene';
import { PaperCrewScene } from './scenes/PaperCrewScene';
import { CreateCrewScene } from './scenes/CreateCrewScene';
import { JoinCrewScene } from './scenes/JoinCrewScene';
import { CrewDetailScene } from './scenes/CrewDetailScene';

// Resolve initial route before Phaser boots
const initialRoute = resolveRoute();
(window as any).__PAPER_ROUTE__ = initialRoute;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: document.body,
  backgroundColor: '#FFFFFF',
  scene: [
    BootScene,
    MainMenuScene,
    TossPaperScene,
    PaperCrewScene,
    CreateCrewScene,
    JoinCrewScene,
    CrewDetailScene,
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
(window as any).__PAPER_GAME__ = game;

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const route = resolveRoute();
  game.scene.getScenes(true).forEach((s) => s.scene.stop());
  game.scene.start(route.scene, route.data);
});
