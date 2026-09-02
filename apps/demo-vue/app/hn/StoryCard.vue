<template>
  <article class="hn-card" @tap="emit('open')">
    <div class="hn-card-row">
      <div class="hn-rank-gutter">
        <span class="hn-rank">{{ rank }}</span>
      </div>

      <div class="hn-card-body">
        <h3 class="hn-story-title">{{ story.title }}</h3>
        <span class="hn-story-domain">{{ story.domain }}</span>

        <div class="hn-meta-row">
          <span class="hn-meta-score">{{ story.score }} points</span>
          <span class="hn-meta-dim">by</span>
          <b class="hn-meta-author">{{ story.by }}</b>
          <span class="hn-meta-dim">{{ story.agoHours }}h ago</span>
          <span class="hn-meta-dim">{{ story.descendants }} comments</span>
        </div>

        <ul v-if="story.tags.length" class="hn-tag-row">
          <li v-for="tag in story.tags" :key="tag" class="hn-tag">
            <span class="hn-tag-text">{{ tag }}</span>
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { Story } from './models';

defineProps<{
  story: Story;
  rank: number;
}>();

const emit = defineEmits<{
  open: [];
}>();
</script>

<style scoped>
.hn-card {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 8;
  padding: 10;
}

.hn-card-row {
  display: flex;
  flex-direction: row;
  gap: 10;
}

.hn-rank-gutter {
  display: flex;
  width: 28;
  justify-content: center;
}

.hn-rank {
  font-size: 16;
  color: #828282;
}

.hn-card-body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-shrink: 1;
  gap: 4;
}

.hn-story-title {
  font-size: 15;
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

.hn-tag-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6;
  list-style-type: none;
}

.hn-tag {
  list-style-type: none;
  background-color: #eeeee4;
  border-radius: 4;
  padding: 2 6;
}

.hn-tag-text {
  font-size: 10;
  color: #828282;
}
</style>
