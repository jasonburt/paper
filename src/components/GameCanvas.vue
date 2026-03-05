<template>
  <div ref="containerRef" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Phaser from 'phaser';
import { resolveRoute } from '../router';
import { BootScene } from '../scenes/BootScene';
import { TossPaperScene } from '../scenes/TossPaperScene';
import { OrigamiTrailScene } from '../scenes/OrigamiTrailScene';

const containerRef = ref<HTMLDivElement>();
let game: Phaser.Game | null = null;

const initialRoute = resolveRoute();
(window as any).__PAPER_ROUTE__ = initialRoute;

onMounted(() => {
  if (!containerRef.value) return;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: containerRef.value,
    backgroundColor: '#FFFFFF',
    scene: [
      BootScene,
      TossPaperScene,
      OrigamiTrailScene,
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

  game = new Phaser.Game(config);
  (window as any).__PAPER_GAME__ = game;
});

// Navigation is handled by App.vue — no popstate handler needed here

onUnmounted(() => {
  if (game) {
    game.destroy(true);
    game = null;
  }
});
</script>
