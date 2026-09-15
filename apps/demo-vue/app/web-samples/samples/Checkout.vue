<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Checkout">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <h1 class="heading">Your cart</h1>

        <section class="cart">
          <article v-for="item in cart" :key="item.name" class="line-item">
            <div class="thumb" :style="{ backgroundColor: item.color }">
              <span class="thumb-glyph">{{ item.glyph }}</span>
            </div>
            <div class="item-body">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-meta">{{ item.detail }}</p>
              <div class="stepper">
                <button class="stepper-button" @tap="bump(item, -1)">−</button>
                <span class="qty">{{ item.qty }}</span>
                <button class="stepper-button" @tap="bump(item, 1)">+</button>
              </div>
            </div>
            <p class="line-total">{{ (item.price * item.qty).toFixed(2) }}</p>
          </article>
        </section>

        <section class="promo-row">
          <Input v-model="promo" class="promo-input" hint="Promo code (try MASON10)" />
          <button class="promo-button" @tap="applyPromo">Apply</button>
        </section>
        <p v-if="promoMessage" class="promo-message">{{ promoMessage }}</p>

        <section class="summary">
          <div class="summary-row"><span>Subtotal</span><span>{{ subtotal.toFixed(2) }}</span></div>
          <div v-if="discount > 0" class="summary-row discount">
            <span>Discount (MASON10)</span><span>−{{ discount.toFixed(2) }}</span>
          </div>
          <div class="summary-row"><span>Shipping</span><span>{{ shipping.toFixed(2) }}</span></div>
          <div class="summary-row total"><span>Total</span><span>{{ total.toFixed(2) }}</span></div>
        </section>

        <button class="place-order">Place order</button>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed, ref } from 'nativescript-vue';

type CartItem = {
  name: string;
  detail: string;
  price: number;
  qty: number;
  color: string;
  glyph: string;
};

const cart = ref<CartItem[]>([
  { name: 'Trail Runners', detail: 'Size 42 · Slate', price: 129.0, qty: 1, color: '#6c5ce7', glyph: 'S' },
  { name: 'Wool Socks ×3', detail: 'Merino · Charcoal', price: 24.0, qty: 2, color: '#00b894', glyph: 'K' },
  { name: 'Insulated Bottle', detail: '750 ml · Glacier', price: 34.5, qty: 1, color: '#0984e3', glyph: 'B' },
]);

const promo = ref('');
const promoApplied = ref(false);
const promoMessage = ref('');

const bump = (item: CartItem, delta: number) => {
  item.qty = Math.max(0, item.qty + delta);
  cart.value = cart.value.filter((i) => i.qty > 0);
};

const applyPromo = () => {
  if (promo.value.trim().toUpperCase() === 'MASON10') {
    promoApplied.value = true;
    promoMessage.value = 'Promo applied — 10% off your order.';
  } else {
    promoApplied.value = false;
    promoMessage.value = promo.value.trim() ? 'That code is not valid.' : 'Enter a promo code first.';
  }
};

const subtotal = computed(() => cart.value.reduce((sum, i) => sum + i.price * i.qty, 0));
const discount = computed(() => (promoApplied.value ? subtotal.value * 0.1 : 0));
const shipping = computed(() => (subtotal.value - discount.value >= 100 ? 0 : 6.95));
const total = computed(() => subtotal.value - discount.value + shipping.value);
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

.heading {
  font-size: 22;
  font-weight: bold;
  color: var(--text);
}

.cart {
  display: flex;
  flex-direction: column;
  gap: 10;
}

.line-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
  background-color: var(--surface);
  border-radius: 12;
  padding: 12;
  box-shadow: 0 2px 8px var(--shadow);
}

.thumb {
  width: 52;
  height: 52;
  border-radius: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-glyph {
  color: #ffffff;
  font-size: 20;
  font-weight: bold;
}

.item-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 3;
}

.item-name {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}

.item-meta {
  font-size: 11;
  color: var(--muted);
}

.stepper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10;
  margin-top: 4;
}

.stepper-button {
  width: 26;
  height: 26;
  border-radius: 13;
  background-color: var(--surface-2);
  color: var(--text);
  font-size: 16;
  border-style: none;
  text-align: center;
}

.qty {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
  min-width: 16;
  text-align: center;
}

.line-total {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}

.promo-row {
  display: flex;
  flex-direction: row;
  gap: 8;
}

.promo-input {
  flex-grow: 1;
  padding: 8 10;
  border: 1 solid var(--border);
  border-radius: 8;
  background-color: var(--surface);
  font-size: 13;
}

.promo-button {
  padding: 8 16;
  border-radius: 8;
  background-color: var(--surface-2);
  color: var(--text);
  font-weight: 600;
  border-style: none;
}

.promo-message {
  font-size: 12;
  color: #00b894;
}

.summary {
  background-color: var(--surface);
  border-radius: 12;
  padding: 14;
  display: flex;
  flex-direction: column;
  gap: 8;
  box-shadow: 0 2px 8px var(--shadow);
}

.summary-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 13;
  color: var(--text-2);
}

.summary-row.discount {
  color: #00b894;
}

.summary-row.total {
  border-top: 1 solid var(--border);
  padding-top: 8;
  font-size: 15;
  font-weight: bold;
  color: var(--text);
}

.place-order {
  background-color: var(--primary);
  color: #ffffff;
  padding: 12 18;
  border-radius: 10;
  font-weight: 600;
  font-size: 14;
  border-style: none;
  text-align: center;
}
</style>
