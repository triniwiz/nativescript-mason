<template>
  <Frame>
    <Page>
      <ActionBar>
        <Label text="Home?" />
      </ActionBar>
      <!-- <View class="wrapper">
        <View class="box a">
          <Text>A</Text>
          <Text>AA</Text>
        </View>
        <View class="box b">B</View>
        <View class="box c">C</View>
        <View class="box d">D</View>
      </View> -->

      <View>
          <Text>A</Text>
          <Text>AA</Text>
          <Text>AAA</Text>
      </View>
      
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
.wrapper {
  display: grid;
  grid-gap: 10;
  grid-template-columns: 100 100 100;
  background-color: #fff;
  color: #444;
}

.box {
  background-color: #444;
  color: #fff;
  border-radius: 5;
  padding: 20;
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
