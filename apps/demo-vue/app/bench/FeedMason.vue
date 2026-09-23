<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Feed - MasonKit">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="feed">
        <div class="toolbar">
          <div class="tool" @tap="append"><span class="tool-text">+20</span></div>
          <div class="tool" @tap="prepend"><span class="tool-text">Prepend</span></div>
          <div class="tool" @tap="shuffle"><span class="tool-text">Shuffle</span></div>
          <div class="tool" @tap="retitle(Date.now() % 100)"><span class="tool-text">Retitle</span></div>
          <div class="tool" @tap="clear"><span class="tool-text">Clear</span></div>
          <div class="tool" @tap="refill"><span class="tool-text">Refill</span></div>
        </div>
        <span class="count">{{ items.length }} rows</span>

        <div v-for="item in items" :key="item.id" class="row">
          <div class="avatar" :style="{ backgroundColor: item.color }"><span class="avatar-text">{{ item.id % 100 }}</span></div>
          <div class="body">
            <span class="title">{{ item.title }}</span>
            <span class="subtitle">{{ item.subtitle }}</span>
          </div>
          <div class="badge"><span class="badge-text">{{ item.badge }}</span></div>
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
import { useFeed } from './scenarios';

const props = defineProps<{ auto?: boolean }>();
const { items, onLoaded, append, prepend, shuffle, retitle, clear, refill } = useFeed('mason', props);
</script>

<style scoped>
.feed {
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

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10;
  padding: 10;
  background-color: var(--surface);
  border-radius: 10;
}

.avatar {
  flex-shrink: 0;
  width: 40;
  height: 40;
  border-radius: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 13;
  font-weight: bold;
  color: #ffffff;
}

.body {
  flex-grow: 1;
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  gap: 2;
}

.title {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}

.subtitle {
  font-size: 12;
  color: var(--muted);
}

.badge {
  padding: 3 8;
  border-radius: 10;
  background-color: var(--primary-soft);
}

.badge-text {
  font-size: 11;
  color: var(--primary);
}
</style>
