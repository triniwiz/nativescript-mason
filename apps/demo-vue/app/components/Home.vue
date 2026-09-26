<template>
  <Frame>
    <Page actionBarHidden="true">
      <Scroll class="page">
        <main class="home page-body">
          <header class="hero">
            <div class="hero-top">
              <div class="hero-text">
                <span class="hero-kicker">NativeScript-Vue</span>
                <span class="hero-title">MasonKit</span>
                <span class="hero-sub">Flexbox, Grid and web-shaped elements on native views.</span>
              </div>
            </div>
            <span class="hero-note">Following the system appearance · currently {{ appearance }}</span>
          </header>

          <section v-for="group in groups" :key="group.title" class="group">
            <span class="section-label">{{ group.title }}</span>
            <div class="nav-list">
              <div v-for="item in group.items" :key="item.title" class="nav-row" @tap="$navigateTo(item.page)">
                <div class="nav-icon" :style="{ backgroundColor: item.color }"><span class="nav-icon-text">{{ item.icon }}</span></div>
                <div class="nav-body">
                  <span class="nav-title">{{ item.title }}</span>
                  <span class="nav-desc">{{ item.desc }}</span>
                </div>
                <span class="nav-arrow">›</span>
              </div>
            </div>
          </section>

          <section class="group">
            <span class="section-label">Diagnostics</span>
            <div class="nav-list">
              <div class="nav-row" @tap="$navigateTo(BenchPage)">
                <div class="nav-icon" style="background-color: #00b894"><span class="nav-icon-text">B</span></div>
                <div class="nav-body">
                  <span class="nav-title">Layout benchmark</span>
                  <span class="nav-desc">MasonKit vs core, three screens, timed</span>
                </div>
                <span class="nav-arrow">›</span>
              </div>
              <div class="nav-row" @tap="$navigateTo(Stress)">
                <div class="nav-icon" style="background-color: #e17055"><span class="nav-icon-text">S</span></div>
                <div class="nav-body">
                  <span class="nav-title">Layout stress</span>
                  <span class="nav-desc">Reconciliation and border regressions</span>
                </div>
                <span class="nav-arrow">›</span>
              </div>
              <div class="card fib">
                <div class="nav-body">
                  <span class="nav-title">JS benchmark</span>
                  <span class="nav-desc">{{ fibStatus }}</span>
                </div>
                <button class="btn-primary" @tap="runFibTest">Run fib(30)</button>
              </div>
            </div>
          </section>

          <footer class="foot">
            <span class="muted">@triniwiz/nativescript-masonkit</span>
          </footer>
        </main>
      </Scroll>
    </Page>
  </Frame>
</template>

<script lang="ts" setup>
import { $navigateTo, ref } from 'nativescript-vue';
import { appearance } from '~/theme';

import FlexboxDemo from '~/plugin-demos/FlexboxDemo.vue';
import GridDemo from '~/plugin-demos/GridDemo.vue';
import GridArea from '~/plugin-demos/Grid-Area.vue';
import DisplayDemo from '~/plugin-demos/DisplayDemo.vue';
import SpacingDemo from '~/plugin-demos/SpacingDemo.vue';
import PositionDemo from '~/plugin-demos/PositionDemo.vue';
import TypographyDemo from '~/plugin-demos/TypographyDemo.vue';
import BoxShadowDemo from '~/plugin-demos/BoxShadowDemo.vue';
import GradientDemo from '~/plugin-demos/GradientDemo.vue';
import TransformDemo from '~/plugin-demos/TransformDemo.vue';
import AnimationDemo from '~/plugin-demos/AnimationDemo.vue';
import TouchDemo from '~/plugin-demos/TouchDemo.vue';
import CoreViewsDemo from '~/plugin-demos/CoreViewsDemo.vue';
import ShowcaseDemo from '~/plugin-demos/ShowcaseDemo.vue';
import HackerNews from '~/hn/HackerNews.vue';
import Photos from '~/web-samples/Photos.vue';
import WebSamples from '~/web-samples/WebSamples.vue';
import Professions from '~/web-samples/Professions.vue';
import Stress from '~/stress/Stress.vue';
import BenchPage from '~/bench/BenchPage.vue';

const groups = [
  {
    title: 'Layout',
    items: [
      { title: 'Flexbox', desc: 'Direction, wrap, justify and align', icon: 'F', color: '#6c5ce7', page: FlexboxDemo },
      { title: 'Grid', desc: 'Tracks, spans and auto-placement', icon: 'G', color: '#0984e3', page: GridDemo },
      { title: 'Grid areas', desc: 'Named grid-template-areas', icon: 'A', color: '#00b894', page: GridArea },
      { title: 'Display', desc: 'block / flex / none toggling', icon: 'D', color: '#e84393', page: DisplayDemo },
      { title: 'Spacing', desc: 'Margin, padding and gap', icon: 'S', color: '#fdcb6e', page: SpacingDemo },
      { title: 'Position', desc: 'Sticky headers and fixed overlays', icon: 'P', color: '#00b894', page: PositionDemo },
    ],
  },
  {
    title: 'Styling',
    items: [
      { title: 'Typography', desc: 'Type scale and text styles', icon: 'T', color: '#b2bec3', page: TypographyDemo },
      { title: 'Box shadows', desc: 'Elevation, colored and inset shadows', icon: 'B', color: '#636e72', page: BoxShadowDemo },
      { title: 'Gradients', desc: 'Stop positions, hard edges and stripes', icon: 'Gr', color: '#fd9644', page: GradientDemo },
      { title: 'Transforms', desc: 'Interactive rotate / scale / translate', icon: 'R', color: '#e17055', page: TransformDemo },
      { title: 'Animation', desc: 'Keyframe-style animations on Mason views', icon: 'M', color: '#4ecdc4', page: AnimationDemo },
      { title: 'Touch animations', desc: 'TouchManager press feedback on Mason views', icon: 'Tm', color: '#fd79a8', page: TouchDemo },
    ],
  },
  {
    title: 'Interop',
    items: [
      { title: 'Core views', desc: 'NativeScript widgets inside Mason containers', icon: 'C', color: '#74b9ff', page: CoreViewsDemo },
      { title: 'Showcase', desc: 'Component gallery', icon: 'W', color: '#a29bfe', page: ShowcaseDemo },
    ],
  },
  {
    title: 'Apps',
    items: [
      { title: 'Hacker News', desc: 'Sortable feed with threaded comments', icon: 'Y', color: '#ff6600', page: HackerNews },
      { title: 'Photos', desc: 'Masonry grid with remote images', icon: 'P', color: '#00cec9', page: Photos },
      { title: 'Web samples', desc: 'Ten content-rich web-style screens', icon: '10', color: '#6c5ce7', page: WebSamples },
      { title: 'Professions', desc: 'Ten mini dashboards', icon: 'Pr', color: '#fd79a8', page: Professions },
    ],
  },
];

const fibStatus = ref('Recursive fib(30) smoke test');
const fibonacci = (n: number): number => (n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2));

const runFibTest = () => {
  const startedAt = Date.now();
  const result = fibonacci(30);
  fibStatus.value = `fib(30) = ${result} in ${Date.now() - startedAt} ms`;
};
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 14;
}

.hero {
  background-color: var(--ink);
  border-radius: 18;
  padding: 20;
  display: flex;
  flex-direction: column;
  gap: 14;
  box-shadow: 0 8px 24px var(--shadow);
}

.hero-top {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.hero-text {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4;
}

.hero-kicker {
  font-size: 11;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.08;
  color: #fdcb6e;
}

.hero-title {
  font-size: 28;
  font-weight: bold;
  color: #ffffff;
}

.hero-sub {
  font-size: 13;
  color: rgba(255, 255, 255, 0.7);
}

.hero-note {
  font-size: 11;
  color: rgba(255, 255, 255, 0.45);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.fib {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
}

.foot {
  display: flex;
  align-items: center;
  padding: 12 0 24;
}
</style>
