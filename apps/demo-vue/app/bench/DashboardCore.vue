<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Dashboard - core">
      <NavigationButton text="Back" @tap="$navigateBack()" />
    </ActionBar>
    <ScrollView class="page">
      <StackLayout class="dash">
        <WrapLayout class="toolbar">
          <nbutton class="tool" text="Bump" @tap="bump(Date.now() % 100)" />
          <nbutton class="tool" text="Rotate" @tap="rotate" />
          <nbutton class="tool" :text="wide ? '3 columns' : '2 columns'" @tap="toggleWide" />
        </WrapLayout>

        <GridLayout class="grid" :columns="columns" :rows="rows">
          <StackLayout v-for="(tile, i) in tiles" :key="tile.id" class="tile" :row="Math.floor(i / cols)" :col="i % cols">
            <nlabel class="label" :text="tile.label" />
            <nlabel class="value" :text="tile.value" :color="tile.color" />
            <GridLayout class="bars" columns="*, *, *, *, *">
              <StackLayout v-for="(h, j) in tile.bars" :key="j" class="bar" :col="j" :height="h" verticalAlignment="bottom" :backgroundColor="tile.color" />
            </GridLayout>
          </StackLayout>
        </GridLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed } from 'nativescript-vue';
import { useDashboard } from './scenarios';

const props = defineProps<{ auto?: boolean }>();
const { tiles, wide, onLoaded, bump, rotate, toggleWide } = useDashboard('core', props);

const cols = computed(() => (wide.value ? 2 : 3));
const columns = computed(() => Array(cols.value).fill('*').join(', '));
const rows = computed(() => Array(Math.ceil(tiles.value.length / cols.value)).fill('auto').join(', '));
</script>

<style scoped>
.dash {
  padding: 12;
}

.toolbar {
  margin-bottom: 10;
}

.tool {
  padding: 6 10;
  margin: 0 6 6 0;
  font-size: 12;
  color: var(--on-primary);
  background-color: var(--primary);
  border-radius: 6;
  text-transform: none;
  min-width: 0;
  min-height: 0;
  android-elevation: 0;
}

/* Gap is emulated with a margin on every cell. */
.grid {
  margin: -4;
}

.tile {
  margin: 4;
  padding: 10;
  background-color: var(--surface);
  border-radius: 10;
}

.label {
  font-size: 11;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 4;
}

.value {
  font-size: 20;
  font-weight: bold;
  margin-bottom: 4;
}

.bars {
  height: 32;
}

.bar {
  margin: 0 1.5;
  vertical-alignment: bottom;
  border-radius: 2;
}
</style>
