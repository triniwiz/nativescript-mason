<template>
  <Frame>
    <Page>
      <ActionBar>
        <Label text="Home?" />
      </ActionBar>
      <!-- <div>
        <sspan>Welcome to the New Layout!</sspan>
        <p @tap="viewFeature('block')">Block</p>
        <p @tap="viewFeature('flex')">FlexBox</p>
        <p @tap="viewFeature('grid')">CSSGrid</p>
      </div> -->



      <div class="wrapper">
        <div class="box a">A</div>
        <div class="box b">B</div>
        <div class="box c">C</div>
        <div class="box d">D</div>
      </div>


    </Page>
  </Frame>
</template>

<script lang="ts" setup>
import { $navigateTo } from 'nativescript-vue';
import NativescriptMasonkit from '../plugin-demos/nativescript-masonkit.vue'
import Grid from '~/plugin-demos/Grid.vue';

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

<style scoped>
.wrapper {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: 100px 100px 100px;
    background-color: #fff;
    color: #444;
  }

  .box {
    background-color: #444;
    color: #fff;
    border-radius: 5px;
    padding: 20px;
    font-size: 150%;

  }

  .a {
    grid-column: 1 / 3;
    grid-row: 1;
  }
  .b {
    grid-column: 3 ;
    grid-row: 1 / 3;
  }
  .c {
    grid-column: 1 ;
    grid-row: 2 ;
  }
  .d {
    grid-column: 2;
    grid-row: 2;
  }
</style>