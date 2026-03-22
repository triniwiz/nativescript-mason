<template>
  <Frame>
    <Page>
      <ActionBar>
        <Label text="Mason Demos" class="text-white" style="font-size: 20; font-weight: bold;" />
      </ActionBar>
      <div class="page">

        <!-- Hero -->
        <div class="hero">
          <p style="font-size: 28; font-weight: bold; color: white;">NativeScript Mason</p>
          <p style="font-size: 14; color: rgba(255,255,255,0.75); margin-top: 4;">CSS Layout Engine</p>
        </div>

        <!-- Demo Grid -->
        <div class="demo-grid">

          <div class="demo-card" @tap="navigate('flexbox')">
            <div class="icon-circle" style="background-color: #FF6B6B;">
              <p class="icon-text">F</p>
            </div>
            <p class="card-title">Flexbox</p>
            <p class="card-desc">Direction, wrap, alignment</p>
          </div>

          <div class="demo-card" @tap="navigate('grid')">
            <div class="icon-circle" style="background-color: #00B894;">
              <p class="icon-text">G</p>
            </div>
            <p class="card-title">Grid</p>
            <p class="card-desc">Templates, areas, spans</p>
          </div>

          <div class="demo-card" @tap="navigate('shadows')">
            <div class="icon-circle" style="background-color: #6C5CE7;">
              <p class="icon-text">S</p>
            </div>
            <p class="card-title">Shadows</p>
            <p class="card-desc">Box shadow, inset, glow</p>
          </div>

          <div class="demo-card" @tap="navigate('transforms')">
            <div class="icon-circle" style="background-color: #0984E3;">
              <p class="icon-text">T</p>
            </div>
            <p class="card-title">Transforms</p>
            <p class="card-desc">Rotate, scale, skew</p>
          </div>

          <div class="demo-card" @tap="navigate('typography')">
            <div class="icon-circle" style="background-color: #E84393;">
              <p class="icon-text">A</p>
            </div>
            <p class="card-title">Typography</p>
            <p class="card-desc">Fonts, weights, styles</p>
          </div>

          <div class="demo-card" @tap="navigate('spacing')">
            <div class="icon-circle" style="background-color: #FDCB6E;">
              <p class="icon-text">S</p>
            </div>
            <p class="card-title">Spacing</p>
            <p class="card-desc">Padding, margin, sizing</p>
          </div>

          <div class="demo-card" @tap="navigate('showcase')">
            <div class="icon-circle" style="background-color: #2D3436;">
              <p class="icon-text">*</p>
            </div>
            <p class="card-title">Showcase</p>
            <p class="card-desc">Combined feature demo</p>
          </div>

          <div class="demo-card" @tap="navigate('grid-area')">
            <div class="icon-circle" style="background-color: #636E72;">
              <p class="icon-text">A</p>
            </div>
            <p class="card-title">Grid Areas</p>
            <p class="card-desc">Named grid areas</p>
          </div>

        </div>

      </div>
    </Page>
  </Frame>
</template>

<script lang="ts" setup>
import { $navigateTo } from 'nativescript-vue';
import FlexboxDemo from '~/plugin-demos/FlexboxDemo.vue';
import GridDemo from '~/plugin-demos/GridDemo.vue';
import BoxShadowDemo from '~/plugin-demos/BoxShadowDemo.vue';
import TransformDemo from '~/plugin-demos/TransformDemo.vue';
import TypographyDemo from '~/plugin-demos/TypographyDemo.vue';
import SpacingDemo from '~/plugin-demos/SpacingDemo.vue';
import ShowcaseDemo from '~/plugin-demos/ShowcaseDemo.vue';
import GridArea from '~/plugin-demos/Grid-Area.vue';

const navigate = (demo: string) => {
  const demos = {
    flexbox: FlexboxDemo,
    grid: GridDemo,
    shadows: BoxShadowDemo,
    transforms: TransformDemo,
    typography: TypographyDemo,
    spacing: SpacingDemo,
    showcase: ShowcaseDemo,
    'grid-area': GridArea,
  };
  $navigateTo(demos[demo]);
};
</script>

<style scoped>
.page {
  padding: 16;
  background-color: #fafafa;
  overflow-y: scroll;
}

.hero {
  background-color: #1a1a2e;
  border-radius: 16;
  padding: 24;
  margin-bottom: 20;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10;
}

.demo-card {
  background-color: white;
  border-radius: 12;
  padding: 14;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.icon-circle {
  width: 44;
  height: 44;
  border-radius: 22;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-text {
  color: white;
  font-size: 18;
  font-weight: bold;
}

.card-title {
  font-size: 14;
  font-weight: bold;
  color: #1a1a2e;
}

.card-desc {
  font-size: 10;
  color: #888;
  text-align: center;
}
</style>
