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
      <p class="text-xl text-[#6B6B6B] font-serif">Fantasy football, but paper airplanes.</p>
    </div>

    <!-- The pitch -->
    <div class="text-left max-w-lg mx-auto mb-16 space-y-6">
      <p class="text-[#1A1A1A] text-lg leading-relaxed">
        Get your friends together. Form a crew. Compete against other crews every week in Toss Paper and Origami Trail.
      </p>
      <p class="text-[#6B6B6B] leading-relaxed">
        It's the group chat energy of fantasy football — trash talk, strategy, lineup debates — but the games take 2 minutes, not 3 hours on a Sunday.
      </p>
    </div>

    <!-- How it works -->
    <div class="mb-16">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-8">How your crew week works</h2>
      <div class="space-y-0 text-left max-w-md mx-auto">
        <div class="flex gap-4 pb-6">
          <div class="flex flex-col items-center">
            <span class="w-8 h-8 rounded-full bg-[#FDE801] flex items-center justify-center text-sm font-mono text-[#1A1A1A]">1</span>
            <span class="w-px flex-1 bg-[#D0D0D0]/60 mt-2"></span>
          </div>
          <div>
            <p class="font-serif text-[#1A1A1A] text-lg">Thursday: Set your lineup</p>
            <p class="text-sm text-[#6B6B6B] mt-1">Crew leader picks 3–5 active players for the week. Who's in? Who's benched? The debates start here.</p>
          </div>
        </div>
        <div class="flex gap-4 pb-6">
          <div class="flex flex-col items-center">
            <span class="w-8 h-8 rounded-full bg-[#FF4F36] flex items-center justify-center text-sm font-mono text-white">2</span>
            <span class="w-px flex-1 bg-[#D0D0D0]/60 mt-2"></span>
          </div>
          <div>
            <p class="font-serif text-[#1A1A1A] text-lg">Pick your defense</p>
            <p class="text-sm text-[#6B6B6B] mt-1">Choose a modifier that messes with your opponent. Combo Lock? No Retry? Check their stats and make them sweat.</p>
          </div>
        </div>
        <div class="flex gap-4 pb-6">
          <div class="flex flex-col items-center">
            <span class="w-8 h-8 rounded-full bg-[#4992FF] flex items-center justify-center text-sm font-mono text-white">3</span>
            <span class="w-px flex-1 bg-[#D0D0D0]/60 mt-2"></span>
          </div>
          <div>
            <p class="font-serif text-[#1A1A1A] text-lg">Play your 5 attempts</p>
            <p class="text-sm text-[#6B6B6B] mt-1">Each player gets 5 tries per game. Best 3 count. No grinding — every throw matters.</p>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="flex flex-col items-center">
            <span class="w-8 h-8 rounded-full bg-[#FF8F01] flex items-center justify-center text-sm font-mono text-white">4</span>
          </div>
          <div>
            <p class="font-serif text-[#1A1A1A] text-lg">Wednesday: Scores lock</p>
            <p class="text-sm text-[#6B6B6B] mt-1">Results drop Thursday. Win, and your crew climbs. Lose, and someone's getting roasted in the group chat.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- What makes it fun -->
    <div class="mb-16 text-left max-w-lg mx-auto">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-6">Why your friend group will love this</h2>
      <div class="space-y-5">
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-1">The lineup drama</p>
          <p class="text-sm text-[#6B6B6B]">Only 3–5 players count each week. Who deserves a roster spot? Who's been slacking? The crew leader decides.</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-1">The mid-week check-in</p>
          <p class="text-sm text-[#6B6B6B]">"We're down by 14 points. Did anyone use their last attempts yet?" Real-time matchup scores keep the tension going all week.</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-1">The defense mind games</p>
          <p class="text-sm text-[#6B6B6B]">Stalk the other crew's stats. Their best player crushes Origami Trail? Hit them with "Speed Run" — only Toss Paper counts this week.</p>
        </div>
        <div class="bg-[#F9F9F9] rounded-lg p-5" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="font-serif text-[#1A1A1A] mb-1">The MVP moment</p>
          <p class="text-sm text-[#6B6B6B]">Weekly MVP badge for the top contributor. Bragging rights are earned, not given.</p>
        </div>
      </div>
    </div>

    <!-- Crew size callout -->
    <div class="mb-16 bg-[#F9F9F9] rounded-lg p-8 text-left max-w-lg mx-auto" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
      <p class="font-serif text-xl text-[#1A1A1A] mb-3">You need 3 friends.</p>
      <p class="text-[#6B6B6B]">
        Crews need at least 3 members to enter the league. Up to 8 per crew.
        Share an invite code and you're in. Takes 30 seconds.
      </p>
    </div>

    <!-- Season structure -->
    <div class="mb-16">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-4">4-week seasons</h2>
      <p class="text-[#6B6B6B] max-w-md mx-auto mb-6">Short enough to stay fun, long enough to mean something. Top crews from each tier compete in the Season Championship — one live 90-minute session on Friday night.</p>
      <div class="flex items-center justify-center gap-3">
        <div class="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#FDE801]/10 border border-[#FDE801]/30">
          <span class="font-serif text-sm text-[#1A1A1A]">Paper Champion</span>
        </div>
        <span class="text-[#D0D0D0]">&larr;</span>
        <div class="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#FF8F01]/10 border border-[#FF8F01]/30">
          <span class="font-serif text-sm text-[#1A1A1A]">Press</span>
        </div>
        <span class="text-[#D0D0D0]">&larr;</span>
        <div class="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#4992FF]/10 border border-[#4992FF]/30">
          <span class="font-serif text-sm text-[#1A1A1A]">Fold</span>
        </div>
        <span class="text-[#D0D0D0]">&larr;</span>
        <div class="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#D0D0D0]/20 border border-[#D0D0D0]/40">
          <span class="font-serif text-sm text-[#1A1A1A]">Scrap</span>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="mb-8">
      <a
        href="#"
        class="inline-block text-xl text-[#4992FF] hover:text-[#FF8F01] transition-colors font-serif"
        @click.prevent="navigate('/paper-crew/create')"
      >
        [ Create Your Crew ]
      </a>
      <p class="text-sm text-[#6B6B6B] mt-4">Season 1 starts soon. Grab your friends.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

function navigate(path: string) {
  pushRoute(path);
}
</script>
