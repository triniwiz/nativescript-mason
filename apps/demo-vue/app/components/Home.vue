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

      <!-- <view style="background-color: green;">
        <text id="1" style="color: red;background-color: blue;">A</text>
        <text id="2" style="color: orange;background-color: pink;">B</text>
        <text id="3" style="color: yellow;background-color: purple;display: block;">C</text>
        <view style="background-color: olive; padding-top: 4;">
          First
          <text id="4" style="color: white;">D</text>
          <img style="height: 100;width: 100;" src="https://picsum.photos/600/600" />
          <text id="5" style="color: white;background-color: lightblue;" text="E"></text>
        </view>
      </view> -->


      <!-- <div>
        <h1>This is a <code>flex-grow</code> example</h1>
        <p>
          A, B, C, and F have <code>flex-grow: 1</code> set. D and E have
          <code>flex-grow: 2</code> set.
        </p>
        <div id="content">
          <div class="box1">A</div>
          <div class="box2">B</div>
          <div class="box3">C</div>
          <div class="box4">D</div>
          <div class="box5">E</div>
          <div class="box6">F</div>
        </div>
      </div> -->


      <!-- <div>
       <div id="content">
        <div class="box1">A</div>
        <div class="box2">B</div>
        <div class="box3">C</div>
        <div class="box4">D</div>
        <div class="box5">E</div>
      </div>
     </div> -->

      <div>
        <h4>This is an example for flex-wrap:wrap</h4>
        <div class="content">
          <div class="red">1</div>
          <div class="green">2</div>
          <div class="blue">3</div>
        </div>
        <h4>This is an example for flex-wrap:nowrap</h4>
        <div class="content1">
          <div class="red">1</div>
          <div class="green">2</div>
          <div class="blue">3</div>
        </div>
        <h4>This is an example for flex-wrap:wrap-reverse</h4>
        <div class="content2">
          <div class="red">1</div>
          <div class="green">2</div>
          <div class="blue">3</div>
        </div>
      </div>

    </Page>
  </Frame>
</template>

<script lang="ts" setup>
import { $navigateTo, Text } from 'nativescript-vue';
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
