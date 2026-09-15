<template>
  <Page iosOverflowSafeAreaEnabled="false" style="background-color: #101014">
    <ActionBar title="Photos">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="gallery page-body">
        <header class="head">
          <div class="head-text">
            <span class="title">Coastal light</span>
            <span class="subtitle">{{ photos.length }} remote images via MasonKit Img · masonry columns</span>
          </div>
          <div class="seg">
            <div v-for="n in [2, 3]" :key="n" class="seg-btn" :class="{ 'seg-btn-active': columns === n }" @tap="columns = n">
              <span class="seg-text" :class="{ 'seg-text-active': columns === n }">{{ n }} col</span>
            </div>
          </div>
        </header>

        <!-- Featured -->
        <div class="hero">
          <Img :src="featured.src" class="hero-img" stretch="aspectFill" />
          <div class="hero-caption">
            <span class="chip-featured">Featured</span>
            <span class="hero-title">{{ featured.title }}</span>
            <span class="hero-loc">{{ featured.loc }} · {{ featured.year }}</span>
          </div>
        </div>

        <!-- Filmstrip -->
        <section class="strip-wrap">
          <span class="section-title">Recent</span>
          <div class="strip">
            <div class="strip-row">
              <div v-for="p in recent" :key="p.seed" class="thumb">
                <Img :src="thumb(p)" class="thumb-img" stretch="aspectFill" />
              </div>
            </div>
          </div>
        </section>

        <!-- Masonry -->
        <section class="masonry-wrap">
          <span class="section-title">All photos</span>
          <div class="columns">
            <div v-for="(col, ci) in masonry" :key="`${columns}-${ci}`" class="col">
              <div v-for="p in col" :key="p.seed" class="cell" :style="{ height: cellHeight(p) }">
                <Img :src="p.src" class="cell-img" stretch="aspectFill" />
                <div class="caption">
                  <span class="caption-title">{{ p.title }}</span>
                  <span v-if="columns === 2" class="caption-loc">{{ p.loc }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer class="foot">
          <span class="foot-text">Images from picsum.photos · seeded so the set is stable between runs</span>
        </footer>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed, ref } from 'nativescript-vue';
import { Screen } from '@nativescript/core';

type Photo = {
  seed: string;
  title: string;
  loc: string;
  year: string;
  /** Aspect ratio as height / width. */
  ratio: number;
  src: string;
};

const columns = ref(2);

const raw: Array<[string, string, string, number]> = [
  ['dune', 'Dune study', 'Comporta', 1.35],
  ['harbour', 'Harbour fog', 'Aveiro', 0.7],
  ['cliff', 'Granite light', 'Sagres', 1.25],
  ['pier', 'Pier at dusk', 'Nazaré', 0.8],
  ['foam', 'Sea foam', 'Ericeira', 1.4],
  ['lantern', 'Old lantern', 'Cascais', 0.9],
  ['reef', 'Reef line', 'Algarve', 1.2],
  ['boat', 'Rope & tide', 'Setúbal', 0.75],
  ['salt', 'Salt pans', 'Aveiro', 0.65],
  ['gull', 'Gull, waiting', 'Peniche', 1.3],
  ['tram', 'Yellow tram', 'Lisbon', 1.1],
  ['tile', 'Azulejo wall', 'Porto', 1.0],
  ['bridge', 'Iron bridge', 'Porto', 0.7],
  ['fort', 'Fortress at noon', 'Sagres', 0.85],
  ['net', 'Drying nets', 'Nazaré', 1.25],
  ['lighthouse', 'Lighthouse', 'Cabo da Roca', 1.45],
  ['market', 'Fish market', 'Olhão', 0.9],
  ['alley', 'Blue alley', 'Óbidos', 1.35],
  ['surf', 'First set', 'Ericeira', 0.75],
  ['cork', 'Cork oaks', 'Alentejo', 0.7],
  ['window', 'Green shutters', 'Tavira', 1.2],
  ['cafe', 'Corner café', 'Coimbra', 1.0],
  ['stairs', 'Steps to the sea', 'Sesimbra', 1.4],
  ['vineyard', 'Terraces', 'Douro', 0.65],
  ['moon', 'Moonrise', 'Comporta', 1.15],
  ['kite', 'Kite, offshore', 'Guincho', 0.8],
  ['rock', 'Sea stack', 'Benagil', 1.3],
  ['rain', 'After the rain', 'Sintra', 1.1],
  ['palace', 'Palace gate', 'Sintra', 0.9],
  ['fog', 'Morning fog', 'Serra da Estrela', 0.7],
  ['lamp', 'Street lamp', 'Évora', 1.4],
  ['cathedral', 'Cathedral', 'Braga', 1.25],
  ['ferry', 'Last ferry', 'Cacilhas', 0.75],
  ['cliffs2', 'Chalk cliffs', 'Aljezur', 0.85],
  ['pool', 'Rock pool', 'Praia da Luz', 1.0],
  ['boats', 'Moliceiros', 'Aveiro', 0.7],
];

const photos: Photo[] = raw.map(([seed, title, loc, ratio], i) => ({
  seed,
  title,
  loc,
  year: String(2021 + (i % 5)),
  ratio,
  src: `https://picsum.photos/seed/mason-${seed}/${ratio >= 1 ? '400/560' : '560/400'}`,
}));

const featured = { ...photos[15], src: 'https://picsum.photos/seed/mason-lighthouse/900/560' };
const recent = photos.slice(0, 12);
const thumb = (p: Photo) => `https://picsum.photos/seed/mason-${p.seed}/200/200`;

/** Column width in dp for the current column count (page padding 16, gap 8). */
const cellHeight = (p: Photo) => {
  const width = (Screen.mainScreen.widthDIPs - 32 - 8 * (columns.value - 1)) / columns.value;
  return Math.round(width * p.ratio);
};

/** Shortest-column-first placement so column bottoms stay roughly level. */
const masonry = computed(() => {
  const cols: Photo[][] = Array.from({ length: columns.value }, () => []);
  const heights = cols.map(() => 0);
  for (const p of photos) {
    const target = heights.indexOf(Math.min(...heights));
    cols[target].push(p);
    heights[target] += cellHeight(p) + 8;
  }
  return cols;
});
</script>

<style scoped>
/* Deliberately dark in both appearances - a photo wall reads best on near-black. */
/* Also set inline on <Page>: MasonKit Scroll paints its background on the
 * scrolled content, so the Page shows through once the content moves. */
.page {
  background-color: #101014;
  overflow-y: scroll;
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 16;
}

.head {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
}

.head-text {
  flex-grow: 1;
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  gap: 2;
}

.title {
  font-size: 22;
  font-weight: bold;
  color: #ffffff;
}

.subtitle {
  font-size: 11;
  color: rgba(255, 255, 255, 0.55);
}

.seg {
  display: flex;
  flex-direction: row;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 10;
  padding: 3;
  gap: 3;
}

.seg-btn {
  padding: 6 10;
  border-radius: 8;
  background-color: transparent;
}

.seg-btn-active {
  background-color: #ffffff;
}

.seg-text {
  font-size: 11;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.seg-text-active {
  color: #101014;
}

.section-title {
  font-size: 12;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.08;
  color: rgba(255, 255, 255, 0.45);
}

/* Featured */
.hero {
  position: relative;
  height: 200;
  border-radius: 16;
  overflow: hidden;
  background-color: #1d1d24;
}

.hero-img {
  width: 100%;
  height: 100%;
}

.hero-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 2;
}

.chip-featured {
  font-size: 10;
  font-weight: bold;
  text-transform: uppercase;
  color: #fdcb6e;
}

.hero-title {
  font-size: 18;
  font-weight: bold;
  color: #ffffff;
}

.hero-loc {
  font-size: 11;
  color: rgba(255, 255, 255, 0.7);
}

/* Filmstrip */
.strip-wrap {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.strip {
  height: 84;
  overflow-x: scroll;
  overflow-y: hidden;
}

.strip-row {
  display: flex;
  flex-direction: row;
  gap: 8;
}

.thumb {
  width: 84;
  height: 84;
  border-radius: 10;
  overflow: hidden;
  background-color: #1d1d24;
}

.thumb-img {
  width: 100%;
  height: 100%;
}

/* Masonry */
.masonry-wrap {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.columns {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8;
}

.col {
  flex-grow: 1;
  flex-basis: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8;
}

.cell {
  position: relative;
  width: 100%;
  border-radius: 12;
  overflow: hidden;
  background-color: #1d1d24;
}

.cell-img {
  width: 100%;
  height: 100%;
}

.caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8 10;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  gap: 1;
}

.caption-title {
  font-size: 12;
  font-weight: bold;
  color: #ffffff;
}

.caption-loc {
  font-size: 10;
  color: rgba(255, 255, 255, 0.65);
}

.foot {
  padding: 8 0 24;
  display: flex;
  align-items: center;
}

.foot-text {
  font-size: 10;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
}
</style>
