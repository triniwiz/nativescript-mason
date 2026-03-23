<template>
  <Page>
    <ActionBar>
      <Label text="Flexbox Layout" class="text-white" style="font-size: 18; font-weight: bold;" />
    </ActionBar>
    <div style="padding: 16;overflow-y: scroll;">

      <!-- Flex Direction -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Flex Direction</p>

      <!-- Row -->
      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">row</p>
      <div style="display: flex; flex-direction: row; background-color: #f0f0f5; border-radius: 8; padding: 8; margin-bottom: 12;">
        <div style="width: 80; height: 50; background-color: #FF6B6B; border-radius: 6; padding: 6;">
          <p style="color: white; font-weight: bold;">1</p>
        </div>
        <div style="width: 80; height: 50; background-color: #4ECDC4; border-radius: 6; padding: 6;">
          <p style="color: white; font-weight: bold;">2</p>
        </div>
        <div style="width: 80; height: 50; background-color: #FFD93D; border-radius: 6; padding: 6;">
          <p style="color: #333; font-weight: bold;">3</p>
        </div>
      </div>

      <!-- Row Reverse -->
      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">row-reverse</p>
      <div style="display: flex; flex-direction: row-reverse; background-color: #f0f0f5; border-radius: 8; padding: 8; margin-bottom: 12;">
        <div style="width: 80; height: 50; background-color: #FF6B6B; border-radius: 6; padding: 6;">
          <p style="color: white; font-weight: bold;">1</p>
        </div>
        <div style="width: 80; height: 50; background-color: #4ECDC4; border-radius: 6; padding: 6;">
          <p style="color: white; font-weight: bold;">2</p>
        </div>
        <div style="width: 80; height: 50; background-color: #FFD93D; border-radius: 6; padding: 6;">
          <p style="color: #333; font-weight: bold;">3</p>
        </div>
      </div>

      <!-- Column -->
      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">column</p>
      <div style="display: flex; flex-direction: column; background-color: #f0f0f5; border-radius: 8; padding: 8; height: 130; margin-bottom: 12;">
        <div style="height: 32; background-color: #FF6B6B; border-radius: 6; padding: 4;">
          <p style="color: white; font-weight: bold; font-size: 13;">1</p>
        </div>
        <div style="height: 32; background-color: #4ECDC4; border-radius: 6; padding: 4;">
          <p style="color: white; font-weight: bold; font-size: 13;">2</p>
        </div>
        <div style="height: 32; background-color: #FFD93D; border-radius: 6; padding: 4;">
          <p style="color: #333; font-weight: bold; font-size: 13;">3</p>
        </div>
      </div>

      <!-- Column Reverse -->
      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">column-reverse</p>
      <div style="display: flex; flex-direction: column-reverse; background-color: #f0f0f5; border-radius: 8; padding: 8; height: 130; margin-bottom: 20;">
        <div style="height: 32; background-color: #FF6B6B; border-radius: 6; padding: 4;">
          <p style="color: white; font-weight: bold; font-size: 13;">1</p>
        </div>
        <div style="height: 32; background-color: #4ECDC4; border-radius: 6; padding: 4;">
          <p style="color: white; font-weight: bold; font-size: 13;">2</p>
        </div>
        <div style="height: 32; background-color: #FFD93D; border-radius: 6; padding: 4;">
          <p style="color: #333; font-weight: bold; font-size: 13;">3</p>
        </div>
      </div>

      <!-- Justify Content -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Justify Content</p>

      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">space-between</p>
      <div style="display: flex; flex-direction: row; justify-content: space-between; background-color: #f0f0f5; border-radius: 8; padding: 8; margin-bottom: 10;">
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">A</p>
        </div>
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">B</p>
        </div>
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">C</p>
        </div>
      </div>

      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">space-around</p>
      <div style="display: flex; flex-direction: row; justify-content: space-around; background-color: #f0f0f5; border-radius: 8; padding: 8; margin-bottom: 10;">
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">A</p>
        </div>
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">B</p>
        </div>
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">C</p>
        </div>
      </div>

      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">center</p>
      <div style="display: flex; flex-direction: row; justify-content: center; gap: 8; background-color: #f0f0f5; border-radius: 8; padding: 8; margin-bottom: 20;">
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">A</p>
        </div>
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">B</p>
        </div>
        <div style="width: 48; height: 48; background-color: #6C5CE7; border-radius: 8;">
          <p style="color: white; font-weight: bold; text-align: center; font-size: 13;">C</p>
        </div>
      </div>

      <!-- Align Items -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Align Items</p>

      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">center</p>
      <div style="display: flex; flex-direction: row; align-items: center; gap: 8; background-color: #f0f0f5; border-radius: 8; padding: 8; height: 90; margin-bottom: 10;">
        <div style="width: 48; height: 30; background-color: #FF6B6B; border-radius: 6;"></div>
        <div style="width: 48; height: 50; background-color: #4ECDC4; border-radius: 6;"></div>
        <div style="width: 48; height: 40; background-color: #FFD93D; border-radius: 6;"></div>
      </div>

      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">flex-end</p>
      <div style="display: flex; flex-direction: row; align-items: flex-end; gap: 8; background-color: #f0f0f5; border-radius: 8; padding: 8; height: 90; margin-bottom: 20;">
        <div style="width: 48; height: 30; background-color: #FF6B6B; border-radius: 6;"></div>
        <div style="width: 48; height: 50; background-color: #4ECDC4; border-radius: 6;"></div>
        <div style="width: 48; height: 40; background-color: #FFD93D; border-radius: 6;"></div>
      </div>

      <!-- Flex Wrap -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Flex Wrap</p>

      <div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 6; background-color: #f0f0f5; border-radius: 8; padding: 8; margin-bottom: 20;">
        <div style="width: 56; height: 44; background-color: #FF6B6B; border-radius: 6;"></div>
        <div style="width: 56; height: 44; background-color: #4ECDC4; border-radius: 6;"></div>
        <div style="width: 56; height: 44; background-color: #FFD93D; border-radius: 6;"></div>
        <div style="width: 56; height: 44; background-color: #6C5CE7; border-radius: 6;"></div>
        <div style="width: 56; height: 44; background-color: #E84393; border-radius: 6;"></div>
        <div style="width: 56; height: 44; background-color: #00B894; border-radius: 6;"></div>
        <div style="width: 56; height: 44; background-color: #0984E3; border-radius: 6;"></div>
      </div>

      <!-- Flex Grow -->
      <p style="font-size: 22; font-weight: bold; color: #1a1a2e; margin-bottom: 8;">Flex Grow</p>
      <p style="font-size: 13; color: #666; margin-bottom: 4; font-weight: bold;">1 : 2 : 1 ratio</p>

      <div style="display: flex; flex-direction: row; gap: 6;">
        <div style="flex-grow: 1; height: 50; background-color: #FF6B6B; border-radius: 6; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">1</p>
        </div>
        <div style="flex-grow: 2; height: 50; background-color: #4ECDC4; border-radius: 6; padding: 8;">
          <p style="color: white; font-weight: bold; text-align: center;">2</p>
        </div>
        <div style="flex-grow: 1; height: 50; background-color: #FFD93D; border-radius: 6; padding: 8;">
          <p style="color: #333; font-weight: bold; text-align: center;">1</p>
        </div>
      </div>

    </div>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped>
</style>
