<template>
  <article class="hn-comment">
    <header class="hn-comment-head">
      <span class="hn-comment-by">{{ comment.by }}</span>
      <span class="hn-meta-dim">{{ comment.agoHours }}h</span>
      <span class="hn-depth-badge">depth {{ depth }}</span>
      <button class="hn-collapse-button" @tap="collapsed = !collapsed">
        {{ collapsed ? `[+${replyCount}]` : '[-]' }}
      </button>
    </header>

    <p v-if="!collapsed" class="hn-comment-text">{{ comment.text }}</p>

    <section v-if="!collapsed && comment.kids.length" class="hn-replies">
      <CommentThread v-for="kid in comment.kids" :key="kid.id" :comment="kid" :depth="depth + 1" />
    </section>
  </article>
</template>

<script lang="ts" setup>
import { computed, ref } from 'nativescript-vue';
import type { Comment } from './models';

const props = withDefaults(
  defineProps<{
    comment: Comment;
    depth?: number;
  }>(),
  { depth: 0 },
);

const collapsed = ref(false);

function countDescendants(comment: Comment): number {
  return comment.kids.reduce((total, kid) => total + 1 + countDescendants(kid), 0);
}

const replyCount = computed(() => countDescendants(props.comment));
</script>

<style scoped>
.hn-comment {
  display: flex;
  flex-direction: column;
  gap: 4;
  background-color: #ffffff;
  border-radius: 6;
  padding: 8;
}

.hn-comment-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8;
}

.hn-comment-by {
  font-size: 12;
  color: #ff6600;
}

.hn-meta-dim {
  font-size: 12;
  color: #828282;
}

.hn-depth-badge {
  font-size: 10;
  color: #828282;
}

.hn-comment-text {
  font-size: 13;
  color: #1a1a1a;
}

.hn-collapse-button {
  font-size: 12;
  color: #828282;
  padding: 2 6;
  border-radius: 0;
  background-color: transparent;
}

.hn-replies {
  display: flex;
  flex-direction: column;
  gap: 6;
  margin-left: 12;
  margin-top: 6;
}
</style>
