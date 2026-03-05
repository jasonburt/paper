<template>
  <div class="h-dvh w-full flex flex-col bg-white">
    <HeaderNav v-if="currentPage !== 'game'" />
    <div class="flex-1 min-h-0 w-full mx-auto overflow-y-auto" :class="currentPage !== 'game' ? 'max-w-4xl' : ''">
      <HomePage v-if="currentPage === 'home'" />
      <PaperCrewHub v-else-if="currentPage === 'paperCrew'" :key="currentPath" />
      <CreateCrew v-else-if="currentPage === 'createCrew'" />
      <JoinCrew v-else-if="currentPage === 'joinCrew'" />
      <CrewRoom
        v-else-if="currentPage === 'crewRoom'"
        :key="crewId"
        :crewId="crewId"
        @play="handlePlay"
      />
      <GameCanvas v-show="currentPage === 'game'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { resolveRoute } from './router';
import HeaderNav from './components/HeaderNav.vue';
import GameCanvas from './components/GameCanvas.vue';
import HomePage from './components/HomePage.vue';
import PaperCrewHub from './components/PaperCrewHub.vue';
import CreateCrew from './components/CreateCrew.vue';
import JoinCrew from './components/JoinCrew.vue';
import CrewRoom from './components/CrewRoom.vue';

const currentPath = ref(window.location.pathname);

type Page = 'home' | 'paperCrew' | 'createCrew' | 'joinCrew' | 'crewRoom' | 'game';

const currentPage = computed<Page>(() => {
  const p = currentPath.value;
  if (p === '/') return 'home';
  if (p === '/paper-crew') return 'paperCrew';
  if (p === '/paper-crew/create') return 'createCrew';
  if (p === '/paper-crew/join') return 'joinCrew';
  if (/^\/paper-crew-room\/\d+$/.test(p)) return 'crewRoom';
  return 'game';
});

const crewRoomMatch = computed(() => currentPath.value.match(/^\/paper-crew-room\/(\d+)$/));
const crewId = computed(() => crewRoomMatch.value ? parseInt(crewRoomMatch.value[1], 10) : 0);

function updatePath() {
  currentPath.value = window.location.pathname;
}

// When CrewRoom emits play, it sets pendingPlay BEFORE onNavigate's nextTick fires.
// This prevents the race condition where both onNavigate and handlePlay try to start the scene.
let pendingPlay: { scene: string; data: Record<string, any> } | null = null;

function startGameScene(scene?: string, data?: Record<string, any>) {
  const game = (window as any).__PAPER_GAME__;
  if (!game) return;
  game.scene.getScenes(true).forEach((s: any) => s.scene.stop());
  if (scene && data) {
    game.scene.start(scene, data);
  } else {
    const route = resolveRoute();
    if (route) {
      game.scene.start(route.scene, route.data);
    }
  }
}

function handlePlay(scene: string, data: Record<string, any>) {
  // Called by CrewRoom AFTER pushRoute fires paper-navigate.
  // Set pendingPlay so onNavigate's nextTick uses this data instead of double-starting.
  pendingPlay = { scene, data };
  updatePath();
}

function onNavigate() {
  const wasGame = currentPage.value === 'game';
  updatePath();

  if (currentPage.value === 'game') {
    // Navigating to a game route — start the Phaser scene on next tick
    nextTick(() => {
      if (pendingPlay) {
        startGameScene(pendingPlay.scene, pendingPlay.data);
        pendingPlay = null;
      } else {
        startGameScene();
      }
    });
  } else if (wasGame) {
    // Leaving game for a Vue page — stop running Phaser scenes
    const game = (window as any).__PAPER_GAME__;
    if (game) {
      game.scene.getScenes(true).forEach((s: any) => s.scene.stop());
    }
  }
}

onMounted(() => {
  window.addEventListener('popstate', onNavigate);
  window.addEventListener('paper-navigate', onNavigate);
});

onUnmounted(() => {
  window.removeEventListener('popstate', onNavigate);
  window.removeEventListener('paper-navigate', onNavigate);
});
</script>
