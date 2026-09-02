<template>
  <Page iosOverflowSafeAreaEnabled="false" iosOverflowSafeArea="false">
    <ActionBar title="MasonKit News" class="hn-action-bar">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>

    <Scroll class="hn-scroll">
      <main class="hn-page">
        <nav class="hn-sort-row">
          <button class="hn-sort-button" :class="{ 'hn-sort-button-active': sort === 'top' }" @tap="sort = 'top'">Top</button>
          <button class="hn-sort-button" :class="{ 'hn-sort-button-active': sort === 'new' }" @tap="sort = 'new'">New</button>
          <button class="hn-sort-button" :class="{ 'hn-sort-button-active': sort === 'discussed' }" @tap="sort = 'discussed'">Discussed</button>
        </nav>

        <section class="hn-feed">
          <StoryCard v-for="(story, index) in stories" :key="story.id" :story="story" :rank="index + 1" @open="open(story)" />
        </section>

        <footer class="hn-feed-footer">
          <span class="hn-meta-dim">Fixture data — see app/hn/fixtures.ts</span>
        </footer>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { computed, ref, $navigateBack, $navigateTo } from 'nativescript-vue';
import { STORIES } from './fixtures';
import type { Story } from './models';
import StoryCard from './StoryCard.vue';
import StoryDetail from './StoryDetail.vue';

type SortMode = 'top' | 'new' | 'discussed';

const sort = ref<SortMode>('top');
const stories = computed(() => {
  const stories = [...STORIES];
  switch (sort.value) {
    case 'new':
      return stories.sort((a, b) => a.agoHours - b.agoHours);
    case 'discussed':
      return stories.sort((a, b) => b.descendants - a.descendants);
    default:
      return stories.sort((a, b) => b.score - a.score);
  }
});

function open(story: Story): void {
  $navigateTo(StoryDetail, { props: { story } });
}
</script>

<style scoped>
.hn-action-bar {
  background-color: #ff6600;
  color: #ffffff;
}

.hn-scroll {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
}

.hn-page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: 12;
  gap: 10;
  background-color: #f6f6ef;
}

.hn-sort-row {
  display: flex;
  flex-direction: row;
  gap: 8;
}

.hn-sort-button {
  padding: 6 12;
  font-size: 13;
  color: #828282;
  background-color: #ffffff;
  border-radius: 6;
}

.hn-sort-button-active {
  color: #ffffff;
  background-color: #ff6600;
}

.hn-feed {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.hn-feed-footer {
  display: flex;
  justify-content: center;
  padding: 8;
}

.hn-meta-dim {
  font-size: 12;
  color: #828282;
}
</style>
