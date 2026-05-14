<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-6 font-serif">
    <div class="text-center py-12">
      <h1 class="text-3xl text-[#1A1A1A] mb-2">{{ pageTitle }}</h1>
      <p class="text-base text-[#6B6B6B] mb-8">{{ pageSubtitle }}</p>

      <!-- Step 1: Email -->
      <div class="flex justify-center mb-4">
        <input
          ref="emailInputRef"
          v-model="email"
          type="email"
          placeholder="you@email.com"
          class="w-72 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif outline-none focus:border-[#4992FF] text-base"
          :disabled="step !== 'email'"
          @keydown.enter="handleSubmit"
        />
      </div>

      <!-- Step 2: Password (for existing users or new signups) -->
      <div v-if="step === 'password' || step === 'signup'" class="flex justify-center mb-4">
        <input
          ref="passwordInputRef"
          v-model="password"
          type="password"
          :placeholder="needsSetPassword ? 'Create a password' : 'Password'"
          class="w-72 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif outline-none focus:border-[#4992FF] text-base"
          @keydown.enter="handleSubmit"
        />
      </div>

      <!-- Grandfathered user notice -->
      <p v-if="needsSetPassword" class="text-sm text-[#6B6B6B] mb-4">
        We've added passwords. Set one to continue.
      </p>

      <!-- Step 3: Signup fields (username + reason) -->
      <div v-if="step === 'signup'" class="flex justify-center mb-4">
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

      <div v-if="step === 'signup'" class="flex justify-center mb-4">
        <textarea
          ref="reasonInputRef"
          v-model="reason"
          maxlength="500"
          placeholder="Why do you want to join Paper? (2+ sentences)"
          rows="3"
          class="w-72 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif outline-none focus:border-[#4992FF] text-base resize-none"
        />
      </div>

      <!-- Invite code (optional, skips waitlist) -->
      <div v-if="step === 'signup'" class="flex justify-center mb-4">
        <input
          v-model="inviteCode"
          type="text"
          maxlength="8"
          placeholder="Invite code (optional)"
          class="w-72 px-3 py-2 border-2 border-[#D0D0D0] rounded bg-[#FAFAFA] text-[#1A1A1A] font-serif outline-none focus:border-[#4992FF] text-base uppercase tracking-widest text-center"
          @keydown.enter="handleSubmit"
        />
      </div>

      <p v-if="inviteCodeStatus === 'valid'" class="text-sm text-[#4992FF] mb-4">
        Invited by {{ invitedBy }} — you'll skip the waitlist!
      </p>
      <p v-if="inviteCodeStatus === 'invalid'" class="text-sm text-[#FF4F36] mb-4">
        Invalid or already used invite code
      </p>

      <p v-if="step === 'signup' && !inviteCode" class="text-sm text-[#6B6B6B] mb-6">
        Paper is invite-only. Tell us about yourself and we'll review your request on Thursday.
      </p>
      <p v-if="step === 'signup' && inviteCode && inviteCodeStatus !== 'valid'" class="text-sm text-[#6B6B6B] mb-6">
        Have an invite code? Enter it above to skip the waitlist.
      </p>

      <!-- Submit -->
      <button
        class="text-2xl text-[#4992FF] hover:text-[#FF8F01] transition-colors"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitLabel }}
      </button>

      <!-- Change email link -->
      <div v-if="step !== 'email'" class="mt-4">
        <button
          class="text-sm text-[#6B6B6B] hover:text-[#4992FF] transition-colors"
          @click="resetToEmail"
        >
          ← Different email
        </button>
      </div>

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
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { pushRoute } from '../router';
import { api } from '../utils/api';
import { saveUserLocal, saveToken, setPlayerColor, setPlayerIcon, setProfileSet, type PaperUser } from '../utils/user';

type Step = 'email' | 'password' | 'signup';

const email = ref('');
const password = ref('');
const username = ref('');
const reason = ref('');
const inviteCode = ref('');
const inviteCodeStatus = ref<'unchecked' | 'valid' | 'invalid'>('unchecked');
const invitedBy = ref('');
const step = ref<Step>('email');
const submitting = ref(false);
const error = ref('');
const needsSetPassword = ref(false);
const waitlistedEmail = ref(false);

// Check invite code validity when it changes
let inviteCheckTimeout: ReturnType<typeof setTimeout>;
watch(inviteCode, (val) => {
  clearTimeout(inviteCheckTimeout);
  const code = val.trim();
  if (code.length < 8) {
    inviteCodeStatus.value = 'unchecked';
    invitedBy.value = '';
    return;
  }
  inviteCheckTimeout = setTimeout(async () => {
    try {
      const resp = await api.get<{ valid: boolean; invited_by?: string; reason?: string }>(`/invites/check?code=${encodeURIComponent(code)}`);
      if (resp.valid) {
        inviteCodeStatus.value = 'valid';
        invitedBy.value = resp.invited_by || '';
      } else {
        inviteCodeStatus.value = 'invalid';
      }
    } catch {
      inviteCodeStatus.value = 'invalid';
    }
  }, 300);
});

const emailInputRef = ref<HTMLInputElement>();
const passwordInputRef = ref<HTMLInputElement>();
const usernameInputRef = ref<HTMLInputElement>();
const reasonInputRef = ref<HTMLTextAreaElement>();

const pageTitle = computed(() => {
  if (step.value === 'signup') return 'Join Paper';
  return 'Sign In';
});

const pageSubtitle = computed(() => {
  if (step.value === 'email') return 'Enter your email to continue';
  if (step.value === 'signup' && waitlistedEmail.value) return 'Have an invite code? Enter it below to skip the wait';
  if (step.value === 'signup') return 'Request access to Paper';
  if (needsSetPassword.value) return 'Set a password for your account';
  return 'Enter your password';
});

const submitLabel = computed(() => {
  if (submitting.value) return '...';
  if (step.value === 'email') return '[ Continue ]';
  if (step.value === 'signup') return inviteCode.value.trim().length === 8 ? '[ Join Paper ]' : '[ Request Access ]';
  if (needsSetPassword.value) return '[ Set Password ]';
  return '[ Sign In ]';
});

onMounted(() => {
  nextTick(() => emailInputRef.value?.focus());
});

function resetToEmail() {
  step.value = 'email';
  password.value = '';
  username.value = '';
  reason.value = '';
  inviteCode.value = '';
  inviteCodeStatus.value = 'unchecked';
  invitedBy.value = '';
  error.value = '';
  needsSetPassword.value = false;
  waitlistedEmail.value = false;
  nextTick(() => emailInputRef.value?.focus());
}

async function handleSubmit() {
  if (submitting.value) return;
  error.value = '';

  const cleanEmail = email.value.trim().toLowerCase();
  if (!cleanEmail) {
    error.value = 'Please enter your email';
    return;
  }

  // Step 1: Check email
  if (step.value === 'email') {
    submitting.value = true;
    try {
      const resp = await api.post<{ exists: boolean; has_password?: boolean; status?: string; waitlisted?: boolean; waitlist_status?: string }>('/auth/check', { email: cleanEmail });

      if (resp.exists) {
        // Existing user
        needsSetPassword.value = !resp.has_password;
        step.value = 'password';
        submitting.value = false;
        nextTick(() => passwordInputRef.value?.focus());
      } else if (resp.waitlisted) {
        // Already on waitlist — let them proceed to signup so they can enter an invite code
        if (resp.waitlist_status === 'pending' || resp.waitlist_status === 'rejected') {
          step.value = 'signup';
          submitting.value = false;
          waitlistedEmail.value = true;
          nextTick(() => passwordInputRef.value?.focus());
        } else {
          error.value = 'Check your email — you may already have an account.';
        }
        submitting.value = false;
      } else {
        // New user — signup flow
        step.value = 'signup';
        submitting.value = false;
        nextTick(() => passwordInputRef.value?.focus());
      }
    } catch (e: any) {
      error.value = e.message || 'Something went wrong';
      submitting.value = false;
    }
    return;
  }

  // Step 2: Login with password
  if (step.value === 'password') {
    if (!password.value) {
      error.value = 'Please enter a password';
      return;
    }
    if (password.value.length < 6) {
      error.value = 'Password must be at least 6 characters';
      return;
    }
    submitting.value = true;
    try {
      const resp = await api.post<PaperUser & { token: string }>('/users', {
        email: cleanEmail,
        password: password.value,
      });
      if (resp.token) saveToken(resp.token);
      saveUserLocal({ id: resp.id, username: resp.username, email: resp.email, icon: resp.icon, color: resp.color });
      if (resp.icon) setPlayerIcon(resp.icon);
      if (resp.color) setPlayerColor(resp.color);
      setProfileSet(true);
      pushRoute('/paper-crew');
    } catch (e: any) {
      error.value = e.message || 'Invalid password';
    } finally {
      submitting.value = false;
    }
    return;
  }

  // Step 3: Signup (waitlist request or invite code)
  if (step.value === 'signup') {
    const cleanName = username.value.trim();
    const code = inviteCode.value.trim().toUpperCase();
    if (!password.value || password.value.length < 6) {
      error.value = 'Password must be at least 6 characters';
      return;
    }
    if (!cleanName) {
      error.value = 'Please choose a username';
      return;
    }
    if (!code && !reason.value.trim()) {
      error.value = 'Please tell us why you want to join';
      return;
    }

    submitting.value = true;
    try {
      const body: Record<string, string> = {
        email: cleanEmail,
        username: cleanName,
        password: password.value,
      };
      if (code) {
        body.invite_code = code;
      } else {
        body.reason = reason.value.trim();
      }

      const resp = await api.post<{ waitlisted?: boolean; message?: string; token?: string; id?: number; username?: string; email?: string; icon?: string; color?: string }>('/users', body);

      if (resp.waitlisted) {
        pushRoute('/waitlist-confirmed');
      } else if (resp.token) {
        saveToken(resp.token);
        saveUserLocal({ id: resp.id!, username: resp.username!, email: resp.email!, icon: resp.icon || 'plane', color: resp.color || '#FF4F36' });
        if (resp.icon) setPlayerIcon(resp.icon);
        if (resp.color) setPlayerColor(resp.color);
        setProfileSet(true);
        pushRoute('/paper-crew');
      }
    } catch (e: any) {
      error.value = e.message || 'Something went wrong';
    } finally {
      submitting.value = false;
    }
  }
}

function goHome() {
  pushRoute('/');
}
</script>
