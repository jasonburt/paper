<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-20 text-center font-serif">
    <div class="px-8 py-14 mb-10">
      <h1 class="text-7xl text-[#1A1A1A] mb-4 tracking-wide">PAPER</h1>
      <p class="text-xl text-[#6B6B6B]">serious games for unserious people</p>
    </div>

    <!-- Practice -->
    <p class="text-xs tracking-[0.3em] text-[#B0A898] uppercase mb-5">Practice</p>
    <div class="space-y-6 mb-10">
      <a
        v-for="item in practiceItems"
        :key="item.path"
        href="#"
        class="flex items-center justify-center gap-3 text-[28px] text-[#1A1A1A] hover:text-[#FF8F01] transition-colors"
        @click.prevent="navigate(item.path)"
      >
        <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: item.color }"></span>
        {{ item.label }}
      </a>
    </div>

    <hr class="w-40 mx-auto border-[#D0D0D0]/40 mb-10" />

    <!-- Compete -->
    <p class="text-xs tracking-[0.3em] text-[#B0A898] uppercase mb-5">Compete</p>
    <div class="space-y-6 mb-10">
      <a
        v-for="item in competeItems"
        :key="item.path"
        href="#"
        class="flex items-center justify-center gap-3 text-[28px] text-[#1A1A1A] hover:text-[#FF8F01] transition-colors"
        @click.prevent="navigate(item.path)"
      >
        <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: item.color }"></span>
        {{ item.label }}
      </a>
    </div>

    <hr class="w-40 mx-auto border-[#D0D0D0]/40 mb-10" />

    <!-- Footer links -->
    <div class="space-y-6">
      <a
        v-for="item in footerItems"
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

const practiceItems = [
  { label: 'Toss Paper', path: '/toss-paper/single', color: '#FDE801' },
  { label: 'Origami Trail', path: '/origami-trail', color: '#FF4F36' },
];

const competeItems = [
  { label: 'Paper Crew', path: '/paper-crew', color: '#4992FF' },
  { label: 'Paper League', path: '/league', color: '#FF8F01' },
];

const footerItems = [
  { label: 'About', path: '/about', color: '#B0A898' },
];

function navigate(path: string) {
  pushRoute(path);
}
</script>
