<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Web samples">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="list page-body">
        <span class="body">Ten content-rich screens built from web-shaped elements — pricing, checkout, dashboards and more.</span>
        <section class="nav-list">
          <div v-for="s in samples" :key="s.name" class="nav-row" @tap="open(s.name)">
            <div class="nav-icon" :style="{ backgroundColor: s.color }"><span class="nav-icon-text">{{ s.title.charAt(0) }}</span></div>
            <div class="nav-body">
              <span class="nav-title">{{ s.title }}</span>
              <span class="nav-desc">{{ s.desc }}</span>
            </div>
            <span class="nav-arrow">›</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, $navigateTo } from 'nativescript-vue';

const samples = [
  { name: 'Pricing', title: 'Pricing', desc: 'Three tiers, featured plan, monthly/annual toggle', color: '#6c5ce7' },
  { name: 'Checkout', title: 'Checkout', desc: 'Cart with quantity steppers, promo code, order summary', color: '#00b894' },
  { name: 'Profile', title: 'Profile', desc: 'Avatar, stats, bio, and a tabbed post grid', color: '#0984e3' },
  { name: 'Analytics', title: 'Analytics', desc: 'Stat cards, flexbox bar chart, activity feed', color: '#e17055' },
  { name: 'Settings', title: 'Settings', desc: 'Grouped settings with inputs and switches', color: '#636e72' },
  { name: 'Events', title: 'Events', desc: 'Event list with date badges, chips, and RSVP toggles', color: '#e84393' },
  { name: 'Ratings', title: 'Ratings', desc: 'Tap-to-rate stars, breakdown bars, review cards', color: '#fdcb6e' },
  { name: 'Login', title: 'Sign in', desc: 'Form with validation and social buttons', color: '#1a1a2e' },
  { name: 'MusicPlayer', title: 'Music player', desc: 'Album art, progress bar, transport controls', color: '#fd79a8' },
  { name: 'Article', title: 'Article', desc: 'Reader page with byline, hero, and pull quote', color: '#4ecdc4' },
];

const open = (name: string) => {
  // Webpack resolves this to a context over the explicit list above.
  const component = require(`~/web-samples/samples/${name}.vue`).default;
  $navigateTo(component);
};
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 12;
}
</style>
