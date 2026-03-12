<template>
  <div class="w-full max-w-3xl mx-auto px-4 py-16">
    <a
      href="#"
      class="inline-block text-sm text-[#4992FF] hover:text-[#FF8F01] transition-colors mb-8 font-sans"
      @click.prevent="navigate('/')"
    >
      ← Home
    </a>

    <h1 class="text-4xl font-serif text-[#1A1A1A] mb-2 tracking-wide text-center">Paper League</h1>
    <p class="text-center text-[#6B6B6B] mb-12 font-serif">Designs & Animations — Olympic Edition</p>

    <!-- =============================== -->
    <!-- ANIMATION 1: Solo — Javelin Throw -->
    <!-- =============================== -->
    <section class="mb-20">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-2">1. The Javelin Throw</h2>
      <p class="text-sm text-[#6B6B6B] mb-6">Solo landing page — athlete runs, throws, plane arcs across and crashes with a score.</p>

      <div class="bg-[#F9F9F9] rounded-xl p-8 overflow-hidden" style="height: 300px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); position: relative;">
        <div class="javelin-scene" style="position: relative; width: 100%; height: 100%;">
          <!-- Ground -->
          <div style="position: absolute; bottom: 30px; left: 0; right: 0; height: 1px; background: #D0D0D0;"></div>

          <!-- Distance markers on ground -->
          <div v-for="n in 5" :key="'mark'+n" style="position: absolute; bottom: 12px; font-family: Georgia, serif; font-size: 10px; color: #D0D0D0;" :style="{ left: `${20 + n * 14}%` }">
            {{ n * 50 }}m
          </div>

          <!-- Runner stick figure -->
          <svg class="javelin-runner" viewBox="0 0 120 160" width="70" height="100" style="position: absolute; bottom: 31px;">
            <!-- Head -->
            <circle cx="60" cy="20" r="12" fill="none" stroke="#1A1A1A" stroke-width="3"/>
            <!-- Body (leaning forward) -->
            <line x1="60" y1="32" x2="55" y2="85" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Back arm (holding airplane, reaching behind) -->
            <line class="javelin-arm" x1="55" y1="50" x2="25" y2="40" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Front arm (pumping) -->
            <line class="javelin-front-arm" x1="55" y1="50" x2="80" y2="60" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Paper airplane in hand (pointing right, behind runner) -->
            <polygon class="javelin-plane" points="10,35 25,40 10,45" fill="#FF4F36"/>
            <!-- Front leg -->
            <line class="javelin-leg-front" x1="55" y1="85" x2="75" y2="155" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Back leg -->
            <line class="javelin-leg-back" x1="55" y1="85" x2="35" y2="155" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
          </svg>

          <!-- Flying airplane (nose-right, arcs across) -->
          <svg class="javelin-flying-plane" viewBox="0 0 40 20" width="28" height="14" style="position: absolute; opacity: 0;">
            <polygon points="40,10 5,2 5,18" fill="#FF4F36"/>
            <line x1="10" y1="10" x2="38" y2="10" stroke="#FFFFFF" stroke-width="1"/>
          </svg>

          <!-- Crash mark (appears at landing) -->
          <div class="javelin-crash" style="position: absolute; bottom: 35px; right: 12%; opacity: 0; font-family: Georgia, serif; text-align: center;">
            <div style="font-size: 11px; color: #FF4F36; letter-spacing: 0.1em;">★</div>
          </div>

          <!-- Score popup -->
          <div class="javelin-score" style="position: absolute; bottom: 55px; right: 9%; opacity: 0; font-family: Georgia, serif; text-align: center;">
            <div style="font-size: 22px; font-weight: bold; color: #FF4F36;">247</div>
            <div style="font-size: 10px; color: #6B6B6B; margin-top: -2px;">points</div>
          </div>
        </div>
      </div>
    </section>

    <!-- =============================== -->
    <!-- ANIMATION 2: Friends — Relay Race -->
    <!-- =============================== -->
    <section class="mb-20">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-2">2. The Relay Handoff</h2>
      <p class="text-sm text-[#6B6B6B] mb-6">Friends landing page — a crew passing a paper airplane like a relay baton.</p>

      <div class="bg-[#F9F9F9] rounded-xl p-8 flex items-end justify-center overflow-hidden" style="height: 280px; box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
        <div class="relay-scene" style="position: relative; width: 100%; height: 220px;">
          <!-- Ground -->
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: #D0D0D0;"></div>

          <!-- Runner 1 (passing) -->
          <svg class="relay-runner1" viewBox="0 0 100 160" width="60" height="96" style="position: absolute; bottom: 1px;">
            <circle cx="45" cy="20" r="10" fill="none" stroke="#4992FF" stroke-width="3"/>
            <line x1="45" y1="30" x2="45" y2="80" stroke="#4992FF" stroke-width="3" stroke-linecap="round"/>
            <line x1="45" y1="45" x2="72" y2="38" stroke="#4992FF" stroke-width="3" stroke-linecap="round"/>
            <line x1="45" y1="45" x2="20" y2="55" stroke="#4992FF" stroke-width="3" stroke-linecap="round"/>
            <line x1="45" y1="80" x2="30" y2="120" stroke="#4992FF" stroke-width="3" stroke-linecap="round"/>
            <line x1="30" y1="120" x2="22" y2="155" stroke="#4992FF" stroke-width="3" stroke-linecap="round"/>
            <line x1="45" y1="80" x2="65" y2="120" stroke="#4992FF" stroke-width="3" stroke-linecap="round"/>
            <line x1="65" y1="120" x2="72" y2="155" stroke="#4992FF" stroke-width="3" stroke-linecap="round"/>
            <!-- Airplane baton -->
            <polygon class="relay-baton" points="72,33 90,38 72,43" fill="#FDE801"/>
          </svg>

          <!-- Runner 2 (receiving) -->
          <svg class="relay-runner2" viewBox="0 0 100 160" width="60" height="96" style="position: absolute; bottom: 1px;">
            <circle cx="50" cy="20" r="10" fill="none" stroke="#FF4F36" stroke-width="3"/>
            <line x1="50" y1="30" x2="50" y2="80" stroke="#FF4F36" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="45" x2="25" y2="38" stroke="#FF4F36" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="45" x2="75" y2="55" stroke="#FF4F36" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="80" x2="35" y2="120" stroke="#FF4F36" stroke-width="3" stroke-linecap="round"/>
            <line x1="35" y1="120" x2="28" y2="155" stroke="#FF4F36" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="80" x2="68" y2="120" stroke="#FF4F36" stroke-width="3" stroke-linecap="round"/>
            <line x1="68" y1="120" x2="75" y2="155" stroke="#FF4F36" stroke-width="3" stroke-linecap="round"/>
          </svg>

          <!-- Runner 3 (waiting) -->
          <svg class="relay-runner3" viewBox="0 0 100 160" width="60" height="96" style="position: absolute; bottom: 1px;">
            <circle cx="50" cy="20" r="10" fill="none" stroke="#FF8F01" stroke-width="3"/>
            <line x1="50" y1="30" x2="50" y2="80" stroke="#FF8F01" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="45" x2="30" y2="60" stroke="#FF8F01" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="45" x2="70" y2="60" stroke="#FF8F01" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="80" x2="40" y2="120" stroke="#FF8F01" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="120" x2="38" y2="155" stroke="#FF8F01" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="80" x2="60" y2="120" stroke="#FF8F01" stroke-width="3" stroke-linecap="round"/>
            <line x1="60" y1="120" x2="62" y2="155" stroke="#FF8F01" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- =============================== -->
    <!-- ANIMATION 3: Company — Synchronized Team -->
    <!-- =============================== -->
    <section class="mb-20">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-2">3. The Synchronized Launch</h2>
      <p class="text-sm text-[#6B6B6B] mb-6">Company landing page — a row of athletes launching paper airplanes in synchronized formation, like an opening ceremony.</p>

      <div class="bg-[#F9F9F9] rounded-xl p-8 flex items-end justify-center overflow-hidden" style="height: 280px; box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
        <div class="sync-scene" style="position: relative; width: 100%; height: 220px;">
          <!-- Ground -->
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: #D0D0D0;"></div>

          <!-- 5 stick figures in a row -->
          <svg v-for="(person, i) in syncTeam" :key="i"
            class="sync-person"
            :style="{ position: 'absolute', bottom: '1px', left: `${10 + i * 18}%`, animationDelay: `${i * 0.15}s` }"
            viewBox="0 0 80 160" width="48" height="96"
          >
            <circle cx="40" cy="20" r="9" fill="none" :stroke="person.color" stroke-width="2.5"/>
            <line x1="40" y1="29" x2="40" y2="78" :stroke="person.color" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Throwing arm -->
            <line class="sync-arm" x1="40" y1="45" x2="65" y2="28" :stroke="person.color" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Other arm -->
            <line x1="40" y1="45" x2="20" y2="55" :stroke="person.color" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Legs (standing) -->
            <line x1="40" y1="78" x2="30" y2="120" :stroke="person.color" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="120" x2="28" y2="155" :stroke="person.color" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="40" y1="78" x2="50" y2="120" :stroke="person.color" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="50" y1="120" x2="52" y2="155" :stroke="person.color" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Paper airplane -->
            <polygon class="sync-plane" points="65,23 78,28 65,33" :fill="person.color"/>
          </svg>

          <!-- Flying planes wave (nose pointing right) -->
          <svg v-for="(person, i) in syncTeam" :key="'plane'+i"
            class="sync-flying-plane"
            :style="{ position: 'absolute', bottom: '140px', left: `${15 + i * 18}%`, animationDelay: `${i * 0.15 + 1}s`, opacity: 0 }"
            viewBox="0 0 30 15" width="24" height="12"
          >
            <polygon points="30,7 5,1 5,13" :fill="person.color"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- =============================== -->
    <!-- STATIC 4: Olympic Trio -->
    <!-- =============================== -->
    <section class="mb-20">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-2">4. The Olympic Trio</h2>
      <p class="text-sm text-[#6B6B6B] mb-6">Static — three athletes side by side: javelin, discus, and paper airplane. The paper airplane athlete is the star.</p>

      <div class="bg-[#F9F9F9] rounded-xl p-8 flex items-end justify-center" style="height: 300px; box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
        <div style="position: relative; width: 100%; height: 240px;">
          <!-- Ground -->
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: #D0D0D0;"></div>

          <!-- Javelin holder (left, muted) -->
          <svg viewBox="0 0 100 180" width="70" height="126" style="position: absolute; bottom: 1px; left: 12%;">
            <circle cx="50" cy="22" r="11" fill="none" stroke="#B0A898" stroke-width="2.5"/>
            <line x1="50" y1="33" x2="50" y2="90" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Arm up holding javelin -->
            <line x1="50" y1="50" x2="60" y2="20" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="50" y1="50" x2="30" y2="60" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Javelin -->
            <line x1="55" y1="5" x2="65" y2="35" stroke="#B0A898" stroke-width="2" stroke-linecap="round"/>
            <!-- Legs -->
            <line x1="50" y1="90" x2="38" y2="135" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="38" y1="135" x2="35" y2="175" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="50" y1="90" x2="62" y2="135" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="62" y1="135" x2="65" y2="175" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Label -->
            <text x="50" y="178" text-anchor="middle" fill="#B0A898" font-size="10" font-family="Georgia, serif">javelin</text>
          </svg>

          <!-- Discus holder (middle, muted) -->
          <svg viewBox="0 0 100 180" width="70" height="126" style="position: absolute; bottom: 1px; left: 38%;">
            <circle cx="50" cy="22" r="11" fill="none" stroke="#B0A898" stroke-width="2.5"/>
            <line x1="50" y1="33" x2="50" y2="90" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Arm out holding discus -->
            <line x1="50" y1="50" x2="80" y2="45" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="50" y1="50" x2="25" y2="55" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Discus (ellipse) -->
            <ellipse cx="85" cy="45" rx="8" ry="5" fill="none" stroke="#B0A898" stroke-width="2" transform="rotate(-10 85 45)"/>
            <!-- Legs -->
            <line x1="50" y1="90" x2="38" y2="135" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="38" y1="135" x2="35" y2="175" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="50" y1="90" x2="62" y2="135" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="62" y1="135" x2="65" y2="175" stroke="#B0A898" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Label -->
            <text x="50" y="178" text-anchor="middle" fill="#B0A898" font-size="10" font-family="Georgia, serif">discus</text>
          </svg>

          <!-- Paper airplane holder (right, HERO) -->
          <svg viewBox="0 0 100 180" width="80" height="144" style="position: absolute; bottom: 1px; right: 10%;">
            <circle cx="45" cy="22" r="12" fill="none" stroke="#1A1A1A" stroke-width="3"/>
            <line x1="45" y1="34" x2="45" y2="95" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Arm up holding airplane proudly -->
            <line x1="45" y1="52" x2="70" y2="22" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="45" y1="52" x2="22" y2="62" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Paper airplane (big, colorful) -->
            <polygon points="70,12 92,22 70,28" fill="#FF4F36" stroke="#FF4F36" stroke-width="1"/>
            <line x1="75" y1="20" x2="90" y2="20" stroke="#FFFFFF" stroke-width="1"/>
            <!-- Legs (confident stance) -->
            <line x1="45" y1="95" x2="30" y2="140" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="30" y1="140" x2="25" y2="175" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="45" y1="95" x2="62" y2="140" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="62" y1="140" x2="68" y2="175" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- =============================== -->
    <!-- STATIC 5: Podium -->
    <!-- =============================== -->
    <section class="mb-20">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-2">5. The Podium</h2>
      <p class="text-sm text-[#6B6B6B] mb-6">Static — three stick figures on an Olympic podium, each holding a paper airplane. Gold center is tallest.</p>

      <div class="bg-[#F9F9F9] rounded-xl p-8 flex items-end justify-center" style="height: 320px; box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
        <div style="position: relative; width: 100%; height: 260px; max-width: 400px; margin: 0 auto;">
          <!-- Podium blocks -->
          <!-- Silver (2nd, left) -->
          <div style="position: absolute; bottom: 0; left: 10%; width: 26%; height: 60px; background: #E8E8E8; border: 1px solid #D0D0D0; border-bottom: none; display: flex; align-items: center; justify-content: center;">
            <span style="font-family: Georgia, serif; font-size: 20px; color: #B0A898;">2</span>
          </div>
          <!-- Gold (1st, center) -->
          <div style="position: absolute; bottom: 0; left: 37%; width: 26%; height: 90px; background: #FDE801; border: 1px solid #E8D200; border-bottom: none; display: flex; align-items: center; justify-content: center;">
            <span style="font-family: Georgia, serif; font-size: 24px; color: #1A1A1A;">1</span>
          </div>
          <!-- Bronze (3rd, right) -->
          <div style="position: absolute; bottom: 0; right: 10%; width: 26%; height: 40px; background: #F0DCC0; border: 1px solid #D8C8A8; border-bottom: none; display: flex; align-items: center; justify-content: center;">
            <span style="font-family: Georgia, serif; font-size: 18px; color: #B0A898;">3</span>
          </div>

          <!-- Silver figure -->
          <svg viewBox="0 0 80 130" width="52" height="85" style="position: absolute; bottom: 60px; left: 13%;">
            <circle cx="40" cy="15" r="9" fill="none" stroke="#6B6B6B" stroke-width="2.5"/>
            <line x1="40" y1="24" x2="40" y2="65" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Arms (holding plane up) -->
            <line x1="40" y1="38" x2="58" y2="20" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="40" y1="38" x2="22" y2="48" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <polygon points="58,15 72,20 58,25" fill="#4992FF"/>
            <!-- Legs -->
            <line x1="40" y1="65" x2="32" y2="100" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="32" y1="100" x2="30" y2="128" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="40" y1="65" x2="48" y2="100" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="48" y1="100" x2="50" y2="128" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
          </svg>

          <!-- Gold figure (arms raised in celebration) -->
          <svg viewBox="0 0 80 130" width="56" height="91" style="position: absolute; bottom: 90px; left: 38%;">
            <circle cx="40" cy="15" r="10" fill="none" stroke="#1A1A1A" stroke-width="3"/>
            <line x1="40" y1="25" x2="40" y2="68" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Arms raised in V -->
            <line x1="40" y1="40" x2="62" y2="12" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="40" x2="18" y2="12" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <!-- Paper airplane held high -->
            <polygon points="62,5 78,12 62,16" fill="#FF4F36"/>
            <!-- Legs -->
            <line x1="40" y1="68" x2="30" y2="100" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="30" y1="100" x2="28" y2="128" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="68" x2="50" y2="100" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
            <line x1="50" y1="100" x2="52" y2="128" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
          </svg>

          <!-- Bronze figure -->
          <svg viewBox="0 0 80 130" width="48" height="78" style="position: absolute; bottom: 40px; right: 14%;">
            <circle cx="40" cy="15" r="9" fill="none" stroke="#6B6B6B" stroke-width="2.5"/>
            <line x1="40" y1="24" x2="40" y2="65" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Arms (plane at side) -->
            <line x1="40" y1="38" x2="60" y2="45" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="40" y1="38" x2="22" y2="48" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <polygon points="60,40 74,45 60,50" fill="#FF8F01"/>
            <!-- Legs -->
            <line x1="40" y1="65" x2="32" y2="100" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="32" y1="100" x2="30" y2="128" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="40" y1="65" x2="48" y2="100" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="48" y1="100" x2="50" y2="128" stroke="#6B6B6B" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- =============================== -->
    <!-- STATIC 6: Opening Ceremony March -->
    <!-- =============================== -->
    <section class="mb-20">
      <h2 class="font-serif text-2xl text-[#1A1A1A] mb-2">6. The Opening Ceremony</h2>
      <p class="text-sm text-[#6B6B6B] mb-6">Static — a marching line of stick figures carrying paper airplanes like flags, with a banner reading "PAPER LEAGUE."</p>

      <div class="bg-[#F9F9F9] rounded-xl p-8 flex items-end justify-center" style="height: 280px; box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
        <div style="position: relative; width: 100%; height: 220px;">
          <!-- Ground -->
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: #D0D0D0;"></div>

          <!-- Banner -->
          <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); border: 1.5px solid #D0D0D0; padding: 4px 20px; background: white;">
            <span style="font-family: Georgia, serif; font-size: 14px; letter-spacing: 0.15em; color: #1A1A1A;">PAPER LEAGUE</span>
          </div>

          <!-- Marching figures -->
          <svg v-for="(marcher, i) in marchers" :key="'march'+i"
            viewBox="0 0 70 150" width="42" height="90"
            :style="{ position: 'absolute', bottom: '1px', left: `${5 + i * 14}%` }"
          >
            <circle cx="35" cy="18" r="9" fill="none" :stroke="marcher.color" stroke-width="2.5"/>
            <line x1="35" y1="27" x2="35" y2="75" :stroke="marcher.color" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Flag arm (holding airplane up like a torch) -->
            <line x1="35" y1="42" x2="50" y2="15" :stroke="marcher.color" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Other arm swinging -->
            <line x1="35" y1="42" x2="18" y2="55" :stroke="marcher.color" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Paper airplane torch -->
            <polygon :points="marcher.planeUp ? '50,8 64,15 50,18' : '50,10 64,15 50,20'" :fill="marcher.planeColor"/>
            <!-- Walking legs -->
            <line x1="35" y1="75" :x2="marcher.legBack ? 22 : 28" y2="115" :stroke="marcher.color" stroke-width="2.5" stroke-linecap="round"/>
            <line :x1="marcher.legBack ? 22 : 28" y1="115" :x2="marcher.legBack ? 18 : 25" y2="148" :stroke="marcher.color" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="35" y1="75" :x2="marcher.legBack ? 48 : 42" y2="115" :stroke="marcher.color" stroke-width="2.5" stroke-linecap="round"/>
            <line :x1="marcher.legBack ? 48 : 42" y1="115" :x2="marcher.legBack ? 52 : 45" y2="148" :stroke="marcher.color" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { pushRoute } from '../router';

function navigate(path: string) {
  pushRoute(path);
}

const syncTeam = [
  { color: '#FF4F36' },
  { color: '#4992FF' },
  { color: '#FDE801' },
  { color: '#FF8F01' },
  { color: '#1A1A1A' },
];

const marchers = [
  { color: '#1A1A1A', planeColor: '#FF4F36', planeUp: true, legBack: false },
  { color: '#4992FF', planeColor: '#FDE801', planeUp: false, legBack: true },
  { color: '#FF4F36', planeColor: '#4992FF', planeUp: true, legBack: false },
  { color: '#FF8F01', planeColor: '#FF4F36', planeUp: false, legBack: true },
  { color: '#1A1A1A', planeColor: '#FF8F01', planeUp: true, legBack: false },
  { color: '#4992FF', planeColor: '#FDE801', planeUp: false, legBack: true },
  { color: '#FF4F36', planeColor: '#4992FF', planeUp: true, legBack: false },
];
</script>

<style scoped>
/* ================================ */
/* ANIMATION 1: Javelin Throw       */
/* 5s loop: run (0-40%), throw (40-50%), fly arc (50-75%), crash+score (75-90%), hold+reset (90-100%) */
/* ================================ */
.javelin-runner {
  left: -10%;
  animation: javelin-run 5s ease-in-out infinite;
}

@keyframes javelin-run {
  0% { left: -10%; }
  35% { left: 22%; }
  40% { left: 25%; }
  /* Stay put after throw */
  100% { left: 25%; }
}

/* Arm swings from behind (holding plane) to forward (release) */
.javelin-arm {
  transform-origin: 55px 50px;
  animation: javelin-arm-swing 5s ease-in-out infinite;
}

@keyframes javelin-arm-swing {
  0%, 35% { transform: rotate(0deg); }
  42% { transform: rotate(120deg); }
  100% { transform: rotate(120deg); }
}

/* Front arm pumps while running, drops after throw */
.javelin-front-arm {
  transform-origin: 55px 50px;
  animation: javelin-front-pump 5s ease-in-out infinite;
}

@keyframes javelin-front-pump {
  0% { transform: rotate(5deg); }
  5% { transform: rotate(-5deg); }
  10% { transform: rotate(5deg); }
  15% { transform: rotate(-5deg); }
  20% { transform: rotate(5deg); }
  25% { transform: rotate(-5deg); }
  30% { transform: rotate(5deg); }
  35% { transform: rotate(-5deg); }
  40% { transform: rotate(15deg); }
  100% { transform: rotate(15deg); }
}

/* Legs run then stop */
.javelin-leg-front {
  transform-origin: 55px 85px;
  animation: javelin-legf 5s ease-in-out infinite;
}
.javelin-leg-back {
  transform-origin: 55px 85px;
  animation: javelin-legb 5s ease-in-out infinite;
}

@keyframes javelin-legf {
  0% { transform: rotate(0deg); }
  5% { transform: rotate(15deg); }
  10% { transform: rotate(-15deg); }
  15% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  25% { transform: rotate(15deg); }
  30% { transform: rotate(-15deg); }
  35% { transform: rotate(15deg); }
  38%, 100% { transform: rotate(0deg); }
}

@keyframes javelin-legb {
  0% { transform: rotate(0deg); }
  5% { transform: rotate(-15deg); }
  10% { transform: rotate(15deg); }
  15% { transform: rotate(-15deg); }
  20% { transform: rotate(15deg); }
  25% { transform: rotate(-15deg); }
  30% { transform: rotate(15deg); }
  35% { transform: rotate(-15deg); }
  38%, 100% { transform: rotate(0deg); }
}

/* Plane in hand disappears at release */
.javelin-plane {
  animation: javelin-plane-vis 5s ease-in-out infinite;
}

@keyframes javelin-plane-vis {
  0%, 40% { opacity: 1; }
  42% { opacity: 0; }
  100% { opacity: 0; }
}

/* Flying plane: arcs up and right, then nose-dives to crash point */
.javelin-flying-plane {
  animation: javelin-fly 5s ease-in-out infinite;
}

@keyframes javelin-fly {
  0%, 41% { left: 30%; bottom: 140px; opacity: 0; transform: rotate(-15deg); }
  43% { left: 33%; bottom: 170px; opacity: 1; transform: rotate(-20deg); }
  52% { left: 50%; bottom: 210px; opacity: 1; transform: rotate(-10deg); }
  62% { left: 68%; bottom: 190px; opacity: 1; transform: rotate(5deg); }
  72% { left: 80%; bottom: 100px; opacity: 1; transform: rotate(25deg); }
  76% { left: 84%; bottom: 42px; opacity: 1; transform: rotate(45deg); }
  78% { left: 84%; bottom: 38px; opacity: 0; transform: rotate(50deg); }
  100% { left: 84%; bottom: 38px; opacity: 0; transform: rotate(50deg); }
}

/* Crash star appears at landing */
.javelin-crash {
  animation: javelin-crash-vis 5s ease-out infinite;
}

@keyframes javelin-crash-vis {
  0%, 75% { opacity: 0; transform: scale(0.5); }
  78% { opacity: 1; transform: scale(1.5); }
  82% { opacity: 1; transform: scale(1); }
  92% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}

/* Score pops up after crash */
.javelin-score {
  animation: javelin-score-vis 5s ease-out infinite;
}

@keyframes javelin-score-vis {
  0%, 78% { opacity: 0; transform: translateY(10px); }
  82% { opacity: 1; transform: translateY(0); }
  92% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-5px); }
}

/* ================================ */
/* ANIMATION 2: Relay Handoff        */
/* ================================ */
.relay-runner1 {
  animation: relay-run1 4s ease-in-out infinite;
}

@keyframes relay-run1 {
  0% { left: 5%; }
  40% { left: 35%; }
  100% { left: 35%; }
}

.relay-runner2 {
  animation: relay-run2 4s ease-in-out infinite;
}

@keyframes relay-run2 {
  0% { left: 40%; }
  40% { left: 40%; }
  45% { left: 40%; }
  90% { left: 70%; }
  100% { left: 70%; }
}

.relay-runner3 {
  left: 75%;
}

.relay-baton {
  animation: relay-baton-vis 4s ease-in-out infinite;
}

@keyframes relay-baton-vis {
  0%, 38% { opacity: 1; }
  42% { opacity: 0; }
  100% { opacity: 0; }
}

/* ================================ */
/* ANIMATION 3: Synchronized Launch  */
/* ================================ */
.sync-person .sync-arm {
  transform-origin: 40px 45px;
  animation: sync-throw 3s ease-in-out infinite;
}

.sync-person .sync-plane {
  animation: sync-plane-vis 3s ease-in-out infinite;
}

.sync-person {
  animation: none;
}

@keyframes sync-throw {
  0%, 35% { transform: rotate(0deg); }
  45% { transform: rotate(60deg); }
  100% { transform: rotate(60deg); }
}

@keyframes sync-plane-vis {
  0%, 40% { opacity: 1; }
  45% { opacity: 0; }
  100% { opacity: 0; }
}

.sync-flying-plane {
  animation: sync-fly 3s ease-out infinite;
}

@keyframes sync-fly {
  0%, 42% { opacity: 0; transform: translateX(0) translateY(0) rotate(-5deg); }
  46% { opacity: 1; transform: translateX(10px) translateY(-10px) rotate(-5deg); }
  70% { opacity: 1; transform: translateX(80px) translateY(-40px) rotate(0deg); }
  100% { opacity: 0; transform: translateX(130px) translateY(-10px) rotate(10deg); }
}
</style>
