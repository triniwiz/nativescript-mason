<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Nested - core">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <ScrollView class="page">
      <StackLayout class="nested">
        <WrapLayout class="toolbar">
          <nbutton class="tool" text="Retext" @tap="retext(Date.now() % 100)" />
          <nbutton class="tool" :text="showOdd ? 'Hide row text' : 'Show row text'" @tap="toggleOdd" />
          <nbutton class="tool" :text="narrow ? 'Widen' : 'Narrow'" @tap="toggleNarrow" />
        </WrapLayout>
        <nlabel class="count" :text="`depth ${tree.depth} · ${boxCount} boxes`" />

        <StackLayout class="root" :class="{ narrow }">
          <NestedBoxCore :node="tree" :show-odd="showOdd" />
        </StackLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed } from 'nativescript-vue';
import NestedBoxCore from './NestedBoxCore.vue';
import { useNested } from './scenarios';

const props = defineProps<{ auto?: boolean }>();
const { tree, showOdd, narrow, onLoaded, retext, toggleOdd, toggleNarrow } = useNested('core', props);
const boxCount = computed(() => 2 ** (tree.value.depth + 1) - 1);
</script>

<style scoped>
.nested {
  padding: 12;
}

.toolbar {
  margin-bottom: 8;
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

.count {
  font-size: 11;
  color: var(--muted);
  margin-bottom: 8;
}

.root {
  width: 100%;
  horizontal-alignment: left;
}

.root.narrow {
  width: 70%;
}
</style>
