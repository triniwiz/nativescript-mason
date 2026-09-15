<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Chef — Kitchen">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="special-hero">
          <p class="hero-kicker">Today's special</p>
          <h1>Pan-seared salmon</h1>
          <p class="hero-sub">Lemon beurre blanc · 84 orders so far</p>
        </section>

        <h2>On the menu tonight</h2>
        <section class="menu-list">
          <article v-for="dish in menu" :key="dish.name" class="dish-card">
            <div class="dish-head">
              <p class="dish-name">{{ dish.name }}</p>
              <p class="dish-price">{{ dish.price }}</p>
            </div>
            <p class="dish-desc">{{ dish.desc }}</p>
            <div class="dish-foot">
              <span class="orders">{{ dish.orders }} orders</span>
              <span class="badge" :class="dish.tagClass">{{ dish.tag }}</span>
            </div>
          </article>
        </section>

        <h2>Kitchen load</h2>
        <section class="load-card">
          <div v-for="station in stations" :key="station.name" class="load-row">
            <span class="load-name">{{ station.name }}</span>
            <div class="track">
              <div class="fill" :style="{ width: station.load + '%', backgroundColor: station.color }" />
            </div>
            <span class="load-pct">{{ station.load }}%</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const menu = [
  { name: 'Pan-seared salmon', desc: 'Crispy skin, lemon beurre blanc, asparagus', price: '€28', orders: 84, tag: 'Special', tagClass: 'special' },
  { name: 'Wild mushroom risotto', desc: 'Carnaroli rice, parmesan, truffle oil', price: '€22', orders: 61, tag: 'Veggie', tagClass: 'veggie' },
  { name: 'Braised lamb shank', desc: 'Red wine jus, root vegetable purée', price: '€31', orders: 47, tag: 'Hearty', tagClass: 'hearty' },
  { name: 'Citrus tart', desc: 'Torched meringue, shortcrust base', price: '€9', orders: 72, tag: 'Dessert', tagClass: 'dessert' },
];

const stations = [
  { name: 'Grill', load: 78, color: '#e17055' },
  { name: 'Sauté', load: 64, color: '#fdcb6e' },
  { name: 'Pastry', load: 41, color: '#00b894' },
];
</script>

<style scoped>
.page { background-color: var(--bg); overflow-y: scroll; }

.page-body { padding: 16; padding-top: 0; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: var(--text); }
.special-hero { background-color: #3d2b1f; border-radius: 16; padding: 20; display: flex; flex-direction: column; gap: 4; box-shadow: 0 8px 22px rgba(61, 43, 31, 0.3); }
.hero-kicker { font-size: 11; font-weight: bold; color: #fdcb6e; text-transform: uppercase; }
.special-hero h1 { font-size: 24; font-weight: bold; color: #ffffff; }
.hero-sub { font-size: 12; color: rgba(255, 255, 255, 0.7); }
.menu-list { display: flex; flex-direction: column; gap: 8; }
.dish-card { background-color: var(--surface); border-radius: 12; padding: 14; display: flex; flex-direction: column; gap: 5; box-shadow: 0 2px 8px var(--shadow); }
.dish-head { display: flex; flex-direction: row; justify-content: space-between; align-items: baseline; }
.dish-name { font-size: 15; font-weight: bold; color: var(--text); }
.dish-price { font-size: 13; font-weight: bold; color: #e17055; }
.dish-desc { font-size: 12; color: var(--muted); }
.dish-foot { display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-top: 3; }
.orders { font-size: 11; color: var(--muted); }
.badge { font-size: 10; font-weight: bold; padding: 2 8; border-radius: 10; }
.badge.special { background-color: #fff3d6; color: #c98a12; }
.badge.veggie { background-color: #e7f9f2; color: #00b894; }
.badge.hearty { background-color: #fdecec; color: #e17055; }
.badge.dessert { background-color: #f3e8ff; color: #6c5ce7; }
.load-card { background-color: var(--surface); border-radius: 12; padding: 14; display: flex; flex-direction: column; gap: 10; }
.load-row { display: flex; flex-direction: row; align-items: center; gap: 10; }
.load-name { font-size: 12; color: var(--text-2); width: 52; }
.track { flex-grow: 1; height: 8; border-radius: 4; background-color: var(--surface-2); overflow: hidden; }
.fill { height: 100%; border-radius: 4; }
.load-pct { font-size: 11; color: var(--muted); width: 32; text-align: right; }
</style>
