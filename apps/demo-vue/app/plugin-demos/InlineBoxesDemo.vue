<template>
  <Page>
    <ActionBar title="Inline boxes">
      <NavigationButton text="Back" v-bind="$backIcon" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <p class="tk-muted note">Each row's boxes should sit on the same baseline as the text around them, as in a browser.</p>

        <p class="tk-text heading">Padded chips</p>
        <div class="tk-surface card">
          <p class="tk-text row">Install <code class="chip">npm i masonkit</code> then run it.</p>
          <p class="tk-text row">Press <span class="chip tall">Enter</span> to send the form.</p>
          <p class="tk-text row">A <span class="chip lopsided">top-heavy</span> chip with more padding above.</p>
        </div>

        <p class="tk-text heading">Inline div around a link</p>
        <div class="tk-surface card">
          <p class="tk-text row">Read <div class="wrapper"><a class="link">the guide</a></div> before you start.</p>
          <p class="tk-text row">See <div class="wrapper boxed"><a class="link">this boxed link</a></div> in its text.</p>
        </div>

        <p class="tk-text heading">Two-line inline block</p>
        <div class="tk-surface card">
          <p class="tk-text row">Sits on <span class="chip narrow">its last line here</span> as on the web.</p>
        </div>

        <p class="tk-text heading">Bottom edge on the baseline</p>
        <div class="tk-surface card">
          <p class="tk-text row">A clipped <span class="chip clipped">overflow hidden</span> box keeps its bottom edge.</p>
          <p class="tk-text row">An empty <span class="swatch"></span> box keeps its bottom edge.</p>
        </div>

        <p class="tk-text heading">pre in a horizontal scroller</p>
        <div class="tk-surface card">
          <div class="scroller">
            <pre class="code-block">const a = 1;
const longerLine = someFunction(withArguments, thatRunPastTheEdge, ofTheViewport);
done();</pre>
          </div>
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.note {
  margin: 0;
  font-size: 13;
  margin-bottom: 12;
}

.heading {
  margin: 0;
  font-size: 18;
  font-weight: bold;
  margin-bottom: 8;
}

.card {
  border-radius: 10;
  padding: 14;
  margin-bottom: 16;
  border-width: 1;
  border-color: #dddddd;
}

.row {
  font-size: 16;
  margin: 0 0 14 0;
}

.chip {
  display: inline-block;
  padding: 6 10;
  border-radius: 6;
  background-color: #dfe6fd;
  color: #1e3799;
}

.tall {
  padding: 14 12;
}

.lopsided {
  padding: 18 10 2 10;
}

.narrow {
  width: 90;
}

.clipped {
  overflow: hidden;
}

.wrapper {
  display: inline;
}

.boxed {
  background-color: #ffeaa7;
  padding: 6;
}

.link {
  color: #0984e3;
  text-decoration: underline;
}

.swatch {
  display: inline-block;
  width: 28;
  height: 28;
  background-color: #e17055;
}

.scroller {
  overflow-x: auto;
}

.code-block {
  white-space: pre;
  font-size: 13;
  padding: 10;
  background-color: #2d3436;
  color: #dfe6e9;
}
</style>
