<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Teacher — Class">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="class-hero">
          <h1>Mathematics 8B</h1>
          <p class="hero-sub">Room 204 · 28 students · Ms. Okafor</p>
        </section>

        <section class="stat-row">
          <div class="stat"><span class="stat-value">28</span><span class="stat-label">Students</span></div>
          <div class="stat"><span class="stat-value">86%</span><span class="stat-label">Avg score</span></div>
          <div class="stat"><span class="stat-value">4</span><span class="stat-label">Due soon</span></div>
        </section>

        <h2>Today's lessons</h2>
        <section class="lesson-list">
          <article v-for="l in lessons" :key="l.topic" class="lesson-card">
            <div class="period">
              <span class="period-num">{{ l.period }}</span>
              <span class="period-time">{{ l.time }}</span>
            </div>
            <div class="lesson-body">
              <p class="lesson-topic">{{ l.topic }}</p>
              <p class="lesson-desc">{{ l.desc }}</p>
            </div>
            <span class="badge" :class="l.statusClass">{{ l.status }}</span>
          </article>
        </section>

        <h2>Homework due</h2>
        <section class="hw-card">
          <div v-for="h in homework" :key="h.title" class="hw-row">
            <div class="hw-body">
              <p class="hw-title">{{ h.title }}</p>
              <p class="hw-meta">{{ h.meta }}</p>
            </div>
            <div class="track">
              <div class="fill" :style="{ width: h.turnedIn + '%' }" />
            </div>
            <span class="hw-pct">{{ h.turnedIn }}%</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const lessons = [
  { period: '1', time: '08:45', topic: 'Quadratic equations', desc: 'Factorising & the quadratic formula', status: 'Done', statusClass: 'done' },
  { period: '3', time: '10:35', topic: 'Graphing parabolas', desc: 'Vertex form and intercepts', status: 'Now', statusClass: 'now' },
  { period: '5', time: '13:20', topic: 'Word problems', desc: 'Modelling real scenarios', status: 'Next', statusClass: 'next' },
];

const homework = [
  { title: 'Exercise 7.3 — Factorising', meta: 'Due tomorrow · 24 of 28 turned in', turnedIn: 86 },
  { title: 'Worksheet — Parabolas', meta: 'Due Friday · 11 of 28 turned in', turnedIn: 39 },
];
</script>

<style scoped>
.page { background-color: var(--bg); overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: var(--text); }
.class-hero { background-color: #2c3a2e; border-radius: 14; padding: 18; }
.class-hero h1 { font-size: 20; font-weight: bold; color: #ffffff; }
.hero-sub { font-size: 12; color: rgba(255, 255, 255, 0.7); margin-top: 3; }
.stat-row { display: flex; flex-direction: row; gap: 10; }
.stat { flex-grow: 1; background-color: var(--surface); border-radius: 12; padding: 12; display: flex; flex-direction: column; align-items: center; gap: 2; box-shadow: 0 2px 8px var(--shadow); }
.stat-value { font-size: 18; font-weight: bold; color: var(--text); }
.stat-label { font-size: 11; color: var(--muted); }
.lesson-list { display: flex; flex-direction: column; gap: 8; }
.lesson-card { display: flex; flex-direction: row; align-items: center; gap: 12; background-color: var(--surface); border-radius: 12; padding: 12; box-shadow: 0 2px 8px var(--shadow); }
.period { display: flex; flex-direction: column; align-items: center; width: 46; }
.period-num { font-size: 18; font-weight: bold; color: var(--text); }
.period-time { font-size: 10; color: var(--muted); }
.lesson-body { flex-grow: 1; display: flex; flex-direction: column; gap: 2; }
.lesson-topic { font-size: 14; font-weight: bold; color: var(--text); }
.lesson-desc { font-size: 11; color: var(--muted); }
.badge { font-size: 10; font-weight: bold; padding: 3 8; border-radius: 10; }
.badge.done { background-color: var(--surface-2); color: var(--muted); }
.badge.now { background-color: #e7f9f2; color: #00b894; }
.badge.next { background-color: #e8f1fd; color: #0984e3; }
.hw-card { background-color: var(--surface); border-radius: 12; padding: 14; display: flex; flex-direction: column; gap: 12; }
.hw-row { display: flex; flex-direction: row; align-items: center; gap: 10; }
.hw-body { width: 150; display: flex; flex-direction: column; gap: 1; }
.hw-title { font-size: 12; font-weight: bold; color: var(--text); }
.hw-meta { font-size: 10; color: var(--muted); }
.track { flex-grow: 1; height: 8; border-radius: 4; background-color: var(--surface-2); overflow: hidden; }
.fill { height: 100%; border-radius: 4; background-color: #00b894; }
.hw-pct { font-size: 11; color: var(--muted); width: 30; text-align: right; }
</style>
