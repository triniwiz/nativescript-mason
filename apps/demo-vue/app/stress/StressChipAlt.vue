<template>
  <div>
    <span class="chip-text">alt {{ label }}</span>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  label: string;
}>();
</script>
