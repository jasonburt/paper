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
      <p class="text-xl text-[#6B6B6B] font-serif">Team building that doesn't feel like team building.</p>
    </div>

    <!-- The pitch -->
    <div class="text-left max-w-lg mx-auto mb-16 space-y-6">
      <p class="text-[#1A1A1A] text-lg leading-relaxed">
        Your team already has a Slack channel. Give them something to compete over.
      </p>
      <p class="text-[#6B6B6B] leading-relaxed">
        Paper League is a weekly game competition for teams. Form department crews, compete head-to-head, and create the kind of cross-team energy that no offsite can manufacture. Each round takes 2 minutes. The trash talk lasts all week.
      </p>
    </div>

    <!-- Why it works for teams -->
    <div class="mb-16">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-8">Why teams actually play this</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left max-w-lg mx-auto">
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-2">2 minutes, not 2 hours</p>
          <p class="text-sm text-[#6B6B6B]">No one has time for another team event. Paper League games take 2 minutes. Play between meetings, on the bus, during standup (we won't tell).</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-2">Cross-team connections</p>
          <p class="text-sm text-[#6B6B6B]">Engineering vs. Design. Marketing vs. Product. The rivalries write themselves. People talk to teammates they'd never otherwise meet.</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-2">Low-key competitive</p>
          <p class="text-sm text-[#6B6B6B]">Capped attempts mean no one grinds for hours. 5 tries, best 3 count. Skill and strategy over time invested.</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-2">Async-first</p>
          <p class="text-sm text-[#6B6B6B]">Distributed team? Different time zones? Everyone plays on their own schedule during the week. Results drop Thursday.</p>
        </div>
      </div>
    </div>

    <!-- How it runs -->
    <div class="mb-16 text-left max-w-lg mx-auto">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-6">How to run it at your company</h2>
      <div class="space-y-6">
        <div class="flex gap-4">
          <span class="font-mono text-sm text-[#6B6B6B] mt-1 shrink-0 w-6">01</span>
          <div>
            <p class="text-[#1A1A1A] font-serif">Create department crews</p>
            <p class="text-sm text-[#6B6B6B] mt-1">Each team creates a crew and shares the invite code on Slack. 3–8 people per crew.</p>
          </div>
        </div>
        <div class="flex gap-4">
          <span class="font-mono text-sm text-[#6B6B6B] mt-1 shrink-0 w-6">02</span>
          <div>
            <p class="text-[#1A1A1A] font-serif">Crew leaders set weekly lineups</p>
            <p class="text-sm text-[#6B6B6B] mt-1">Pick 3–5 active players each week. Rotate to keep everyone involved, or go full tryhard — your call.</p>
          </div>
        </div>
        <div class="flex gap-4">
          <span class="font-mono text-sm text-[#6B6B6B] mt-1 shrink-0 w-6">03</span>
          <div>
            <p class="text-[#1A1A1A] font-serif">Play during the week</p>
            <p class="text-sm text-[#6B6B6B] mt-1">5 attempts per game mode. Takes 10 minutes total for the whole week. Mid-week score updates keep things spicy.</p>
          </div>
        </div>
        <div class="flex gap-4">
          <span class="font-mono text-sm text-[#6B6B6B] mt-1 shrink-0 w-6">04</span>
          <div>
            <p class="text-[#1A1A1A] font-serif">Thursday: results and bragging</p>
            <p class="text-sm text-[#6B6B6B] mt-1">Weekly standings update. MVP badges. Tier promotions. Post the results in #general and watch the replies roll in.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Season format -->
    <div class="mb-16 bg-[#F9F9F9] rounded-lg p-8 text-left max-w-lg mx-auto" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
      <p class="font-serif text-xl text-[#1A1A1A] mb-3">4-week seasons. Built for short attention spans.</p>
      <p class="text-[#6B6B6B] mb-4">
        Each season is 4 weeks — long enough for real rivalries, short enough that nobody burns out.
        Top crews compete in a Friday evening Championship session. It's the company all-hands nobody dreads.
      </p>
      <div class="flex flex-wrap gap-2">
        <span class="px-3 py-1 rounded-full bg-[#FDE801]/10 border border-[#FDE801]/30 text-xs font-serif text-[#1A1A1A]">Paper Champion</span>
        <span class="px-3 py-1 rounded-full bg-[#FF8F01]/10 border border-[#FF8F01]/30 text-xs font-serif text-[#1A1A1A]">Press</span>
        <span class="px-3 py-1 rounded-full bg-[#4992FF]/10 border border-[#4992FF]/30 text-xs font-serif text-[#1A1A1A]">Fold</span>
        <span class="px-3 py-1 rounded-full bg-[#D0D0D0]/20 border border-[#D0D0D0]/40 text-xs font-serif text-[#1A1A1A]">Scrap</span>
      </div>
    </div>

    <!-- Anti-cheat callout -->
    <div class="mb-16 text-left max-w-lg mx-auto">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-4">Fair by design</h2>
      <p class="text-[#6B6B6B] mb-4">No one wants the intern grinding 200 attempts to carry the team. Paper League caps it at 5 tries per game. Scores are ranked by percentile so every department competes on equal footing — even if engineering has a ringer.</p>
      <div class="flex flex-wrap gap-3 text-xs text-[#6B6B6B]">
        <span class="px-3 py-1 rounded-full border border-[#D0D0D0]">5 attempt cap</span>
        <span class="px-3 py-1 rounded-full border border-[#D0D0D0]">Percentile scoring</span>
        <span class="px-3 py-1 rounded-full border border-[#D0D0D0]">No alt accounts</span>
        <span class="px-3 py-1 rounded-full border border-[#D0D0D0]">Anti-sandbagging</span>
      </div>
    </div>

    <!-- CTA -->
    <div class="mb-8">
      <a
        href="#"
        class="inline-block text-xl text-[#4992FF] hover:text-[#FF8F01] transition-colors font-serif"
        @click.prevent="navigate('/paper-crew/create')"
      >
        [ Start Your Company League ]
      </a>
      <p class="text-sm text-[#6B6B6B] mt-4">Free. No signup forms. No sales calls. Just create a crew.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

function navigate(path: string) {
  pushRoute(path);
}
</script>
