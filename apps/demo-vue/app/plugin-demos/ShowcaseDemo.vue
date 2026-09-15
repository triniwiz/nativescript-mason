<template>
  <Page iosOverflowSafeAreaEnabled="false" iosOverflowSafeArea="false">
    <ActionBar title="Showcase">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">

      <!-- Hero Card -->
      <div class="tk-ink"
        style="border-radius: 20; padding: 30; margin-bottom: 20; box-shadow: 0 12px 40px rgba(26, 26, 46, 0.4)">
        <p style="font-size: 32; font-weight: bold; color: white;">Mason</p>
        <p style="font-size: 15; color: rgba(255,255,255,0.7); margin-top: 4;">CSS Layout Engine for NativeScript</p>
        <div style="display: flex; flex-direction: row; gap: 8; margin-top: 16;">
          <div
            style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Flexbox</p>
          </div>
          <div
            style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Grid</p>
          </div>
          <div
            style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Shadows</p>
          </div>
          <div
            style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Transforms</p>
          </div>
        </div>
      </div>

      <!-- Stat Cards Row -->
      <div style="display: flex; flex-direction: row; gap: 10; margin-bottom: 20;">
        <div class="tk-surface"
          style="flex-grow: 1; border-radius: 14; padding: 16; box-shadow: 0 4px 16px rgba(9, 132, 227, 0.15)">
          <p style="font-size: 28; font-weight: bold; color: #0984E3;">184</p>
          <p class="tk-muted" style="font-size: 11; margin-top: 2">CSS Properties</p>
        </div>
        <div class="tk-surface"
          style="flex-grow: 1; border-radius: 14; padding: 16; box-shadow: 0 4px 16px rgba(0, 184, 148, 0.15)">
          <p style="font-size: 28; font-weight: bold; color: #00B894;">3</p>
          <p class="tk-muted" style="font-size: 11; margin-top: 2">Platforms</p>
        </div>
        <div class="tk-surface"
          style="flex-grow: 1; border-radius: 14; padding: 16; box-shadow: 0 4px 16px rgba(232, 67, 147, 0.15)">
          <p style="font-size: 28; font-weight: bold; color: #E84393;">Rust</p>
          <p class="tk-muted" style="font-size: 11; margin-top: 2">Powered</p>
        </div>
      </div>

      <!-- Profile Card -->
      <div class="tk-surface"
        style="border-radius: 16; margin-bottom: 20; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12)">
        <!-- Header -->
        <div
          style="display: flex; flex-direction: row; align-items: center; gap: 14; padding: 18; border-bottom: 1 solid rgba(128, 128, 128, 0.3)">
          <div
            style="width: 52; height: 52; border-radius: 26; background-color: #6C5CE7; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);">
            <p style="font-size: 22; color: white; font-weight: bold;">M</p>
          </div>
          <div style="flex-grow: 1;">
            <p class="tk-text" style="font-size: 17; font-weight: bold">Mason Layout Engine</p>
            <p class="tk-muted" style="font-size: 12">Shared-buffer CSS for native apps</p>
          </div>
        </div>
        <!-- Body -->
        <div style="padding: 18;">
          <p class="tk-text-2" style="font-size: 13">
            Full CSS layout support including Flexbox, Grid, Box Shadows, Transforms, Typography, and more. Built on
            Taffy with a high-performance shared-buffer architecture.
          </p>
        </div>
        <!-- Footer Stats -->
        <div
          style="display: flex; flex-direction: row; justify-content: space-around; padding: 14; border-top: 1 solid rgba(128, 128, 128, 0.3)">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #0984E3;">JS</p>
            <p class="tk-muted" style="font-size: 10">TypeScript</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #FF6B6B;">Kt</p>
            <p class="tk-muted" style="font-size: 10">Kotlin</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #E84393;">Sw</p>
            <p class="tk-muted" style="font-size: 10">Swift</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #FFD93D;">Rs</p>
            <p class="tk-muted" style="font-size: 10">Rust</p>
          </div>
        </div>
      </div>

      <!-- Notification Stack -->
      <p class="tk-text" style="font-size: 18; font-weight: bold; margin-bottom: 10">Activity</p>

      <div style="display: flex; flex-direction: column; gap: 8; margin-bottom: 20;">
        <div class="tk-surface"
          style="display: flex; flex-direction: row; align-items: center; gap: 12; border-radius: 12; padding: 14; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); border-left: 4 solid #00B894">
          <div style="flex-grow: 1;">
            <p class="tk-text" style="font-size: 13; font-weight: bold">Build Succeeded</p>
            <p class="tk-muted" style="font-size: 11">All 42 tests passed</p>
          </div>
          <p class="tk-muted" style="font-size: 10">2m ago</p>
        </div>

        <div class="tk-surface"
          style="display: flex; flex-direction: row; align-items: center; gap: 12; border-radius: 12; padding: 14; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); border-left: 4 solid #FDCB6E">
          <div style="flex-grow: 1;">
            <p class="tk-text" style="font-size: 13; font-weight: bold">Layout Recomputed</p>
            <p class="tk-muted" style="font-size: 11">3 dirty nodes invalidated</p>
          </div>
          <p class="tk-muted" style="font-size: 10">5m ago</p>
        </div>

        <div class="tk-surface"
          style="display: flex; flex-direction: row; align-items: center; gap: 12; border-radius: 12; padding: 14; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); border-left: 4 solid #0984E3">
          <div style="flex-grow: 1;">
            <p class="tk-text" style="font-size: 13; font-weight: bold">Style Synced</p>
            <p class="tk-muted" style="font-size: 11">Buffer updated: 560 bytes</p>
          </div>
          <p class="tk-muted" style="font-size: 10">8m ago</p>
        </div>
      </div>

      <!-- Color Palette -->
      <p class="tk-text" style="font-size: 18; font-weight: bold; margin-bottom: 10">Palette</p>

      <div
        style="display: flex; flex-direction: row; height: 64; border-radius: 14; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12)">
        <div style="flex-grow: 1; background-color: #FF6B6B;"></div>
        <div style="flex-grow: 1; background-color: #E84393;"></div>
        <div style="flex-grow: 1; background-color: #6C5CE7;"></div>
        <div style="flex-grow: 1; background-color: #0984E3;"></div>
        <div style="flex-grow: 1; background-color: #00B894;"></div>
        <div style="flex-grow: 1; background-color: #FDCB6E;"></div>
        <div style="flex-grow: 1; background-color: #E17055;"></div>
      </div>

      <!-- Gradient Cards -->
      <p class="tk-text" style="font-size: 18; font-weight: bold; margin-top: 20; margin-bottom: 10">Layered Shadows
      </p>

      <div style="display: flex; flex-direction: row; gap: 12;">
        <div
          style="flex-grow: 1; height: 90; background-color: #6C5CE7; border-radius: 16; padding: 14; box-shadow: 0 6px 20px rgba(108, 92, 231, 0.45);">
          <p style="color: white; font-size: 20; font-weight: bold;">Pro</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 10; margin-top: 4;">Purple glow</p>
        </div>
        <div
          style="flex-grow: 1; height: 90; background-color: #0984E3; border-radius: 16; padding: 14; box-shadow: 0 6px 20px rgba(9, 132, 227, 0.45);">
          <p style="color: white; font-size: 20; font-weight: bold;">Plus</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 10; margin-top: 4;">Blue glow</p>
        </div>
        <div
          style="flex-grow: 1; height: 90; background-color: #00B894; border-radius: 16; padding: 14; box-shadow: 0 6px 20px rgba(0, 184, 148, 0.45);">
          <p style="color: white; font-size: 20; font-weight: bold;">Go</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 10; margin-top: 4;">Green glow</p>
        </div>
      </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped></style>
