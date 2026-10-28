<template>
  <Page>
    <ActionBar title="Inline-block lines">
      <NavigationButton text="Back" v-bind="$backIcon" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <div class="page-body">
        <div v-for="c in cases" :key="c.id" class="case">
          <span class="label">Case {{ c.id }}: box on line {{ c.line }}</span>
          <!-- prettier-ignore -->
          <p :ref="(el) => (paragraphs[c.id] = el)" :style="c.pStyle">{{ c.before }}<code v-if="c.tag === 'code'" :ref="(el) => (boxes[c.id] = el)" :style="c.boxStyle">{{ c.box }}</code><span v-else :ref="(el) => (boxes[c.id] = el)" :style="c.boxStyle">{{ c.box }}</span>{{ c.after }}</p>
          <p style="background-color: #bfdbfe">NEXT PARAGRAPH</p>
        </div>
      </div>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { onMounted } from 'nativescript-vue';

const wrapsLine1 = 'Line one of the paragraph wraps onto a second line here, then ';
const fixedBox = 'display: inline-block; width: 150px; background-color: #fde68a; padding: 1px 4px';
const autoBox = 'display: inline-block; background-color: #fde68a; padding: 1px 4px';
const importText = "import HlmSwitchImports from '.../packages/ui/native/shims/helm-switch'";
const shimSentence = 'Native-only code imports the shim, as the native docs demo does: ';

const cases = [
  { id: 1, line: 1, pStyle: 'line-height: 1.5', before: 'Before text ', tag: 'code', boxStyle: autoBox, box: 'short', after: ' after.' },
  { id: 5, line: 1, pStyle: 'line-height: 1.5', before: 'Before text ', tag: 'code', boxStyle: fixedBox, box: 'this text wraps inside a fixed width box', after: ' after.' },
  { id: 8, line: 1, pStyle: 'line-height: 1.5', before: '', tag: 'code', boxStyle: autoBox, box: importText, after: ' after.' },
  { id: 9, line: 1, pStyle: '', before: '', tag: 'code', boxStyle: autoBox, box: importText, after: ' after, then more text that wraps to a third line.' },
  { id: 7, line: 2, pStyle: 'line-height: 1.5', before: wrapsLine1, tag: 'code', boxStyle: fixedBox, box: 'this text wraps inside a fixed width box', after: ' after.' },
  { id: 4, line: 2, pStyle: 'line-height: 1.5', before: wrapsLine1, tag: 'span', boxStyle: 'display: inline-block; height: 60px; background-color: #fca5a5', box: 'tall', after: ' after.' },
  { id: 2, line: 3, pStyle: 'line-height: 1.5', before: shimSentence, tag: 'code', boxStyle: autoBox, box: importText, after: '' },
  { id: 3, line: 3, pStyle: '', before: shimSentence, tag: 'code', boxStyle: autoBox, box: importText, after: '' },
  { id: 6, line: 3, pStyle: 'line-height: 1.5', before: shimSentence, tag: 'code', boxStyle: 'display: inline; background-color: #fde68a; padding: 1px 4px', box: importText, after: '' },
];

const paragraphs: Record<number, any> = {};
const boxes: Record<number, any> = {};

function windowY(view: any): number {
  const loc = Array.create('int', 2);
  view.getLocationInWindow(loc);
  return loc[1];
}

// The probe reads Android views; the page itself renders anywhere.
onMounted(() => {
  if (!__ANDROID__) return;
  setTimeout(() => {
    const density = android.content.res.Resources.getSystem().getDisplayMetrics().density;
    for (const c of cases) {
      const p = paragraphs[c.id]?.nativeView?.nativeViewProtected;
      const box = boxes[c.id]?.nativeView?.nativeViewProtected;
      if (!p || !box) {
        console.log(`INLINE_REPRO case=${c.id} missing p=${!!p} box=${!!box}`);
        continue;
      }
      const pTop = windowY(p);
      const top = (windowY(box) - pTop) / density;
      const height = box.getHeight() / density;
      const pHeight = p.getHeight() / density;
      const insideP = top + height <= pHeight + 0.5;
      console.log(`INLINE_REPRO case=${c.id} line=${c.line} p.h=${pHeight.toFixed(1)} box.top=${top.toFixed(1)} box.h=${height.toFixed(1)} box.bottom=${(top + height).toFixed(1)} insideP=${insideP}`);
    }
  }, 1500);
});
</script>

<style scoped>
.page-body {
  padding: 16;
}

.case {
  margin-bottom: 12;
}

.label {
  font-size: 12;
  color: #6b7280;
}
</style>
