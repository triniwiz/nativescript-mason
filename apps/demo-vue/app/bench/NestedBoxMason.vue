<template>
  <div class="box" :class="node.depth % 2 ? 'column' : 'row'">
    <p v-if="showOdd || node.depth % 2 === 1" class="text" :class="[node.children.length ? 'branch' : 'leaf', node.depth % 2 ? '' : 'full']">{{ node.text }}</p>
    <NestedBoxMason v-for="child in node.children" :key="child.id" :node="child" :show-odd="showOdd" class="cell" />
  </div>
</template>

<script lang="ts" setup>
import type { NestedNode } from './data';

defineProps<{ node: NestedNode; showOdd: boolean }>();
</script>

<style scoped>
.box {
  display: flex;
  gap: 4;
  padding: 4;
  border-radius: 6;
  background-color: var(--surface);
  border-width: 1;
  border-color: var(--border);
}

.row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
}

.full {
  flex-basis: 100%;
}

.column {
  flex-direction: column;
}

.cell {
  flex-grow: 1;
  flex-basis: 0;
  min-width: 0;
}

.text {
  font-size: 10;
  color: var(--text-2);
}

.branch {
  color: var(--muted);
}
</style>
