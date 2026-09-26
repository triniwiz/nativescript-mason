<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Rich Text - core">
      <NavigationButton text="Back" @tap="$navigateBack()" />
    </ActionBar>
    <ScrollView class="page">
      <StackLayout class="rich">
        <WrapLayout class="toolbar">
          <nbutton class="tool" text="Retext" @tap="retext(Date.now() % 100)" />
          <nbutton class="tool" text="Restyle" @tap="restyle" />
          <nbutton class="tool" text="+10" @tap="append" />
          <nbutton class="tool" :text="narrow ? 'Widen' : 'Narrow'" @tap="toggleNarrow" />
        </WrapLayout>
        <nlabel class="count" :text="`${cards.length} cards · ${spanCount} spans`" />

        <StackLayout class="root" :class="{ narrow }">
          <StackLayout v-for="card in cards" :key="card.id" class="card" :borderColor="card.color">
            <StackLayout class="card-body">
              <nlabel class="title" textWrap="true">
                <FormattedString>
                  <nspan :text="`#${card.id} `" :color="card.color" fontWeight="bold" />
                  <nspan :text="' ' + card.title" fontWeight="bold" />
                </FormattedString>
              </nlabel>
              <nlabel class="para" textWrap="true">
                <FormattedString>
                  <nspan v-for="(r, i) in card.runs" :key="i" :text="r.text" v-bind="spanProps(r)" />
                </FormattedString>
              </nlabel>
              <nlabel class="meta" textWrap="true">
                <FormattedString>
                  <nspan v-for="(r, i) in card.meta" :key="i" :text="r.text" v-bind="spanProps(r)" />
                </FormattedString>
              </nlabel>
            </StackLayout>
          </StackLayout>
        </StackLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, computed } from 'nativescript-vue';
import { useRich } from './scenarios';
import type { SpanRun } from './data';

const props = defineProps<{ auto?: boolean }>();
const { cards, narrow, onLoaded, retext, restyle, append, toggleNarrow } = useRich('core', props);
const spanCount = computed(() => cards.value.reduce((n, c) => n + c.runs.length + c.meta.length + 2, 0));

function spanProps(r: SpanRun): Record<string, string> {
  const p: Record<string, string> = {};
  if (r.bold) p.fontWeight = 'bold';
  if (r.italic) p.fontStyle = 'italic';
  if (r.color) p.color = r.color;
  return p;
}
</script>

<style scoped>
.rich {
  padding: 12;
}

.toolbar {
  margin-bottom: 8;
}

.tool {
  padding: 6 10;
  margin: 0 6 6 0;
  font-size: 12;
  color: var(--on-primary);
  background-color: var(--primary);
  border-radius: 6;
  text-transform: none;
  min-width: 0;
  min-height: 0;
  android-elevation: 0;
}

.count {
  font-size: 11;
  color: var(--muted);
  margin-bottom: 8;
}

.root {
  width: 100%;
  horizontal-alignment: left;
}

.root.narrow {
  width: 60%;
}

.card {
  border-width: 1;
  border-radius: 8;
  margin-bottom: 8;
}

.card-body {
  padding: 10;
}

.title {
  font-size: 15;
  font-weight: bold;
  margin-bottom: 4;
}

.para {
  font-size: 13;
  line-height: 18;
  color: var(--text-2);
  margin-bottom: 4;
}

.meta {
  font-size: 11;
  color: var(--muted);
}
</style>
