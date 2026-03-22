<template>
  <Page>
    <ActionBar>
      <Label text="Spacing &amp; Sizing" class="text-white" style="font-size: 18; font-weight: bold;" />
    </ActionBar>
    <div class="page">

      <!-- Padding -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Padding</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6;">
        <div style="background-color: #74B9FF; padding: 4; border-radius: 8;">
          <div class="inner-box">
            <p class="inner-text">padding: 4</p>
          </div>
        </div>
        <div style="background-color: #74B9FF; padding: 12; border-radius: 8;">
          <div class="inner-box">
            <p class="inner-text">padding: 12</p>
          </div>
        </div>
        <div style="background-color: #74B9FF; padding: 24; border-radius: 8;">
          <div class="inner-box">
            <p class="inner-text">padding: 24</p>
          </div>
        </div>
      </div>

      <!-- Margin -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Margin</p>
      </div>

      <div style="background-color: #f0f0f5; border-radius: 8; padding: 2;">
        <div style="background-color: #FF6B6B; height: 32; border-radius: 6; margin: 4;">
          <p class="margin-text">margin: 4</p>
        </div>
        <div style="background-color: #E84393; height: 32; border-radius: 6; margin: 12;">
          <p class="margin-text">margin: 12</p>
        </div>
        <div style="background-color: #6C5CE7; height: 32; border-radius: 6; margin: 20;">
          <p class="margin-text">margin: 20</p>
        </div>
      </div>

      <!-- Border Radius -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Border Radius</p>
      </div>

      <div style="display: flex; flex-direction: row; justify-content: space-around; align-items: center; padding: 16;">
        <div style="width: 56; height: 56; background-color: #0984E3; border-radius: 0;">
          <p class="radius-text">0</p>
        </div>
        <div style="width: 56; height: 56; background-color: #0984E3; border-radius: 8;">
          <p class="radius-text">8</p>
        </div>
        <div style="width: 56; height: 56; background-color: #0984E3; border-radius: 16;">
          <p class="radius-text">16</p>
        </div>
        <div style="width: 56; height: 56; background-color: #0984E3; border-radius: 28;">
          <p class="radius-text">28</p>
        </div>
      </div>

      <!-- Sizing -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Width &amp; Height</p>
      </div>

      <div style="display: flex; flex-direction: row; gap: 8; align-items: flex-end; padding: 8; background-color: #f0f0f5; border-radius: 8; height: 140;">
        <div style="width: 40; height: 40; background-color: #00B894; border-radius: 6;">
          <p style="font-size: 9; color: white; text-align: center;">40</p>
        </div>
        <div style="width: 50; height: 60; background-color: #00B894; border-radius: 6;">
          <p style="font-size: 9; color: white; text-align: center;">60</p>
        </div>
        <div style="width: 50; height: 80; background-color: #00B894; border-radius: 6;">
          <p style="font-size: 9; color: white; text-align: center;">80</p>
        </div>
        <div style="width: 50; height: 100; background-color: #00B894; border-radius: 6;">
          <p style="font-size: 9; color: white; text-align: center;">100</p>
        </div>
        <div style="width: 50; height: 120; background-color: #00B894; border-radius: 6;">
          <p style="font-size: 9; color: white; text-align: center;">120</p>
        </div>
      </div>

      <!-- Percentage Sizing -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Percentage Width</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4; background-color: #f0f0f5; padding: 8; border-radius: 8;">
        <div style="width: 25%; height: 28; background-color: #FDCB6E; border-radius: 4;">
          <p style="font-size: 10; color: #333; padding-left: 4;">25%</p>
        </div>
        <div style="width: 50%; height: 28; background-color: #E17055; border-radius: 4;">
          <p style="font-size: 10; color: white; padding-left: 4;">50%</p>
        </div>
        <div style="width: 75%; height: 28; background-color: #D63031; border-radius: 4;">
          <p style="font-size: 10; color: white; padding-left: 4;">75%</p>
        </div>
        <div style="width: 100%; height: 28; background-color: #636E72; border-radius: 4;">
          <p style="font-size: 10; color: white; padding-left: 4;">100%</p>
        </div>
      </div>

      <!-- Gap -->
      <div class="section-title">
        <p style="font-size: 22; font-weight: bold; color: #1a1a2e;">Gap</p>
      </div>

      <div style="display: flex; flex-direction: row; gap: 2; margin-bottom: 6;">
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <p style="font-size: 10; color: #888; margin-left: 6;">gap: 2</p>
      </div>

      <div style="display: flex; flex-direction: row; gap: 8; margin-bottom: 6;">
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <p style="font-size: 10; color: #888; margin-left: 6;">gap: 8</p>
      </div>

      <div style="display: flex; flex-direction: row; gap: 16;">
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <div class="gap-item purple"></div>
        <p style="font-size: 10; color: #888; margin-left: 6;">gap: 16</p>
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
  margin-bottom: 8;
}

.inner-box {
  background-color: white;
  border-radius: 6;
  padding: 6;
}

.inner-text {
  font-size: 12;
  color: #333;
  text-align: center;
}

.margin-text {
  font-size: 12;
  color: white;
  text-align: center;
  font-weight: 600;
}

.radius-text {
  font-size: 14;
  color: white;
  text-align: center;
  font-weight: bold;
}

.gap-item {
  width: 30;
  height: 30;
  border-radius: 4;
}

.purple { background-color: #6C5CE7; }
</style>
