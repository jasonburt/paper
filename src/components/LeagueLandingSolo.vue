<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-16 text-center">
    <!-- Hero -->
    <div class="mb-16">
      <p class="text-sm tracking-[0.3em] text-[#6B6B6B] uppercase mb-4 font-sans">Introducing</p>
      <h1 class="text-5xl sm:text-6xl font-serif text-[#1A1A1A] tracking-wide mb-3">PAPER LEAGUE</h1>
      <div class="flex items-center justify-center gap-2 mb-6">
        <span class="w-8 h-px bg-[#D0D0D0]"></span>
        <span class="w-2 h-2 rounded-full bg-[#FDE801]"></span>
        <span class="w-2 h-2 rounded-full bg-[#FF4F36]"></span>
        <span class="w-2 h-2 rounded-full bg-[#4992FF]"></span>
        <span class="w-8 h-px bg-[#D0D0D0]"></span>
      </div>
      <p class="text-xl text-[#6B6B6B] font-serif">Every throw counts.</p>
    </div>

    <!-- The pitch -->
    <div class="text-left max-w-lg mx-auto mb-16 space-y-6">
      <p class="text-[#1A1A1A] text-lg leading-relaxed">
        You get <strong>5 attempts</strong>. Your best 3 count. No grinding, no second chances — just you and the paper.
      </p>
      <p class="text-[#6B6B6B] leading-relaxed">
        Paper League is a weekly competition where every throw, every shot, every combo matters.
        Beat your personal best and climb the tiers from <em>Scrap</em> all the way to <em>Paper Champion</em>.
      </p>
    </div>

    <!-- How it works -->
    <div class="mb-16">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-8">Your week</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
        <div class="bg-[#F9F9F9] rounded-lg p-6" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <div class="text-3xl mb-3">Thu</div>
          <p class="text-sm text-[#6B6B6B]">New matchup drops. See who you're up against. Plan your strategy.</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-6" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <div class="text-3xl mb-3">Play</div>
          <p class="text-sm text-[#6B6B6B]">5 attempts per game. Best 3 count. Beat your PB for a bonus multiplier.</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-6" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <div class="text-3xl mb-3">Wed</div>
          <p class="text-sm text-[#6B6B6B]">Scores lock. Results drop Thursday. Did you climb a tier?</p>
        </div>
      </div>
    </div>

    <!-- The hook -->
    <div class="mb-16 text-left max-w-lg mx-auto">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-6">Get better, not just busier</h2>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#FDE801] mt-2 shrink-0"></span>
          <p class="text-[#6B6B6B]"><strong class="text-[#1A1A1A]">Personal bests matter.</strong> Beat your PB during a league week and your crew gets a 1.1x bonus.</p>
        </div>
        <div class="flex items-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#FF4F36] mt-2 shrink-0"></span>
          <p class="text-[#6B6B6B]"><strong class="text-[#1A1A1A]">Streaks reward consistency.</strong> Play every week and earn up to a 1.15x multiplier.</p>
        </div>
        <div class="flex items-start gap-3">
          <span class="w-2 h-2 rounded-full bg-[#4992FF] mt-2 shrink-0"></span>
          <p class="text-[#6B6B6B]"><strong class="text-[#1A1A1A]">Improvement is tracked.</strong> Getting better week over week earns bonus points — even if you're not the best player.</p>
        </div>
      </div>
    </div>

    <!-- Tiers visual -->
    <div class="mb-16">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-8">Climb the tiers</h2>
      <div class="flex flex-col items-center gap-3">
        <div class="flex items-center gap-3 px-6 py-3 rounded-lg bg-[#FDE801]/10 border border-[#FDE801]/30 w-48">
          <span class="font-mono text-sm text-[#6B6B6B]">T1</span>
          <span class="font-serif text-[#1A1A1A]">Paper Champion</span>
        </div>
        <div class="flex items-center gap-3 px-6 py-3 rounded-lg bg-[#FF8F01]/10 border border-[#FF8F01]/30 w-44">
          <span class="font-mono text-sm text-[#6B6B6B]">T2</span>
          <span class="font-serif text-[#1A1A1A]">Press</span>
        </div>
        <div class="flex items-center gap-3 px-6 py-3 rounded-lg bg-[#4992FF]/10 border border-[#4992FF]/30 w-40">
          <span class="font-mono text-sm text-[#6B6B6B]">T3</span>
          <span class="font-serif text-[#1A1A1A]">Fold</span>
        </div>
        <div class="flex items-center gap-3 px-6 py-3 rounded-lg bg-[#D0D0D0]/20 border border-[#D0D0D0]/40 w-36">
          <span class="font-mono text-sm text-[#6B6B6B]">T4</span>
          <span class="font-serif text-[#1A1A1A]">Scrap</span>
        </div>
        <p class="text-xs text-[#6B6B6B] mt-2">Everyone starts at Scrap. Earn your way up.</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="mb-8">
      <a
        href="#"
        class="inline-block text-xl text-[#4992FF] hover:text-[#FF8F01] transition-colors font-serif"
        @click.prevent="navigate('/paper-crew')"
      >
        [ Join a Crew to Start ]
      </a>
      <p class="text-sm text-[#6B6B6B] mt-4">Season 1 starts soon. 4 weeks. Every throw counts.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

function navigate(path: string) {
  pushRoute(path);
}
</script>
