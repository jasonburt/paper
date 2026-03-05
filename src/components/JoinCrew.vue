<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-6 font-serif text-center">
    <div class="py-12">
      <h1 class="text-3xl text-[#1A1A1A] mb-4">Join a Crew</h1>
      <p class="text-lg text-[#6B6B6B] mb-6">Enter invite code:</p>
      <div class="flex justify-center mb-2">
        <input
          ref="codeInputRef"
          v-model="code"
          type="text"
          maxlength="6"
          placeholder="ABC123"
          class="w-50 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-mono text-2xl text-center tracking-[4px] outline-none focus:border-[#4992FF] uppercase"
          @keydown.enter="handleJoin"
        />
      </div>
      <p v-if="error" class="text-sm text-[#FF4F36] mb-4">{{ error }}</p>
      <div class="mt-4">
        <button
          class="text-2xl text-[#4992FF] hover:text-[#FF8F01] transition-colors"
          :disabled="submitting"
          @click="handleJoin"
        >
          {{ submitting ? '...' : '[ Join ]' }}
        </button>
      </div>
      <div class="mt-8">
        <button
          class="text-sm text-[#6B6B6B] hover:text-[#FF8F01] transition-colors"
          @click="goBack"
        >
          ← Back
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

const code = ref('');
const error = ref('');
const submitting = ref(false);
const codeInputRef = ref<HTMLInputElement>();

onMounted(() => {
  nextTick(() => codeInputRef.value?.focus());
});

async function handleJoin() {
  const c = code.value.trim().toUpperCase();
  if (!c || c.length < 4) {
    error.value = 'Enter a valid code';
    return;
  }
  const user = getUser();
  if (!user) return;

  submitting.value = true;
  error.value = '';

  try {
    const result = await api.post<any>('/crews/join', { invite_code: c, user_id: user.id });
    pushRoute(`/paper-crew-room/${result.crew_id}`);
  } catch (e: any) {
    error.value = e.message || 'Failed to join';
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  pushRoute('/paper-crew');
}
</script>
