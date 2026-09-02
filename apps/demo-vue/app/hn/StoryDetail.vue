<template>
  <Page iosOverflowSafeAreaEnabled="false" iosOverflowSafeArea="false">
    <ActionBar :title="story.title" class="hn-action-bar">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>

    <Scroll class="hn-scroll">
      <main class="hn-page">
        <header class="hn-story-header">
          <h1 class="hn-story-title-large">{{ story.title }}</h1>
          <span class="hn-story-domain">{{ story.domain }}</span>
          <div class="hn-meta-row">
            <span class="hn-meta-score">{{ story.score }} points</span>
            <span class="hn-meta-dim">by</span>
            <b class="hn-meta-author">{{ story.by }}</b>
            <span class="hn-meta-dim">{{ story.agoHours }}h ago</span>
          </div>
        </header>

        <div class="hn-comment-bar">
          <h4 class="hn-section-title">{{ story.descendants }} comments</h4>
          <button class="hn-collapse-button" @tap="showComments = !showComments">
            {{ showComments ? 'Hide all' : 'Show all' }}
          </button>
        </div>

        <section v-if="showComments" class="hn-comment-list">
          <CommentThread v-for="comment in story.comments" :key="comment.id" :comment="comment" />
        </section>

        <div v-if="!story.comments.length" class="hn-empty">
          <span class="hn-meta-dim">No comments yet.</span>
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { ref } from 'nativescript-vue';
import CommentThread from './CommentThread.vue';
import type { Story } from './models';

defineProps<{
  story: Story;
}>();

const showComments = ref(true);
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

.hn-story-header {
  display: flex;
  flex-direction: column;
  gap: 6;
  padding: 12;
  background-color: #ffffff;
  border-radius: 8;
}

.hn-story-title-large {
  font-size: 19;
  color: #1a1a1a;
}

.hn-story-domain {
  font-size: 11;
  color: #828282;
}

.hn-meta-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8;
}

.hn-meta-score,
.hn-meta-author,
.hn-meta-dim {
  font-size: 12;
}

.hn-meta-score {
  color: #ff6600;
}

.hn-meta-author {
  color: #1a1a1a;
}

.hn-meta-dim {
  color: #828282;
}

.hn-comment-bar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.hn-section-title {
  font-size: 15;
  color: #1a1a1a;
}

.hn-collapse-button {
  font-size: 12;
  color: #828282;
  padding: 2 6;
  border-radius: 0;
  background-color: transparent;
}

.hn-comment-list {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.hn-empty {
  display: flex;
  justify-content: center;
  padding: 16;
}
</style>
