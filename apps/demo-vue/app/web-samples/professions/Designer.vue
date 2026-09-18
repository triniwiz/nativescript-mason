<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Designer — Portfolio">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="intro">
          <h1>Ines Marques</h1>
          <p class="role">Product & brand designer</p>
          <p class="blurb">I help early teams find a visual voice — systems, not one-off screens.</p>
          <button class="cta" @tap="contacted = !contacted">{{ contacted ? 'Message sent ✓' : 'Work with me' }}</button>
        </section>

        <nav class="filter-row">
          <button v-for="f in filters" :key="f" class="filter" :class="{ active: filter === f }" @tap="filter = f">{{ f }}</button>
        </nav>

        <section class="work-grid">
          <article v-for="w in filtered" :key="w.title" class="work-card">
            <div class="thumb" :style="{ backgroundColor: w.color }">
              <span class="glyph">{{ w.glyph }}</span>
            </div>
            <div class="work-body">
              <p class="work-title">{{ w.title }}</p>
              <p class="work-year">{{ w.year }} · {{ w.kind }}</p>
            </div>
          </article>
        </section>

        <section class="services">
          <h2>Services</h2>
          <ul>
            <li>Design systems & component libraries</li>
            <li>Brand identity refreshes</li>
            <li>Design engineering (CSS layout, motion)</li>
          </ul>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed, ref } from 'nativescript-vue';

const filters = ['All', 'Product', 'Brand', 'Motion'];
const filter = ref('All');
const contacted = ref(false);

const works = [
  { title: 'Atlas banking app', year: '2024', kind: 'Product', color: '#0984e3', glyph: 'A' },
  { title: 'Copperleaf identity', year: '2024', kind: 'Brand', color: '#e17055', glyph: 'C' },
  { title: 'Pulse onboarding', year: '2023', kind: 'Motion', color: '#6c5ce7', glyph: 'P' },
  { title: 'Fieldnotes journal', year: '2023', kind: 'Product', color: '#00b894', glyph: 'F' },
  { title: 'Meridian rebrand', year: '2022', kind: 'Brand', color: '#e84393', glyph: 'M' },
  { title: 'Loop micro-motion', year: '2022', kind: 'Motion', color: '#fdcb6e', glyph: 'L' },
];

const filtered = computed(() => (filter.value === 'All' ? works : works.filter((w) => w.kind === filter.value)));
</script>

<style scoped>
.page { background-color: var(--bg); overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 14; }
.intro { display: flex; flex-direction: column; gap: 4; align-items: flex-start; }
.intro h1 { font-size: 22; font-weight: bold; color: var(--text); }
.role { font-size: 13; color: #6c5ce7; font-weight: bold; }
.blurb { font-size: 13; color: var(--muted); margin-top: 4; }
.cta { margin-top: 10; background-color: var(--ink); color: #ffffff; padding: 9 20; border-radius: 20; font-size: 13; font-weight: 600; border-style: none; }
.filter-row { display: flex; flex-direction: row; gap: 8; }
.filter { padding: 6 14; border-radius: 16; background-color: var(--surface); color: var(--muted); font-size: 12; border: 1 solid var(--border); border-style: none; }
.filter.active { background-color: var(--ink); color: #ffffff; font-weight: bold; }
.work-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10; }
.work-card { background-color: var(--surface); border-radius: 12; overflow: hidden; box-shadow: 0 2px 8px var(--shadow); }
.thumb { height: 90; display: flex; align-items: center; justify-content: center; }
.glyph { color: rgba(255, 255, 255, 0.9); font-size: 26; font-weight: bold; }
.work-body { padding: 10; display: flex; flex-direction: column; gap: 2; }
.work-title { font-size: 13; font-weight: bold; color: var(--text); }
.work-year { font-size: 10; color: var(--muted); }
.services { background-color: var(--surface); border-radius: 12; padding: 14; display: flex; flex-direction: column; gap: 8; box-shadow: 0 2px 8px var(--shadow); }
.services h2 { font-size: 14; font-weight: bold; color: var(--text); }
.services ul { display: flex; flex-direction: column; gap: 5; padding-left: 16; }
.services li { font-size: 12; color: var(--text-2); }
</style>
