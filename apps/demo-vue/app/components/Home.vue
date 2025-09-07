<template>
  <Frame>
    <Page>
      <ActionBar>
        <Label text="Home?" />
      </ActionBar>
      <div backgroundColor="red">
        <p style="color: red;">Test nativescript-masonkit
          <sspan style="color: blue;"> inline text</sspan>
        </p>
        <p style="color: black;background-color: pink;">Paragraph with image <img width="100" height="100" src="https://picsum.photos/200/300" /></p>
        <img width="300" height="300" src="https://picsum.photos/200/300" />
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
</style>
