<template>
  <Page iosOverflowSafeAreaEnabled="false" style="background-color: #101014">
    <ActionBar title="Photographer — Studio">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="studio-head">
          <div class="avatar"><span>RQ</span></div>
          <div class="studio-body">
            <h1>Rui Quintela</h1>
            <p class="tagline">Documentary & landscape photographer</p>
          </div>
        </section>

        <section class="stat-row">
          <div class="stat"><span class="stat-value">312</span><span class="stat-label">Shoots</span></div>
          <div class="stat"><span class="stat-value">41k</span><span class="stat-label">Followers</span></div>
          <div class="stat"><span class="stat-value">7</span><span class="stat-label">Exhibits</span></div>
        </section>

        <h2>Recent frames</h2>
        <section class="frame-grid">
          <article v-for="f in frames" :key="f.title" class="frame-card">
            <div class="frame" :style="{ backgroundColor: f.color }">
              <span class="frame-glyph">▣</span>
            </div>
            <div class="frame-body">
              <p class="frame-title">{{ f.title }}</p>
              <p class="frame-meta">{{ f.loc }} · {{ f.year }}</p>
            </div>
          </article>
        </section>

        <h2>Gear bag</h2>
        <section class="gear-card">
          <div v-for="g in gear" :key="g" class="gear-row">
            <span class="gear-dot" />
            <p class="gear-item">{{ g }}</p>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const frames = [
  { title: 'Tide lines', loc: 'Comporta', year: '2025', color: '#7a9e9f' },
  { title: 'Night market', loc: 'Bangkok', year: '2024', color: '#3d3a50' },
  { title: 'Granite light', loc: 'Serra da Estrela', year: '2024', color: '#8c7a6b' },
  { title: 'Harbour fog', loc: 'Aveiro', year: '2023', color: '#5f7a95' },
  { title: 'Dune study', loc: 'Sahara', year: '2023', color: '#c2a06b' },
  { title: 'Metro ghosts', loc: 'Lisbon', year: '2022', color: '#4a4a55' },
];

const gear = ['Mirrorless body · 45 MP', '35 mm f/1.4 prime', '70–200 mm f/2.8 zoom', 'Compact tripod & filters'];
</script>

<style scoped>
/* Deliberately dark in both appearances - the whole screen is white-on-dark. */
/* Also set inline on <Page>: MasonKit Scroll paints its background on the
 * scrolled content, so the Page shows through once the content moves. */
.page { background-color: #101014; overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: rgba(255, 255, 255, 0.85); }
.studio-head { display: flex; flex-direction: row; align-items: center; gap: 12; background-color: rgba(255, 255, 255, 0.05); border-radius: 14; padding: 14; }
.avatar { width: 54; height: 54; border-radius: 27; background-color: #7a9e9f; display: flex; align-items: center; justify-content: center; }
.avatar span { color: #ffffff; font-size: 18; font-weight: bold; }
.studio-body { display: flex; flex-direction: column; gap: 2; }
.studio-body h1 { font-size: 18; font-weight: bold; color: #ffffff; }
.tagline { font-size: 12; color: rgba(255, 255, 255, 0.55); }
.stat-row { display: flex; flex-direction: row; gap: 10; }
.stat { flex-grow: 1; background-color: rgba(255, 255, 255, 0.05); border-radius: 12; padding: 12; display: flex; flex-direction: column; align-items: center; gap: 2; }
.stat-value { font-size: 18; font-weight: bold; color: #ffffff; }
.stat-label { font-size: 11; color: rgba(255, 255, 255, 0.5); }
.frame-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10; }
.frame-card { background-color: rgba(255, 255, 255, 0.05); border-radius: 12; overflow: hidden; }
.frame { height: 100; display: flex; align-items: center; justify-content: center; }
.frame-glyph { color: rgba(255, 255, 255, 0.5); font-size: 24; }
.frame-body { padding: 10; display: flex; flex-direction: column; gap: 2; }
.frame-title { font-size: 13; font-weight: bold; color: #ffffff; }
.frame-meta { font-size: 10; color: rgba(255, 255, 255, 0.45); }
.gear-card { background-color: rgba(255, 255, 255, 0.05); border-radius: 12; padding: 14; display: flex; flex-direction: column; gap: 10; }
.gear-row { display: flex; flex-direction: row; align-items: center; gap: 10; }
.gear-dot { width: 8; height: 8; border-radius: 4; background-color: #7a9e9f; }
.gear-item { font-size: 12; color: rgba(255, 255, 255, 0.75); }
</style>
