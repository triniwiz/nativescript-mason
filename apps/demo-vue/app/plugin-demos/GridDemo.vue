<template>
  <Page>
    <ActionBar title="Grid Layout">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="stack page-body">
        <!-- Basic Grid -->
        <section class="block">
          <span class="h1">Basic Grid</span>
          <span class="muted">3 columns, auto rows</span>
          <div class="grid" style="gap: 4">
            <div v-for="(c, i) in basic" :key="i" class="cell" :class="{ 'cell-dark': c.dark }" :style="{ backgroundColor: c.color }">
              <span class="cell-label">{{ i + 1 }}</span>
            </div>
          </div>
        </section>

        <!-- Grid with Gap -->
        <section class="block">
          <span class="h1">Grid Gap</span>
          <span class="muted">12px gap between cells</span>
          <div class="grid" style="gap: 12">
            <div v-for="c in gap" :key="c.label" class="cell cell-round" :class="{ 'cell-dark': c.dark }" :style="{ backgroundColor: c.color }">
              <span class="cell-label">{{ c.label }}</span>
            </div>
          </div>
        </section>

        <!-- Named Grid Areas -->
        <section class="block">
          <span class="h1">Grid Areas</span>
          <span class="muted">Dashboard-style layout</span>
          <div class="dashboard">
            <div class="cell dash-header"><span class="cell-label">Header</span></div>
            <div class="cell dash-sidebar"><span class="cell-label cell-label-sm">Nav</span></div>
            <div class="cell dash-main"><span class="cell-label">Main Content</span></div>
            <div class="cell dash-footer"><span class="cell-label cell-label-sm">Footer</span></div>
          </div>
        </section>

        <!-- Spanning Cells -->
        <section class="block">
          <span class="h1">Column Span</span>
          <span class="muted">Items spanning multiple columns</span>
          <div class="grid" style="gap: 6">
            <div class="cell cell-sm" style="grid-column: 1 / 3; background-color: #0984e3"><span class="cell-label cell-label-sm">Spans 2 columns</span></div>
            <div class="cell cell-sm" style="background-color: #a29bfe"><span class="cell-label">1</span></div>
            <div class="cell cell-sm" style="background-color: #ff6b6b"><span class="cell-label">2</span></div>
            <div class="cell cell-sm" style="grid-column: 2 / 4; background-color: #00b894"><span class="cell-label cell-label-sm">Spans 2 columns</span></div>
          </div>
        </section>

        <!-- Mixed Sizing -->
        <section class="block">
          <span class="h1">Mixed Sizing</span>
          <span class="muted">Fixed + fractional units</span>
          <div class="grid" style="grid-template-columns: 80 1fr 2fr; gap: 6">
            <div class="cell cell-xs" style="background-color: #ff6b6b"><span class="cell-label cell-label-sm">80</span></div>
            <div class="cell cell-xs" style="background-color: #4ecdc4"><span class="cell-label cell-label-sm">1fr</span></div>
            <div class="cell cell-xs cell-dark" style="background-color: #ffd93d"><span class="cell-label cell-label-sm">2fr</span></div>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
const basic = [
  { color: '#00b894' },
  { color: '#e17055' },
  { color: '#74b9ff' },
  { color: '#a29bfe' },
  { color: '#fdcb6e', dark: true },
  { color: '#ff6b6b' },
];

const gap = [
  { label: 'A', color: '#ff6b6b' },
  { label: 'B', color: '#4ecdc4' },
  { label: 'C', color: '#ffd93d', dark: true },
  { label: 'D', color: '#6c5ce7' },
  { label: 'E', color: '#e17055' },
  { label: 'F', color: '#00b894' },
];
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

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 4;
}

/* Every cell centres its label both ways instead of relying on text-align. */
.cell {
  height: 56;
  border-radius: 6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-round {
  border-radius: 10;
}

.cell-sm {
  height: 50;
  border-radius: 8;
}

.cell-xs {
  height: 48;
}

.cell-label {
  color: #ffffff;
  font-weight: bold;
  font-size: 14;
}

.cell-label-sm {
  font-size: 12;
}

/* Yellow cells keep dark text in both appearances. */
.cell-dark .cell-label {
  color: #1a1a2e;
}

.dashboard {
  display: grid;
  grid-template-columns: 90 1fr;
  grid-template-rows: 50 1fr 36;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  gap: 6;
  height: 200;
  margin-top: 4;
}

.dash-header {
  grid-area: header;
  background-color: #2d3436;
  height: auto;
  border-radius: 8;
}

.dash-sidebar {
  grid-area: sidebar;
  background-color: #636e72;
  height: auto;
  border-radius: 8;
}

.dash-main {
  grid-area: main;
  background-color: #0984e3;
  height: auto;
  border-radius: 8;
}

.dash-footer {
  grid-area: footer;
  background-color: #2d3436;
  height: auto;
  border-radius: 8;
}
</style>
