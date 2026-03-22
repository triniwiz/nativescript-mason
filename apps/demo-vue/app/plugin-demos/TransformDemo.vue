<template>
  <Page>
    <ActionBar>
      <Label text="CSS Transforms" class="text-white" style="font-size: 18; font-weight: bold;" />
    </ActionBar>
    <div class="page">

      <!-- Rotate -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Rotate</p>
      </div>

      <div class="demo-row">
        <div class="transform-card" style="background-color: #FF6B6B; transform: rotate(0deg);">
          <p class="card-text">0</p>
        </div>
        <div class="transform-card" style="background-color: #E84393; transform: rotate(15deg);">
          <p class="card-text">15</p>
        </div>
        <div class="transform-card" style="background-color: #6C5CE7; transform: rotate(45deg);">
          <p class="card-text">45</p>
        </div>
        <div class="transform-card" style="background-color: #0984E3; transform: rotate(90deg);">
          <p class="card-text">90</p>
        </div>
        <div class="transform-card" style="background-color: #00B894; transform: rotate(180deg);">
          <p class="card-text">180</p>
        </div>
      </div>

      <!-- Scale -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Scale</p>
      </div>

      <div class="demo-row-spaced">
        <div class="scale-wrapper">
          <div class="transform-card-sm" style="background-color: #FDCB6E; transform: scale(0.5, 0.5);">
            <p class="card-text-sm">0.5</p>
          </div>
        </div>
        <div class="scale-wrapper">
          <div class="transform-card-sm" style="background-color: #E17055; transform: scale(0.75, 0.75);">
            <p class="card-text-sm">0.75</p>
          </div>
        </div>
        <div class="scale-wrapper">
          <div class="transform-card-sm" style="background-color: #D63031; transform: scale(1.0, 1.0);">
            <p class="card-text-sm">1.0</p>
          </div>
        </div>
        <div class="scale-wrapper">
          <div class="transform-card-sm" style="background-color: #E84393; transform: scale(1.25, 1.25);">
            <p class="card-text-sm">1.25</p>
          </div>
        </div>
      </div>

      <!-- Translate -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Translate</p>
      </div>

      <div style="display: flex; flex-direction: row; gap: 40; padding: 20; background-color: #f0f0f5; border-radius: 12; height: 100;">
        <div class="translate-box" style="background-color: #74B9FF;">
          <p class="card-text-sm">origin</p>
        </div>
        <div class="translate-box" style="background-color: #A29BFE; transform: translateX(10);">
          <p class="card-text-sm">X+10</p>
        </div>
        <div class="translate-box" style="background-color: #FF7675; transform: translateY(20);">
          <p class="card-text-sm">Y+20</p>
        </div>
        <div class="translate-box" style="background-color: #55EFC4; transform: translate(10, 10);">
          <p class="card-text-sm">XY</p>
        </div>
      </div>

      <!-- Skew -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Skew</p>
      </div>

      <div class="demo-row-spaced">
        <div class="skew-wrapper">
          <div class="transform-card-sm" style="background-color: #00CEC9; transform: skewX(0deg);">
            <p class="card-text-sm">0</p>
          </div>
        </div>
        <div class="skew-wrapper">
          <div class="transform-card-sm" style="background-color: #0984E3; transform: skewX(10deg);">
            <p class="card-text-sm">X 10</p>
          </div>
        </div>
        <div class="skew-wrapper">
          <div class="transform-card-sm" style="background-color: #6C5CE7; transform: skewX(20deg);">
            <p class="card-text-sm">X 20</p>
          </div>
        </div>
        <div class="skew-wrapper">
          <div class="transform-card-sm" style="background-color: #E84393; transform: skewY(15deg);">
            <p class="card-text-sm">Y 15</p>
          </div>
        </div>
      </div>

      <!-- Combined -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Combined Transforms</p>
      </div>

      <div class="demo-row-spaced" style="height: 100;">
        <div class="combo-wrapper">
          <div class="transform-card-sm" style="background-color: #FF6B6B; transform: rotate(30deg) scale(1.2, 1.2);">
            <p class="card-text-sm" style="font-size: 8;">rot+scl</p>
          </div>
        </div>
        <div class="combo-wrapper">
          <div class="transform-card-sm" style="background-color: #6C5CE7; transform: skewX(15deg) rotate(10deg);">
            <p class="card-text-sm" style="font-size: 8;">skw+rot</p>
          </div>
        </div>
        <div class="combo-wrapper">
          <div class="transform-card-sm" style="background-color: #00B894; transform: scale(0.8, 0.8) rotate(-20deg);">
            <p class="card-text-sm" style="font-size: 8;">scl+rot</p>
          </div>
        </div>
        <div class="combo-wrapper">
          <div class="transform-card-sm" style="background-color: #FDCB6E; transform: rotate(45deg) scale(0.7, 0.7);">
            <p class="card-text-sm" style="font-size: 8;">45+0.7</p>
          </div>
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
  overflow-y: scroll;
}

.section-title {
  margin-top: 16;
  margin-bottom: 10;
}

.demo-row {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 16;
  background-color: #f0f0f5;
  border-radius: 12;
  height: 80;
}

.demo-row-spaced {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 16;
  background-color: #f0f0f5;
  border-radius: 12;
  height: 90;
}

.transform-card {
  width: 44;
  height: 44;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transform-card-sm {
  width: 44;
  height: 44;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scale-wrapper {
  width: 60;
  height: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skew-wrapper {
  width: 60;
  height: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.combo-wrapper {
  width: 60;
  height: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.translate-box {
  width: 50;
  height: 50;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-text {
  color: white;
  font-weight: bold;
  font-size: 14;
  text-align: center;
}

.card-text-sm {
  color: white;
  font-weight: bold;
  font-size: 11;
  text-align: center;
}
</style>
