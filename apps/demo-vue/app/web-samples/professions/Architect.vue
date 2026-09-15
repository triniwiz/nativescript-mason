<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Architect — Studio">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="studio-head">
          <h1>Studio Verne</h1>
          <p class="tagline">Residential & civic architecture — Porto</p>
          <div class="stat-row">
            <div class="stat"><span class="stat-value">26</span><span class="stat-label">Built</span></div>
            <div class="stat"><span class="stat-value">9</span><span class="stat-label">In design</span></div>
            <div class="stat"><span class="stat-value">4</span><span class="stat-label">Awards</span></div>
          </div>
        </section>

        <h2>Projects</h2>
        <section class="project-list">
          <article v-for="p in projects" :key="p.name" class="project-card">
            <div class="plan" :style="{ backgroundColor: p.color }">
              <div class="plan-block" />
              <div class="plan-block small" />
            </div>
            <div class="project-body">
              <div class="project-head">
                <p class="project-name">{{ p.name }}</p>
                <span class="badge" :class="p.stageClass">{{ p.stage }}</span>
              </div>
              <p class="project-meta">{{ p.type }} · {{ p.year }} · {{ p.area }}</p>
            </div>
          </article>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const projects = [
  { name: 'Casa do Rio', type: 'Private residence', year: '2025', area: '340 m²', color: '#a08059', stage: 'On site', stageClass: 'site' },
  { name: 'Mercado de Gaia', type: 'Civic refurbishment', year: '2024', area: '2,100 m²', color: '#6b7f8c', stage: 'Built', stageClass: 'built' },
  { name: 'Torre Sal', type: 'Mixed use', year: '2024', area: '8,400 m²', color: '#4d5d73', stage: 'Permitting', stageClass: 'permit' },
  { name: 'Pavilhão Luz', type: 'Competition', year: '2023', area: '1,200 m²', color: '#c9b458', stage: 'Built', stageClass: 'built' },
];
</script>

<style scoped>
.page { background-color: var(--bg); overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: var(--text); }
.studio-head { background-color: #33302a; border-radius: 14; padding: 18; display: flex; flex-direction: column; gap: 4; }
.studio-head h1 { font-size: 22; font-weight: bold; color: #ffffff; }
.tagline { font-size: 12; color: rgba(255, 255, 255, 0.65); }
.stat-row { display: flex; flex-direction: row; gap: 10; margin-top: 12; }
.stat { flex-grow: 1; background-color: rgba(255, 255, 255, 0.08); border-radius: 10; padding: 10; display: flex; flex-direction: column; align-items: center; gap: 2; }
.stat-value { font-size: 16; font-weight: bold; color: #ffffff; }
.stat-label { font-size: 10; color: rgba(255, 255, 255, 0.55); }
.project-list { display: flex; flex-direction: column; gap: 10; }
.project-card { background-color: var(--surface); border-radius: 12; overflow: hidden; box-shadow: 0 2px 8px var(--shadow); }
.plan { height: 90; padding: 14; display: flex; flex-direction: row; align-items: flex-end; gap: 10; }
.plan-block { width: 70; height: 48; border: 2 solid rgba(255, 255, 255, 0.85); border-radius: 2; }
.plan-block.small { width: 40; height: 30; }
.project-body { padding: 12; display: flex; flex-direction: column; gap: 4; }
.project-head { display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
.project-name { font-size: 15; font-weight: bold; color: var(--text); }
.badge { font-size: 10; font-weight: bold; padding: 2 8; border-radius: 10; }
.badge.site { background-color: #fff3d6; color: #c98a12; }
.badge.built { background-color: #e7f9f2; color: #00b894; }
.badge.permit { background-color: #e8f1fd; color: #0984e3; }
.project-meta { font-size: 11; color: var(--muted); }
</style>
