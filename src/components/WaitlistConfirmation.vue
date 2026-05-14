<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-6 font-serif">
    <div class="text-center py-16">
      <h1 class="text-3xl text-[#1A1A1A] mb-4">You're on the list</h1>
      <p class="text-lg text-[#6B6B6B] mb-2">We review requests every Thursday.</p>
      <p class="text-base text-[#B0A898] mb-8">You'll get an email when you're in.</p>

      <div class="inline-block border-2 border-[#D0D0D0] rounded px-6 py-4 mb-8">
        <p class="text-sm text-[#6B6B6B] font-mono">Status: <span class="text-[#FF8F01]">PENDING</span></p>
      </div>

      <div>
        <button
          class="text-lg text-[#4992FF] hover:text-[#FF8F01] transition-colors"
          @click="goHome"
        >
          [ Back to Paper ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

function goHome() {
  pushRoute('/');
}
</script>
