<template>
  <Page>
    <ActionBar>
      <Label text="Box Shadow" class="text-white" style="font-size: 18; font-weight: bold;" />
    </ActionBar>
    <div class="page">

      <!-- Subtle Shadows -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Elevation Levels</p>
      </div>

      <div class="card-row">
        <div class="card elevation-1">
          <p style="font-size: 12; font-weight: 600; color: #555;">Level 1</p>
          <p style="font-size: 10; color: #999;">Subtle</p>
        </div>
        <div class="card elevation-2">
          <p style="font-size: 12; font-weight: 600; color: #555;">Level 2</p>
          <p style="font-size: 10; color: #999;">Medium</p>
        </div>
        <div class="card elevation-3">
          <p style="font-size: 12; font-weight: 600; color: #555;">Level 3</p>
          <p style="font-size: 10; color: #999;">Elevated</p>
        </div>
      </div>

      <!-- Colored Shadows -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Colored Shadows</p>
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
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Inset Shadows</p>
      </div>

      <div class="card-row">
        <div class="inset-card inset-light">
          <p style="font-size: 11; font-weight: 600; color: #666; text-align: center;">Pressed</p>
        </div>
        <div class="inset-card inset-deep">
          <p style="font-size: 11; font-weight: 600; color: #666; text-align: center;">Recessed</p>
        </div>
        <div class="inset-card inset-well">
          <p style="font-size: 11; font-weight: 600; color: #555; text-align: center;">Well</p>
        </div>
      </div>

      <!-- Neumorphism -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Neumorphism</p>
      </div>

      <div style="display: flex; flex-direction: row; justify-content: center; gap: 20; padding: 20; background-color: #e0e5ec; border-radius: 12;">
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
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Multi-Layer Shadows</p>
      </div>

      <div style="display: flex; flex-direction: row; justify-content: space-around; padding: 20;">
        <div class="layered-card">
          <p style="font-size: 13; font-weight: 600; color: #333; text-align: center;">Soft Float</p>
          <p style="font-size: 10; color: #888; text-align: center;">3 layers</p>
        </div>
        <div class="sharp-card">
          <p style="font-size: 13; font-weight: 600; color: #333; text-align: center;">Hard Edge</p>
          <p style="font-size: 10; color: #888; text-align: center;">Offset</p>
        </div>
      </div>

    </div>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.page {
  padding: 16;
  background-color: #fafafa;
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
  background-color: white;
  border-radius: 10;
  padding: 12;
}

.elevation-1 {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.elevation-2 {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.elevation-3 {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
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
  background-color: #eee;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.inset-deep {
  background-color: #e8e8e8;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.25);
}

.inset-well {
  background-color: #f0f0f0;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.7);
}

.neu-raised {
  width: 64;
  height: 64;
  border-radius: 14;
  background-color: #e0e5ec;
  box-shadow: 6px 6px 12px #b8bec7, -6px -6px 12px #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.neu-flat {
  width: 64;
  height: 64;
  border-radius: 14;
  background-color: #e0e5ec;
  box-shadow: 3px 3px 6px #b8bec7, -3px -3px 6px #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.neu-pressed {
  width: 64;
  height: 64;
  border-radius: 14;
  background-color: #e0e5ec;
  box-shadow: inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layered-card {
  width: 120;
  height: 80;
  background-color: white;
  border-radius: 12;
  padding: 14;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.1);
}

.sharp-card {
  width: 120;
  height: 80;
  background-color: white;
  border-radius: 12;
  padding: 14;
  box-shadow: 5px 5px 0 #2D3436;
}
</style>
