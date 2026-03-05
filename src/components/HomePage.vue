<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-20 text-center font-serif">
    <h1 class="text-6xl text-[#1A1A1A] mb-4 tracking-wide">PAPER</h1>
    <p class="text-xl text-[#6B6B6B] mb-12">origami games collection</p>

    <hr class="w-60 mx-auto border-[#D0D0D0]/60 mb-10" />

    <div class="space-y-6">
      <a
        v-for="item in menuItems"
        :key="item.path"
        href="#"
        class="flex items-center justify-center gap-3 text-[28px] text-[#1A1A1A] hover:text-[#FF8F01] transition-colors"
        @click.prevent="navigate(item.path)"
      >
        <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: item.color }"></span>
        {{ item.label }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

const menuItems = [
  { label: 'Toss Paper', path: '/toss-paper/single', color: '#FDE801' },
  { label: 'Origami Trail', path: '/origami-trail', color: '#FF4F36' },
  { label: 'Paper Crew', path: '/paper-crew', color: '#4992FF' },
];

function navigate(path: string) {
  pushRoute(path);
}
</script>
