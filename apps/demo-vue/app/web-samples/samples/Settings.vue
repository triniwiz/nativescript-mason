<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Settings">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="settings-group">
          <h2>Account</h2>
          <div class="settings-row">
            <div class="row-body">
              <p class="row-title">Display name</p>
              <p class="row-desc">Shown on your public profile</p>
            </div>
            <Input v-model="profile.name" class="row-input" />
          </div>
          <div class="settings-row">
            <div class="row-body">
              <p class="row-title">Email</p>
              <p class="row-desc">Used for sign-in and receipts</p>
            </div>
            <Input v-model="profile.email" class="row-input" keyboardType="email" />
          </div>
        </section>

        <section class="settings-group">
          <h2>Preferences</h2>
          <div class="settings-row">
            <div class="row-body">
              <p class="row-title">Dark mode</p>
              <p class="row-desc">Easier on the eyes at night</p>
            </div>
            <Switch v-model="prefs.darkMode" />
          </div>
          <div class="settings-row">
            <div class="row-body">
              <p class="row-title">Push notifications</p>
              <p class="row-desc">Mentions, replies, and digests</p>
            </div>
            <Switch v-model="prefs.notifications" />
          </div>
          <div class="settings-row">
            <div class="row-body">
              <p class="row-title">Compact layout</p>
              <p class="row-desc">Denser lists, smaller cards</p>
            </div>
            <Switch v-model="prefs.compact" />
          </div>
        </section>

        <section class="settings-group">
          <h2>About</h2>
          <div class="settings-row">
            <div class="row-body">
              <p class="row-title">Version</p>
              <p class="row-desc">MasonKit demo build</p>
            </div>
            <p class="row-value">2.4.1</p>
          </div>
          <div class="settings-row">
            <div class="row-body">
              <p class="row-title">Reset demo data</p>
              <p class="row-desc">Restore all preferences</p>
            </div>
            <button class="reset-button" @tap="reset">Reset</button>
          </div>
        </section>

        <p class="saved-note" v-if="savedNote">{{ savedNote }}</p>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, reactive, ref } from 'nativescript-vue';

const profile = reactive({ name: 'Amelia Reyes', email: 'amelia@example.com' });

const defaults = { darkMode: true, notifications: true, compact: false };
const prefs = reactive({ ...defaults });

const savedNote = ref('');

const reset = () => {
  Object.assign(prefs, defaults);
  savedNote.value = 'Preferences restored to defaults.';
  setTimeout(() => (savedNote.value = ''), 2000);
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

.settings-group {
  background-color: var(--surface);
  border-radius: 12;
  padding: 14;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px var(--shadow);
}

.settings-group h2 {
  font-size: 12;
  font-weight: bold;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 8;
}

.settings-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
  padding-top: 10;
  padding-bottom: 10;
  border-bottom: 1 solid var(--border);
}

.settings-row:last-child {
  border-bottom-width: 0;
}

.row-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 2;
}

.row-title {
  font-size: 14;
  color: var(--text);
}

.row-desc {
  font-size: 11;
  color: var(--muted);
}

.row-input {
  width: 140;
  padding: 6 8;
  border: 1 solid var(--border);
  border-radius: 8;
  background-color: var(--bg);
  font-size: 13;
}

.row-value {
  font-size: 13;
  color: var(--muted);
}

.reset-button {
  background-color: #ff6b6b;
  color: #ffffff;
  padding: 7 14;
  border-radius: 8;
  font-size: 12;
  font-weight: 600;
  border-style: none;
}

.saved-note {
  font-size: 12;
  color: #00b894;
  text-align: center;
}
</style>
