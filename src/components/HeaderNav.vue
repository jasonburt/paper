<template>
  <nav class="w-full max-w-4xl mx-auto flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 border-b border-gray-100">
    <a
      href="#"
      class="font-serif text-sm md:text-lg tracking-wide text-[#1A1A1A] hover:text-[#FF8F01] transition-colors"
      @click.prevent="navigateTo('/', 'MainMenuScene')"
    >
      PAPER
    </a>
    <div class="flex gap-3 md:gap-4 text-xs md:text-sm font-serif">
      <a
        v-for="link in navLinks"
        :key="link.path"
        href="#"
        class="transition-colors"
        :class="activeRoute === link.path
          ? 'text-[#4992FF]'
          : 'text-[#6B6B6B] hover:text-[#FF8F01]'"
        @click.prevent="navigateTo(link.path, link.scene)"
      >
        {{ link.label }}
      </a>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { pushRoute } from '../router';

const navLinks = [
  { label: 'Toss Paper', path: '/toss-paper', scene: 'TossPaperScene' },
  { label: 'Paper Crew', path: '/paper-crew', scene: 'PaperCrewScene' },
];

const activeRoute = ref(window.location.pathname);

function navigateTo(path: string, scene: string, data: Record<string, any> = {}) {
  pushRoute(path);
  activeRoute.value = path;
  const game = (window as any).__PAPER_GAME__;
  if (game) {
    game.scene.getScenes(true).forEach((s: any) => s.scene.stop());
    game.scene.start(scene, data);
  }
}

function onPopState() {
  activeRoute.value = window.location.pathname;
}

onMounted(() => window.addEventListener('popstate', onPopState));
onUnmounted(() => window.removeEventListener('popstate', onPopState));
</script>
