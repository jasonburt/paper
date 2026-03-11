<template>
  <div class="w-full max-w-2xl mx-auto px-4 py-20 font-serif">
    <a
      href="#"
      class="inline-block text-sm text-[#4992FF] hover:text-[#FF8F01] transition-colors mb-8"
      @click.prevent="goBack"
    >
      ← {{ section === 'main' ? 'Home' : 'About' }}
    </a>

    <div class="about-content text-left" v-html="renderedHtml" @click="handleContentClick"></div>

    <!-- Sub-page links on main about page -->
    <div v-if="section === 'main'" class="mt-12 pt-8 border-t border-[#D0D0D0]/60">
      <div class="space-y-4">
        <a
          v-for="game in gameLinks"
          :key="game.path"
          href="#"
          class="flex items-center gap-3 text-lg text-[#1A1A1A] hover:text-[#FF8F01] transition-colors"
          @click.prevent="navigate(game.path)"
        >
          <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{ backgroundColor: game.color }"></span>
          {{ game.label }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { pushRoute } from '../router';
import aboutMain from '../../About.md?raw';
import aboutTossPaper from '../../AboutTossPaper.md?raw';
import aboutOrigamiTrail from '../../AboutOrigamiTrail.md?raw';

const props = defineProps<{
  section: 'main' | 'toss-paper' | 'origami-trail';
}>();

const gameLinks = [
  { label: 'About Toss Paper', path: '/about/toss-paper', color: '#FDE801' },
  { label: 'About Origami Trail', path: '/about/origami-trail', color: '#FF4F36' },
];

const markdownSource = computed(() => {
  switch (props.section) {
    case 'toss-paper': return aboutTossPaper;
    case 'origami-trail': return aboutOrigamiTrail;
    default: return aboutMain;
  }
});

function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line — close list if open, skip
    if (line.trim() === '') {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push('<hr class="my-6 border-[#D0D0D0]/60" />');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      const level = headingMatch[1].length;
      const text = inline(headingMatch[2]);
      if (level === 1) {
        htmlParts.push(`<h1 class="text-4xl text-[#1A1A1A] mb-4 tracking-wide text-center">${text}</h1>`);
      } else if (level === 2) {
        htmlParts.push(`<h2 class="text-2xl text-[#1A1A1A] mt-8 mb-3">${text}</h2>`);
      } else {
        htmlParts.push(`<h3 class="text-xl text-[#1A1A1A] mt-6 mb-2">${text}</h3>`);
      }
      continue;
    }

    // List items
    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      if (!inList) { htmlParts.push('<ul class="list-disc list-inside space-y-1 mb-4 text-[#6B6B6B]">'); inList = true; }
      htmlParts.push(`<li>${inline(listMatch[1])}</li>`);
      continue;
    }

    // Paragraph
    if (inList) { htmlParts.push('</ul>'); inList = false; }
    htmlParts.push(`<p class="text-[#6B6B6B] mb-3 leading-relaxed">${inline(line)}</p>`);
  }

  if (inList) htmlParts.push('</ul>');
  return htmlParts.join('\n');
}

function inline(text: string): string {
  // Links: [text](url) — only internal navigation links are rendered as clickable
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#4992FF] hover:text-[#FF8F01] transition-colors underline">$1</a>');
  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#1A1A1A] font-semibold">$1</strong>');
  // Italic
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="font-mono text-sm bg-[#F5F5F5] px-1 py-0.5 rounded">$1</code>');
  return text;
}

const renderedHtml = computed(() => renderMarkdown(markdownSource.value));

function goBack() {
  pushRoute(props.section === 'main' ? '/' : '/about');
}

function navigate(path: string) {
  pushRoute(path);
}

function handleContentClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('a');
  if (!target) return;
  const href = target.getAttribute('href');
  if (href && href.startsWith('/')) {
    e.preventDefault();
    pushRoute(href);
  }
}
</script>
