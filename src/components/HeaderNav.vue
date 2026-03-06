<template>
  <nav class="w-full flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 border-b border-gray-100" :class="gameBack ? '' : 'max-w-4xl mx-auto'">
    <a
      href="#"
      class="font-serif text-sm md:text-lg tracking-wide text-[#1A1A1A] hover:text-[#FF8F01] transition-colors"
      @click.prevent="navigateTo('/')"
    >
      PAPER
    </a>
    <button
      v-if="gameBack"
      class="font-serif text-sm md:text-base text-[#6B6B6B] hover:text-[#FF8F01] transition-colors"
      @click="handleBack"
    >
      {{ gameBack.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

const props = defineProps<{
  gameBack?: { label: string; route: string } | null;
}>();

function navigateTo(path: string) {
  // If in a game, stop Phaser scenes before navigating
  if (props.gameBack) {
    const game = (window as any).__PAPER_GAME__;
    if (game) {
      game.scene.getScenes(true).forEach((s: any) => s.scene.stop());
    }
  }
  pushRoute(path);
}

function handleBack() {
  if (!props.gameBack) return;
  const game = (window as any).__PAPER_GAME__;
  if (game) {
    game.scene.getScenes(true).forEach((s: any) => s.scene.stop());
  }
  pushRoute(props.gameBack.route);
}
</script>
