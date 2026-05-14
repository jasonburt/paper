<template>
  <div class="font-serif">
    <!-- Loading -->
    <div v-if="loading" class="text-center text-[#6B6B6B] py-8 text-sm">
      Loading highlights...
    </div>

    <!-- Empty state -->
    <div v-else-if="weeks.length === 0" class="text-center py-8">
      <p class="text-lg text-[#6B6B6B] mb-2">No highlights yet</p>
      <p class="text-sm text-[#B0A898]">Play some games this week — winners are crowned every Thursday!</p>
    </div>

    <template v-else>
      <!-- Stats summary bar -->
      <div v-if="stats?.most_wins || stats?.top_score" class="grid grid-cols-2 gap-3 mb-6">
        <div v-if="stats.most_wins" class="bg-[#FAFAFA] border border-[#D0D0D0]/60 rounded-lg px-3 py-3 text-center">
          <p class="text-[10px] tracking-[0.15em] text-[#B0A898] uppercase mb-1">Most Wins</p>
          <p class="text-base text-[#1A1A1A]">
            <span class="text-[#FDE801]">★</span> {{ stats.most_wins.username }}
          </p>
          <p class="text-[11px] text-[#6B6B6B] font-mono">{{ stats.most_wins.wins }} weeks · {{ gameLabel(stats.most_wins.game) }}</p>
        </div>
        <div v-if="stats.top_score" class="bg-[#FAFAFA] border border-[#D0D0D0]/60 rounded-lg px-3 py-3 text-center">
          <p class="text-[10px] tracking-[0.15em] text-[#B0A898] uppercase mb-1">Top Score</p>
          <p class="text-base text-[#1A1A1A]">{{ stats.top_score.score.toLocaleString() }} pts</p>
          <p class="text-[11px] text-[#6B6B6B] font-mono">by {{ stats.top_score.username }}</p>
        </div>
      </div>

      <!-- Week cards -->
      <div class="space-y-4">
        <div
          v-for="week in weeks"
          :key="week.weekStart"
          class="bg-[#FAFAFA] border border-[#D0D0D0]/60 rounded-lg px-4 py-4"
        >
          <!-- Week header -->
          <p class="text-xs text-[#B0A898] font-mono mb-3">
            {{ formatDate(week.weekStart) }} – {{ formatDate(week.weekEnd) }}
          </p>

          <!-- Game results -->
          <div class="space-y-4">
            <div v-for="highlight in week.highlights" :key="highlight.game">
              <p class="text-[11px] tracking-[0.15em] text-[#6B6B6B] uppercase mb-2">
                {{ gameLabel(highlight.game) }}
              </p>

              <!-- Winner -->
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[#FDE801] text-sm">★</span>
                <PlayerIcon
                  :icon="highlight.winner.icon || 'plane'"
                  :color="highlight.winner.color || '#FF4F36'"
                  :size="18"
                />
                <span class="text-sm font-mono" :style="{ color: highlight.winner.color || '#1A1A1A' }">
                  {{ highlight.winner.username }}
                </span>
                <span v-if="highlight.winner.streak" class="text-xs" title="Winning streak!">🔥</span>
                <span class="text-sm font-mono text-[#6B6B6B] ml-auto">{{ highlight.winner.score }} pts</span>
              </div>

              <!-- Runner up -->
              <div v-if="highlight.runner_up" class="flex items-center gap-2 mb-1 ml-5">
                <PlayerIcon
                  :icon="highlight.runner_up.icon || 'plane'"
                  :color="highlight.runner_up.color || '#FF4F36'"
                  :size="14"
                />
                <span class="text-xs font-mono text-[#6B6B6B]">{{ highlight.runner_up.username }}</span>
                <span class="text-xs font-mono text-[#B0A898] ml-auto">{{ highlight.runner_up.score }} pts</span>
              </div>

              <!-- Others -->
              <button
                v-if="highlight.participant_count > 2"
                class="text-[11px] text-[#B0A898] hover:text-[#4992FF] transition-colors ml-5 mt-1"
                @click="toggleExpand(highlight)"
              >
                {{ highlight.expanded ? '▾ Hide' : `▸ ${highlight.participant_count - 2} others played` }}
              </button>
              <div v-if="highlight.expanded && highlight.scores.length > 2" class="ml-5 mt-1 space-y-1">
                <div
                  v-for="(entry, i) in highlight.scores.slice(2)"
                  :key="i"
                  class="flex items-center gap-2"
                >
                  <span class="text-[11px] font-mono text-[#B0A898]">{{ entry.username }}</span>
                  <span class="text-[11px] font-mono text-[#B0A898] ml-auto">{{ entry.score }} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../utils/api';
import PlayerIcon from './PlayerIcon.vue';

interface Highlight {
  id: number;
  game: string;
  week_start: string;
  week_end: string;
  winner: { user_id: number; username: string; score: number; icon?: string; color?: string; streak?: boolean };
  runner_up: { user_id: number; username: string; score: number; icon?: string; color?: string } | null;
  total_plays: number;
  participant_count: number;
  scores: Array<{ username: string; score: number }>;
  expanded?: boolean;
}

interface WeekGroup {
  weekStart: string;
  weekEnd: string;
  highlights: Highlight[];
}

interface Stats {
  most_wins: { user_id: number; username: string; wins: number; game: string } | null;
  top_score: { user_id: number; username: string; score: number; game: string; week_start: string } | null;
}

const props = defineProps<{
  crewId: string;
}>();

const loading = ref(true);
const weeks = ref<WeekGroup[]>([]);
const stats = ref<Stats | null>(null);

onMounted(async () => {
  try {
    const [highlights, statsData] = await Promise.all([
      api.get<Highlight[]>(`/crews/${props.crewId}/highlights?limit=24`),
      api.get<Stats>(`/crews/${props.crewId}/highlights/stats`),
    ]);
    stats.value = statsData;

    // Group highlights by week
    const weekMap = new Map<string, WeekGroup>();
    for (const h of highlights) {
      if (!weekMap.has(h.week_start)) {
        weekMap.set(h.week_start, { weekStart: h.week_start, weekEnd: h.week_end, highlights: [] });
      }
      weekMap.get(h.week_start)!.highlights.push({ ...h, expanded: false });
    }
    weeks.value = Array.from(weekMap.values());
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
});

function gameLabel(game: string): string {
  if (game === 'toss-paper') return 'Toss Paper';
  if (game === 'origami-trail') return 'Origami Trail';
  return game;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toggleExpand(highlight: Highlight) {
  highlight.expanded = !highlight.expanded;
}
</script>
