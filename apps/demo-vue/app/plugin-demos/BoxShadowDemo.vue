<template>
  <Page>
    <ActionBar title="Box Shadow">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">

      <!-- Subtle Shadows -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Elevation Levels</p>
      </div>

      <div class="card-row">
        <div class="card elevation-1">
          <p class="tk-text-2" style="font-size: 12; font-weight: 600">Level 1</p>
          <p class="tk-muted" style="font-size: 10">Subtle</p>
        </div>
        <div class="card elevation-2">
          <p class="tk-text-2" style="font-size: 12; font-weight: 600">Level 2</p>
          <p class="tk-muted" style="font-size: 10">Medium</p>
        </div>
        <div class="card elevation-3">
          <p class="tk-text-2" style="font-size: 12; font-weight: 600">Level 3</p>
          <p class="tk-muted" style="font-size: 10">Elevated</p>
        </div>
      </div>

      <!-- Colored Shadows -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Colored Shadows</p>
      </div>

      <div class="card-row">
        <div class="color-card blue-glow">
          <p style="font-size: 24; font-weight: bold; color: white; text-align: center;">B</p>
        </div>
        <div class="color-card pink-glow">
          <p style="font-size: 24; font-weight: bold; color: white; text-align: center;">P</p>
        </div>
        <div class="color-card green-glow">
          <p style="font-size: 24; font-weight: bold; color: white; text-align: center;">G</p>
        </div>
      </div>

      <!-- Inset Shadows -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Inset Shadows</p>
      </div>

      <div class="card-row">
        <div class="inset-card inset-light">
          <p class="tk-text-2" style="font-size: 11; font-weight: 600; text-align: center">Pressed</p>
        </div>
        <div class="inset-card inset-deep">
          <p class="tk-text-2" style="font-size: 11; font-weight: 600; text-align: center">Recessed</p>
        </div>
        <div class="inset-card inset-well">
          <p class="tk-text-2" style="font-size: 11; font-weight: 600; text-align: center">Well</p>
        </div>
      </div>

      <!-- Neumorphism -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Neumorphism</p>
      </div>

      <div class="tk-surface-2" style="display: flex; flex-direction: row; justify-content: center; gap: 20; padding: 20; border-radius: 12">
        <div class="neu-raised">
          <p style="font-size: 20; text-align: center; color: #6C5CE7;">O</p>
        </div>
        <div class="neu-flat">
          <p style="font-size: 20; text-align: center; color: #FF6B6B;">X</p>
        </div>
        <div class="neu-pressed">
          <p style="font-size: 20; text-align: center; color: #00B894;">V</p>
        </div>
      </div>

      <!-- Layered Shadows -->
      <div class="section-title">
        <p class="tk-text" style="font-size: 22; font-weight: bold">Multi-Layer Shadows</p>
      </div>

      <div style="display: flex; flex-direction: row; justify-content: space-around; padding: 20;">
        <div class="layered-card">
          <p class="tk-text" style="font-size: 13; font-weight: 600; text-align: center">Soft Float</p>
          <p class="tk-muted" style="font-size: 10; text-align: center">3 layers</p>
        </div>
        <div class="sharp-card">
          <p class="tk-text" style="font-size: 13; font-weight: 600; text-align: center">Hard Edge</p>
          <p class="tk-muted" style="font-size: 10; text-align: center">Offset</p>
        </div>
      </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

.section-title {
  margin-top: 16;
  margin-bottom: 10;
}

.card-row {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 8;
}

.card {
  width: 90;
  height: 70;
  background-color: var(--surface);
  border-radius: 10;
  padding: 12;
}

.elevation-1 {
  box-shadow: 0 1px 3px var(--shadow);
}

.elevation-2 {
  box-shadow: 0 4px 12px var(--shadow);
}

.elevation-3 {
  box-shadow: 0 8px 24px var(--shadow-strong);
}

.color-card {
  width: 80;
  height: 80;
  border-radius: 16;
  display: flex;
  align-items: center;
  justify-content: center;
}

.blue-glow {
  background-color: #0984E3;
  box-shadow: 0 6px 20px rgba(9, 132, 227, 0.5);
}

.pink-glow {
  background-color: #E84393;
  box-shadow: 0 6px 20px rgba(232, 67, 147, 0.5);
}

.green-glow {
  background-color: #00B894;
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.5);
}

.inset-card {
  width: 90;
  height: 60;
  border-radius: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inset-light {
  background-color: var(--surface-2);
  box-shadow: inset 0 2px 4px var(--shadow);
}

.inset-deep {
  background-color: var(--surface-2);
  box-shadow: inset 0 4px 8px var(--shadow-strong);
}

.inset-well {
  background-color: var(--surface-2);
  box-shadow: inset 0 2px 6px var(--shadow-strong), inset 0 -2px 4px var(--highlight);
}

.neu-raised {
  width: 64;
  height: 64;
  border-radius: 14;
  background-color: var(--surface-2);
  box-shadow: 6px 6px 12px var(--neu-dark), -6px -6px 12px var(--neu-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.neu-flat {
  width: 64;
  height: 64;
  border-radius: 14;
  background-color: var(--surface-2);
  box-shadow: 3px 3px 6px var(--neu-dark), -3px -3px 6px var(--neu-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.neu-pressed {
  width: 64;
  height: 64;
  border-radius: 14;
  background-color: var(--surface-2);
  box-shadow: inset 4px 4px 8px var(--neu-dark), inset -4px -4px 8px var(--neu-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.layered-card {
  width: 120;
  height: 80;
  background-color: var(--surface);
  border-radius: 12;
  padding: 14;
  box-shadow: 0 2px 4px var(--shadow), 0 4px 8px var(--shadow), 0 8px 24px var(--shadow);
}

.sharp-card {
  width: 120;
  height: 80;
  background-color: var(--surface);
  border-radius: 12;
  padding: 14;
  box-shadow: 5px 5px 0 #2D3436;
}
</style>
