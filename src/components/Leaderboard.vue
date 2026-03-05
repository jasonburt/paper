<template>
  <div class="font-mono text-xs">
    <p v-if="loading" class="text-[#6B6B6B]">Loading...</p>
    <p v-else-if="scores.length === 0" class="text-[#6B6B6B] font-serif text-xs">
      No scores yet
    </p>
    <div v-else class="space-y-1">
      <div
        v-for="(entry, i) in scores"
        :key="i"
        class="flex items-center gap-2"
      >
        <span :style="{ color: rankColor(i) }" class="w-4 text-right">{{ i + 1 }}.</span>
        <span class="text-[#1A1A1A] flex-1 truncate">{{ entry.username }}</span>
        <span class="text-[#6B6B6B]">{{ entry.score }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  scores: Array<{ username: string; score: number }>;
  loading?: boolean;
}>();

function rankColor(index: number): string {
  if (index === 0) return '#FDE801';
  if (index === 1) return '#FF8F01';
  if (index === 2) return '#FF4F36';
  return '#1A1A1A';
}
</script>
