<template>
  <Page iosOverflowSafeAreaEnabled="false" actionBarHidden="true">
    <!--
      In-app host for the layout benchmark. The bench UI (BenchHome) needs its
      own Frame to drive scenario-page navigation; wrapping that Frame in a Page
      makes it a valid $navigateTo target from Home (a Frame-rooted component is
      not — core's performNavigation calls onNavigatingTo on it). Scenario
      navigation inside resolves via Frame.topmost(), which is this nested frame
      while it hosts pages. NB: keep the template comment-free at ROOT level —
      a root-level comment makes Vue produce a fragment root and NS-Vue's
      $navigateTo root resolution returns undefined.
    -->
    <Frame id="benchFrame">
      <BenchHome />
    </Frame>
  </Page>
</template>

<script lang="ts" setup>
import BenchHome from './BenchHome.vue';
</script>
