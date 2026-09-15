<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Article">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <article class="page-body">
        <header>
          <p class="kicker">Engineering Notes</p>
          <h1>The quiet rebirth of layout on mobile</h1>
          <div class="byline">
            <div class="mini-avatar"><span>DK</span></div>
            <div class="byline-body">
              <p class="byline-author">Dana Kovac</p>
              <p class="byline-meta">June 12 · 6 min read</p>
            </div>
            <button class="save-button" :class="{ saved }" @tap="saved = !saved">{{ saved ? 'Saved ✓' : 'Save' }}</button>
          </div>
        </header>

        <div class="hero">
          <span class="hero-glyph">▦</span>
        </div>

        <p class="lede">
          For a decade, mobile layout meant one of two things: springs and struts, or a flex engine tuned for the
          web and bolted onto native views. Both worked. Neither felt like it belonged.
        </p>

        <p>
          The web solved this a long time ago. Flexbox gave us distribution along an axis; Grid gave us two
          dimensions and the honesty to say so. The trouble was never the model — it was the host. Native widgets
          speak a different dialect, and every bridge charged a toll at the border.
        </p>

        <h2>Shared memory changes the equation</h2>

        <p>
          The newer generation of layout engines keeps the entire style tree in a shared buffer. The UI thread
          reads exactly what the style thread wrote, with no serialization step in between. A dirty node invalidates
          a subtree, the engine recomputes, and the native layer gets a plain array of frames.
        </p>

        <blockquote>
          “Layout is not a rendering problem. It is a bookkeeping problem — and bookkeeping is what computers are
          good at.”
        </blockquote>

        <h2>What this means for product teams</h2>

        <p>
          Designers can hand over the same CSS they use for the web prototype. Engineers stop maintaining parallel
          constraint systems for iOS and Android. QA gets identical geometry on both platforms, which quietly
          deletes an entire class of screenshot-test diffs.
        </p>

        <p>
          None of this is glamorous. But glamour was never the point. The point is that a junior developer should
          be able to centre a card — vertically and horizontally — without a computer science degree or a
          three-hundred-comment Stack Overflow thread.
        </p>

        <footer class="article-footer">
          <span>Filed under: layout, css, native</span>
        </footer>
      </article>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, ref } from 'nativescript-vue';

const saved = ref(false);
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

.page-body { padding: 18; }

article {
  display: flex;
  flex-direction: column;
  gap: 14;
}

.kicker {
  font-size: 11;
  font-weight: bold;
  color: #6c5ce7;
  text-transform: uppercase;
}

article h1 {
  font-size: 26;
  font-weight: bold;
  color: var(--text);
  line-height: 32;
}

.byline {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10;
  margin-top: 4;
}

.mini-avatar {
  width: 40;
  height: 40;
  border-radius: 20;
  background-color: #e17055;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-avatar span {
  color: #ffffff;
  font-size: 13;
  font-weight: bold;
}

.byline-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1;
}

.byline-author {
  font-size: 13;
  font-weight: bold;
  color: var(--text);
}

.byline-meta {
  font-size: 11;
  color: var(--muted);
}

.save-button {
  padding: 7 14;
  border-radius: 16;
  background-color: var(--surface-2);
  color: var(--text);
  font-size: 12;
  font-weight: 600;
  border-style: none;
}

.save-button.saved {
  background-color: #6c5ce7;
  color: #ffffff;
}

.hero {
  height: 160;
  border-radius: 14;
  background-color: var(--ink);
  background: linear-gradient(120deg, #1a1a2e, #6c5ce7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-glyph {
  color: rgba(255, 255, 255, 0.9);
  font-size: 48;
}

.lede {
  font-size: 16;
  color: var(--text);
  line-height: 24;
}

article p {
  font-size: 14;
  color: var(--text-2);
  line-height: 22;
}

article h2 {
  font-size: 18;
  font-weight: bold;
  color: var(--text);
  margin-top: 6;
}

blockquote {
  border-left: 4 solid #6c5ce7;
  padding: 4 14;
  font-size: 15;
  font-style: italic;
  color: var(--text);
  line-height: 22;
  margin-top: 4;
  margin-bottom: 4;
}

.article-footer {
  border-top: 1 solid var(--border);
  padding-top: 12;
}

.article-footer span {
  font-size: 11;
  color: var(--muted);
}
</style>
