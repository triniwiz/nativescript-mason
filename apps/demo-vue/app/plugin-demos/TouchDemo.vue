<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Touch animations">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body stack">
        <span class="body">@nativescript/core's TouchManager works on MasonKit views like any other NativeScript view. Press and hold the cards.</span>

        <!-- Per-view animation definitions -->
        <section class="block">
          <span class="section-label">touchAnimation per view</span>

          <div class="card press" :touchAnimation="pressScale" @tap="count.scale++">
            <div class="press-icon" style="background-color: #6c5ce7"><span class="press-glyph">S</span></div>
            <div class="press-body">
              <span class="h2">Scale</span>
              <span class="muted">down: scale 0.96 · up: spring back · tapped {{ count.scale }}×</span>
            </div>
          </div>

          <div class="card press" :touchAnimation="pressFade" @tap="count.fade++">
            <div class="press-icon" style="background-color: #00b894"><span class="press-glyph">O</span></div>
            <div class="press-body">
              <span class="h2">Opacity</span>
              <span class="muted">down: 0.6 · up: 1 · tapped {{ count.fade }}×</span>
            </div>
          </div>

          <div class="card press" :touchAnimation="pressLift" @tap="count.lift++">
            <div class="press-icon" style="background-color: #e17055"><span class="press-glyph">L</span></div>
            <div class="press-body">
              <span class="h2">Lift (function form)</span>
              <span class="muted">down: translate −4 + scale 1.02 · up: settle · tapped {{ count.lift }}×</span>
            </div>
          </div>
        </section>

        <!-- Global tap animations -->
        <section class="block">
          <span class="section-label">TouchManager.enableGlobalTapAnimations</span>
          <div class="card">
            <div class="row">
              <div class="press-body">
                <span class="h2">Global tap animation</span>
                <span class="muted">Every view with a tap handler animates, no per-view config.</span>
              </div>
              <Switch :checked="globalOn" @checkedChange="onGlobalToggle" />
            </div>
            <span class="muted note">Applies to views created after the toggle — the row below is re-created on each change.</span>
            <div class="chips" :key="chipsKey">
              <div v-for="c in chips" :key="c" class="chip-btn" @tap="lastChip = c">
                <span class="chip-text">{{ c }}</span>
              </div>
            </div>
            <span class="muted">last tapped: {{ lastChip || '—' }} · global {{ globalOn ? 'on' : 'off' }}</span>
          </div>
        </section>

        <!-- Opt out -->
        <section class="block">
          <span class="section-label">ignoreTouchAnimation</span>
          <div class="card press" ignoreTouchAnimation="true" @tap="count.ignored++">
            <div class="press-icon" style="background-color: #636e72"><span class="press-glyph">×</span></div>
            <div class="press-body">
              <span class="h2">Opted out</span>
              <span class="muted">Tappable, but never animates even with global on · tapped {{ count.ignored }}×</span>
            </div>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, onUnmounted, reactive, ref } from 'nativescript-vue';
import { CoreTypes, TouchManager, type View } from '@nativescript/core';

const count = reactive({ scale: 0, fade: 0, lift: 0, ignored: 0 });

// AnimationDefinition form: plain objects, the same shape `view.animate()` takes.
const pressScale = {
  down: { scale: { x: 0.96, y: 0.96 }, duration: 120, curve: CoreTypes.AnimationCurve.easeOut },
  up: { scale: { x: 1, y: 1 }, duration: 220, curve: CoreTypes.AnimationCurve.spring },
};

const pressFade = {
  down: { opacity: 0.6, duration: 100 },
  up: { opacity: 1, duration: 200 },
};

// Function form: full control, e.g. chaining or reading view state.
const pressLift = {
  down: (view: View) => {
    view.animate({ translate: { x: 0, y: -4 }, scale: { x: 1.02, y: 1.02 }, duration: 120, curve: CoreTypes.AnimationCurve.easeOut });
  },
  up: (view: View) => {
    view.animate({ translate: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, duration: 260, curve: CoreTypes.AnimationCurve.spring });
  },
};

// Global mode: any view with a tap listener gets TouchManager.animations
// attached when it loads. The chips row is keyed so toggling re-creates it.
const globalOn = ref(false);
const chipsKey = ref(0);
const chips = ['Flex', 'Grid', 'Text', 'Img'];
const lastChip = ref('');

const previousGlobal = TouchManager.enableGlobalTapAnimations;
const previousAnimations = TouchManager.animations;

TouchManager.animations = {
  down: { scale: { x: 0.9, y: 0.9 }, duration: 100 },
  up: { scale: { x: 1, y: 1 }, duration: 180, curve: CoreTypes.AnimationCurve.spring },
};

const onGlobalToggle = (args: { value: boolean }) => {
  globalOn.value = args.value;
  TouchManager.enableGlobalTapAnimations = args.value;
  chipsKey.value++;
};

onUnmounted(() => {
  // Leave the rest of the app the way we found it.
  TouchManager.enableGlobalTapAnimations = previousGlobal;
  TouchManager.animations = previousAnimations;
});
</script>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 16;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.press {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
}

.press-icon {
  width: 40;
  height: 40;
  border-radius: 12;
  display: flex;
  align-items: center;
  justify-content: center;
}

.press-glyph {
  font-size: 16;
  font-weight: bold;
  color: #ffffff;
}

.press-body {
  flex-grow: 1;
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  gap: 2;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
}

.note {
  margin-top: 8;
}

.chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8;
  margin-top: 8;
  margin-bottom: 8;
}

.chip-btn {
  padding: 8 14;
  border-radius: 16;
  background-color: var(--primary-soft);
}

.chip-text {
  font-size: 12;
  font-weight: 600;
  color: var(--primary);
}
</style>
