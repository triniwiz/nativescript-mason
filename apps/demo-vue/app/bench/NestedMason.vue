<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Nested - MasonKit">
      <NavigationButton text="Back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="nested">
        <div class="toolbar">
          <div class="tool" @tap="retext(Date.now() % 100)"><span class="tool-text">Retext</span></div>
          <div class="tool" @tap="toggleOdd"><span class="tool-text" :text="showOdd ? 'Hide row text' : 'Show row text'" /></div>
          <div class="tool" @tap="toggleNarrow"><span class="tool-text" :text="narrow ? 'Widen' : 'Narrow'" /></div>
        </div>
        <span class="count" :text="`depth ${tree.depth} · ${boxCount} boxes`" />

        <div class="root" :class="{ narrow }">
          <NestedBoxMason :node="tree" :show-odd="showOdd" />
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed } from 'nativescript-vue';
import NestedBoxMason from './NestedBoxMason.vue';
import { useNested } from './scenarios';

const props = defineProps<{ auto?: boolean }>();
const { tree, showOdd, narrow, onLoaded, retext, toggleOdd, toggleNarrow } = useNested('mason', props);
const boxCount = computed(() => 2 ** (tree.value.depth + 1) - 1);
</script>

<style scoped>
.nested {
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
}

.root.narrow {
  width: 70%;
}
</style>
