<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Profile">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="profile-header">
          <div class="avatar">
            <span class="avatar-initials">AR</span>
          </div>
          <h1>Amelia Reyes</h1>
          <p class="handle">@amelia.builds · Product Designer, Lisbon</p>
          <p class="bio">
            Designing calm interfaces for busy products. Previously at two startups you have never heard of.
            Coffee first, wireframes second.
          </p>
          <div class="stats-row">
            <div class="stat"><span class="stat-value">248</span><span class="stat-label">Posts</span></div>
            <div class="stat"><span class="stat-value">12.4k</span><span class="stat-label">Followers</span></div>
            <div class="stat"><span class="stat-value">380</span><span class="stat-label">Following</span></div>
          </div>
          <button class="follow-button" @tap="following = !following">{{ following ? 'Following ✓' : 'Follow' }}</button>
        </section>

        <nav class="tab-row">
          <button class="tab" :class="{ active: tab === 'grid' }" @tap="tab = 'grid'">Grid</button>
          <button class="tab" :class="{ active: tab === 'about' }" @tap="tab = 'about'">About</button>
        </nav>

        <section v-if="tab === 'grid'" class="post-grid">
          <div v-for="post in posts" :key="post.title" class="post-cell" :style="{ backgroundColor: post.color }">
            <span class="post-glyph">{{ post.glyph }}</span>
            <span class="post-title">{{ post.title }}</span>
          </div>
        </section>

        <section v-else class="about-card">
          <h2>About</h2>
          <p>Seven years designing mobile products. I write about design systems, motion, and the occasional side project.</p>
          <h2>Links</h2>
          <p>ameliareyes.design · dribbble/amelia · hello@ameliareyes.design</p>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, ref } from 'nativescript-vue';

const tab = ref<'grid' | 'about'>('grid');
const following = ref(false);

const posts = [
  { title: 'Onboarding flows', glyph: 'O', color: '#6c5ce7' },
  { title: 'Type scales', glyph: 'T', color: '#0984e3' },
  { title: 'Dark mode kit', glyph: 'D', color: '#1a1a2e' },
  { title: 'Empty states', glyph: 'E', color: '#00b894' },
  { title: 'Motion notes', glyph: 'M', color: '#e84393' },
  { title: 'Form patterns', glyph: 'F', color: '#fdcb6e' },
];
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

.profile-header {
  background-color: var(--surface);
  border-radius: 16;
  padding: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6;
  box-shadow: 0 2px 12px var(--shadow);
}

.avatar {
  width: 76;
  height: 76;
  border-radius: 38;
  background-color: #e17055;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(225, 112, 85, 0.4);
}

.avatar-initials {
  color: #ffffff;
  font-size: 28;
  font-weight: bold;
}

.profile-header h1 {
  font-size: 20;
  font-weight: bold;
  color: var(--text);
  margin-top: 6;
}

.handle {
  font-size: 12;
  color: var(--muted);
}

.bio {
  font-size: 13;
  color: var(--text-2);
  text-align: center;
  margin-top: 6;
}

.stats-row {
  display: flex;
  flex-direction: row;
  gap: 28;
  margin-top: 12;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2;
}

.stat-value {
  font-size: 17;
  font-weight: bold;
  color: var(--text);
}

.stat-label {
  font-size: 11;
  color: var(--muted);
}

.follow-button {
  margin-top: 12;
  background-color: var(--primary);
  color: #ffffff;
  padding: 9 28;
  border-radius: 20;
  font-weight: 600;
  border-style: none;
}

.tab-row {
  display: flex;
  flex-direction: row;
  gap: 8;
}

.tab {
  flex-grow: 1;
  padding: 8;
  border-radius: 8;
  background-color: var(--surface);
  color: var(--muted);
  font-size: 13;
  border-style: none;
  text-align: center;
}

.tab.active {
  color: var(--text);
  font-weight: bold;
  background-color: var(--surface-2);
}

.post-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8;
}

.post-cell {
  aspect-ratio: 1;
  border-radius: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.post-glyph {
  color: rgba(255, 255, 255, 0.85);
  font-size: 22;
  font-weight: bold;
}

.post-title {
  position: absolute;
  bottom: 6;
  left: 8;
  right: 8;
  color: rgba(255, 255, 255, 0.9);
  font-size: 9;
}

.about-card {
  background-color: var(--surface);
  border-radius: 12;
  padding: 16;
  display: flex;
  flex-direction: column;
  gap: 8;
}

.about-card h2 {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}

.about-card p {
  font-size: 13;
  color: var(--text-2);
}
</style>
