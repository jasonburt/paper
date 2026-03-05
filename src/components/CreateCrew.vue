<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-6 font-serif">
    <!-- Form -->
    <div v-if="!created" class="text-center py-12">
      <h1 class="text-3xl text-[#1A1A1A] mb-4">Create a Crew</h1>
      <p class="text-lg text-[#6B6B6B] mb-6">Crew Name:</p>
      <div class="flex justify-center mb-6">
        <input
          ref="nameInputRef"
          v-model="crewName"
          type="text"
          maxlength="24"
          placeholder="e.g. Lunch Squad"
          class="w-70 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif outline-none focus:border-[#4992FF] text-base"
          @keydown.enter="handleCreate"
        />
      </div>
      <button
        class="text-2xl text-[#FF4F36] hover:text-[#FF8F01] transition-colors"
        :disabled="submitting"
        @click="handleCreate"
      >
        {{ submitting ? '...' : '[ Create ]' }}
      </button>
      <div class="mt-8">
        <button
          class="text-sm text-[#6B6B6B] hover:text-[#FF8F01] transition-colors"
          @click="goBack"
        >
          ← Back
        </button>
      </div>
    </div>

    <!-- Code screen -->
    <div v-else class="text-center py-12">
      <h1 class="text-3xl text-[#1A1A1A] mb-2">Crew Created!</h1>
      <p class="text-xl text-[#6B6B6B] mb-8">{{ createdCrew.name }}</p>
      <p class="text-lg text-[#6B6B6B] mb-4">Your invite code:</p>
      <div class="flex justify-center mb-3">
        <div class="px-8 py-3 rounded-lg bg-[#F9F9F9] border-2 border-[#4992FF]">
          <span class="text-4xl font-mono font-bold text-[#1A1A1A]">{{ createdCrew.invite_code }}</span>
        </div>
      </div>
      <p class="text-sm text-[#6B6B6B] mb-6">Share this code with friends</p>
      <div class="space-y-4">
        <button
          class="text-xl text-[#4992FF] hover:text-[#FF8F01] transition-colors block mx-auto"
          @click="copyCode"
        >
          {{ codeCopied ? 'Copied!' : '[ Copy Code ]' }}
        </button>
        <button
          class="text-xl text-[#FF4F36] hover:text-[#FF8F01] transition-colors block mx-auto"
          @click="goToCrew"
        >
          [ Go to Crew ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { getUser } from '../utils/user';

const crewName = ref('');
const submitting = ref(false);
const created = ref(false);
const createdCrew = ref({ id: 0, name: '', invite_code: '' });
const codeCopied = ref(false);
const nameInputRef = ref<HTMLInputElement>();

onMounted(() => {
  nextTick(() => nameInputRef.value?.focus());
});

async function handleCreate() {
  const name = crewName.value.trim();
  if (!name || submitting.value) return;
  const user = getUser();
  if (!user) return;

  submitting.value = true;
  try {
    const crew = await api.post<any>('/crews', { name, created_by: user.id });
    createdCrew.value = crew;
    created.value = true;
  } catch {
    // ignore
  } finally {
    submitting.value = false;
  }
}

function copyCode() {
  navigator.clipboard.writeText(createdCrew.value.invite_code).then(() => {
    codeCopied.value = true;
    setTimeout(() => { codeCopied.value = false; }, 1500);
  });
}

function goToCrew() {
  pushRoute(`/paper-crew-room/${createdCrew.value.id}`);
}

function goBack() {
  pushRoute('/paper-crew');
}
</script>
