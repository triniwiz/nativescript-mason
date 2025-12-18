<template>
  <Page>
    <ActionBar title="nativescript-masonkit">
    </ActionBar>

    <GridLayout>
      <Button class="info" :text="message"/>
    </GridLayout>
  </Page>
</template>

<script lang="ts" setup>
  import { ref } from "nativescript-vue";
  import { DemoSharedNativescriptMasonkit } from '@demo/shared';
  import { } from '@triniwiz/nativescript-masonkit';

  const message = ref("Test nativescript-masonkit");
</script>

<style scoped>

  .info {
    font-size: 20;
    horizontal-align: center;
    vertical-align: center;
  }
</style>
