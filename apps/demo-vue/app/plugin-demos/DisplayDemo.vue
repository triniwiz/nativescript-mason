<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Display Demo">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <p class="lead">
          Port of <code>apps/display-demo.html</code>. Tap the button to toggle
          <code>display: flex</code> / <code>display: none</code> on the styled box below.
        </p>

        <section class="stage">
          <div v-if="visible" class="demo-box" />
          <p v-else class="hidden-note">Box is hidden — display: none removes it from layout entirely.</p>
        </section>

        <div class="status-row">
          <span class="status-label">computed display</span>
          <code class="status-value">{{ visible ? 'flex' : 'none' }}</code>
        </div>

        <button class="toggle-button" @tap="toggle">{{ visible ? 'Hide' : 'Show' }}</button>

        <section class="notes">
          <h3>What to look for</h3>
          <ul>
            <li>The box keeps its decorations while visible: asymmetric border-radius, dotted left border, dashed top border, and a drop shadow.</li>
            <li>When hidden, the stage collapses — siblings reflow as if the box never existed.</li>
          </ul>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, ref } from 'nativescript-vue';

const visible = ref(true);

const toggle = () => {
  visible.value = !visible.value;
};
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

main {
  display: flex;
  flex-direction: column;
  gap: 14;
}

.lead {
  font-size: 13;
  color: var(--text-2);
}

code {
  font-family: monospace;
  background-color: var(--surface-2);
  border-radius: 4;
  padding: 1 5;
  font-size: 12;
  color: #d63031;
}

.stage {
  background-color: var(--bg);
  border: 1 solid #e0e0e6;
  border-radius: 12;
  padding: 20;
  min-height: 190;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-box {
  display: flex;
  flex-direction: column;
  width: 150;
  height: 150;
  background-color: #ff351a;
  background: linear-gradient(to right, rgb(255, 53, 26), rgb(0, 235, 235));
  border-radius: 0 75 0 0;
  box-shadow: 3 5 5 rgba(0, 0, 0, 0.55);
  border-left: 2 dotted rgb(0, 235, 235);
  border-top: 2 dashed rgb(255, 53, 26);
}

.hidden-note {
  font-size: 12;
  color: var(--muted);
  text-align: center;
}

.status-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8;
}

.status-label {
  font-size: 12;
  color: var(--muted);
}

.status-value {
  font-size: 13;
}

.toggle-button {
  background-color: var(--primary);
  color: #ffffff;
  padding: 12 18;
  border-radius: 10;
  font-weight: 600;
  border-style: none;
  text-align: center;
}

.notes {
  border-top: 1 solid var(--border);
  padding-top: 12;
  display: flex;
  flex-direction: column;
  gap: 6;
}

.notes h3 {
  font-size: 14;
  font-weight: bold;
  color: var(--text);
}

.notes ul {
  display: flex;
  flex-direction: column;
  gap: 4;
  padding-left: 16;
}

.notes li {
  font-size: 12;
  color: var(--text-2);
}
</style>
