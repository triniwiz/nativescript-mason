<template>
  <Frame>
    <!--
      App-root shell: NS-Vue special-cases a Frame root for the root component,
      which is the ONLY context where a Frame-rooted component is valid — a
      Frame has no onNavigatingTo, so $navigateTo-ing this component directly
      crashes in core's performNavigation. To open the bench from inside the
      app, navigate to BenchPage.vue (Page > Frame > BenchHome) instead.
      Keep this template comment-free at ROOT level: a root-level comment
      makes Vue produce a fragment root and the app's root view resolution
      fails ("Failed to create View with entry.create()").
    -->
    <BenchHome :autoStart="true" />
  </Frame>
</template>

<script lang="ts" setup>
import BenchHome from './BenchHome.vue';
</script>
