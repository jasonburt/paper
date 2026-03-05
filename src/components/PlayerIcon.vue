<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" xmlns="http://www.w3.org/2000/svg">
    <!-- Plane -->
    <template v-if="icon === 'plane'">
      <polygon :points="planePoints" :fill="color" />
    </template>

    <!-- Crane -->
    <template v-else-if="icon === 'crane'">
      <polygon :points="craneTopPoints" :fill="color" />
      <polygon :points="craneBottomPoints" :fill="color" />
    </template>

    <!-- Star -->
    <template v-else-if="icon === 'star'">
      <polygon :points="starPoints" :fill="color" />
    </template>

    <!-- Boat -->
    <template v-else-if="icon === 'boat'">
      <polygon :points="boatHullPoints" :fill="color" />
      <polygon :points="boatSailPoints" :fill="color" />
    </template>

    <!-- Heart -->
    <template v-else-if="icon === 'heart'">
      <circle :cx="r - r * 0.55 * 0.55" :cy="r - r * 0.55 * 0.3" :r="r * 0.55" :fill="color" />
      <circle :cx="r + r * 0.55 * 0.55" :cy="r - r * 0.55 * 0.3" :r="r * 0.55" :fill="color" />
      <polygon :points="heartTriPoints" :fill="color" />
    </template>

    <!-- Diamond -->
    <template v-else-if="icon === 'diamond'">
      <polygon :points="diamondPoints" :fill="color" />
    </template>

    <!-- Fallback circle -->
    <template v-else>
      <circle :cx="r" :cy="r" :r="r" :fill="color" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  icon: string;
  color: string;
  size?: number;
}>(), {
  size: 36,
});

const r = computed(() => props.size / 2);
const s = computed(() => props.size);

// Plane: two triangles forming paper airplane pointing right
const planePoints = computed(() => {
  const sz = s.value;
  const half = r.value;
  return `${sz},${half} 0,0 ${sz * 0.15},${half} ${sz},${half} 0,${sz} ${sz * 0.15},${half}`;
});

// Crane: top wing + body
const craneTopPoints = computed(() => {
  const sz = s.value;
  const half = r.value;
  return `0,${half} ${half},0 ${sz},${half}`;
});
const craneBottomPoints = computed(() => {
  const sz = s.value;
  const half = r.value;
  return `${half * 0.3},${half} ${half},${sz} ${sz - half * 0.3},${half}`;
});

// Star: 5-pointed star
const starPoints = computed(() => {
  const half = r.value;
  const cx = half;
  const cy = half;
  const outer = half;
  const inner = half * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const aOuter = (i * 72 - 90) * Math.PI / 180;
    const aInner = ((i * 72) + 36 - 90) * Math.PI / 180;
    pts.push(`${cx + Math.cos(aOuter) * outer},${cy + Math.sin(aOuter) * outer}`);
    pts.push(`${cx + Math.cos(aInner) * inner},${cy + Math.sin(aInner) * inner}`);
  }
  return pts.join(' ');
});

// Boat: hull + sail
const boatHullPoints = computed(() => {
  const sz = s.value;
  const half = r.value;
  return `0,${sz * 0.7} ${sz},${sz * 0.7} ${half},${sz}`;
});
const boatSailPoints = computed(() => {
  const sz = s.value;
  const half = r.value;
  return `${half},0 ${half},${sz * 0.7} ${sz * 0.8},${sz * 0.7}`;
});

// Heart: triangle portion
const heartTriPoints = computed(() => {
  const half = r.value;
  const cx = half;
  const cy = half;
  return `${cx - half * 0.85},${cy} ${cx + half * 0.85},${cy} ${cx},${cy + half * 0.95}`;
});

// Diamond: rhombus
const diamondPoints = computed(() => {
  const sz = s.value;
  const half = r.value;
  return `${half},0 ${sz},${half} ${half},${sz} 0,${half}`;
});
</script>
