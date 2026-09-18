<template>
  <Page iosOverflowSafeAreaEnabled="false" style="background-color: #12121c">
    <ActionBar title="Music Player">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <div class="artwork">
          <span class="artwork-glyph">♫</span>
        </div>

        <div class="track-info">
          <h1>Midnight Circuit</h1>
          <p class="artist">Neon Coastline — After Hours</p>
        </div>

        <div class="progress-block">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progress + '%' }" />
          </div>
          <div class="time-row">
            <span class="time">{{ elapsed }}</span>
            <span class="time">{{ duration }}</span>
          </div>
        </div>

        <div class="controls">
          <button class="control-button" @tap="skip(-10)">⏪</button>
          <button class="play-button" @tap="playing = !playing">{{ playing ? '⏸' : '▶' }}</button>
          <button class="control-button" @tap="skip(10)">⏩</button>
        </div>

        <div class="extra-row">
          <button class="extra-button" :class="{ active: shuffle }" @tap="shuffle = !shuffle">Shuffle</button>
          <button class="extra-button" :class="{ active: repeat }" @tap="repeat = !repeat">Repeat</button>
        </div>

        <section class="up-next">
          <h2>Up next</h2>
          <div v-for="track in upNext" :key="track.title" class="up-next-row">
            <div class="up-next-body">
              <p class="up-next-title">{{ track.title }}</p>
              <p class="up-next-artist">{{ track.artist }}</p>
            </div>
            <span class="up-next-time">{{ track.time }}</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed, ref } from 'nativescript-vue';

const totalSeconds = 214;
const position = ref(83);
const playing = ref(true);
const shuffle = ref(false);
const repeat = ref(false);

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const progress = computed(() => Math.round((position.value / totalSeconds) * 100));
const elapsed = computed(() => fmt(position.value));
const duration = computed(() => fmt(totalSeconds));

const skip = (delta: number) => {
  position.value = Math.min(totalSeconds, Math.max(0, position.value + delta));
};

const upNext = [
  { title: 'Glass Harbour', artist: 'Neon Coastline', time: '3:42' },
  { title: 'Static Bloom', artist: 'Neon Coastline', time: '4:05' },
  { title: 'Slow Voltage', artist: 'After Hours', time: '2:58' },
];
</script>

<style scoped>
/* Also set inline on <Page>: MasonKit Scroll paints its background on the
 * scrolled content, so the Page shows through once the content moves. */
.page {
  background-color: #12121c;
  overflow-y: scroll;
}

.page-body { padding: 20; }

main {
  display: flex;
  flex-direction: column;
  gap: 18;
  align-items: stretch;
}

.artwork {
  height: 220;
  border-radius: 18;
  background-color: #2d2d4a;
  background: linear-gradient(135deg, #6c5ce7, #e84393);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 30px rgba(108, 92, 231, 0.35);
}

.artwork-glyph {
  color: rgba(255, 255, 255, 0.9);
  font-size: 64;
}

.track-info {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 3;
}

.track-info h1 {
  font-size: 20;
  font-weight: bold;
  color: #ffffff;
}

.artist {
  font-size: 13;
  color: rgba(255, 255, 255, 0.6);
}

.progress-block {
  display: flex;
  flex-direction: column;
  gap: 6;
}

.progress-track {
  height: 5;
  border-radius: 3;
  background-color: rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3;
  background-color: #e84393;
}

.time-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.time {
  font-size: 11;
  color: rgba(255, 255, 255, 0.5);
}

.controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 26;
}

.control-button {
  width: 52;
  height: 52;
  border-radius: 26;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 18;
  border-style: none;
  text-align: center;
}

.play-button {
  width: 72;
  height: 72;
  border-radius: 36;
  background-color: #e84393;
  color: #ffffff;
  font-size: 26;
  border-style: none;
  text-align: center;
  box-shadow: 0 8px 22px rgba(232, 67, 147, 0.45);
}

.extra-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10;
}

.extra-button {
  padding: 7 16;
  border-radius: 16;
  background-color: transparent;
  border: 1 solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  font-size: 12;
}

.extra-button.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.up-next {
  display: flex;
  flex-direction: column;
  gap: 10;
  border-top: 1 solid rgba(255, 255, 255, 0.1);
  padding-top: 14;
}

.up-next h2 {
  font-size: 13;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
}

.up-next-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10;
}

.up-next-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1;
}

.up-next-title {
  font-size: 13;
  color: #ffffff;
}

.up-next-artist {
  font-size: 11;
  color: rgba(255, 255, 255, 0.5);
}

.up-next-time {
  font-size: 11;
  color: rgba(255, 255, 255, 0.4);
}
</style>
