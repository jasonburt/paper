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

      <!-- Leaderboards -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p class="text-sm text-[#6B6B6B] mb-2">Toss Paper</p>
          <Leaderboard :scores="tossScores" :loading="tossLoading" />
        </div>
        <div>
          <p class="text-sm text-[#6B6B6B] mb-2">Origami Trail</p>
          <Leaderboard :scores="trailScores" :loading="trailLoading" />
        </div>
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

      <!-- Invite code footer -->
      <p class="text-center text-sm font-mono text-[#6B6B6B] mb-6">
        Invite: {{ crew.invite_code }}
      </p>

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
import { ref, onMounted } from 'vue';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser } from '../utils/user';
import PlayerIcon from './PlayerIcon.vue';
import Leaderboard from './Leaderboard.vue';

interface CrewData {
  id: number;
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
  crewId: number;
}>();

const emit = defineEmits<{
  play: [scene: string, data: Record<string, any>];
}>();

const crew = ref<CrewData | null>(null);
const loading = ref(true);
const error = ref('');
const codeCopied = ref(false);

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
    const scores = await api.get<ScoreEntry[]>(`/scores/${game}?crew_id=${props.crewId}`);
    target.value = scores.slice(0, 5);
  } catch {
    // silently fail
  } finally {
    loadingRef.value = false;
  }
}

function copyInviteCode() {
  if (!crew.value) return;
  navigator.clipboard.writeText(crew.value.invite_code).then(() => {
    codeCopied.value = true;
    setTimeout(() => { codeCopied.value = false; }, 1200);
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
