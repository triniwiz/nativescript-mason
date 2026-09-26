<template>
  <Page>
    <ActionBar title="Position">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">

      <!-- Sticky section headers -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Sticky section headers</p>
      </div>
      <span class="tk-muted">Each letter header is `position: sticky; top: 0`. It pins to the top of the page scroll while its group is in view and is pushed off by the next header.</span>

      <section v-for="group in groups" :key="group.letter">
        <div class="sticky-header">
          <span class="sticky-header-text">{{ group.letter }}</span>
        </div>
        <div v-for="name in group.names" :key="name" class="row">
          <span class="tk-text">{{ name }}</span>
        </div>
      </section>

      <!-- Sticky inside a nested scroll container -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Sticky in a nested scroll</p>
      </div>
      <span class="tk-muted">Sticky is scoped to the nearest scrolling ancestor. This header sticks inside the 180-tall box, not the page.</span>

      <Scroll style="height: 180; border-radius: 12" class="tk-surface-2">
        <div class="sticky-header">
          <span class="sticky-header-text">Sticks inside this box</span>
        </div>
        <div v-for="n in 10" :key="n" class="row">
          <span class="tk-text">Filler row {{ n }}</span>
        </div>
      </Scroll>

      <!-- Fixed escapes overflow clipping -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Fixed escapes clipping</p>
      </div>
      <span class="tk-muted">The parent below is relative and clips overflow. The absolute child stays clipped, like the web. The fixed child resolves its insets against the page viewport and is reparented there, so it escapes the clip and holds still when the page scrolls.</span>

      <div class="clip-box">
        <div class="absolute-box">
          <span class="pin-text">absolute 8,8</span>
        </div>
        <div class="fixed-box">
          <span class="pin-text">fixed 8,8</span>
        </div>
      </div>

      <!-- Fixed bottom banner -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Fixed bottom banner</p>
      </div>
      <span class="tk-muted">A banner pinned to the bottom of the page with `position: fixed`, independent of scroll position.</span>

      <button class="btn-primary" @tap="bannerVisible = !bannerVisible">{{ bannerVisible ? 'Hide banner' : 'Show banner' }}</button>

      <div class="spacer" />

      <!-- last in DOM order so it paints above everything else on the page -->
      <div v-if="bannerVisible" class="banner">
        <span style="color: white; font-weight: bold">position: fixed · bottom: 24</span>
      </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { ref } from 'nativescript-vue';

const groups = [
  { letter: 'A', names: ['Ada', 'Alan', 'Amara', 'Anil'] },
  { letter: 'B', names: ['Bea', 'Ben', 'Bianca'] },
  { letter: 'C', names: ['Cara', 'Chen', 'Clara', 'Cyrus'] },
  { letter: 'D', names: ['Dana', 'Deepak', 'Dmitri'] },
  { letter: 'E', names: ['Elin', 'Emeka', 'Eva', 'Ezra', 'Elio'] },
  { letter: 'F', names: ['Farah', 'Finn', 'Freya'] },
];

const bannerVisible = ref(true);
</script>

<style scoped>
.section-title {
  margin-top: 16;
  margin-bottom: 8;
}

.sticky-header {
  position: sticky;
  top: 0;
  padding: 8 12;
  background-color: var(--surface-2);
  border-bottom-width: 1;
  border-bottom-color: var(--border);
}

.sticky-header-text {
  font-size: 13;
  font-weight: bold;
  color: var(--text);
}

.row {
  height: 44;
  padding: 0 12;
  display: flex;
  align-items: center;
  border-bottom-width: 1;
  border-bottom-color: var(--border);
}

.clip-box {
  position: relative;
  height: 140;
  background-color: var(--surface-2);
  border-radius: 12;
  overflow: hidden;
}

.absolute-box {
  position: absolute;
  top: 8;
  left: 8;
  width: 120;
  height: 40;
  border-radius: 10;
  background-color: #0984e3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fixed-box {
  position: fixed;
  top: 8;
  right: 8;
  width: 120;
  height: 40;
  border-radius: 10;
  background-color: #00b894;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-text {
  font-size: 12;
  color: white;
  font-weight: bold;
}

.spacer {
  height: 96;
}

.banner {
  position: fixed;
  left: 16;
  right: 16;
  bottom: 24;
  padding: 14 16;
  border-radius: 14;
  background-color: #6c5ce7;
  box-shadow: 0 8px 24px rgba(108,92,231,0.4);
}
</style>
