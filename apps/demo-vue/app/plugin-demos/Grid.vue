<template>
    <Page>
        <ActionBar title="Grid">
        </ActionBar>

        <div backgroundColor="lightgray" height="100%" width="100%">
            <div class="parent">
                <div class="div1"> </div>
                <div class="div2"> </div>
                <div class="div3"> </div>
                <div class="div4"> </div>
                <div class="div5"> </div>
            </div>
        </div>
    </Page>
</template>

<script lang="ts" setup>
import { ref } from "nativescript-vue";
import { DemoSharedNativescriptMasonkit } from '@demo/shared';
import { } from '@triniwiz/nativescript-masonkit';

const message = ref("Test nativescript-masonkit");
</script>

<style scoped>
.parent {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(5, 1fr);
    grid-column-gap: 0px;
    grid-row-gap: 0px;
}

.div1 {
    grid-area: 1 / 1 / 2 / 2;
    background-color: red;
}

.div2 {
    grid-area: 2 / 2 / 3 / 3;
    background-color: blue;
}

.div3 {
    grid-area: 3 / 3 / 4 / 4;
    background-color: white;
}

.div4 {
    grid-area: 4 / 4 / 5 / 5;
    background-color: yellow;
}

.div5 {
    grid-area: 5 / 5 / 6 / 6;
    background-color: black;
}
</style>
