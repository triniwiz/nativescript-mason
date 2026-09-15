<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Events">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <nav class="chip-row">
          <button
            v-for="c in categories"
            :key="c"
            class="chip"
            :class="{ active: filter === c }"
            @tap="filter = c"
          >
            {{ c }}
          </button>
        </nav>

        <section class="event-list">
          <article v-for="event in filtered" :key="event.title" class="event-card">
            <div class="date-badge">
              <span class="date-day">{{ event.day }}</span>
              <span class="date-month">{{ event.month }}</span>
            </div>
            <div class="event-body">
              <h3>{{ event.title }}</h3>
              <p class="event-loc">{{ event.location }}</p>
              <div class="event-meta">
                <span class="event-time">{{ event.time }}</span>
                <span class="event-cat">{{ event.category }}</span>
              </div>
            </div>
            <button class="rsvp" :class="{ going: event.going }" @tap="event.going = !event.going">
              {{ event.going ? 'Going ✓' : 'RSVP' }}
            </button>
          </article>
        </section>

        <p v-if="!filtered.length" class="empty">No events in this category.</p>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed, reactive, ref } from 'nativescript-vue';

type EventItem = {
  title: string;
  location: string;
  day: string;
  month: string;
  time: string;
  category: string;
  going: boolean;
};

const categories = ['All', 'Tech', 'Music', 'Food', 'Sport'];

const filter = ref('All');

const events = reactive<EventItem[]>([
  { title: 'NativeScript Meetup', location: 'Hub Lisbon · Rua do Alecrim 12', day: '14', month: 'JUN', time: '18:30', category: 'Tech', going: true },
  { title: 'Jazz in the Park', location: 'Parque Eduardo VII', day: '15', month: 'JUN', time: '20:00', category: 'Music', going: false },
  { title: 'Ramen Night Market', location: 'LX Factory, Hall B', day: '18', month: 'JUN', time: '17:00', category: 'Food', going: false },
  { title: 'Morning 10K Run', location: 'Marginal Promenade', day: '21', month: 'JUN', time: '08:00', category: 'Sport', going: true },
  { title: 'Design Systems Talk', location: 'Marvila Startup Hub', day: '24', month: 'JUN', time: '19:00', category: 'Tech', going: false },
  { title: 'Vinyl Swap Fair', location: 'Galeria Zé dos Bois', day: '28', month: 'JUN', time: '14:00', category: 'Music', going: false },
]);

const filtered = computed(() => (filter.value === 'All' ? events : events.filter((e) => e.category === filter.value)));
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

main {
  display: flex;
  flex-direction: column;
  gap: 12;
}

.chip-row {
  display: flex;
  flex-direction: row;
  gap: 8;
  flex-wrap: wrap;
}

.chip {
  padding: 6 14;
  border-radius: 16;
  background-color: var(--surface);
  color: var(--text-2);
  font-size: 12;
  border: 1 solid #e2e4ec;
  border-style: none;
}

.chip.active {
  background-color: var(--ink);
  color: #ffffff;
  font-weight: bold;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 10;
}

.event-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
  background-color: var(--surface);
  border-radius: 12;
  padding: 12;
  box-shadow: 0 2px 8px var(--shadow);
}

.date-badge {
  width: 52;
  height: 52;
  border-radius: 10;
  background-color: #6c5ce7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.date-day {
  color: #ffffff;
  font-size: 18;
  font-weight: bold;
}

.date-month {
  color: rgba(255, 255, 255, 0.8);
  font-size: 10;
}

.event-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 2;
}

.event-body h3 {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}

.event-loc {
  font-size: 11;
  color: var(--muted);
}

.event-meta {
  display: flex;
  flex-direction: row;
  gap: 8;
  margin-top: 3;
}

.event-time {
  font-size: 11;
  color: var(--text-2);
}

.event-cat {
  font-size: 11;
  color: #6c5ce7;
  font-weight: bold;
}

.rsvp {
  padding: 7 12;
  border-radius: 16;
  background-color: var(--surface-2);
  color: var(--text);
  font-size: 11;
  font-weight: 600;
  border-style: none;
}

.rsvp.going {
  background-color: #00b894;
  color: #ffffff;
}

.empty {
  font-size: 13;
  color: var(--muted);
  text-align: center;
  margin-top: 24;
}
</style>
