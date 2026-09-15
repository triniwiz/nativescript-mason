<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Animation">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="stack page-body">
        <span class="body">NativeScript's view.animate() drives MasonKit views like any other view. Tap a card to run its animation.</span>

        <section class="card demo" @tap="run('slide')">
          <div class="stage">
            <div ref="slideBox" class="box" style="background-color: #4ecdc4"></div>
          </div>
          <div class="demo-meta">
            <span class="h2">Translate</span>
            <span class="muted">Slide right and back · 500 ms each way</span>
          </div>
        </section>

        <section class="card demo" @tap="run('spin')">
          <div class="stage">
            <div ref="spinBox" class="box" style="background-color: #6c5ce7"></div>
          </div>
          <div class="demo-meta">
            <span class="h2">Rotate + scale</span>
            <span class="muted">Full turn while growing to 1.4×, ease-in-out</span>
          </div>
        </section>

        <section class="card demo" @tap="run('fade')">
          <div class="stage">
            <div ref="fadeBox" class="box" style="background-color: #ff6b6b"></div>
          </div>
          <div class="demo-meta">
            <span class="h2">Opacity</span>
            <span class="muted">Fade out then back in</span>
          </div>
        </section>

        <section class="card demo" @tap="run('sequence')">
          <div class="stage">
            <div v-for="(c, i) in sequenceColors" :key="i" :ref="(el) => (sequenceBoxes[i] = el)" class="box small" :style="{ backgroundColor: c }"></div>
          </div>
          <div class="demo-meta">
            <span class="h2">Staggered</span>
            <span class="muted">Three views, 120 ms apart</span>
          </div>
        </section>

        <span class="muted" style="text-align: center; padding-top: 8">Ported from the Lynx styling/animation guide.</span>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, ref } from 'nativescript-vue';
import { CoreTypes } from '@nativescript/core';

const slideBox = ref<any>(null);
const spinBox = ref<any>(null);
const fadeBox = ref<any>(null);
const sequenceBoxes = ref<any[]>([]);
const sequenceColors = ['#fdcb6e', '#00b894', '#0984e3'];

const busy = new Set<string>();
const nativeOf = (r: any) => r?.nativeView ?? r;

const run = async (name: 'slide' | 'spin' | 'fade' | 'sequence') => {
  if (busy.has(name)) return;
  busy.add(name);
  try {
    if (name === 'slide') {
      const el = nativeOf(slideBox.value);
      await el.animate({ translate: { x: 140, y: 0 }, duration: 500, curve: CoreTypes.AnimationCurve.easeInOut });
      await el.animate({ translate: { x: 0, y: 0 }, duration: 500, curve: CoreTypes.AnimationCurve.easeInOut });
    } else if (name === 'spin') {
      const el = nativeOf(spinBox.value);
      await el.animate({ rotate: 360, scale: { x: 1.4, y: 1.4 }, duration: 600, curve: CoreTypes.AnimationCurve.easeInOut });
      await el.animate({ rotate: 0, scale: { x: 1, y: 1 }, duration: 400, curve: CoreTypes.AnimationCurve.easeInOut });
    } else if (name === 'fade') {
      const el = nativeOf(fadeBox.value);
      await el.animate({ opacity: 0, duration: 350 });
      await el.animate({ opacity: 1, duration: 350 });
    } else {
      await Promise.all(
        sequenceBoxes.value.map(async (r, i) => {
          const el = nativeOf(r);
          await el.animate({ translate: { x: 0, y: -24 }, duration: 250, delay: i * 120, curve: CoreTypes.AnimationCurve.easeOut });
          await el.animate({ translate: { x: 0, y: 0 }, duration: 250, curve: CoreTypes.AnimationCurve.easeIn });
        }),
      );
    }
  } finally {
    busy.delete(name);
  }
};
</script>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 12;
}

.demo {
  display: flex;
  flex-direction: column;
  gap: 12;
}

/* Tall and padded enough for the rotate + scale case: a 72dp box at 1.4x
 * turned 45deg spans ~143dp, and it grows around its own centre. No
 * overflow: hidden, so nothing gets clipped mid-animation. */
.stage {
  height: 160;
  border-radius: 10;
  background-color: var(--surface-2);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 40;
  gap: 12;
}

.box {
  width: 72;
  height: 72;
  border-radius: 12;
}

.small {
  width: 48;
  height: 48;
}

.demo-meta {
  display: flex;
  flex-direction: column;
  gap: 2;
}
</style>
