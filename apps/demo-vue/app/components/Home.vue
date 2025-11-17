<template>
  <Frame>
    <Page>
      <ActionBar>
        <Label text="Home?" class="text-white bg-gray-800" />
      </ActionBar>
      <div>
        <sspan>Welcome to the New Layout!</sspan>
        <p @tap="viewFeature('block')">Block</p>
        <p @tap="viewFeature('flex')">FlexBox</p>
        <p @tap="viewFeature('grid')">CSSGrid</p>
      </div>



      <!-- <div class="wrapper">
        <div class="box a">A</div>
        <div class="box b">B</div>
        <div class="box c">C</div>
        <div class="box d">D</div>
      </div> -->


      <!-- <div class="wrapper">
        <div class="box a">a</div>
        <div class="box b">b</div>
      </div> -->

    </Page>
  </Frame>
</template>

<script lang="ts" setup>
import { $navigateTo } from 'nativescript-vue';
import NativescriptMasonkit from '../plugin-demos/nativescript-masonkit.vue'
import Grid from '~/plugin-demos/Grid.vue';
import { StackLayout } from '@nativescript/core';

const viewDemo = (args) => {
  const label = args.object;
  console.log(`Tapped on label: ${label.text}`);
  $navigateTo(NativescriptMasonkit);
}
const viewFeature = (args) => {
  switch (args) {
    case 'block':
      console.log('Block feature selected');
      break;
    case 'flex':
      console.log('FlexBox feature selected');
      break;
    case 'grid':
      $navigateTo(Grid)
      break;
  }
}
</script>

<style scoped></style>