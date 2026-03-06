<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-6 font-serif">
    <div class="text-center py-12">
      <h1 class="text-3xl text-[#1A1A1A] mb-2">Sign In</h1>
      <p class="text-base text-[#6B6B6B] mb-8">Enter your email to continue</p>

      <!-- Email input -->
      <div class="flex justify-center mb-4">
        <input
          ref="emailInputRef"
          v-model="email"
          type="email"
          placeholder="you@email.com"
          class="w-72 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif outline-none focus:border-[#4992FF] text-base"
          @keydown.enter="handleSubmit"
        />
      </div>

      <!-- Username input (shown for new accounts) -->
      <div v-if="showUsername" class="flex justify-center mb-4">
        <input
          ref="usernameInputRef"
          v-model="username"
          type="text"
          maxlength="20"
          placeholder="Choose a username..."
          class="w-72 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif outline-none focus:border-[#4992FF] text-base"
          @keydown.enter="handleSubmit"
        />
      </div>

      <p v-if="showUsername" class="text-sm text-[#6B6B6B] mb-6">New here? Pick a username to get started.</p>

      <!-- Submit -->
      <button
        class="text-2xl text-[#4992FF] hover:text-[#FF8F01] transition-colors"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '...' : '[ Continue ]' }}
      </button>

      <!-- Error -->
      <p v-if="error" class="mt-4 text-sm text-[#FF4F36]">{{ error }}</p>

      <!-- Back -->
      <div class="mt-8">
        <button
          class="text-sm text-[#6B6B6B] hover:text-[#FF8F01] transition-colors"
          @click="goHome"
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
import { saveUserLocal, saveToken, setPlayerColor, setPlayerIcon, setProfileSet, type PaperUser } from '../utils/user';

const email = ref('');
const username = ref('');
const showUsername = ref(false);
const submitting = ref(false);
const error = ref('');

const emailInputRef = ref<HTMLInputElement>();
const usernameInputRef = ref<HTMLInputElement>();

onMounted(() => {
  nextTick(() => emailInputRef.value?.focus());
});

async function handleSubmit() {
  const cleanEmail = email.value.trim().toLowerCase();
  if (!cleanEmail) {
    error.value = 'Please enter your email';
    return;
  }
  if (submitting.value) return;
  error.value = '';

  // If username field not shown yet, try to find existing account by email
  if (!showUsername.value) {
    submitting.value = true;
    try {
      const resp = await api.get<PaperUser & { token: string }>(`/users/me?email=${encodeURIComponent(cleanEmail)}`);
      // Existing user — log in and restore profile
      if (resp.token) saveToken(resp.token);
      saveUserLocal({ id: resp.id, username: resp.username, email: resp.email, icon: resp.icon, color: resp.color });
      if (resp.icon) setPlayerIcon(resp.icon);
      if (resp.color) setPlayerColor(resp.color);
      setProfileSet(true);
      pushRoute('/paper-crew');
      return;
    } catch {
      // User not found — show username field for signup
      showUsername.value = true;
      submitting.value = false;
      nextTick(() => usernameInputRef.value?.focus());
      return;
    }
  }

  // Signup — email + username
  const cleanName = username.value.trim();
  if (!cleanName) {
    error.value = 'Please choose a username';
    return;
  }

  submitting.value = true;
  try {
    const resp = await api.post<PaperUser & { token: string }>('/users', { email: cleanEmail, username: cleanName });
    if (resp.token) saveToken(resp.token);
    saveUserLocal({ id: resp.id, username: resp.username, email: resp.email, icon: resp.icon, color: resp.color });
    pushRoute('/paper-crew');
  } catch (e: any) {
    error.value = e.message || 'Something went wrong';
  } finally {
    submitting.value = false;
  }
}

function goHome() {
  pushRoute('/');
}
</script>
