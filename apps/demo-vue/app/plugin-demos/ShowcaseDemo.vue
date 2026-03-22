<template>
  <Page>
    <ActionBar>
      <Label text="Showcase" class="text-white" style="font-size: 18; font-weight: bold;" />
    </ActionBar>
    <div style="padding: 16; background-color: #fafafa;overflow-y: scroll;">

      <!-- Hero Card -->
      <div style="background-color: #1a1a2e; border-radius: 20; padding: 30; margin-bottom: 20; box-shadow: 0 12px 40px rgba(26, 26, 46, 0.4);">
        <p style="font-size: 32; font-weight: bold; color: white;">Mason</p>
        <p style="font-size: 15; color: rgba(255,255,255,0.7); margin-top: 4;">CSS Layout Engine for NativeScript</p>
        <div style="display: flex; flex-direction: row; gap: 8; margin-top: 16;">
          <div style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Flexbox</p>
          </div>
          <div style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Grid</p>
          </div>
          <div style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Shadows</p>
          </div>
          <div style="background-color: rgba(255,255,255,0.15); border-radius: 20; padding-left: 12; padding-right: 12; padding-top: 6; padding-bottom: 6;">
            <p style="color: rgba(255,255,255,0.9); font-size: 11;">Transforms</p>
          </div>
        </div>
      </div>

      <!-- Stat Cards Row -->
      <div style="display: flex; flex-direction: row; gap: 10; margin-bottom: 20;">
        <div style="flex-grow: 1; background-color: white; border-radius: 14; padding: 16; box-shadow: 0 4px 16px rgba(9, 132, 227, 0.15);">
          <p style="font-size: 28; font-weight: bold; color: #0984E3;">184</p>
          <p style="font-size: 11; color: #888; margin-top: 2;">CSS Properties</p>
        </div>
        <div style="flex-grow: 1; background-color: white; border-radius: 14; padding: 16; box-shadow: 0 4px 16px rgba(0, 184, 148, 0.15);">
          <p style="font-size: 28; font-weight: bold; color: #00B894;">3</p>
          <p style="font-size: 11; color: #888; margin-top: 2;">Platforms</p>
        </div>
        <div style="flex-grow: 1; background-color: white; border-radius: 14; padding: 16; box-shadow: 0 4px 16px rgba(232, 67, 147, 0.15);">
          <p style="font-size: 28; font-weight: bold; color: #E84393;">Rust</p>
          <p style="font-size: 11; color: #888; margin-top: 2;">Powered</p>
        </div>
      </div>

      <!-- Profile Card -->
      <div style="background-color: white; border-radius: 16; margin-bottom: 20; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);">
        <!-- Header -->
        <div style="display: flex; flex-direction: row; align-items: center; gap: 14; padding: 18; border-bottom: 1px solid #f0f0f0;">
          <div style="width: 52; height: 52; border-radius: 26; background-color: #6C5CE7; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);">
            <p style="font-size: 22; color: white; font-weight: bold;">M</p>
          </div>
          <div style="flex-grow: 1;">
            <p style="font-size: 17; font-weight: bold; color: #1a1a2e;">Mason Layout Engine</p>
            <p style="font-size: 12; color: #999;">Shared-buffer CSS for native apps</p>
          </div>
        </div>
        <!-- Body -->
        <div style="padding: 18;">
          <p style="font-size: 13; color: #555; line-height: 22;">
            Full CSS layout support including Flexbox, Grid, Box Shadows, Transforms, Typography, and more. Built on Taffy with a high-performance shared-buffer architecture.
          </p>
        </div>
        <!-- Footer Stats -->
        <div style="display: flex; flex-direction: row; justify-content: space-around; padding: 14; border-top: 1px solid #f0f0f0;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #0984E3;">JS</p>
            <p style="font-size: 10; color: #aaa;">TypeScript</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #FF6B6B;">Kt</p>
            <p style="font-size: 10; color: #aaa;">Kotlin</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #E84393;">Sw</p>
            <p style="font-size: 10; color: #aaa;">Swift</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <p style="font-size: 18; font-weight: bold; color: #FFD93D;">Rs</p>
            <p style="font-size: 10; color: #aaa;">Rust</p>
          </div>
        </div>
      </div>

      <!-- Notification Stack -->
      <p style="font-size: 18; font-weight: bold; color: #1a1a2e; margin-bottom: 10;">Activity</p>

      <div style="display: flex; flex-direction: column; gap: 8; margin-bottom: 20;">
        <div style="display: flex; flex-direction: row; align-items: center; gap: 12; background-color: white; border-radius: 12; padding: 14; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #00B894;">
          <div style="flex-grow: 1;">
            <p style="font-size: 13; font-weight: bold; color: #333;">Build Succeeded</p>
            <p style="font-size: 11; color: #999;">All 42 tests passed</p>
          </div>
          <p style="font-size: 10; color: #ccc;">2m ago</p>
        </div>

        <div style="display: flex; flex-direction: row; align-items: center; gap: 12; background-color: white; border-radius: 12; padding: 14; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #FDCB6E;">
          <div style="flex-grow: 1;">
            <p style="font-size: 13; font-weight: bold; color: #333;">Layout Recomputed</p>
            <p style="font-size: 11; color: #999;">3 dirty nodes invalidated</p>
          </div>
          <p style="font-size: 10; color: #ccc;">5m ago</p>
        </div>

        <div style="display: flex; flex-direction: row; align-items: center; gap: 12; background-color: white; border-radius: 12; padding: 14; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #0984E3;">
          <div style="flex-grow: 1;">
            <p style="font-size: 13; font-weight: bold; color: #333;">Style Synced</p>
            <p style="font-size: 11; color: #999;">Buffer updated: 560 bytes</p>
          </div>
          <p style="font-size: 10; color: #ccc;">8m ago</p>
        </div>
      </div>

      <!-- Color Palette -->
      <p style="font-size: 18; font-weight: bold; color: #1a1a2e; margin-bottom: 10;">Palette</p>

      <div style="display: flex; flex-direction: row; height: 64; border-radius: 14; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
        <div style="flex-grow: 1; background-color: #FF6B6B;"></div>
        <div style="flex-grow: 1; background-color: #E84393;"></div>
        <div style="flex-grow: 1; background-color: #6C5CE7;"></div>
        <div style="flex-grow: 1; background-color: #0984E3;"></div>
        <div style="flex-grow: 1; background-color: #00B894;"></div>
        <div style="flex-grow: 1; background-color: #FDCB6E;"></div>
        <div style="flex-grow: 1; background-color: #E17055;"></div>
      </div>

      <!-- Gradient Cards -->
      <p style="font-size: 18; font-weight: bold; color: #1a1a2e; margin-top: 20; margin-bottom: 10;">Layered Shadows</p>

      <div style="display: flex; flex-direction: row; gap: 12;">
        <div style="flex-grow: 1; height: 90; background-color: #6C5CE7; border-radius: 16; padding: 14; box-shadow: 0 6px 20px rgba(108, 92, 231, 0.45);">
          <p style="color: white; font-size: 20; font-weight: bold;">Pro</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 10; margin-top: 4;">Purple glow</p>
        </div>
        <div style="flex-grow: 1; height: 90; background-color: #0984E3; border-radius: 16; padding: 14; box-shadow: 0 6px 20px rgba(9, 132, 227, 0.45);">
          <p style="color: white; font-size: 20; font-weight: bold;">Plus</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 10; margin-top: 4;">Blue glow</p>
        </div>
        <div style="flex-grow: 1; height: 90; background-color: #00B894; border-radius: 16; padding: 14; box-shadow: 0 6px 20px rgba(0, 184, 148, 0.45);">
          <p style="color: white; font-size: 20; font-weight: bold;">Go</p>
          <p style="color: rgba(255,255,255,0.7); font-size: 10; margin-top: 4;">Green glow</p>
        </div>
      </div>

    </div>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped>
</style>
