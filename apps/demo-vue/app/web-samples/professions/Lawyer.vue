<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Lawyer — Docket">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="stat-row">
          <div class="stat"><span class="stat-value">7</span><span class="stat-label">Active</span></div>
          <div class="stat"><span class="stat-value">3</span><span class="stat-label">Court dates</span></div>
          <div class="stat"><span class="stat-value">94%</span><span class="stat-label">Win rate</span></div>
        </section>

        <h2>Active cases</h2>
        <section class="case-list">
          <article v-for="c in cases" :key="c.ref" class="case-card">
            <div class="case-head">
              <p class="case-ref">{{ c.ref }}</p>
              <span class="badge" :class="c.stageClass">{{ c.stage }}</span>
            </div>
            <p class="case-title">{{ c.title }}</p>
            <div class="case-meta">
              <span class="client">{{ c.client }}</span>
              <span class="date">⚖ {{ c.next }}</span>
            </div>
            <div class="track">
              <div class="fill" :style="{ width: c.progress + '%' }" />
            </div>
          </article>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const cases = [
  { ref: '24-0118', title: 'Breach of contract — logistics JV', client: 'Nordwind GmbH', stage: 'Discovery', stageClass: 'discovery', next: 'Jul 03', progress: 40 },
  { ref: '24-0092', title: 'IP assignment dispute — SaaS platform', client: 'Helio Systems', stage: 'Deposition', stageClass: 'deposition', next: 'Jun 21', progress: 62 },
  { ref: '24-0141', title: 'Lease termination — retail portfolio', client: 'Bluebird Retail', stage: 'Negotiation', stageClass: 'negotiation', next: 'Jun 27', progress: 25 },
  { ref: '23-0877', title: 'Employment claim — executive exit', client: 'Meridian Capital', stage: 'Pre-trial', stageClass: 'pretrial', next: 'Aug 12', progress: 81 },
];
</script>

<style scoped>
.page { background-color: var(--bg); overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: var(--text); }
.stat-row { display: flex; flex-direction: row; gap: 10; }
.stat { flex-grow: 1; background-color: var(--surface); border-radius: 12; padding: 12; display: flex; flex-direction: column; align-items: center; gap: 2; box-shadow: 0 2px 8px var(--shadow); }
.stat-value { font-size: 18; font-weight: bold; color: var(--text); }
.stat-label { font-size: 11; color: var(--muted); }
.case-list { display: flex; flex-direction: column; gap: 8; }
.case-card { background-color: var(--surface); border-radius: 12; padding: 14; display: flex; flex-direction: column; gap: 6; box-shadow: 0 2px 8px var(--shadow); }
.case-head { display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
.case-ref { font-size: 11; font-weight: bold; color: var(--muted); font-family: monospace; }
.badge { font-size: 10; font-weight: bold; padding: 2 8; border-radius: 10; }
.badge.discovery { background-color: #e8f1fd; color: #0984e3; }
.badge.deposition { background-color: #fff3d6; color: #c98a12; }
.badge.negotiation { background-color: #e7f9f2; color: #00b894; }
.badge.pretrial { background-color: #fdecec; color: #e17055; }
.case-title { font-size: 14; font-weight: bold; color: var(--text); }
.case-meta { display: flex; flex-direction: row; justify-content: space-between; align-items: center; }
.client { font-size: 12; color: var(--muted); }
.date { font-size: 11; color: var(--text-2); }
.track { height: 6; border-radius: 3; background-color: var(--surface-2); overflow: hidden; margin-top: 4; }
.fill { height: 100%; border-radius: 3; background-color: #8d8578; }
</style>
