<template>
  <div class="relative w-full h-full">
    <div ref="containerRef" class="w-full h-full"></div>
    <ObjectPicker
      :objects="pickerObjects"
      @select="onObjectSelected"
      @skip="onPickerSkip"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Phaser from 'phaser';
import { resolveRoute } from '../router';
import { BootScene } from '../scenes/BootScene';
import { TossPaperScene } from '../scenes/TossPaperScene';
import { OrigamiTrailScene } from '../scenes/OrigamiTrailScene';
import ObjectPicker from './ObjectPicker.vue';
import { TOSS_PAPER_OBJECTS, type PlaceableObject } from '../data/placeable-objects';

const containerRef = ref<HTMLDivElement>();
let game: Phaser.Game | null = null;

const pickerObjects = ref<PlaceableObject[]>(TOSS_PAPER_OBJECTS);

const initialRoute = resolveRoute();
(window as any).__PAPER_ROUTE__ = initialRoute;

function onObjectSelected(obj: PlaceableObject) {
  window.dispatchEvent(new CustomEvent('paper:object-selected', { detail: obj }));
}

function onPickerSkip() {
  window.dispatchEvent(new CustomEvent('paper:picker-skip'));
}

// Listen for Phaser requesting which objects to show
function onSetPickerObjects(e: Event) {
  const objects = (e as CustomEvent).detail;
  if (Array.isArray(objects)) {
    pickerObjects.value = objects;
  }
}

onMounted(() => {
  window.addEventListener('paper:set-picker-objects', onSetPickerObjects);

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
  window.removeEventListener('paper:set-picker-objects', onSetPickerObjects);
  if (game) {
    game.destroy(true);
    game = null;
  }
});
</script>
