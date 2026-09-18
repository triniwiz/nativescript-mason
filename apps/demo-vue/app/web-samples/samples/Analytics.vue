<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Analytics">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <header class="header-row">
          <div>
            <h1>Dashboard</h1>
            <p class="subtitle">Last 7 days · all channels</p>
          </div>
          <span class="live-badge">Live</span>
        </header>

        <section class="stat-row">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <p class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</p>
            <p class="stat-label">{{ stat.label }}</p>
            <p class="stat-delta" :class="{ down: stat.delta < 0 }">{{ stat.delta > 0 ? '+' : '' }}{{ stat.delta }}%</p>
          </div>
        </section>

        <section class="chart-card">
          <h2>Daily signups</h2>
          <div class="chart">
            <div v-for="day in chart" :key="day.label" class="chart-column">
              <div class="bar" :style="{ height: day.value * 1.6, backgroundColor: day.color }" />
              <span class="bar-label">{{ day.label }}</span>
            </div>
          </div>
        </section>

        <section class="activity-card">
          <h2>Recent activity</h2>
          <div class="activity-list">
            <div v-for="event in activity" :key="event.text" class="activity-row">
              <span class="dot" :style="{ backgroundColor: event.color }" />
              <p class="activity-text">{{ event.text }}</p>
              <span class="activity-time">{{ event.time }}</span>
            </div>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const stats = [
  { label: 'Visitors', value: '48.2k', delta: 12.4, color: '#0984e3' },
  { label: 'Signups', value: '1,204', delta: 8.1, color: '#00b894' },
  { label: 'Revenue', value: '$9.6k', delta: -2.3, color: '#6c5ce7' },
];

const chart = [
  { label: 'M', value: 42, color: '#74b9ff' },
  { label: 'T', value: 68, color: '#74b9ff' },
  { label: 'W', value: 55, color: '#0984e3' },
  { label: 'T', value: 90, color: '#0984e3' },
  { label: 'F', value: 74, color: '#6c5ce7' },
  { label: 'S', value: 38, color: '#a29bfe' },
  { label: 'S', value: 61, color: '#a29bfe' },
];

const activity = [
  { text: 'New team signup — Nordwind GmbH', time: '2m', color: '#00b894' },
  { text: 'Invoice paid — $249.00', time: '14m', color: '#0984e3' },
  { text: 'Trial ending soon — 3 accounts', time: '1h', color: '#fdcb6e' },
  { text: 'Churn risk flagged — acme.io', time: '3h', color: '#ff6b6b' },
  { text: 'Feature flag enabled — new onboarding', time: '5h', color: '#6c5ce7' },
];
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

main {
  display: flex;
  flex-direction: column;
  gap: 14;
}

.header-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.header-row h1 {
  font-size: 22;
  font-weight: bold;
  color: var(--text);
}

.subtitle {
  font-size: 12;
  color: var(--muted);
  margin-top: 2;
}

.live-badge {
  background-color: #00b894;
  color: #ffffff;
  font-size: 11;
  font-weight: bold;
  padding: 4 10;
  border-radius: 12;
}

.stat-row {
  display: flex;
  flex-direction: row;
  gap: 10;
}

.stat-card {
  flex-grow: 1;
  background-color: var(--surface);
  border-radius: 12;
  padding: 14;
  display: flex;
  flex-direction: column;
  gap: 2;
  box-shadow: 0 2px 8px var(--shadow);
}

.stat-value {
  font-size: 20;
  font-weight: bold;
}

.stat-label {
  font-size: 11;
  color: var(--muted);
}

.stat-delta {
  font-size: 11;
  font-weight: bold;
  color: #00b894;
  margin-top: 2;
}

.stat-delta.down {
  color: #ff6b6b;
}

.chart-card,
.activity-card {
  background-color: var(--surface);
  border-radius: 12;
  padding: 16;
  display: flex;
  flex-direction: column;
  gap: 12;
  box-shadow: 0 2px 8px var(--shadow);
}

.chart-card h2,
.activity-card h2 {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}

.chart {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-around;
  height: 160;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6;
  height: 100%;
  justify-content: flex-end;
}

.bar {
  width: 22;
  border-radius: 5 5 0 0;
}

.bar-label {
  font-size: 10;
  color: var(--muted);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10;
}

.activity-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10;
}

.dot {
  width: 8;
  height: 8;
  border-radius: 4;
}

.activity-text {
  flex-grow: 1;
  font-size: 12;
  color: var(--text);
}

.activity-time {
  font-size: 10;
  color: var(--muted);
}
</style>
