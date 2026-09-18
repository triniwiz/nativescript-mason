<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Pricing">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <header class="header">
          <h1>Choose your plan</h1>
          <p class="subtitle">Start free, upgrade when your team grows.</p>
        </header>

        <div class="billing-toggle">
          <button class="toggle-option" :class="{ active: billing === 'monthly' }" @tap="billing = 'monthly'">Monthly</button>
          <button class="toggle-option" :class="{ active: billing === 'annual' }" @tap="billing = 'annual'">Annual −20%</button>
        </div>

        <section class="tier-grid">
          <article v-for="tier in tiers" :key="tier.name" class="tier-card" :class="{ featured: tier.featured }">
            <p class="tier-name">{{ tier.name }}</p>
            <div class="price-row">
              <span class="price">{{ price(tier) }}</span>
              <span class="per">/ mo</span>
            </div>
            <p class="tier-blurb">{{ tier.blurb }}</p>
            <ul class="feature-list">
              <li v-for="f in tier.features" :key="f">{{ f }}</li>
            </ul>
            <button class="tier-button" :class="{ primary: tier.featured }">{{ tier.featured ? 'Start trial' : 'Choose' }}</button>
          </article>
        </section>

        <footer class="footnote">Prices in USD. Annual billing charged yearly.</footer>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, ref } from 'nativescript-vue';

type Tier = {
  name: string;
  monthly: number;
  blurb: string;
  features: string[];
  featured?: boolean;
};

const billing = ref<'monthly' | 'annual'>('annual');

const tiers: Tier[] = [
  {
    name: 'Starter',
    monthly: 12,
    blurb: 'For side projects and experiments.',
    features: ['3 projects', 'Community support', 'Basic analytics'],
  },
  {
    name: 'Pro',
    monthly: 29,
    blurb: 'For professionals shipping every week.',
    features: ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom domains'],
    featured: true,
  },
  {
    name: 'Team',
    monthly: 79,
    blurb: 'For teams that collaborate at scale.',
    features: ['Everything in Pro', 'SSO & roles', 'Audit log', '99.9% SLA'],
  },
];

const price = (tier: Tier) => (billing.value === 'monthly' ? tier.monthly : Math.round(tier.monthly * 0.8));
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

main {
  display: flex;
  flex-direction: column;
  gap: 16;
}

.header h1 {
  font-size: 24;
  font-weight: bold;
  color: var(--text);
}

.subtitle {
  font-size: 13;
  color: var(--muted);
  margin-top: 4;
}

.billing-toggle {
  display: flex;
  flex-direction: row;
  background-color: var(--surface-2);
  border-radius: 10;
  padding: 4;
  gap: 4;
}

.toggle-option {
  flex-grow: 1;
  padding: 8 12;
  border-radius: 8;
  font-size: 13;
  color: var(--text-2);
  background-color: transparent;
  border-style: none;
  text-align: center;
}

.toggle-option.active {
  background-color: var(--surface);
  color: var(--text);
  font-weight: bold;
  box-shadow: 0 2px 6px var(--shadow);
}

.tier-grid {
  display: flex;
  flex-direction: column;
  gap: 12;
}

.tier-card {
  background-color: var(--surface);
  border-radius: 14;
  padding: 18;
  display: flex;
  flex-direction: column;
  gap: 8;
  border: 2 solid transparent;
  box-shadow: 0 2px 10px var(--shadow);
}

.tier-card.featured {
  border-color: #6c5ce7;
  box-shadow: 0 8px 24px rgba(108, 92, 231, 0.25);
}

.tier-name {
  font-size: 15;
  font-weight: bold;
  color: var(--text);
}

.price-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 4;
}

.price {
  font-size: 30;
  font-weight: bold;
  color: #6c5ce7;
}

.per {
  font-size: 12;
  color: var(--muted);
}

.tier-blurb {
  font-size: 12;
  color: var(--muted);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 5;
  padding-left: 16;
  margin-top: 4;
}

.feature-list li {
  font-size: 13;
  color: var(--text);
}

.tier-button {
  margin-top: 8;
  padding: 10 14;
  border-radius: 10;
  border: 1 solid var(--border);
  background-color: var(--surface);
  color: var(--text);
  font-size: 13;
  font-weight: 600;
}

.tier-button.primary {
  background-color: #6c5ce7;
  border-color: #6c5ce7;
  color: #ffffff;
}

.footnote {
  font-size: 11;
  color: var(--muted);
  text-align: center;
}
</style>
