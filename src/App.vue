<template>
  <div class="h-dvh w-full flex flex-col bg-white">
    <HeaderNav />
    <div class="flex-1 min-h-0 w-full max-w-4xl mx-auto">
      <GameCanvas />
    </div>
  </div>
</template>

<script setup lang="ts">
import HeaderNav from './components/HeaderNav.vue';
import GameCanvas from './components/GameCanvas.vue';
</script>
