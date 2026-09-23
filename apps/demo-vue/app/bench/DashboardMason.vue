<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Dashboard - MasonKit">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="dash">
        <div class="toolbar">
          <div class="tool" @tap="bump(Date.now() % 100)"><span class="tool-text">Bump</span></div>
          <div class="tool" @tap="rotate"><span class="tool-text">Rotate</span></div>
          <div class="tool" @tap="toggleWide"><span class="tool-text">{{ wide ? '3 columns' : '2 columns' }}</span></div>
        </div>

        <div class="grid" :class="{ wide }">
          <div v-for="tile in tiles" :key="tile.id" class="tile">
            <span class="label">{{ tile.label }}</span>
            <span class="value" :style="{ color: tile.color }">{{ tile.value }}</span>
            <div class="bars">
              <div v-for="(h, i) in tile.bars" :key="i" class="bar" :style="{ height: h, backgroundColor: tile.color }" />
            </div>
          </div>
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
import { useDashboard } from './scenarios';

const props = defineProps<{ auto?: boolean }>();
const { tiles, wide, onLoaded, bump, rotate, toggleWide } = useDashboard('mason', props);
</script>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 10;
  padding: 12;
}

.toolbar {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6;
}

.tool {
  padding: 6 10;
  background-color: var(--primary);
  border-radius: 6;
}

.tool-text {
  font-size: 12;
  color: var(--on-primary);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8;
}

.grid.wide {
  grid-template-columns: 1fr 1fr;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 4;
  padding: 10;
  background-color: var(--surface);
  border-radius: 10;
}

.label {
  font-size: 11;
  color: var(--muted);
  text-transform: uppercase;
}

.value {
  font-size: 20;
  font-weight: bold;
}

.bars {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 3;
  height: 32;
}

.bar {
  flex-grow: 1;
  border-radius: 2;
}
</style>
