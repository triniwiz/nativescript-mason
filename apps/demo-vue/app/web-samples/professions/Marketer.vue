<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Marketer — Campaigns">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="kpi-row">
          <div class="kpi"><span class="kpi-value">48.2k</span><span class="kpi-label">Reach</span><span class="kpi-delta up">+12%</span></div>
          <div class="kpi"><span class="kpi-value">3.1%</span><span class="kpi-label">CTR</span><span class="kpi-delta up">+0.4</span></div>
          <div class="kpi"><span class="kpi-value">$1.20</span><span class="kpi-label">CPC</span><span class="kpi-delta down">−$0.08</span></div>
        </section>

        <h2>Active campaigns</h2>
        <section class="campaign-list">
          <article v-for="c in campaigns" :key="c.name" class="campaign-card">
            <div class="camp-head">
              <p class="camp-name">{{ c.name }}</p>
              <span class="badge" :class="c.statusClass">{{ c.status }}</span>
            </div>
            <p class="camp-channel">{{ c.channel }} · ends {{ c.ends }}</p>
            <div class="camp-stats">
              <div class="camp-stat"><span class="cs-value">{{ c.ctr }}</span><span class="cs-label">CTR</span></div>
              <div class="camp-stat"><span class="cs-value">{{ c.spend }}</span><span class="cs-label">Spend</span></div>
              <div class="camp-stat"><span class="cs-value">{{ c.roas }}</span><span class="cs-label">ROAS</span></div>
            </div>
            <div class="track">
              <div class="fill" :style="{ width: c.budgetUsed + '%' }" />
            </div>
            <p class="budget-note">{{ c.budgetUsed }}% of budget used</p>
          </article>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const campaigns = [
  { name: 'Summer Launch', channel: 'Paid social', ends: 'Jun 30', status: 'Live', statusClass: 'live', ctr: '3.8%', spend: '$4.2k', roas: '4.1x', budgetUsed: 62 },
  { name: 'Brand Search', channel: 'SEM', ends: 'Ongoing', status: 'Live', statusClass: 'live', ctr: '6.2%', spend: '$2.8k', roas: '5.6x', budgetUsed: 44 },
  { name: 'Webinar Series', channel: 'Email', ends: 'Jul 12', status: 'Draft', statusClass: 'draft', ctr: '—', spend: '$0', roas: '—', budgetUsed: 0 },
];
</script>

<style scoped>
.page { background-color: var(--bg); overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: var(--text); }
.kpi-row { display: flex; flex-direction: row; gap: 10; }
.kpi { flex-grow: 1; background-color: var(--surface); border-radius: 12; padding: 12; display: flex; flex-direction: column; gap: 2; box-shadow: 0 2px 8px var(--shadow); }
.kpi-value { font-size: 18; font-weight: bold; color: var(--text); }
.kpi-label { font-size: 11; color: var(--muted); }
.kpi-delta { font-size: 11; font-weight: bold; margin-top: 2; }
.kpi-delta.up { color: #00b894; }
.kpi-delta.down { color: #0984e3; }
.campaign-list { display: flex; flex-direction: column; gap: 8; }
.campaign-card { background-color: var(--surface); border-radius: 12; padding: 14; display: flex; flex-direction: column; gap: 7; box-shadow: 0 2px 8px var(--shadow); }
.camp-head { display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
.camp-name { font-size: 14; font-weight: bold; color: var(--text); }
.badge { font-size: 10; font-weight: bold; padding: 2 8; border-radius: 10; }
.badge.live { background-color: #e7f9f2; color: #00b894; }
.badge.draft { background-color: var(--surface-2); color: var(--muted); }
.camp-channel { font-size: 11; color: var(--muted); }
.camp-stats { display: flex; flex-direction: row; gap: 20; }
.camp-stat { display: flex; flex-direction: column; gap: 1; }
.cs-value { font-size: 14; font-weight: bold; color: var(--text); }
.cs-label { font-size: 10; color: var(--muted); }
.track { height: 6; border-radius: 3; background-color: var(--surface-2); overflow: hidden; margin-top: 3; }
.fill { height: 100%; border-radius: 3; background-color: #6c5ce7; }
.budget-note { font-size: 10; color: var(--muted); }
</style>
