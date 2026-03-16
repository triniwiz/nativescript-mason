<template>
  <Frame>
    <Page>
      <ActionBar>
        <Label text="Home?" class="text-white bg-gray-800" />
      </ActionBar>
      <!-- <div>
        <input placeholder="Type here..." />
        <input type="button" value="Tapp" />
      </div> -->


      <div class="section">
  <div class="left">1</div>
  <!-- <div class="left">2</div>
  <div class="right">3</div> -->
  <!-- <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tristique
    sapien ac erat tincidunt, sit amet dignissim lectus vulputate. Donec id
    iaculis velit. Aliquam vel malesuada erat. Praesent non magna ac massa
    aliquet tincidunt vel in massa. Phasellus feugiat est vel leo finibus
    congue.
  </p> -->
</div>


      <!-- <div style="margin:12;">
        <h3>Float test</h3>
        <div>
          <div style="float: left; width: 50px; height: 50px; border: 2px solid red; background: pink;"></div>
          <p>
            This paragraph should wrap around the floated box. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.
            Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.
          </p>
        </div>
        <div style="clear: both;"></div>
      </div> -->

        <!--
      <div height="100%">
        <div>
          <h4>This is a Column-Reverse</h4>
          <div id="col-rev" class="content">
            <div class="box red">A</div>
            <div class="box lightblue">B</div>
            <div class="box yellow">C</div>
          </div>
          <h4>This is a Row-Reverse</h4>
          <div id="row-rev" class="content">
            <div class="box red">A</div>
            <div class="box lightblue">B</div>
            <div class="box yellow">C</div>
          </div>
        </div>
      </div>

-->
      <!--
      <div>
        <p>
          top: <img style="vertical-align: top" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          middle: <img style="vertical-align: middle" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          bottom: <img style="vertical-align: bottom" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          super: <img style="vertical-align: super" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          sub: <img style="vertical-align: sub" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
        </p>

        <p>
          text-top: <img style="vertical-align: text-top" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          text-bottom: <img style="vertical-align: text-bottom" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          0.2em: <img style="vertical-align: 0.2em" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          -1em: <img style="vertical-align: -1em" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          20%: <img style="vertical-align: 20%" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
          -100%: <img style="vertical-align: -100%" src="https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png" alt="star" />
        </p>

      </div>
    -->

      <!-- <div>
        <div style="display: inline-block;" class="box" id="one">One</div>
        <div style="display: inline-block; top: 20; left: 20; position: relative;" class="box" id="two">Two</div>
        <div style="display: inline-block;" class="box" id="three">Three</div>
        <div style="display: inline-block;" class="box" id="four">Four</div>
      </div> -->
      <!-- <div> -->

      <!-- <div style="width: 300px; height: 300px;">
      <div style="margin: 10; height: 150px; width: 150px; background: red; border: 1px solid #444444;">
        Hello world
      </div>
      <sbutton style="margin: 10;">Click me</sbutton>
      </div>
      </div> -->


      <!-- left 5% / 15% 60% repeat-x
  url("https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png"); -->


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

<style scoped>
.content {
  width: 200px;
  height: 200px;
  border: 1 solid #c3c3c3;
  display: flex;
}

.box {
  width: 50px;
  height: 50px;
}

#col-rev {
  flex-direction: column-reverse;
}

#row-rev {
  flex-direction: row-reverse;
}

.red {
  background-color: red;
}

.lightblue {
  background-color: lightblue;
}

.yellow {
  background-color: yellow;
}


.section {
  background-color: red;
  box-sizing: border-box;
  border: 1px solid blue;
  width: 100%;
  float: left;
}

div {
  margin: 5px;
  width: 50px;
  height: 150px;
}

.left {
  float: left;
  background: pink;
}

.right {
  float: right;
  background: cyan;
}
</style>