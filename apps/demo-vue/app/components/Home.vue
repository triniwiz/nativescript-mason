<template>
  <Frame>
    <Page>
      <ActionBar>
        <Label text="Home?" />
      </ActionBar>
      <!-- <div style="background-color: red;">
        <p style="color: yellow;font-weight: bold;">Test nativescript-masonkit
          <sspan style="color: blue;"> inline text</sspan>
          Hello World!
        </p>
        <p style="color: white; font-style: italic;">Paragraph with image <img width="200" height="200" src="https://picsum.photos/200/300" /></p>
        <img width="300" height="300" src="https://picsum.photos/200/300" />
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

const viewDemo = (args) => {
  const label = args.object;
  console.log(`Tapped on label: ${label.text}`);
  $navigateTo(NativescriptMasonkit);
}
</script>

<style scoped lang="css">
.info {
  font-size: 20;
  horizontal-align: center;
  vertical-align: center;
}

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
  font-size: 15px;

}

.a {
  grid-column: 1 / 3;
  grid-row: 1;
}

.b {
  grid-column: 3;
  grid-row: 1 / 3;
}

.c {
  grid-column: 1;
  grid-row: 2;
}

.d {
  grid-column: 2;
  grid-row: 2;
}
</style>
