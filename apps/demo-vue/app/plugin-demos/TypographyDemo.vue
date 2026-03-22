<template>
  <Page>
    <ActionBar>
      <Label text="Typography" class="text-white" style="font-size: 18; font-weight: bold;" />
    </ActionBar>
    <div style="padding: 16;overflow-y: scroll;">

      <!-- Headings -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Headings</p>

      <div style="background-color: white; border-radius: 10; padding: 14; margin-bottom: 16; border: 1px solid #eee;">
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
      </div>

      <!-- Font Weight -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Font Weight</p>

      <div style="background-color: white; border-radius: 10; padding: 14; margin-bottom: 16; border: 1px solid #eee;">
        <p style="font-size: 16; color: #333; font-weight: 100;">Thin (100) - The quick brown fox</p>
        <p style="font-size: 16; color: #333; font-weight: 300;">Light (300) - The quick brown fox</p>
        <p style="font-size: 16; color: #333; font-weight: 400;">Regular (400) - The quick brown fox</p>
        <p style="font-size: 16; color: #333; font-weight: 600;">Semi-Bold (600) - The quick brown fox</p>
        <p style="font-size: 16; color: #333; font-weight: 700;">Bold (700) - The quick brown fox</p>
        <p style="font-size: 16; color: #333; font-weight: 900;">Black (900) - The quick brown fox</p>
      </div>

      <!-- Font Styles -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Font Styles</p>

      <div style="background-color: white; border-radius: 10; padding: 14; margin-bottom: 16; border: 1px solid #eee;">
        <p style="font-style: normal; font-size: 16; color: #333;">Normal style text</p>
        <p style="font-style: italic; font-size: 16; color: #333;">Italic style text</p>
      </div>

      <!-- Text Alignment -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Text Alignment</p>

      <div style="background-color: #FF6B6B; border-radius: 8; padding: 10; margin-bottom: 4;">
        <p style="text-align: left; color: white; font-size: 14;">Left aligned text</p>
      </div>
      <div style="background-color: #6C5CE7; border-radius: 8; padding: 10; margin-bottom: 4;">
        <p style="text-align: center; color: white; font-size: 14;">Center aligned text</p>
      </div>
      <div style="background-color: #00B894; border-radius: 8; padding: 10; margin-bottom: 16;">
        <p style="text-align: right; color: white; font-size: 14;">Right aligned text</p>
      </div>

      <!-- Colors & Sizes -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Colors &amp; Sizes</p>

      <div style="background-color: white; border-radius: 10; padding: 14; margin-bottom: 16; border: 1px solid #eee;">
        <p style="font-size: 10; color: #aaa;">10px - Tiny caption text</p>
        <p style="font-size: 13; color: #666;">13px - Secondary body text</p>
        <p style="font-size: 16; color: #333;">16px - Primary body text</p>
        <p style="font-size: 20; color: #0984E3;">20px - Accent headline</p>
        <p style="font-size: 28; color: #E84393; font-weight: bold;">28px - Hero text</p>
        <p style="font-size: 36; color: #1a1a2e; font-weight: bold;">36px - Display</p>
      </div>

      <!-- Inline Formatting -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Inline Formatting</p>

      <div style="background-color: white; border-radius: 10; padding: 14; margin-bottom: 16; border: 1px solid #eee;">
        <p style="font-size: 15; color: #333; line-height: 24;">
          You can mix <b>bold text</b> with <sspan style="color: #E84393;">colored spans</sspan> and
          <sspan style="font-style: italic; color: #0984E3;">italic accents</sspan> in a single paragraph.
        </p>
      </div>

      <!-- Letter Spacing -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Letter Spacing</p>

      <div style="background-color: white; border-radius: 10; padding: 14; border: 1px solid #eee;">
        <p style="letter-spacing: 0; font-size: 14; color: #333;">Normal spacing (0)</p>
        <p style="letter-spacing: 2; font-size: 14; color: #333;">Tracked out (2px)</p>
        <p style="letter-spacing: 5; font-size: 14; color: #333; font-weight: bold;">W I D E   T R A C K E D</p>
      </div>

    </div>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped>
</style>
