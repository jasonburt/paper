<template>
  <nav class="w-full max-w-4xl mx-auto flex items-center px-3 py-1.5 md:px-4 md:py-2 border-b border-gray-100">
    <a
      href="#"
      class="font-serif text-sm md:text-lg tracking-wide text-[#1A1A1A] hover:text-[#FF8F01] transition-colors"
      @click.prevent="navigateTo('/')"
    >
      PAPER
    </a>
  </nav>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

function navigateTo(path: string) {
  pushRoute(path);
}
</script>
