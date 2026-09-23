<template>
  <GridLayout v-if="node.depth % 2 === 0 && node.children.length" class="box" columns="*, *" rows="auto, auto">
    <nlabel v-if="showOdd" class="text branch" :text="node.text" textWrap="true" row="0" colSpan="2" />
    <NestedBoxCore v-for="(child, i) in node.children" :key="child.id" :node="child" :show-odd="showOdd" class="cell" row="1" :col="i" />
  </GridLayout>
  <StackLayout v-else class="box">
    <nlabel class="text" :class="node.children.length ? 'branch' : 'leaf'" :text="node.text" textWrap="true" />
    <NestedBoxCore v-for="child in node.children" :key="child.id" :node="child" :show-odd="showOdd" class="cell" />
  </StackLayout>
</template>

<script lang="ts" setup>
import type { NestedNode } from './data';

defineProps<{ node: NestedNode; showOdd: boolean }>();
</script>

<style scoped>
.box {
  padding: 4;
  border-radius: 6;
  background-color: var(--surface);
  border-width: 1;
  border-color: var(--border);
}

.cell {
  margin: 2;
  vertical-alignment: top;
}

.text {
  font-size: 10;
  color: var(--text-2);
  margin: 2;
}

.branch {
  color: var(--muted);
}
</style>
