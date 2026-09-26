<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Rich Text - MasonKit">
      <NavigationButton text="Back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="rich">
        <div class="toolbar">
          <div class="tool" @tap="retext(Date.now() % 100)"><span class="tool-text">Retext</span></div>
          <div class="tool" @tap="restyle"><span class="tool-text">Restyle</span></div>
          <div class="tool" @tap="append"><span class="tool-text">+10</span></div>
          <div class="tool" @tap="toggleNarrow"><span class="tool-text" :text="narrow ? 'Widen' : 'Narrow'" /></div>
        </div>
        <span class="count" :text="`${cards.length} cards · ${spanCount} spans`" />

        <div class="root" :class="{ narrow }">
          <div v-for="card in cards" :key="card.id" class="card" :style="{ borderColor: card.color }">
            <div class="card-body">
              <p class="title">
                <span class="badge" :style="{ backgroundColor: card.color }" :text="`#${card.id}`" />
                <span class="title-text" :text="' ' + card.title" />
              </p>
              <p class="para">
                <span v-for="(r, i) in card.runs" :key="i" :text="r.text" :style="runStyle(r)" />
              </p>
              <p class="meta">
                <span v-for="(r, i) in card.meta" :key="i" :text="r.text" :style="runStyle(r)" />
              </p>
            </div>
          </div>
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed } from 'nativescript-vue';
import { useRich } from './scenarios';
import type { SpanRun } from './data';

const props = defineProps<{ auto?: boolean }>();
const { cards, narrow, onLoaded, retext, restyle, append, toggleNarrow } = useRich('mason', props);
const spanCount = computed(() => cards.value.reduce((n, c) => n + c.runs.length + c.meta.length + 2, 0));

function runStyle(r: SpanRun): Record<string, string> {
  const s: Record<string, string> = {};
  if (r.bold) s.fontWeight = 'bold';
  if (r.italic) s.fontStyle = 'italic';
  if (r.color) s.color = r.color;
  return s;
}
</script>

<style scoped>
.rich {
  display: flex;
  flex-direction: column;
  gap: 8;
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

.count {
  font-size: 11;
  color: var(--muted);
}

.root {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8;
}

.root.narrow {
  width: 60%;
}

.card {
  border-width: 1;
  border-style: solid;
  border-radius: 8;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4;
  padding: 10;
}

.title {
  font-size: 15;
  font-weight: bold;
}

.badge {
  font-size: 10;
  color: white;
  padding: 1 5;
  border-radius: 4;
}

.title-text {
  font-size: 15;
  font-weight: bold;
}

.para {
  font-size: 13;
  line-height: 18;
  color: var(--text-2);
}

.meta {
  font-size: 11;
  color: var(--muted);
}
</style>
