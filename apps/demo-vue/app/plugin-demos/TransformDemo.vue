<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Transform Playground">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <p class="lead">
          Port of <code>apps/transform-demo.html</code>. Pick a preset or type a transform and apply it live.
        </p>

        <!-- Preview -->
        <section class="preview">
          <div class="box" :style="{ transform: current }">
            <p class="box-text">Transformed</p>
          </div>
        </section>

        <p class="current-label">transform: {{ current }}</p>

        <!-- Presets -->
        <section class="presets">
          <button
            v-for="p in presets"
            :key="p.value"
            class="preset-button"
            :class="{ 'preset-active': current === p.value }"
            @tap="apply(p.value)"
          >
            {{ p.label }}
          </button>
        </section>

        <!-- Custom input -->
        <section class="input-row">
          <Input v-model="custom" class="transform-input" hint="translate(24,12) rotate(8deg) scale(1.02)" />
          <button class="apply-button" @tap="apply(custom)">Apply</button>
        </section>

        <!-- Static gallery -->
        <h2 class="section-title">Rotate</h2>
        <div class="demo-row">
          <div class="transform-card" style="background-color: #FF6B6B; transform: rotate(0deg);"><p class="card-text">0</p></div>
          <div class="transform-card" style="background-color: #E84393; transform: rotate(15deg);"><p class="card-text">15</p></div>
          <div class="transform-card" style="background-color: #6C5CE7; transform: rotate(45deg);"><p class="card-text">45</p></div>
          <div class="transform-card" style="background-color: #0984E3; transform: rotate(90deg);"><p class="card-text">90</p></div>
        </div>

        <h2 class="section-title">Scale</h2>
        <div class="demo-row-spaced">
          <div class="scale-wrapper">
            <div class="transform-card-sm" style="background-color: #FDCB6E; transform: scale(0.5, 0.5);"><p class="card-text-sm">0.5</p></div>
          </div>
          <div class="scale-wrapper">
            <div class="transform-card-sm" style="background-color: #E17055; transform: scale(0.75, 0.75);"><p class="card-text-sm">0.75</p></div>
          </div>
          <div class="scale-wrapper">
            <div class="transform-card-sm" style="background-color: #D63031; transform: scale(1.0, 1.0);"><p class="card-text-sm">1.0</p></div>
          </div>
          <div class="scale-wrapper">
            <div class="transform-card-sm" style="background-color: #E84393; transform: scale(1.25, 1.25);"><p class="card-text-sm">1.25</p></div>
          </div>
        </div>

        <h2 class="section-title">Skew</h2>
        <div class="demo-row-spaced">
          <div class="skew-wrapper">
            <div class="transform-card-sm" style="background-color: #00CEC9; transform: skewX(0deg);"><p class="card-text-sm">0</p></div>
          </div>
          <div class="skew-wrapper">
            <div class="transform-card-sm" style="background-color: #0984E3; transform: skewX(10deg);"><p class="card-text-sm">X 10</p></div>
          </div>
          <div class="skew-wrapper">
            <div class="transform-card-sm" style="background-color: #6C5CE7; transform: skewX(20deg);"><p class="card-text-sm">X 20</p></div>
          </div>
          <div class="skew-wrapper">
            <div class="transform-card-sm" style="background-color: #E84393; transform: skewY(15deg);"><p class="card-text-sm">Y 15</p></div>
          </div>
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, ref } from 'nativescript-vue';

const presets = [
  { label: 'translate(0,0)', value: 'translate(0, 0)' },
  { label: 'rotate(15deg)', value: 'rotate(15deg)' },
  { label: 'scale(1.3)', value: 'scale(1.3, 1.3)' },
  { label: 'skew(12deg)', value: 'skewX(12deg)' },
  { label: 'combo', value: 'translate(24, 12) rotate(8deg) scale(1.02)' },
  { label: 'combo 2', value: 'translate(40, -10) rotate(-12deg) scale(0.9)' },
];

const current = ref('translate(24, 12) rotate(8deg) scale(1.02)');
const custom = ref('');

const apply = (value: string) => {
  if (!value || !value.trim()) {
    return;
  }
  current.value = value.trim();
};
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

main {
  display: flex;
  flex-direction: column;
  gap: 12;
}

.lead {
  font-size: 13;
  color: var(--text-2);
}

code {
  font-family: monospace;
  background-color: var(--surface-2);
  border-radius: 4;
  padding: 1 5;
  font-size: 12;
  color: #d63031;
}

.preview {
  background-color: var(--surface-2);
  border-radius: 12;
  height: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.box {
  width: 200;
  height: 110;
  background-color: #2196f3;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.box-text {
  color: #ffffff;
  font-size: 16;
  font-weight: bold;
}

.current-label {
  font-size: 12;
  font-family: monospace;
  color: var(--text-2);
  text-align: center;
}

.presets {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8;
}

.preset-button {
  background-color: var(--surface);
  border: 1 solid #ccc;
  border-radius: 6;
  padding: 8 12;
  font-size: 12;
  color: var(--text);
}

.preset-active {
  background-color: #2196f3;
  border-color: #2196f3;
  color: #ffffff;
}

.input-row {
  display: flex;
  flex-direction: row;
  gap: 8;
}

.transform-input {
  flex-grow: 1;
  min-width: 120;
  padding: 8 10;
  border: 1 solid #ccc;
  border-radius: 6;
  background-color: var(--surface);
  font-size: 13;
}

.apply-button {
  background-color: var(--primary);
  color: #ffffff;
  padding: 8 18;
  border-radius: 6;
  font-weight: 600;
  border-style: none;
}

.section-title {
  margin-top: 8;
  font-size: 16;
  font-weight: bold;
  color: var(--text);
}

.demo-row {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 16;
  background-color: var(--surface-2);
  border-radius: 12;
  height: 80;
}

.demo-row-spaced {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 16;
  background-color: var(--surface-2);
  border-radius: 12;
  height: 90;
}

.transform-card {
  width: 44;
  height: 44;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transform-card-sm {
  width: 44;
  height: 44;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scale-wrapper,
.skew-wrapper {
  width: 60;
  height: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-text {
  color: white;
  font-weight: bold;
  font-size: 14;
  text-align: center;
}

.card-text-sm {
  color: white;
  font-weight: bold;
  font-size: 11;
  text-align: center;
}
</style>
