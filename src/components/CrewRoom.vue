<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-6 font-serif">
    <!-- Loading -->
    <div v-if="loading" class="text-center text-[#6B6B6B] py-20 text-lg">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <p class="text-[#6B6B6B] text-lg mb-6">{{ error }}</p>
      <button
        class="text-[#6B6B6B] hover:text-[#FF8F01] transition-colors text-sm"
        @click="goBack"
      >
        ← Back
      </button>
    </div>

    <!-- Crew Room -->
    <div v-else-if="crew">
      <!-- Header -->
      <h1 class="text-center text-3xl text-[#1A1A1A] mb-2">{{ crew.name }}</h1>

      <!-- Invite code badge -->
      <div class="flex justify-center mb-6">
        <button
          class="px-4 py-1 rounded bg-[#F9F9F9] border border-[#D0D0D0] font-mono text-base text-[#4992FF] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
          @click="copyInviteCode"
        >
          {{ codeCopied ? 'Copied!' : crew.invite_code }}
        </button>
      </div>

      <!-- Members -->
      <div class="mb-4">
        <p class="text-sm text-[#6B6B6B] mb-2">Members</p>
        <div class="flex gap-5 flex-wrap">
          <div
            v-for="member in crew.members"
            :key="member.id"
            class="flex flex-col items-center gap-1"
          >
            <PlayerIcon
              :icon="member.icon || 'plane'"
              :color="member.color || '#FF4F36'"
              :size="36"
            />
            <span class="text-xs font-mono text-[#1A1A1A]">{{ member.username }}</span>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="border-[#D0D0D0]/60 mb-4" />

      <!-- Tabs -->
      <div class="flex justify-center gap-6 mb-4">
        <button
          class="text-sm transition-colors"
          :class="activeTab === 'leaderboard' ? 'text-[#1A1A1A] underline underline-offset-4' : 'text-[#B0A898] hover:text-[#6B6B6B]'"
          @click="activeTab = 'leaderboard'"
        >
          Leaderboard
        </button>
        <button
          class="text-sm transition-colors"
          :class="activeTab === 'highlights' ? 'text-[#1A1A1A] underline underline-offset-4' : 'text-[#B0A898] hover:text-[#6B6B6B]'"
          @click="activeTab = 'highlights'"
        >
          Weekly Winners
        </button>
      </div>

      <!-- Leaderboards -->
      <div v-if="activeTab === 'leaderboard'" class="mb-8">
        <div class="flex justify-between items-center mb-3">
          <p class="text-xs text-[#B0A898]">{{ weekFilter === 'current' ? 'This Week' : 'All Time' }}</p>
          <button
            class="text-[11px] text-[#4992FF] hover:text-[#FF8F01] transition-colors"
            @click="toggleWeekFilter"
          >
            {{ weekFilter === 'current' ? 'Show All Time' : 'Show This Week' }}
          </button>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-[#6B6B6B] mb-2">Toss Paper</p>
            <Leaderboard :scores="tossScores" :loading="tossLoading" />
          </div>
          <div>
            <p class="text-sm text-[#6B6B6B] mb-2">Origami Trail</p>
            <Leaderboard :scores="trailScores" :loading="trailLoading" />
          </div>
        </div>
      </div>

      <!-- Highlights -->
      <div v-if="activeTab === 'highlights'" class="mb-8">
        <WeeklyHighlights :crew-id="crewId" />
      </div>

      <!-- Play Buttons -->
      <div class="flex justify-center gap-8 mb-6">
        <button
          class="text-xl text-[#FF4F36] hover:text-[#FF8F01] transition-colors font-serif"
          @click="playGame('TossPaperScene', '/toss-paper')"
        >
          [ Toss Paper ]
        </button>
        <button
          class="text-xl text-[#FF4F36] hover:text-[#FF8F01] transition-colors font-serif"
          @click="playGame('OrigamiTrailScene', '/origami-trail')"
        >
          [ Origami Trail ]
        </button>
      </div>

      <!-- Invite & Calendar footer -->
      <div class="border-t border-[#D0D0D0]/60 pt-4 mb-6">
        <!-- Invite link -->
        <div class="flex items-center justify-center gap-2 mb-3">
          <span class="text-sm text-[#6B6B6B]">Invite:</span>
          <button
            class="font-mono text-sm text-[#4992FF] hover:text-[#FF8F01] transition-colors truncate max-w-[200px]"
            @click="copyInviteLink"
            :title="inviteLink"
          >
            {{ linkCopied ? 'Copied!' : shortInviteLink }}
          </button>
        </div>

        <!-- Save to Calendar -->
        <div class="flex justify-center">
          <a
            :href="calendarUrl"
            target="_blank"
            rel="noopener"
            class="text-sm text-[#4992FF] hover:text-[#FF8F01] transition-colors font-serif"
          >
            [ Save to Calendar ]
          </a>
        </div>
      </div>

      <!-- Back -->
      <button
        class="text-sm text-[#6B6B6B] hover:text-[#FF8F01] transition-colors"
        @click="goBack"
      >
        ← Back
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser } from '../utils/user';
import PlayerIcon from './PlayerIcon.vue';
import Leaderboard from './Leaderboard.vue';
import WeeklyHighlights from './WeeklyHighlights.vue';

interface CrewData {
  id: string;
  name: string;
  invite_code: string;
  members: Array<{ id: number; username: string; icon?: string; color?: string }>;
  game_count: number;
}

interface ScoreEntry {
  username: string;
  score: number;
}

const props = defineProps<{
  crewId: string;
}>();

const emit = defineEmits<{
  play: [scene: string, data: Record<string, any>];
}>();

const crew = ref<CrewData | null>(null);
const loading = ref(true);
const error = ref('');
const codeCopied = ref(false);
const linkCopied = ref(false);
const activeTab = ref<'leaderboard' | 'highlights'>('leaderboard');
const weekFilter = ref<'current' | 'all'>('current');

const inviteLink = computed(() => {
  if (!crew.value) return '';
  return `${window.location.origin}/paper-crew/join?code=${crew.value.invite_code}`;
});

const shortInviteLink = computed(() => {
  if (!crew.value) return '';
  return `/join?code=${crew.value.invite_code}`;
});

const calendarUrl = computed(() => {
  if (!crew.value) return '';
  // Weekly Thursday event — league week starts
  const title = encodeURIComponent(`Paper League — ${crew.value.name}`);
  const details = encodeURIComponent(
    `New league week! Set your roster and play your matches.\n\nJoin: ${inviteLink.value}`
  );
  // Recur weekly on Thursdays, all-day event
  // Next Thursday as start date
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + daysUntilThursday);
  const dateStr = thursday.toISOString().slice(0, 10).replace(/-/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateStr}/${dateStr}&recur=RRULE:FREQ=WEEKLY;BYDAY=TH`;
});

const tossScores = ref<ScoreEntry[]>([]);
const trailScores = ref<ScoreEntry[]>([]);
const tossLoading = ref(true);
const trailLoading = ref(true);

onMounted(async () => {
  if (!props.crewId) {
    error.value = 'No crew selected';
    loading.value = false;
    return;
  }

  try {
    crew.value = await api.get<CrewData>(`/crews/${props.crewId}`);
    loading.value = false;

    // Load leaderboards in parallel
    loadLeaderboard('toss-paper', tossScores, tossLoading);
    loadLeaderboard('origami-trail', trailScores, trailLoading);
  } catch {
    error.value = 'Failed to load crew';
    loading.value = false;
  }
});

async function loadLeaderboard(
  game: string,
  target: typeof tossScores,
  loadingRef: typeof tossLoading,
) {
  try {
    const weekParam = weekFilter.value === 'current' ? '&week=current' : '';
    const scores = await api.get<ScoreEntry[]>(`/scores/${game}?crew_id=${props.crewId}${weekParam}`);
    target.value = scores.slice(0, 5);
  } catch {
    // silently fail
  } finally {
    loadingRef.value = false;
  }
}

function toggleWeekFilter() {
  weekFilter.value = weekFilter.value === 'current' ? 'all' : 'current';
  tossLoading.value = true;
  trailLoading.value = true;
  loadLeaderboard('toss-paper', tossScores, tossLoading);
  loadLeaderboard('origami-trail', trailScores, trailLoading);
}

function copyInviteCode() {
  if (!crew.value) return;
  navigator.clipboard.writeText(crew.value.invite_code).then(() => {
    codeCopied.value = true;
    setTimeout(() => { codeCopied.value = false; }, 1200);
  });
}

function copyInviteLink() {
  navigator.clipboard.writeText(inviteLink.value).then(() => {
    linkCopied.value = true;
    setTimeout(() => { linkCopied.value = false; }, 1200);
  });
}

function playGame(scene: string, basePath: string) {
  const user = getUser();
  pushRoute(`${basePath}/multi/${props.crewId}`);
  emit('play', scene, {
    mode: 'multi',
    crew_id: props.crewId,
    user_id: user?.id,
  });
}

function goBack() {
  pushRoute('/paper-crew');
  // App.vue handles showing PaperCrewHub Vue component
}
</script>
