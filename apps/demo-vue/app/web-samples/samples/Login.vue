<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Sign In">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <header class="brand">
          <div class="logo">
            <span class="logo-glyph">M</span>
          </div>
          <h1>Welcome back</h1>
          <p class="subtitle">Sign in to continue to MasonKit</p>
        </header>

        <form class="form" @submit="signIn">
          <label class="field-label" for="email">Email</label>
          <Input id="email" v-model="email" class="field" keyboardType="email" hint="you@example.com" />

          <label class="field-label" for="password">Password</label>
          <Input id="password" v-model="password" class="field" secure="true" hint="Your password" />

          <div class="form-row">
            <div class="remember">
              <Switch v-model="remember" />
              <span class="remember-text">Remember me</span>
            </div>
            <a class="forgot" @tap="notice = 'Password reset link sent (demo).'">Forgot?</a>
          </div>

          <button class="primary-button" @tap="signIn">Sign in</button>
        </form>

        <div class="divider">
          <div class="divider-line" />
          <span class="divider-text">or continue with</span>
          <div class="divider-line" />
        </div>

        <div class="social-row">
          <button class="social-button" @tap="notice = 'Google sign-in (demo).'">G</button>
          <button class="social-button" @tap="notice = 'GitHub sign-in (demo).'">GH</button>
          <button class="social-button" @tap="notice = 'Apple sign-in (demo).'">A</button>
        </div>

        <p class="notice" v-if="notice">{{ notice }}</p>
        <p class="error" v-if="error">{{ error }}</p>

        <footer class="footer">
          <p>New here? <a class="link">Create an account</a></p>
        </footer>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, ref } from 'nativescript-vue';

const email = ref('');
const password = ref('');
const remember = ref(true);
const error = ref('');
const notice = ref('');

const signIn = () => {
  error.value = '';
  notice.value = '';
  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address.';
    return;
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.';
    return;
  }
  notice.value = `Signed in as ${email.value} (demo).`;
};
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

.page-body { padding: 24; }

main {
  display: flex;
  flex-direction: column;
  gap: 16;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6;
  margin-top: 12;
}

.logo {
  width: 60;
  height: 60;
  border-radius: 16;
  background-color: #6c5ce7;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.35);
}

.logo-glyph {
  color: #ffffff;
  font-size: 26;
  font-weight: bold;
}

.brand h1 {
  font-size: 22;
  font-weight: bold;
  color: var(--text);
  margin-top: 8;
}

.subtitle {
  font-size: 13;
  color: var(--muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.field-label {
  font-size: 12;
  font-weight: bold;
  color: var(--text-2);
  margin-top: 4;
}

.field {
  padding: 10 12;
  border: 1 solid var(--border);
  border-radius: 10;
  background-color: var(--bg);
  font-size: 14;
}

.form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 4;
}

.remember {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6;
}

.remember-text {
  font-size: 12;
  color: var(--text-2);
}

.forgot {
  font-size: 12;
  color: var(--primary);
}

.primary-button {
  margin-top: 10;
  background-color: #6c5ce7;
  color: #ffffff;
  padding: 12 18;
  border-radius: 10;
  font-weight: bold;
  font-size: 14;
  border-style: none;
  text-align: center;
}

.divider {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10;
}

.divider-line {
  flex-grow: 1;
  height: 1;
  background-color: var(--surface-2);
}

.divider-text {
  font-size: 11;
  color: var(--muted);
}

.social-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 12;
}

.social-button {
  width: 52;
  height: 44;
  border-radius: 10;
  background-color: var(--surface-2);
  color: var(--text);
  font-weight: bold;
  font-size: 14;
  border: 1 solid #e2e4ec;
  border-style: none;
}

.notice {
  font-size: 12;
  color: #00b894;
  text-align: center;
}

.error {
  font-size: 12;
  color: #ff6b6b;
  text-align: center;
}

.footer {
  align-items: center;
}

.footer p {
  font-size: 12;
  color: var(--muted);
  text-align: center;
}

.link {
  color: var(--primary);
}
</style>
