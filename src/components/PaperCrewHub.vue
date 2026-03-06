<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-6 font-serif">
    <!-- Step 1: Profile picker -->
    <div v-if="step === 'profile'" class="text-center py-4">
      <h1 class="text-[28px] text-[#1A1A1A] mb-1">Welcome, {{ currentUser?.username }}!</h1>
      <p class="text-sm text-[#6B6B6B] mb-4">Pick your icon and color</p>

      <!-- Preview -->
      <div class="flex justify-center mb-1">
        <div class="w-12 h-12 rounded-full bg-[#F5F0E8] flex items-center justify-center">
          <PlayerIcon :icon="selectedIcon" :color="selectedColor" :size="28" />
        </div>
      </div>
      <p class="text-xs font-mono text-[#6B6B6B] mb-4">{{ selectedIconLabel }}</p>

      <!-- Username -->
      <p class="text-base text-[#1A1A1A] mb-2">Name</p>
      <div class="flex justify-center mb-1">
        <input
          v-model="editedUsername"
          type="text"
          maxlength="20"
          placeholder="Your username"
          class="w-60 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif text-center outline-none focus:border-[#4992FF] text-base"
        />
      </div>
      <p v-if="usernameError" class="text-sm text-[#FF4F36] mb-3">{{ usernameError }}</p>

      <!-- Email (read-only) -->
      <p v-if="currentUser?.email" class="text-xs font-mono text-[#B0A898] mb-6">{{ currentUser.email }}</p>

      <!-- Icon grid -->
      <p class="text-base text-[#1A1A1A] mb-3">Icon</p>
      <div class="flex justify-center gap-6 mb-6">
        <button
          v-for="icon in PLAYER_ICONS"
          :key="icon.key"
          class="flex flex-col items-center gap-1 cursor-pointer"
          @click="selectedIcon = icon.key"
        >
          <div
            class="p-1 rounded-full transition-all"
            :class="selectedIcon === icon.key ? 'ring-2 ring-[#1A1A1A] ring-offset-2' : ''"
          >
            <PlayerIcon :icon="icon.key" :color="selectedColor" :size="28" />
          </div>
          <span class="text-[9px] text-[#6B6B6B]">{{ icon.label }}</span>
        </button>
      </div>

      <!-- Color grid -->
      <p class="text-base text-[#1A1A1A] mb-3">Color</p>
      <div class="flex justify-center gap-6 mb-6">
        <button
          v-for="c in PLAYER_COLORS"
          :key="c.hex"
          class="flex flex-col items-center gap-1 cursor-pointer"
          @click="selectedColor = c.hex"
        >
          <div
            class="w-10 h-10 rounded-full transition-all"
            :class="selectedColor === c.hex ? 'ring-2 ring-[#1A1A1A] ring-offset-2' : ''"
            :style="{ backgroundColor: c.hex }"
          ></div>
          <span class="text-[9px] text-[#6B6B6B]">{{ c.label }}</span>
        </button>
      </div>

      <!-- Save & Skip -->
      <button
        class="text-2xl text-[#4992FF] hover:text-[#FF8F01] transition-colors mb-2"
        :disabled="saving"
        @click="saveProfile"
      >
        {{ saving ? 'Saving...' : '[ Save & Continue ]' }}
      </button>
      <br />
      <button
        class="text-xs text-[#B0A898] hover:text-[#6B6B6B] transition-colors"
        @click="skipProfile"
      >
        skip for now
      </button>
      <div class="mt-6">
        <button
          class="text-sm text-[#6B6B6B] hover:text-[#FF8F01] transition-colors"
          @click="goHome"
        >
          ← Back
        </button>
      </div>
    </div>

    <!-- Step 2: Crew hub -->
    <div v-else-if="step === 'hub'">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl text-[#1A1A1A]">Paper Crew</h1>
        <div v-if="currentUser" class="flex items-center gap-2">
          <PlayerIcon
            :icon="currentUser.icon || playerIcon"
            :color="currentUser.color || playerColor"
            :size="20"
          />
          <span class="text-xs font-mono text-[#6B6B6B]">{{ currentUser.username }}</span>
          <button
            class="text-lg text-[#B0A898] hover:text-[#FF8F01] transition-colors ml-1"
            @click="editProfile"
          >
            ⚙
          </button>
          <button
            class="text-xs text-[#B0A898] hover:text-[#FF4F36] transition-colors ml-1"
            @click="handleLogout"
          >
            Log out
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingCrews" class="text-center py-20">
        <p class="text-lg text-[#6B6B6B]">Loading...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="crews.length === 0" class="text-center py-12">
        <p class="text-lg text-[#6B6B6B] mb-2">No crews yet</p>
        <p class="text-sm text-[#6B6B6B]">Create or join one to start competing!</p>
      </div>

      <!-- Crew list -->
      <div v-else>
        <p class="text-lg text-[#6B6B6B] mb-3">Your Crews:</p>
        <div class="space-y-3">
          <button
            v-for="crew in crews"
            :key="crew.id"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-md bg-[#F9F9F9] border border-[#D0D0D0]/60 hover:bg-[#F0F0F0] transition-colors text-left cursor-pointer"
            @click="goToCrewRoom(crew.id)"
          >
            <div class="w-3 h-3 rounded-full bg-[#4992FF] shrink-0"></div>
            <div class="flex-1 min-w-0">
              <p class="text-xl text-[#1A1A1A] font-serif">{{ crew.name }}</p>
              <p class="text-xs font-mono text-[#6B6B6B]">{{ crew.member_count }} members</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex justify-center gap-8 mt-8 mb-6">
        <button
          class="text-2xl text-[#4992FF] hover:text-[#FF8F01] transition-colors"
          @click="goCreate"
        >
          [ Create Crew ]
        </button>
        <button
          class="text-2xl text-[#4992FF] hover:text-[#FF8F01] transition-colors"
          @click="goJoin"
        >
          [ Join Crew ]
        </button>
      </div>

      <!-- Back -->
      <button
        class="text-sm text-[#6B6B6B] hover:text-[#FF8F01] transition-colors"
        @click="goHome"
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
import {
  getUser, updateUserProfile, validateSession, clearUser,
  getPlayerColor, getPlayerIcon, setPlayerColor, setPlayerIcon,
  isProfileSet, setProfileSet,
  PLAYER_COLORS, PLAYER_ICONS,
} from '../utils/user';
import PlayerIcon from './PlayerIcon.vue';

type Step = 'profile' | 'hub';

const step = ref<Step>('profile');
const currentUser = ref(getUser());
const saving = ref(false);

// Profile picker state
const selectedIcon = ref(getPlayerIcon());
const selectedColor = ref(getPlayerColor());
const editedUsername = ref(currentUser.value?.username || '');
const usernameError = ref('');
const selectedIconLabel = computed(
  () => PLAYER_ICONS.find(i => i.key === selectedIcon.value)?.label || selectedIcon.value,
);

const playerIcon = ref(getPlayerIcon());
const playerColor = ref(getPlayerColor());

// Crews
const crews = ref<any[]>([]);
const loadingCrews = ref(true);

onMounted(async () => {
  const user = getUser();
  if (!user) {
    pushRoute('/login');
    return;
  }

  // Validate session against DB (handles ephemeral DB reset)
  const validUser = await validateSession();
  if (!validUser) {
    pushRoute('/login');
    return;
  }
  currentUser.value = validUser;

  // If the server already has a non-default icon/color, the user has profiled before
  const hasProfile = isProfileSet() || (validUser.icon && validUser.icon !== 'plane') || (validUser.color && validUser.color !== '#FF4F36');
  if (!hasProfile) {
    step.value = 'profile';
    return;
  }

  // Restore profile flags from server data
  if (!isProfileSet() && validUser.icon) {
    setPlayerColor(validUser.color || '#FF4F36');
    setPlayerIcon(validUser.icon || 'plane');
    setProfileSet(true);
    playerIcon.value = validUser.icon || 'plane';
    playerColor.value = validUser.color || '#FF4F36';
  }

  step.value = 'hub';
  await loadCrews(validUser.id);
});

function handleLogout() {
  clearUser();
  pushRoute('/');
}

async function saveProfile() {
  if (!currentUser.value || saving.value) return;
  const cleanName = editedUsername.value.trim();
  if (!cleanName) {
    usernameError.value = 'Username cannot be empty';
    return;
  }
  usernameError.value = '';
  saving.value = true;
  try {
    await updateUserProfile(currentUser.value.id, selectedIcon.value, selectedColor.value, cleanName);
    currentUser.value = getUser();
    playerIcon.value = getPlayerIcon();
    playerColor.value = getPlayerColor();
    step.value = 'hub';
    await loadCrews(currentUser.value!.id);
  } catch (e: any) {
    if (e.message?.includes('already taken')) {
      usernameError.value = 'Username already taken';
    }
  } finally {
    saving.value = false;
  }
}

async function skipProfile() {
  if (!currentUser.value) return;
  const cleanName = editedUsername.value.trim() || currentUser.value.username;
  await updateUserProfile(currentUser.value.id, selectedIcon.value, selectedColor.value, cleanName).catch(() => {});
  currentUser.value = getUser();
  playerIcon.value = getPlayerIcon();
  playerColor.value = getPlayerColor();
  step.value = 'hub';
  await loadCrews(currentUser.value!.id);
}

function editProfile() {
  if (!currentUser.value) return;
  selectedIcon.value = currentUser.value.icon || getPlayerIcon();
  selectedColor.value = currentUser.value.color || getPlayerColor();
  editedUsername.value = currentUser.value.username;
  usernameError.value = '';
  step.value = 'profile';
}

async function loadCrews(userId: number) {
  loadingCrews.value = true;
  try {
    crews.value = await api.get<any[]>(`/crews/user/${userId}`);
  } catch {
    crews.value = [];
  } finally {
    loadingCrews.value = false;
  }
}

function goToCrewRoom(crewId: string) {
  pushRoute(`/paper-crew-room/${crewId}`);
}

function goCreate() {
  pushRoute('/paper-crew/create');
}

function goJoin() {
  pushRoute('/paper-crew/join');
}

function goHome() {
  pushRoute('/');
}
</script>
