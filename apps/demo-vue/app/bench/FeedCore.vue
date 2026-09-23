<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="onLoaded">
    <ActionBar title="Feed - core">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <ScrollView class="page">
      <StackLayout class="feed">
        <WrapLayout class="toolbar">
          <nbutton class="tool" text="+20" @tap="append" />
          <nbutton class="tool" text="Prepend" @tap="prepend" />
          <nbutton class="tool" text="Shuffle" @tap="shuffle" />
          <nbutton class="tool" text="Retitle" @tap="retitle(Date.now() % 100)" />
          <nbutton class="tool" text="Clear" @tap="clear" />
          <nbutton class="tool" text="Refill" @tap="refill" />
        </WrapLayout>
        <nlabel class="count" :text="`${items.length} rows`" />

        <GridLayout v-for="item in items" :key="item.id" class="row" columns="40, *, auto" rows="auto">
          <GridLayout col="0" class="avatar" verticalAlignment="middle" :backgroundColor="item.color">
            <nlabel class="avatar-text" :text="item.id % 100" />
          </GridLayout>
          <StackLayout col="1" class="body">
            <nlabel class="title" :text="item.title" />
            <nlabel class="subtitle" :text="item.subtitle" textWrap="true" />
          </StackLayout>
          <GridLayout col="2" class="badge" verticalAlignment="middle">
            <nlabel class="badge-text" :text="item.badge" />
          </GridLayout>
        </GridLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
import { useFeed } from './scenarios';

const props = defineProps<{ auto?: boolean }>();
const { items, onLoaded, append, prepend, shuffle, retitle, clear, refill } = useFeed('core', props);
</script>

<style scoped>
.feed {
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

.row {
  padding: 10;
  margin-bottom: 8;
  background-color: var(--surface);
  border-radius: 10;
  vertical-alignment: middle;
}

.avatar {
  width: 40;
  height: 40;
  border-radius: 20;
  vertical-alignment: middle;
}

.avatar-text {
  font-size: 13;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  vertical-alignment: middle;
}

.body {
  margin-left: 10;
  margin-right: 10;
  vertical-alignment: middle;
}

.title {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 2;
}

.subtitle {
  font-size: 12;
  color: var(--muted);
}

.badge {
  padding: 3 8;
  border-radius: 10;
  background-color: var(--primary-soft);
  vertical-alignment: middle;
}

.badge-text {
  font-size: 11;
  color: var(--primary);
}
</style>
