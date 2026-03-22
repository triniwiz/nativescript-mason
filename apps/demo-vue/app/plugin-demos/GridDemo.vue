<template>
  <Page>
    <ActionBar>
      <Label text="Grid Layout" class="text-white" style="font-size: 18; font-weight: bold;" />
    </ActionBar>
    <div style="padding: 16;overflow-y: scroll;">

      <!-- Basic Grid -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 4;">Basic Grid</p>
      <p style="font-size: 12; color: #888; margin-bottom: 8;">3 columns, auto rows</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4; margin-bottom: 20;">
        <div style="background-color: #00B894; border-radius: 6; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold;">1</p>
        </div>
        <div style="background-color: #E17055; border-radius: 6; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold;">2</p>
        </div>
        <div style="background-color: #74B9FF; border-radius: 6; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold;">3</p>
        </div>
        <div style="background-color: #A29BFE; border-radius: 6; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold;">4</p>
        </div>
        <div style="background-color: #FDCB6E; border-radius: 6; height: 56; padding: 8;">
          <p style="color: #333; font-weight: bold;">5</p>
        </div>
        <div style="background-color: #FF6B6B; border-radius: 6; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold;">6</p>
        </div>
      </div>

      <!-- Grid with Gap -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 4;">Grid Gap</p>
      <p style="font-size: 12; color: #888; margin-bottom: 8;">12px gap between cells</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12; margin-bottom: 20;">
        <div style="background-color: #FF6B6B; border-radius: 10; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">A</p>
        </div>
        <div style="background-color: #4ECDC4; border-radius: 10; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">B</p>
        </div>
        <div style="background-color: #FFD93D; border-radius: 10; height: 56; padding: 8;">
          <p style="color: #333; font-weight: bold; text-align: center;">C</p>
        </div>
        <div style="background-color: #6C5CE7; border-radius: 10; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">D</p>
        </div>
        <div style="background-color: #E17055; border-radius: 10; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">E</p>
        </div>
        <div style="background-color: #00B894; border-radius: 10; height: 56; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">F</p>
        </div>
      </div>

      <!-- Named Grid Areas -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 4;">Grid Areas</p>
      <p style="font-size: 12; color: #888; margin-bottom: 8;">Dashboard-style layout</p>

      <div class="dashboard">
        <div class="dash-header">
          <p style="color: white; font-weight: bold; font-size: 14; text-align: center;">Header</p>
        </div>
        <div class="dash-sidebar">
          <p style="color: white; font-weight: bold; font-size: 12; text-align: center;">Nav</p>
        </div>
        <div class="dash-main">
          <p style="color: white; font-weight: bold; font-size: 14; text-align: center;">Main Content</p>
        </div>
        <div class="dash-footer">
          <p style="color: white; font-weight: bold; font-size: 12; text-align: center;">Footer</p>
        </div>
      </div>

      <!-- Spanning Cells -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-top: 20; margin-bottom: 4;">Column Span</p>
      <p style="font-size: 12; color: #888; margin-bottom: 8;">Items spanning multiple columns</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6; margin-bottom: 20;">
        <div style="grid-column: 1 / 3; background-color: #0984E3; border-radius: 8; height: 50; padding: 8;">
          <p style="color: white; font-weight: bold; font-size: 12; text-align: center;">Spans 2 columns</p>
        </div>
        <div style="background-color: #A29BFE; border-radius: 8; height: 50; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">1</p>
        </div>
        <div style="background-color: #FF6B6B; border-radius: 8; height: 50; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">2</p>
        </div>
        <div style="grid-column: 2 / 4; background-color: #00B894; border-radius: 8; height: 50; padding: 8;">
          <p style="color: white; font-weight: bold; font-size: 12; text-align: center;">Spans 2 columns</p>
        </div>
      </div>

      <!-- Mixed Sizing -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 4;">Mixed Sizing</p>
      <p style="font-size: 12; color: #888; margin-bottom: 8;">Fixed + fractional units</p>

      <div style="display: grid; grid-template-columns: 80px 1fr 2fr; gap: 6;">
        <div style="background-color: #FF6B6B; border-radius: 6; height: 48; padding: 8;">
          <p style="color: white; font-size: 11; text-align: center;">80px</p>
        </div>
        <div style="background-color: #4ECDC4; border-radius: 6; height: 48; padding: 8;">
          <p style="color: white; font-size: 11; text-align: center;">1fr</p>
        </div>
        <div style="background-color: #FFD93D; border-radius: 6; height: 48; padding: 8;">
          <p style="color: #333; font-size: 11; text-align: center;">2fr</p>
        </div>
      </div>

    </div>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 90px 1fr;
  grid-template-rows: 50px 1fr 36px;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  gap: 6;
  height: 200;
  border-radius: 8;
}

.dash-header {
  grid-area: header;
  background-color: #2D3436;
  border-radius: 8;
}

.dash-sidebar {
  grid-area: sidebar;
  background-color: #636E72;
  border-radius: 8;
}

.dash-main {
  grid-area: main;
  background-color: #0984E3;
  border-radius: 8;
}

.dash-footer {
  grid-area: footer;
  background-color: #2D3436;
  border-radius: 8;
}
</style>
