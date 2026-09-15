<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Professions">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="list page-body">
        <span class="body">Ten mini dashboards, one per profession — each a different mix of grid, flex and typography.</span>
        <section class="grid">
          <div v-for="p in professions" :key="p.name" class="tile" @tap="$navigateTo(p.page)">
            <div class="tile-icon" :style="{ backgroundColor: p.color }"><span class="nav-icon-text">{{ p.glyph }}</span></div>
            <span class="tile-title">{{ p.name }}</span>
            <span class="nav-desc">{{ p.desc }}</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, $navigateTo } from 'nativescript-vue';
import Designer from '~/web-samples/professions/Designer.vue';
import Developer from '~/web-samples/professions/Developer.vue';
import Photographer from '~/web-samples/professions/Photographer.vue';
import Chef from '~/web-samples/professions/Chef.vue';
import Doctor from '~/web-samples/professions/Doctor.vue';
import Lawyer from '~/web-samples/professions/Lawyer.vue';
import Teacher from '~/web-samples/professions/Teacher.vue';
import Architect from '~/web-samples/professions/Architect.vue';
import Musician from '~/web-samples/professions/Musician.vue';
import Marketer from '~/web-samples/professions/Marketer.vue';

const professions = [
  { name: 'Designer', desc: 'Portfolio', glyph: 'De', color: '#e84393', page: Designer },
  { name: 'Developer', desc: 'Repos', glyph: 'Dv', color: '#6c5ce7', page: Developer },
  { name: 'Photographer', desc: 'Studio', glyph: 'Ph', color: '#0984e3', page: Photographer },
  { name: 'Chef', desc: 'Kitchen', glyph: 'Ch', color: '#e17055', page: Chef },
  { name: 'Doctor', desc: 'Schedule', glyph: 'Dr', color: '#00b894', page: Doctor },
  { name: 'Lawyer', desc: 'Docket', glyph: 'La', color: '#636e72', page: Lawyer },
  { name: 'Teacher', desc: 'Class', glyph: 'Te', color: '#fdcb6e', page: Teacher },
  { name: 'Architect', desc: 'Studio', glyph: 'Ar', color: '#2d3436', page: Architect },
  { name: 'Musician', desc: 'Studio', glyph: 'Mu', color: '#fd79a8', page: Musician },
  { name: 'Marketer', desc: 'Campaigns', glyph: 'Ma', color: '#00cec9', page: Marketer },
];
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 12;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6;
  background-color: var(--surface);
  border-radius: 14;
  padding: 14;
  border-style: none;
  text-align: left;
  box-shadow: 0 2px 10px var(--shadow);
}

.tile:active {
  background-color: var(--surface-2);
}

.tile-icon {
  width: 36;
  height: 36;
  border-radius: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4;
}

.tile-title {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}
</style>
