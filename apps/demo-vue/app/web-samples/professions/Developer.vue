<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Developer — Repos">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="stat-row">
          <div class="stat"><span class="stat-value">42</span><span class="stat-label">Repos</span></div>
          <div class="stat"><span class="stat-value">1.8k</span><span class="stat-label">Stars</span></div>
          <div class="stat"><span class="stat-value">317</span><span class="stat-label">PRs</span></div>
        </section>

        <h2>Repositories</h2>
        <section class="repo-list">
          <article v-for="repo in repos" :key="repo.name" class="repo-card">
            <div class="repo-head">
              <p class="repo-name">{{ repo.name }}</p>
              <span class="badge" :class="repo.status">{{ repo.ci }}</span>
            </div>
            <p class="repo-desc">{{ repo.desc }}</p>
            <div class="repo-meta">
              <span class="lang"><span class="dot" :style="{ backgroundColor: repo.color }" />{{ repo.lang }}</span>
              <span class="meta-dim">★ {{ repo.stars }}</span>
              <span class="meta-dim">⑂ {{ repo.forks }}</span>
            </div>
          </article>
        </section>

        <h2>CI status</h2>
        <section class="ci-list">
          <div v-for="run in ciRuns" :key="run.branch" class="ci-row">
            <span class="dot" :style="{ backgroundColor: run.color }" />
            <div class="ci-body">
              <p class="ci-branch">{{ run.branch }}</p>
              <p class="ci-msg">{{ run.msg }}</p>
            </div>
            <span class="ci-time">{{ run.time }}</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const repos = [
  { name: 'mason-layout', desc: 'CSS layout engine bindings for native apps', lang: 'Rust', color: '#dea584', stars: 842, forks: 96, ci: 'passing', status: 'pass' },
  { name: 'river-ui', desc: 'Headless component primitives, zero styling', lang: 'TypeScript', color: '#3178c6', stars: 611, forks: 54, ci: 'passing', status: 'pass' },
  { name: 'pocket-ci', desc: 'Tiny CI runner for monorepos', lang: 'Go', color: '#00add8', stars: 233, forks: 18, ci: 'failing', status: 'fail' },
  { name: 'dotfiles', desc: 'Personal config, archived', lang: 'Shell', color: '#89e051', stars: 91, forks: 12, ci: 'n/a', status: 'muted' },
];

const ciRuns = [
  { branch: 'main · build #482', msg: 'All 214 checks passed', time: '4m', color: '#00b894' },
  { branch: 'feature/grid-gap · #481', msg: 'Snapshot diff detected', time: '32m', color: '#fdcb6e' },
  { branch: 'fix/ci-cache · #480', msg: 'Lint step failed', time: '1h', color: '#ff6b6b' },
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
.repo-list, .ci-list { display: flex; flex-direction: column; gap: 8; }
.repo-card { background-color: var(--surface); border-radius: 12; padding: 12; display: flex; flex-direction: column; gap: 6; box-shadow: 0 2px 8px var(--shadow); }
.repo-head { display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
.repo-name { font-size: 14; font-weight: bold; color: #0984e3; }
.badge { font-size: 10; font-weight: bold; padding: 2 8; border-radius: 10; }
.badge.pass { background-color: #e7f9f2; color: #00b894; }
.badge.fail { background-color: #fdecec; color: #ff6b6b; }
.badge.muted { background-color: var(--surface-2); color: var(--muted); }
.repo-desc { font-size: 12; color: var(--text-2); }
.repo-meta { display: flex; flex-direction: row; gap: 12; align-items: center; }
.lang { font-size: 11; color: var(--text-2); display: flex; flex-direction: row; align-items: center; gap: 4; }
.dot { width: 8; height: 8; border-radius: 4; }
.meta-dim { font-size: 11; color: var(--muted); }
.ci-row { display: flex; flex-direction: row; align-items: center; gap: 10; background-color: var(--surface); border-radius: 10; padding: 10 12; }
.ci-body { flex-grow: 1; display: flex; flex-direction: column; gap: 1; }
.ci-branch { font-size: 12; font-weight: bold; color: var(--text); }
.ci-msg { font-size: 11; color: var(--muted); }
.ci-time { font-size: 10; color: var(--muted); }
</style>
