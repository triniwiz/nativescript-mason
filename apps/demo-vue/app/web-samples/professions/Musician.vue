<template>
  <Page iosOverflowSafeAreaEnabled="false" style="background-color: #101014">
    <ActionBar title="Musician — Studio">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="release-hero">
          <p class="hero-kicker">Latest single</p>
          <h1>Glass Harbour</h1>
          <p class="hero-sub">Neon Coastline · out now</p>
        </section>

        <section class="stat-row">
          <div class="stat"><span class="stat-value">128k</span><span class="stat-label">Streams</span></div>
          <div class="stat"><span class="stat-value">14</span><span class="stat-label">Shows</span></div>
          <div class="stat"><span class="stat-value">3</span><span class="stat-label">Releases</span></div>
        </section>

        <h2>Tracks</h2>
        <section class="track-list">
          <article v-for="t in tracks" :key="t.title" class="track-card">
            <span class="track-num">{{ t.num }}</span>
            <div class="track-body">
              <p class="track-title">{{ t.title }}</p>
              <p class="track-meta">{{ t.plays }} plays</p>
            </div>
            <button class="play" :class="{ playing: t.playing }" @tap="toggle(t)">{{ t.playing ? '❚❚' : '▶' }}</button>
          </article>
        </section>

        <h2>Upcoming shows</h2>
        <section class="show-list">
          <div v-for="s in shows" :key="s.city" class="show-row">
            <div class="show-date"><span class="day">{{ s.day }}</span><span class="month">{{ s.month }}</span></div>
            <div class="show-body">
              <p class="show-city">{{ s.city }}</p>
              <p class="show-venue">{{ s.venue }}</p>
            </div>
            <span class="badge" :class="s.statusClass">{{ s.status }}</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, reactive } from 'nativescript-vue';

type Track = { num: string; title: string; plays: string; playing: boolean };

const tracks = reactive<Track[]>([
  { num: '01', title: 'Glass Harbour', plays: '84.1k', playing: true },
  { num: '02', title: 'Static Bloom', plays: '31.7k', playing: false },
  { num: '03', title: 'Midnight Circuit', plays: '12.2k', playing: false },
]);

const toggle = (t: Track) => {
  const wasPlaying = t.playing;
  tracks.forEach((tr) => (tr.playing = false));
  t.playing = !wasPlaying;
};

const shows = [
  { day: '18', month: 'JUN', city: 'Lisbon', venue: 'Lux Frágil', status: 'Selling fast', statusClass: 'hot' },
  { day: '02', month: 'JUL', city: 'Porto', venue: 'Hard Club', status: 'Tickets', statusClass: 'open' },
  { day: '19', month: 'JUL', city: 'Madrid', venue: 'Sala Riviera', status: 'Sold out', statusClass: 'sold' },
];
</script>

<style scoped>
/* Deliberately dark in both appearances - the whole screen is white-on-dark. */
/* Also set inline on <Page>: MasonKit Scroll paints its background on the
 * scrolled content, so the Page shows through once the content moves. */
.page { background-color: #101014; overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: rgba(255, 255, 255, 0.85); }
.release-hero { border-radius: 16; padding: 20; background-color: #2d2d4a; background: linear-gradient(135deg, #2d2d4a, #6c5ce7); display: flex; flex-direction: column; gap: 4; }
.hero-kicker { font-size: 11; font-weight: bold; color: #fdcb6e; text-transform: uppercase; }
.release-hero h1 { font-size: 24; font-weight: bold; color: #ffffff; }
.hero-sub { font-size: 12; color: rgba(255, 255, 255, 0.7); }
.stat-row { display: flex; flex-direction: row; gap: 10; }
.stat { flex-grow: 1; background-color: rgba(255, 255, 255, 0.06); border-radius: 12; padding: 12; display: flex; flex-direction: column; align-items: center; gap: 2; }
.stat-value { font-size: 18; font-weight: bold; color: #ffffff; }
.stat-label { font-size: 11; color: rgba(255, 255, 255, 0.5); }
.track-list { display: flex; flex-direction: column; gap: 8; }
.track-card { display: flex; flex-direction: row; align-items: center; gap: 12; background-color: rgba(255, 255, 255, 0.06); border-radius: 12; padding: 12; }
.track-num { font-size: 13; color: rgba(255, 255, 255, 0.4); width: 22; }
.track-body { flex-grow: 1; display: flex; flex-direction: column; gap: 1; }
.track-title { font-size: 14; font-weight: bold; color: #ffffff; }
.track-meta { font-size: 11; color: rgba(255, 255, 255, 0.5); }
.play { width: 36; height: 36; border-radius: 18; background-color: rgba(255, 255, 255, 0.12); color: #ffffff; font-size: 12; border-style: none; text-align: center; }
.play.playing { background-color: #e84393; }
.show-list { display: flex; flex-direction: column; gap: 8; }
.show-row { display: flex; flex-direction: row; align-items: center; gap: 12; background-color: rgba(255, 255, 255, 0.06); border-radius: 12; padding: 12; }
.show-date { display: flex; flex-direction: column; align-items: center; width: 44; }
.day { font-size: 17; font-weight: bold; color: #ffffff; }
.month { font-size: 10; color: rgba(255, 255, 255, 0.5); }
.show-body { flex-grow: 1; display: flex; flex-direction: column; gap: 1; }
.show-city { font-size: 14; font-weight: bold; color: #ffffff; }
.show-venue { font-size: 11; color: rgba(255, 255, 255, 0.5); }
.badge { font-size: 10; font-weight: bold; padding: 3 8; border-radius: 10; }
.badge.hot { background-color: rgba(253, 203, 110, 0.2); color: #fdcb6e; }
.badge.open { background-color: rgba(0, 184, 148, 0.2); color: #00b894; }
.badge.sold { background-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); }
</style>
