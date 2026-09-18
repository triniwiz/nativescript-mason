<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Ratings">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="summary-card">
          <div class="score-block">
            <span class="big-score">{{ average }}</span>
            <div class="stars-row">
              <button v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(Number(average)) }" @tap="rate(n)">★</button>
            </div>
            <p class="review-count">{{ totalReviews }} reviews</p>
          </div>
          <div class="breakdown">
            <div v-for="row in breakdown" :key="row.stars" class="breakdown-row">
              <span class="breakdown-label">{{ row.stars }}</span>
              <div class="track">
                <div class="fill" :style="{ width: row.pct + '%' }" />
              </div>
              <span class="breakdown-pct">{{ row.pct }}%</span>
            </div>
          </div>
        </section>

        <p class="your-rating">Your rating: {{ mine ? mine + ' / 5' : 'tap a star above' }}</p>

        <section class="review-list">
          <article v-for="review in reviews" :key="review.author" class="review-card">
            <div class="review-head">
              <div class="mini-avatar" :style="{ backgroundColor: review.color }">
                <span class="mini-initials">{{ review.author.slice(0, 1) }}</span>
              </div>
              <div class="review-who">
                <p class="review-author">{{ review.author }}</p>
                <p class="review-stars">{{ '★'.repeat(review.stars) }}{{ '☆'.repeat(5 - review.stars) }}</p>
              </div>
              <span class="review-date">{{ review.date }}</span>
            </div>
            <p class="review-text">{{ review.text }}</p>
          </article>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed, ref } from 'nativescript-vue';

const breakdown = [
  { stars: 5, pct: 62 },
  { stars: 4, pct: 24 },
  { stars: 3, pct: 9 },
  { stars: 2, pct: 3 },
  { stars: 1, pct: 2 },
];

const reviews = ref([
  { author: 'Marta Silva', stars: 5, date: '2d ago', color: '#6c5ce7', text: 'Exactly what I needed. Set it up in ten minutes and it has been rock solid ever since.' },
  { author: 'Jon Peters', stars: 4, date: '5d ago', color: '#0984e3', text: 'Great overall. Would love a dark mode and slightly faster search, but no real complaints.' },
  { author: 'Aisha Khan', stars: 5, date: '1w ago', color: '#00b894', text: 'The onboarding alone deserves five stars. My whole team picked it up in a day.' },
]);

const mine = ref(0);
const totalReviews = 1284;

const rate = (n: number) => {
  mine.value = mine.value === n ? 0 : n;
};

const average = computed(() => (mine.value ? ((4.6 * totalReviews + mine.value) / (totalReviews + 1)).toFixed(2) : '4.6'));
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

main {
  display: flex;
  flex-direction: column;
  gap: 14;
}

.summary-card {
  background-color: var(--surface);
  border-radius: 14;
  padding: 18;
  display: flex;
  flex-direction: row;
  gap: 18;
  box-shadow: 0 2px 10px var(--shadow);
}

.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4;
}

.big-score {
  font-size: 40;
  font-weight: bold;
  color: var(--text);
}

.stars-row {
  display: flex;
  flex-direction: row;
  gap: 2;
}

.star {
  font-size: 18;
  color: var(--muted);
  background-color: transparent;
  border-style: none;
  padding: 0 2;
}

.star.filled {
  color: #fdcb6e;
}

.review-count {
  font-size: 11;
  color: var(--muted);
}

.breakdown {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8;
}

.breakdown-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8;
}

.breakdown-label {
  font-size: 11;
  color: var(--text-2);
  width: 10;
}

.track {
  flex-grow: 1;
  height: 8;
  border-radius: 4;
  background-color: var(--surface-2);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 4;
  background-color: #fdcb6e;
}

.breakdown-pct {
  font-size: 10;
  color: var(--muted);
  width: 28;
  text-align: right;
}

.your-rating {
  font-size: 12;
  color: var(--muted);
  text-align: center;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 10;
}

.review-card {
  background-color: var(--surface);
  border-radius: 12;
  padding: 14;
  display: flex;
  flex-direction: column;
  gap: 8;
  box-shadow: 0 2px 8px var(--shadow);
}

.review-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10;
}

.mini-avatar {
  width: 36;
  height: 36;
  border-radius: 18;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-initials {
  color: #ffffff;
  font-size: 14;
  font-weight: bold;
}

.review-who {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1;
}

.review-author {
  font-size: 13;
  font-weight: bold;
  color: var(--text);
}

.review-stars {
  font-size: 11;
  color: #fdcb6e;
}

.review-date {
  font-size: 10;
  color: var(--muted);
}

.review-text {
  font-size: 12;
  color: var(--text-2);
}
</style>
