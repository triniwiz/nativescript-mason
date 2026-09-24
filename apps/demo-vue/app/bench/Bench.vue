<template>
  <Frame>
    <!-- Only valid as the app root: $navigateTo from inside the app goes to BenchPage. Never put a comment at template root level. -->
    <BenchHome :autoStart="true" />
  </Frame>
</template>

<script lang="ts" setup>
import BenchHome from './BenchHome.vue';
</script>
