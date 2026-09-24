<template>
  <Page iosOverflowSafeAreaEnabled="false" actionBarHidden="true">
    <!-- Page > Frame so Home can $navigateTo the bench. Never put a comment at template root level. -->
    <Frame id="benchFrame">
      <BenchHome />
    </Frame>
  </Page>
</template>

<script lang="ts" setup>
import BenchHome from './BenchHome.vue';
</script>
