<template>
  <Page>
    <ActionBar title="Gradients">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body stack">
        <section v-for="section in sections" :key="section.title" class="stack">
          <span class="section-label">{{ section.title }}</span>
          <div v-for="sample in section.samples" :key="sample.cls" class="card sample">
            <div :class="['swatch', sample.cls]" />
            <span class="h2">{{ sample.title }}</span>
            <span class="code">{{ sample.css }}</span>
            <span class="body">{{ sample.note }}</span>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
// Each `css` string must match the class of the same name in <style>, which is
// where the gradient is applied so it goes through the stylesheet path.
const sections = [
  {
    title: 'Stop positions',
    samples: [
      { cls: 'even', title: 'Evenly spread', css: 'red, blue, green', note: 'No positions: the stops sit at 0%, 50% and 100%.' },
      { cls: 'neighbours', title: 'Between neighbours', css: 'red, blue 80%, green, white', note: 'Green has no position, so it lands halfway between blue at 80% and white at 100%.' },
      { cls: 'backwards', title: 'Out of order', css: 'red 50%, blue 20%, green', note: 'Blue asks for 20%, before red. It moves up to 50%, leaving a hard edge.' },
    ],
  },
  {
    title: 'Two-position stops',
    samples: [
      { cls: 'halves', title: 'Hard split', css: 'red 0% 50%, blue 50% 100%', note: 'Each colour holds for its whole range, so the halves meet without blending.' },
      { cls: 'stripes', title: 'Stripes', css: 'red 0 25%, white 25% 50%, blue 50% 75%, black 75%', note: 'Four solid bands from two positions per stop.' },
      { cls: 'progress', title: 'Progress bar', css: '#00b894 0 64%, #dfe6e9 64% 100%', note: 'One gradient draws both the filled and empty track.' },
    ],
  },
  {
    title: 'Showcase',
    samples: [
      { cls: 'sunset', title: 'Sunset', css: '160deg, #fd9644, #fc5c65 45%, #4b0082', note: 'An angled gradient with one positioned stop.' },
      { cls: 'glow', title: 'Radial glow', css: 'circle, #ffeaa7, #fdcb6e 30%, #2d3436', note: 'Radial gradients use the same stop rules.' },
    ],
  },
];
</script>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 12;
}

.sample {
  display: flex;
  flex-direction: column;
  gap: 6;
}

.swatch {
  height: 72;
  border-radius: 10;
  margin-bottom: 4;
}

.code {
  font-family: monospace;
  font-size: 12;
  color: var(--primary);
}

.even {
  background: linear-gradient(to right, red, blue, green);
}
.neighbours {
  background: linear-gradient(to right, red, blue 80%, green, white);
}
.backwards {
  background: linear-gradient(to right, red 50%, blue 20%, green);
}
.halves {
  background: linear-gradient(to right, red 0% 50%, blue 50% 100%);
}
.stripes {
  background: linear-gradient(to right, red 0 25%, white 25% 50%, blue 50% 75%, black 75%);
}
.progress {
  height: 16;
  border-radius: 8;
  background: linear-gradient(to right, #00b894 0 64%, #dfe6e9 64% 100%);
}
.sunset {
  background: linear-gradient(160deg, #fd9644, #fc5c65 45%, #4b0082);
}
.glow {
  background: radial-gradient(circle, #ffeaa7, #fdcb6e 30%, #2d3436);
}
</style>
