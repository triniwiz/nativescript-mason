<template>
  <Page>
    <ActionBar title="Inputs">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <p class="note">Each block mirrors plain HTML. Compare with the same markup in a browser.</p>

        <p class="section">Bound value</p>
        <div class="stack">
          <Input class="field" v-model="live" placeholder="type here" />
          <span class="note">value: {{ live }}</span>
          <div class="row"><Input type="checkbox" v-model="agree" /><span class="note">checkbox: {{ show(agree) }}</span></div>
          <Input type="range" v-model="volume" />
          <span class="note">range: {{ show(volume) }}</span>
          <Input type="date" v-model="day" />
          <span class="note">date: {{ show(day) }}</span>
          <Input type="color" v-model="tint" />
          <span class="note">color: {{ show(tint) }}</span>
          <button class="btn" @tap="setBound">Set from code</button>
        </div>

        <p class="section">Unstyled (UA defaults)</p>
        <div class="stack">
          <Input placeholder="type=text" />
          <Input type="email" placeholder="type=email" />
          <Input type="password" placeholder="type=password" />
          <Input type="tel" placeholder="type=tel" />
          <Input type="url" placeholder="type=url" />
          <Input type="number" placeholder="type=number" />
          <Input type="search" placeholder="type=search" />
          <Input v-model="prefilled" />
        </div>

        <p class="section">Border and padding</p>
        <div class="stack">
          <Input class="pad-0" placeholder="padding: 0, border 1" />
          <Input class="pad-8" placeholder="padding: 8, border 1" />
          <Input class="pad-12-16" placeholder="padding: 12 16, border 1" />
          <Input class="border-2" placeholder="border: 2 solid, padding 8" />
          <Input class="no-border" placeholder="border: none, padding 8" />
        </div>

        <p class="section">Radius and background</p>
        <div class="stack">
          <Input class="field round-0" placeholder="radius 0" />
          <Input class="field round-8" placeholder="radius 8" />
          <Input class="field pill" placeholder="radius 999 (pill)" />
          <Input class="field filled" placeholder="filled background" />
        </div>

        <p class="section">Typography</p>
        <div class="stack">
          <Input class="field fs-12" v-model="small" placeholder="font-size 12" />
          <Input class="field fs-18" v-model="large" placeholder="font-size 18" />
          <Input class="field bold" v-model="bold" placeholder="bold, colored text" />
          <Input class="field centered" v-model="centered" placeholder="text-align: center" />
          <Input class="field right" v-model="right" placeholder="text-align: right" />
        </div>

        <p class="section">Colors</p>
        <div class="stack">
          <Input class="field c-border-lit" value="border literal red" />
          <Input class="field c-border-var" value="border var(--primary)" />
          <Input class="field c-border-long" value="border-color longhand green" />
          <Input class="field c-text-lit" value="text literal red" />
          <Input class="field c-text-var" value="text var(--primary)" />
          <Input class="field c-text-lit" placeholder="placeholder (not colored)" />
          <div class="c-div d-a"><span class="d-t">A: border: 2 solid #ff0000</span></div>
          <div class="c-div d-b"><span class="d-t">B: border: 2 solid red</span></div>
          <div class="c-div d-c"><span class="d-t">C: width+style+color longhands</span></div>
          <div class="c-div d-d"><span class="d-t">D: border: 2px solid #ff0000</span></div>
        </div>

        <p class="section">Width and layout</p>
        <div class="stack">
          <Input class="field w-half" placeholder="width: 50%" />
          <div class="row">
            <Input class="field grow" placeholder="flex: 1" />
            <button class="btn" @tap="noop">Go</button>
          </div>
          <div class="row">
            <Input class="field grow" placeholder="first" />
            <Input class="field grow" placeholder="second" />
          </div>
        </div>

        <p class="section">Other types</p>
        <div class="stack">
          <div class="row"><Input type="checkbox" /><span class="label">checkbox</span></div>
          <div class="row"><Input type="radio" /><span class="label">radio</span></div>
          <Input type="range" />
          <Input type="date" />
          <Input type="color" />
          <Input type="file" />
          <Input type="button" value="type=button" />
          <Input type="submit" value="type=submit" />
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { ref } from 'nativescript-vue';

const prefilled = ref('Prefilled value');
const small = ref('Small text');
const large = ref('Large text');
const bold = ref('Bold text');
const centered = ref('Centered');
const right = ref('Right aligned');
const live = ref('');
const agree = ref(true);
const volume = ref(30);
const day = ref('2026-01-15');
const tint = ref('#ff0000');
const show = (v: unknown) => `${JSON.stringify(v)} (${typeof v})`;
const setBound = () => {
  agree.value = !agree.value;
  volume.value = 80;
  day.value = '2026-12-25';
  tint.value = '#00aa00';
};
const noop = () => {};
</script>

<style scoped>
.page {
  overflow-y: scroll;
}
.page-body {
  padding: 16;
}
.note {
  font-size: 12;
  color: var(--muted);
}
.section {
  margin-top: 20;
  margin-bottom: 8;
  font-size: 18;
  font-weight: bold;
  color: var(--text);
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 8;
}
.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8;
}
.grow {
  flex-grow: 1;
  min-width: 0;
}
.label {
  font-size: 14;
  color: var(--text);
}
.btn {
  padding: 8 14;
  border-radius: 6;
  background-color: var(--primary);
  color: white;
}

.field {
  padding: 8 12;
  border: 1 solid var(--border);
  border-radius: 6;
  color: var(--text);
}
.pad-0 {
  padding: 0;
  border: 1 solid var(--border);
}
.pad-8 {
  padding: 8;
  border: 1 solid var(--border);
}
.pad-12-16 {
  padding: 12 16;
  border: 1 solid var(--border);
}
.border-2 {
  padding: 8;
  border: 2 solid var(--primary);
}
.no-border {
  padding: 8;
  border: none;
  background-color: var(--surface-2);
}
.round-0 {
  border-radius: 0;
}
.round-8 {
  border-radius: 8;
}
.pill {
  border-radius: 999;
  padding: 8 16;
}
.filled {
  background-color: var(--surface-2);
}
.fs-12 {
  font-size: 12;
}
.fs-18 {
  font-size: 18;
}
.bold {
  font-weight: bold;
  color: var(--primary);
}
.centered {
  text-align: center;
}
.right {
  text-align: right;
}
.c-border-lit {
  border: 2 solid #ff0000;
}
.c-border-var {
  border: 2 solid var(--primary);
}
.c-border-long {
  border: 2 solid;
  border-color: #00aa00;
}
.c-text-lit {
  color: #ff0000;
}
.c-text-var {
  color: var(--primary);
}
.d-t { color: #000000; font-size: 12; }
.d-a { background-color: #ffffff; border: 2 solid #ff0000; }
.d-b { background-color: #ffffff; border: 2 solid red; }
.d-c { background-color: #ffffff; border-width: 2; border-style: solid; border-color: #ff0000; }
.d-d { background-color: #ffffff; border: 2px solid #ff0000; }
.c-div {
  padding: 8;
}
.w-half {
  width: 50%;
}
</style>
