<template>
  <Page>
    <ActionBar title="Grid Areas">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>

    <Scroll class="page">
      <main class="page-body">

      <p class="tk-text" style="padding-left:16; padding-right:16; font-size: 22; font-weight: bold; margin-bottom: 4">Named Grid Areas</p>
      <p class="tk-muted" style="padding-left:16; padding-right:16; font-size: 12; margin-bottom: 12">Header / Sidebar / Content / Footer</p>

      <div style="display: grid; grid-gap: 8; grid-template-columns: 100 auto; grid-template-areas: 'header header' 'sidebar content' 'sidebar2 sidebar2' 'footer footer';">
        <div style="grid-area: header; background-color: #2D3436; color: #fff; border-radius: 8; padding: 12; font-size: 14;">
          <p style="color: white;">Header</p>
        </div>
        <div style="grid-area: sidebar; background-color: #444; color: #fff; border-radius: 8; padding: 12; font-size: 14;">
          <p style="color: white;">Sidebar</p>
        </div>
        <div style="grid-area: content; background-color: #444; color: #fff; border-radius: 8; padding: 12; font-size: 14;">
          <p style="color: white;">Content</p>
          <p class="tk-muted" style="font-size: 11; margin-top: 4">More content than we had before so this column is now quite tall.</p>
        </div>
        <div style="grid-area: sidebar2; background-color: #636E72; color: #fff; border-radius: 8; padding: 12; font-size: 14;">
          <p style="color: white;">Sidebar 2</p>
        </div>
        <div style="grid-area: footer; background-color: #2D3436; color: #fff; border-radius: 8; padding: 12; font-size: 14;">
          <p style="color: white;">Footer</p>
        </div>
      </div>

      <p class="tk-text" style="padding-left:16; padding-right:16; font-size: 22; font-weight: bold; margin-top: 24; margin-bottom: 4">Holy Grail Layout</p>
      <p class="tk-muted" style="padding-left:16; padding-right:16; font-size: 12; margin-bottom: 12">Classic 3-column with header/footer</p>

      <div style="display: grid; grid-template-columns: 70 1fr 70; grid-template-rows: 48 1fr 40; grid-template-areas: 'hg-header hg-header hg-header' 'hg-left hg-main hg-right' 'hg-footer hg-footer hg-footer'; gap: 6; height: 240;">
        <div style="grid-area: hg-header; background-color: #0984E3; border-radius: 8; display: flex; align-items: center; justify-content: center;">
          <p style="color: white; font-weight: bold; font-size: 14; text-align: center;">Header</p>
        </div>
        <div style="grid-area: hg-left; background-color: #6C5CE7; border-radius: 8; display: flex; align-items: center; justify-content: center;">
          <p style="color: white; font-size: 11; text-align: center;">Left</p>
        </div>
        <div style="grid-area: hg-main; background-color: #00B894; border-radius: 8; display: flex; align-items: center; justify-content: center;">
          <p style="color: white; font-size: 13; text-align: center;">Main Content Area</p>
        </div>
        <div style="grid-area: hg-right; background-color: #E84393; border-radius: 8; display: flex; align-items: center; justify-content: center;">
          <p style="color: white; font-size: 11; text-align: center;">Right</p>
        </div>
        <div style="grid-area: hg-footer; background-color: #2D3436; border-radius: 8; display: flex; align-items: center; justify-content: center;">
          <p style="color: white; font-weight: bold; font-size: 14; text-align: center;">Footer</p>
        </div>
      </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
</script>
