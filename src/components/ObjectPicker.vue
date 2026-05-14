<template>
  <div v-if="visible" class="object-picker-overlay" @click.self="handleOverlayClick">
    <div class="object-picker-panel">
      <p class="picker-title">Place something for the next player</p>

      <input
        ref="searchRef"
        v-model="searchQuery"
        type="text"
        maxlength="30"
        placeholder="Search objects..."
        class="picker-search"
      />

      <div v-if="filteredObjects.length === 0" class="picker-empty">
        No objects found
      </div>

      <div class="picker-grid">
        <button
          v-for="obj in filteredObjects"
          :key="obj.id"
          class="picker-cell"
          :class="{ 'coming-soon': obj.status === 'coming_soon' }"
          @click="selectItem(obj)"
        >
          <div class="picker-thumb" :style="thumbStyle(obj)">
            <svg v-if="obj.spriteKey === 'wall'" viewBox="0 0 40 20" class="thumb-svg"><rect width="40" height="20" fill="#E8E8E8" stroke="#D0D0D0" stroke-width="1"/><line x1="20" y1="0" x2="20" y2="20" stroke="#D0D0D0" stroke-width="1"/></svg>
            <svg v-else-if="obj.spriteKey === 'fan'" viewBox="0 0 32 32" class="thumb-svg"><circle cx="16" cy="16" r="14" fill="#EEF4FF" stroke="#4992FF" stroke-width="1.5"/><line v-for="a in 8" :key="a" :x1="16" :y1="16" :x2="16+Math.cos(a*Math.PI/4)*10" :y2="16+Math.sin(a*Math.PI/4)*10" stroke="#4992FF" stroke-width="1.5"/></svg>
            <svg v-else-if="obj.spriteKey === 'ball'" viewBox="0 0 32 32" class="thumb-svg"><circle cx="16" cy="16" r="14" fill="#D0D0D0"/><line x1="8" y1="10" x2="24" y2="14" stroke="#A0A0A0" stroke-width="1" opacity="0.6"/><line x1="12" y1="24" x2="22" y2="10" stroke="#A0A0A0" stroke-width="1" opacity="0.6"/></svg>
            <svg v-else-if="obj.spriteKey === 'sticky_note'" viewBox="0 0 32 32" class="thumb-svg"><rect x="1" y="1" width="30" height="30" fill="#FFF59D" stroke="#E6DB80" stroke-width="1"/><polygon points="22,1 31,1 31,10" fill="#E6DB80"/><line x1="4" y1="10" x2="28" y2="10" stroke="#D4C960" stroke-width="0.8" opacity="0.5"/><line x1="4" y1="16" x2="28" y2="16" stroke="#D4C960" stroke-width="0.8" opacity="0.5"/><line x1="4" y1="22" x2="20" y2="22" stroke="#D4C960" stroke-width="0.8" opacity="0.5"/></svg>
            <svg v-else-if="obj.spriteKey === 'tape_roll'" viewBox="0 0 28 32" class="thumb-svg"><rect x="1" y="1" width="26" height="30" rx="2" fill="#E8DCC8" stroke="#C8B898" stroke-width="1"/><circle cx="14" cy="11" r="7" fill="none" stroke="#C8B898" stroke-width="2"/><circle cx="14" cy="11" r="3" fill="#FAF5EC"/><circle cx="14" cy="25" r="5" fill="none" stroke="#C8B898" stroke-width="1.5"/><circle cx="14" cy="25" r="2" fill="#FAF5EC"/></svg>
            <svg v-else-if="obj.spriteKey === 'paper_cup'" viewBox="0 0 32 32" class="thumb-svg"><polygon points="6,2 26,2 23,30 9,30" fill="#F0F0F0" stroke="#CCC" stroke-width="1"/><line x1="4" y1="2" x2="28" y2="2" stroke="#CCC" stroke-width="2"/><line x1="8" y1="12" x2="24" y2="12" stroke="#4992FF" stroke-width="1" opacity="0.4"/></svg>
            <svg v-else-if="obj.spriteKey === 'origami_crane'" viewBox="0 0 32 32" class="thumb-svg"><polygon points="16,3 4,22 28,22" fill="#FF8F01"/><polygon points="16,10 2,20 16,20" fill="#FFA030"/><polygon points="16,10 30,20 16,20" fill="#FFA030"/><polygon points="13,22 19,22 16,30" fill="#E07800"/></svg>
            <svg v-else-if="obj.spriteKey === 'pencil'" viewBox="0 0 12 36" class="thumb-svg"><rect x="1" y="4" width="10" height="24" rx="1" fill="#F7D154" stroke="#E0B830" stroke-width="0.8"/><polygon points="1,28 11,28 6,36" fill="#F5E0B0"/><polygon points="4,36 8,36 6,38" fill="#333"/><rect x="1" y="4" width="10" height="4" fill="#E06070"/><rect x="1" y="4" width="10" height="2" rx="1" fill="#D05060"/></svg>
            <svg v-else-if="obj.spriteKey === 'eraser'" viewBox="0 0 32 20" class="thumb-svg"><rect x="1" y="1" width="30" height="18" rx="3" fill="#F8B4C8" stroke="#E090A8" stroke-width="1"/><rect x="1" y="1" width="10" height="18" rx="3" fill="#4992FF" opacity="0.6"/><line x1="22" y1="4" x2="22" y2="16" stroke="#E090A8" stroke-width="0.8" opacity="0.5"/></svg>
            <svg v-else-if="obj.spriteKey === 'stapler'" viewBox="0 0 40 20" class="thumb-svg"><rect x="2" y="8" width="36" height="10" rx="2" fill="#888" stroke="#666" stroke-width="1"/><rect x="4" y="2" width="32" height="8" rx="2" fill="#AAA" stroke="#888" stroke-width="1"/><rect x="14" y="16" width="12" height="3" fill="#666"/></svg>
            <svg v-else-if="obj.spriteKey === 'paper_clip'" viewBox="0 0 20 32" class="thumb-svg"><path d="M6,28 L6,8 Q6,3 10,3 Q14,3 14,8 L14,24 Q14,28 10,28 Q8,28 8,24 L8,10" fill="none" stroke="#C0C0C0" stroke-width="2.5" stroke-linecap="round"/></svg>
            <svg v-else-if="obj.spriteKey === 'rubber_band'" viewBox="0 0 32 32" class="thumb-svg"><ellipse cx="16" cy="16" rx="13" ry="10" fill="none" stroke="#C87030" stroke-width="3"/><ellipse cx="16" cy="16" rx="13" ry="10" fill="none" stroke="#E0A050" stroke-width="1.5"/></svg>
            <svg v-else-if="obj.spriteKey === 'glue_stick'" viewBox="0 0 20 36" class="thumb-svg"><rect x="3" y="10" width="14" height="24" rx="2" fill="#9060C0" stroke="#7040A0" stroke-width="1"/><rect x="5" y="0" width="10" height="12" rx="5" fill="#E0E0E0" stroke="#C0C0C0" stroke-width="1"/><rect x="6" y="16" width="8" height="10" rx="1" fill="#F0F0F0" opacity="0.7"/></svg>
            <svg v-else-if="obj.spriteKey === 'bookmark'" viewBox="0 0 18 36" class="thumb-svg"><polygon points="1,0 17,0 17,32 9,26 1,32" fill="#FF4F36" stroke="#D03020" stroke-width="0.8"/><line x1="4" y1="6" x2="14" y2="6" stroke="#FFF" stroke-width="1" opacity="0.4"/><line x1="4" y1="10" x2="12" y2="10" stroke="#FFF" stroke-width="1" opacity="0.3"/></svg>
            <svg v-else-if="obj.spriteKey === 'protractor'" viewBox="0 0 36 20" class="thumb-svg"><path d="M2,18 Q18,-4 34,18 Z" fill="#F0E8D0" stroke="#C8B898" stroke-width="1"/><path d="M8,18 Q18,4 28,18" fill="none" stroke="#C8B898" stroke-width="0.8" opacity="0.5"/><line v-for="a in 7" :key="a" :x1="18" :y1="18" :x2="18+Math.cos((a+1)*Math.PI/9)*12" :y2="18-Math.sin((a+1)*Math.PI/9)*12" stroke="#B0A898" stroke-width="0.5" opacity="0.5"/></svg>
            <span v-else class="thumb-placeholder">?</span>
          </div>
          <span class="picker-name">{{ obj.name }}</span>
          <span v-if="obj.status === 'coming_soon'" class="picker-soon">Coming Soon</span>
          <span v-else class="picker-effect">{{ effectLabel(obj.effect) }}</span>
        </button>
      </div>

      <button class="picker-skip" @click="skip">Skip</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { searchObjects, type PlaceableObject } from '../data/placeable-objects';

const props = defineProps<{
  objects: PlaceableObject[];
}>();

const emit = defineEmits<{
  select: [obj: PlaceableObject];
  skip: [];
}>();

const visible = ref(false);
const searchQuery = ref('');
const searchRef = ref<HTMLInputElement>();

const filteredObjects = computed(() => {
  const filtered = searchObjects(props.objects, searchQuery.value);
  const available = filtered.filter(o => o.status === 'available');
  const comingSoon = filtered.filter(o => o.status === 'coming_soon');
  return [...available, ...comingSoon];
});

// Sprite color mapping for thumbnails
const thumbColors: Record<string, string> = {
  wall: '#E8E8E8',
  fan: '#EEF4FF',
  ball: '#D0D0D0',
  sticky_note: '#FFF59D',
  tape_roll: '#E8DCC8',
  paper_cup: '#F0F0F0',
  origami_crane: '#FF8F01',
  pencil: '#F7D154',
  eraser: '#F8B4C8',
  stapler: '#AAAAAA',
  paper_clip: '#E8E8E8',
  rubber_band: '#F0D8B0',
  glue_stick: '#D8C0F0',
  bookmark: '#FFE0D8',
  protractor: '#F0E8D0',
};

function thumbStyle(obj: PlaceableObject) {
  if (obj.status === 'coming_soon') {
    return { backgroundColor: '#E0E0E0' };
  }
  return { backgroundColor: thumbColors[obj.spriteKey] || '#E8E8E8' };
}

function effectLabel(effect: string) {
  if (effect === 'blocker') return 'Blocker';
  if (effect === 'environmental') return 'Effect';
  return 'Cosmetic';
}

function selectItem(obj: PlaceableObject) {
  if (obj.status === 'coming_soon') return;
  visible.value = false;
  searchQuery.value = '';
  emit('select', obj);
}

function skip() {
  visible.value = false;
  searchQuery.value = '';
  emit('skip');
}

function handleOverlayClick() {
  // Clicking the overlay background dismisses the picker (skip)
  skip();
}

function show() {
  visible.value = true;
  searchQuery.value = '';
  nextTick(() => searchRef.value?.focus());
}

function hide() {
  visible.value = false;
  searchQuery.value = '';
}

// Listen for Phaser events
function onShowPicker() { show(); }
function onHidePicker() { hide(); }

onMounted(() => {
  window.addEventListener('paper:show-picker', onShowPicker);
  window.addEventListener('paper:hide-picker', onHidePicker);
});

onUnmounted(() => {
  window.removeEventListener('paper:show-picker', onShowPicker);
  window.removeEventListener('paper:hide-picker', onHidePicker);
});

defineExpose({ show, hide, visible });
</script>

<style scoped>
.object-picker-overlay {
  position: absolute;
  inset: 0;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.15);
}

.object-picker-panel {
  background: #fff;
  border-top: 1px solid #E0E0E0;
  border-radius: 12px 12px 0 0;
  padding: 20px 16px 12px;
  max-height: 65%;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
  position: relative;
  z-index: 1501;
}

.picker-title {
  text-align: center;
  font-family: Georgia, serif;
  font-size: 14px;
  color: #6B6B6B;
  margin: 0 0 12px;
}

.picker-search {
  display: block;
  width: 100%;
  max-width: 320px;
  margin: 0 auto 16px;
  padding: 8px 12px;
  font-family: Georgia, serif;
  font-size: 14px;
  border: 2px solid #D0D0D0;
  border-radius: 4px;
  outline: none;
  background: #FAFAFA;
  color: #1A1A1A;
  box-sizing: border-box;
}
.picker-search:focus {
  border-color: #4992FF;
}

.picker-empty {
  text-align: center;
  font-family: Georgia, serif;
  font-size: 14px;
  color: #AAAAAA;
  padding: 24px 0;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}
@media (max-width: 550px) {
  .picker-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.picker-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.picker-cell:hover:not(.coming-soon) {
  background: rgba(73, 146, 255, 0.08);
}
.picker-cell.coming-soon {
  cursor: default;
  opacity: 0.45;
}

.picker-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-svg {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.coming-soon .thumb-svg {
  opacity: 0.4;
}
.thumb-placeholder {
  font-size: 18px;
  color: #BBBBBB;
  font-family: Georgia, serif;
}

.picker-name {
  font-family: Georgia, serif;
  font-size: 11px;
  color: #1A1A1A;
  text-align: center;
  line-height: 1.2;
}
.coming-soon .picker-name {
  color: #BBBBBB;
}

.picker-soon {
  font-family: Georgia, serif;
  font-size: 9px;
  color: #CCCCCC;
  font-style: italic;
}

.picker-effect {
  font-family: monospace;
  font-size: 9px;
  color: #B0A898;
}

.picker-skip {
  display: block;
  margin: 0 auto;
  padding: 6px 24px;
  font-family: Georgia, serif;
  font-size: 14px;
  color: #AAAAAA;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}
.picker-skip:hover {
  color: #FF8F01;
}
</style>
