<template>
  <Page>
    <ActionBar title="Flexbox Layout">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body stack">
        <!-- Flex Direction -->
        <section class="block">
          <span class="h1">Flex Direction</span>
          <template v-for="dir in directions" :key="dir">
            <span class="label">{{ dir }}</span>
            <div class="track" :class="{ 'track-tall': dir.startsWith('column') }" :style="{ flexDirection: dir }">
              <div v-for="(c, i) in three" :key="i" class="cell" :class="{ 'cell-dark': c.dark, 'cell-fixed': dir.startsWith('row') }" :style="{ backgroundColor: c.color }">
                <span class="cell-label">{{ i + 1 }}</span>
              </div>
            </div>
          </template>
        </section>

        <!-- Justify Content -->
        <section class="block">
          <span class="h1">Justify Content</span>
          <template v-for="j in justify" :key="j">
            <span class="label">{{ j }}</span>
            <div class="track" :style="{ justifyContent: j, gap: j === 'center' ? 8 : 0 }">
              <div v-for="l in ['A', 'B', 'C']" :key="l" class="cell cell-square" style="background-color: #6c5ce7">
                <span class="cell-label">{{ l }}</span>
              </div>
            </div>
          </template>
        </section>

        <!-- Align Items -->
        <section class="block">
          <span class="h1">Align Items</span>
          <template v-for="a in align" :key="a">
            <span class="label">{{ a }}</span>
            <div class="track track-align" :style="{ alignItems: a }">
              <div v-for="(c, i) in three" :key="i" class="cell cell-narrow" :class="{ 'cell-dark': c.dark }" :style="{ backgroundColor: c.color, height: [30, 50, 40][i] }">
                <span class="cell-label cell-label-sm">{{ [30, 50, 40][i] }}</span>
              </div>
            </div>
          </template>
        </section>

        <!-- Flex Wrap -->
        <section class="block">
          <span class="h1">Flex Wrap</span>
          <span class="label">wrap · 7 items</span>
          <div class="track" style="flex-wrap: wrap; gap: 6">
            <div v-for="(c, i) in wrapColors" :key="i" class="cell cell-wrap" :class="{ 'cell-dark': c.dark }" :style="{ backgroundColor: c.color }">
              <span class="cell-label cell-label-sm">{{ i + 1 }}</span>
            </div>
          </div>
        </section>

        <!-- Flex Grow -->
        <section class="block">
          <span class="h1">Flex Grow</span>
          <span class="label">1 : 2 : 1 ratio</span>
          <div class="track" style="gap: 6">
            <div v-for="(c, i) in three" :key="i" class="cell cell-grow" :class="{ 'cell-dark': c.dark }" :style="{ backgroundColor: c.color, flexGrow: [1, 2, 1][i] }">
              <span class="cell-label">{{ [1, 2, 1][i] }}</span>
            </div>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
const three = [{ color: '#ff6b6b' }, { color: '#4ecdc4' }, { color: '#ffd93d', dark: true }];
const directions = ['row', 'row-reverse', 'column', 'column-reverse'];
const justify = ['space-between', 'space-around', 'center'];
const align = ['flex-start', 'center', 'flex-end'];
const wrapColors = [{ color: '#ff6b6b' }, { color: '#4ecdc4' }, { color: '#ffd93d', dark: true }, { color: '#6c5ce7' }, { color: '#e84393' }, { color: '#00b894' }, { color: '#0984e3' }];
</script>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 24;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 6;
}

.label {
  font-size: 13;
  font-weight: bold;
  color: var(--text-2);
  margin-top: 6;
}

.track {
  display: flex;
  flex-direction: row;
  background-color: var(--surface-2);
  border-radius: 8;
  padding: 8;
}

.track-tall {
  height: 130;
}

.track-align {
  height: 90;
  gap: 8;
}

/* Every cell centres its label both ways instead of relying on text-align. */
.cell {
  height: 50;
  border-radius: 6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-fixed {
  width: 80;
}

.cell-square {
  width: 50;
}

.cell-narrow {
  width: 48;
}

.cell-wrap {
  width: 56;
  height: 44;
}

.cell-grow {
  flex-basis: 0;
}

.cell-label {
  color: #ffffff;
  font-weight: bold;
  font-size: 14;
}

.cell-label-sm {
  font-size: 11;
}

/* Yellow cells keep dark text in both appearances. */
.cell-dark .cell-label {
  color: #1a1a2e;
}
</style>
