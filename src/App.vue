<template>
  <div class="h-dvh w-full flex flex-col bg-white">
    <HeaderNav :gameBack="gameBackRoute" />
    <div class="flex-1 min-h-0 w-full mx-auto overflow-y-auto" :class="currentPage !== 'game' ? 'max-w-4xl' : ''">
      <HomePage v-if="currentPage === 'home'" />
      <LoginPage v-else-if="currentPage === 'login'" />
      <AboutPage v-else-if="currentPage === 'about'" :section="aboutSection" :key="currentPath" />
      <LeagueLandingSolo v-else-if="currentPage === 'leagueSolo'" />
      <LeagueLandingFriends v-else-if="currentPage === 'leagueFriends'" />
      <LeagueLandingCompany v-else-if="currentPage === 'leagueCompany'" />
      <DesignsAndAnimations v-else-if="currentPage === 'designs'" />
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
import LoginPage from './components/LoginPage.vue';
import PaperCrewHub from './components/PaperCrewHub.vue';
import CreateCrew from './components/CreateCrew.vue';
import JoinCrew from './components/JoinCrew.vue';
import CrewRoom from './components/CrewRoom.vue';
import AboutPage from './components/AboutPage.vue';
import LeagueLandingSolo from './components/LeagueLandingSolo.vue';
import LeagueLandingFriends from './components/LeagueLandingFriends.vue';
import LeagueLandingCompany from './components/LeagueLandingCompany.vue';
import DesignsAndAnimations from './components/DesignsAndAnimations.vue';

const currentPath = ref(window.location.pathname);

type Page = 'home' | 'login' | 'about' | 'leagueSolo' | 'leagueFriends' | 'leagueCompany' | 'designs' | 'paperCrew' | 'createCrew' | 'joinCrew' | 'crewRoom' | 'game';

const currentPage = computed<Page>(() => {
  const p = currentPath.value;
  if (p === '/') return 'home';
  if (p === '/login') return 'login';
  if (p === '/about' || p.startsWith('/about/')) return 'about';
  if (p === '/league') return 'leagueSolo';
  if (p === '/league/friends') return 'leagueFriends';
  if (p === '/league/company') return 'leagueCompany';
  if (p === '/designs') return 'designs';
  if (p === '/paper-crew') return 'paperCrew';
  if (p === '/paper-crew/create') return 'createCrew';
  if (p === '/paper-crew/join') return 'joinCrew';
  if (/^\/paper-crew-room\/[a-f0-9]+$/.test(p)) return 'crewRoom';
  return 'game';
});

const aboutSection = computed<'main' | 'toss-paper' | 'origami-trail'>(() => {
  const p = currentPath.value;
  if (p === '/about/toss-paper') return 'toss-paper';
  if (p === '/about/origami-trail') return 'origami-trail';
  return 'main';
});

const crewRoomMatch = computed(() => currentPath.value.match(/^\/paper-crew-room\/([a-f0-9]+)$/));
const crewId = computed(() => crewRoomMatch.value ? crewRoomMatch.value[1] : '');

// When in a game, provide back route info to the header nav
const gameBackRoute = computed(() => {
  if (currentPage.value !== 'game') return null;
  const p = currentPath.value;
  const multiMatch = p.match(/\/multi\/([a-f0-9]+)$/);
  if (multiMatch) {
    return { label: '← Crew', route: `/paper-crew-room/${multiMatch[1]}` };
  }
  return { label: '← Back', route: '/' };
});

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
