<template>
  <Page>
    <ActionBar title="Issue repros">
      <NavigationButton text="Back" v-bind="$backIcon" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <p class="tk-muted note">One card per reported issue. DOM probes log REPRO lines to the console.</p>

        <p class="tk-text heading">A. Centred nowrap text in a flex box</p>
        <div class="tk-surface card">
          <div class="row-flex">
            <span class="avatar nowrap-center">AB</span>
            <span class="avatar pre-center">CD</span>
            <span class="wide-pill">centred pill label</span>
          </div>
        </div>

        <p class="tk-text heading">B. collapse then hidden keeps a gap</p>
        <div class="tk-surface card">
          <div class="bar a">above</div>
          <div ref="collapseThenHidden" class="bar b">hidden (should be a gap)</div>
          <div class="bar c">below</div>
        </div>

        <p class="tk-text heading">C. Centred pre, inline boxes on the baseline</p>
        <div class="tk-surface card">
          <pre class="code centred">one
two two
three three three</pre>
          <p class="tk-text row">Press <kbd class="kbd">Ctrl</kbd> then <button class="inline-btn">Go</button> and <span class="kbd two-line">two<br />lines</span> end.</p>
        </div>

        <p class="tk-text heading">1. Nested text keeps inline styles</p>
        <div class="tk-surface card">
          <p class="tk-text row">plain <span class="red bold">red bold</span> plain <span class="blue italic">blue italic</span></p>
          <blockquote class="quote"><p class="green">green p in a blockquote</p></blockquote>
          <pre class="code"><code><span class="kw">const</span> x <span class="op">=</span> <span class="num">42</span>;</code></pre>
          <pre class="code"><span class="kw">pre</span> &gt; <span class="num">span</span> (no code)</pre>
          <p class="tk-text row">p &gt; code &gt; <code><span class="red">red</span> <span class="blue">blue</span></code></p>
          <p class="tk-text row">p &gt; span &gt; <span><span class="red">red</span> and <span class="blue">blue</span></span></p>
          <p class="tk-text row">p &gt; b &gt; <b><span class="red">red bold</span></b></p>
        </div>

        <p class="tk-text heading">2. white-space: pre keeps spaces in runs</p>
        <div class="tk-surface card">
          <pre class="code"><code><span>[</span><span>    </span><span>]</span><span>[ edge ]</span><span> </span><span>end</span></code></pre>
        </div>

        <p class="tk-text heading">3. Inline div inside text</p>
        <div class="tk-surface card">
          <p class="tk-text row">Read <div class="inline"><a class="link">the guide</a></div> first.</p>
        </div>

        <p class="tk-text heading">4. List markers</p>
        <div class="tk-surface card">
          <ul><li>Disc one</li><li>Disc two</li></ul>
          <ol><li>Numbered one</li><li>Numbered two</li></ol>
          <ul class="md-ul"><li>Explicit disc one</li><li>Explicit disc two</li></ul>
          <ol class="md-ol"><li>Explicit decimal one</li><li>Explicit decimal two</li></ol>
          <ul class="md-short"><li>Shorthand disc one</li><li>Shorthand disc two</li></ul>
          <ol class="md-short-ol"><li>Shorthand decimal outside one</li><li>Shorthand decimal outside two</li></ol>
          <ul class="md-pad"><li class="md-li">Rule on the li one</li><li class="md-li">Rule on the li two</li></ul>
          <ul class="md-ul"><li><p class="li-p">p in li one</p></li><li><p class="li-p">p in li two</p></li></ul>
          <ul class="md-ul"><li><span>span in li one</span></li><li><span>span in li two</span></li></ul>
          <ul class="md-ul"><li><div>div in li one</div></li><li><div>div in li two</div></li></ul>
          <ol class="md-ol"><li>text and <a class="link">a link</a> in li</li><li><strong>bold</strong> start</li></ol>
        </div>

        <p class="tk-text heading">5. Inline-block on the baseline</p>
        <div class="tk-surface card">
          <p class="tk-text row">Press <kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">K</kbd> or <a class="link chip-link">a link chip</a>.</p>
        </div>

        <p class="tk-text heading">6. pre in an overflow-x box</p>
        <div class="tk-surface card">
          <div class="scroller">
            <pre class="code">line one
line two is much longer than the viewport so it has to scroll sideways
line three</pre>
          </div>
        </div>

        <p class="tk-text heading">7. Button centres its text</p>
        <div class="tk-surface card">
          <button class="outline-btn">Outline</button>
        </div>

        <p class="tk-text heading">8. Flex text element centres its text</p>
        <div class="tk-surface card">
          <span class="avatar">AB</span>
        </div>

        <p class="tk-text heading">9. Passthrough host keeps its slot</p>
        <div class="tk-surface card">
          <div class="row-flex">
            <span class="cell">A</span>
            <ProxyViewContainer><span class="cell">B1</span><span class="cell">B2</span></ProxyViewContainer>
            <span class="cell">C</span>
          </div>
        </div>

        <p class="tk-text heading">10. visibility: collapse</p>
        <div class="tk-surface card">
          <div class="bar a">above</div>
          <div class="bar b" style="visibility: collapse">collapsed</div>
          <div class="bar c">below (should touch above)</div>
        </div>

        <p class="tk-text heading">12. Tap a child moved by a negative margin</p>
        <div class="tk-surface card">
          <div class="neg-host">
            <div class="neg-spacer">spacer</div>
            <div class="neg-target" @tap="onNegTap">tap me ({{ negTaps }})</div>
          </div>
        </div>

        <p class="tk-text heading">13. backdrop-filter</p>
        <div class="tk-surface card">
          <div class="backdrop-host">
            <span class="tk-text">Text behind the overlay</span>
            <div class="backdrop"></div>
          </div>
        </div>

        <p class="tk-text heading">16. Calendar grid</p>
        <div class="tk-surface card">
          <div class="cal-grid">
            <span v-for="d in days" :key="d" class="cal-day">{{ d }}</span>
          </div>
          <div v-for="w in weeks" :key="w[0]" class="cal-week">
            <span v-for="d in w" :key="d" class="cal-cell">{{ d }}</span>
          </div>
        </div>

        <p class="tk-text heading">17. Progress and skeleton</p>
        <div class="tk-surface card">
          <div class="progress"><div ref="progressFill" class="progress-fill"></div></div>
          <div class="skeleton"></div>
        </div>

        <p class="tk-text heading">Probes (11, 14, 15, tagName, getBoundingClientRect)</p>
        <div class="tk-surface card">
          <button ref="probeButton" class="outline-btn" @tap="() => {}">Probe target</button>
          <span ref="probeText" class="tk-text">Probe text</span>
          <span class="tk-muted">{{ probeSummary }}</span>
        </div>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'nativescript-vue';

const days = Array.from({ length: 14 }, (_, i) => i + 1);
const weeks = [days.slice(0, 7), days.slice(7, 14)];

const negTaps = ref(0);
function onNegTap() {
  negTaps.value++;
  console.log(`REPRO 12 tapped ${negTaps.value}`);
}

const probeButton = ref<any>();
const probeText = ref<any>();
const probeSummary = ref('');
const progressFill = ref<any>();
const collapseThenHidden = ref<any>();

function nativeOf(r: any) {
  return r?.nativeView ?? r;
}

function probe(label: string, fn: () => unknown): string {
  let result: string;
  try {
    result = JSON.stringify(fn());
  } catch (e) {
    result = `threw ${(e as Error).message}`;
  }
  const line = `${label}=${result}`;
  console.log(`REPRO ${line}`);
  return line;
}

onMounted(() => {
  const hiddenBar = nativeOf(collapseThenHidden.value);
  hiddenBar.visibility = 'collapse';
  setTimeout(() => (hiddenBar.visibility = 'hidden'), 300);
  setTimeout(() => {
    const button = nativeOf(probeButton.value);
    const text = nativeOf(probeText.value);
    const lines = [
      probe('11.hasListeners(tap)', () => button.hasListeners('tap')),
      probe('11.hasListeners(click)', () => button.hasListeners?.('click')),
      probe('14.setAttribute', () => {
        button.setAttribute('data-x', '1');
        return button.getAttribute('data-x');
      }),
      probe('14.textContent', () => text.textContent),
      probe('tagName', () => button.tagName),
      probe('getBoundingClientRect', () => {
        const r = button.getBoundingClientRect();
        return r && { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
      probe('15.Canvas', () => {
        text.style.color = 'Canvas';
        return String(text.style.color);
      }),
      probe('15.CanvasText', () => {
        text.style.backgroundColor = 'CanvasText';
        return String(text.style.backgroundColor);
      }),
    ];
    const fill = nativeOf(progressFill.value);
    lines.push(
      probe('17.fill', () => ({
        coreTranslateX: fill.translateX,
        styleTransform: String(fill.style.transform),
        nativeTranslationX: fill.nativeViewProtected?.getTranslationX?.(),
        nativeWidth: fill.nativeViewProtected?.getWidth?.(),
      })),
    );
    probeSummary.value = lines.join('\n');
  }, 1000);
});
</script>

<style scoped>
.note {
  margin: 0 0 12 0;
  font-size: 13;
}

.heading {
  margin: 0 0 8 0;
  font-size: 17;
  font-weight: bold;
}

.card {
  border-radius: 10;
  padding: 12;
  margin-bottom: 16;
  border-width: 1;
  border-color: #dddddd;
}

.row {
  font-size: 16;
  margin: 0 0 8 0;
}

.red { color: #d63031; }
.blue { color: #0984e3; }
.green { color: #00b894; }
.bold { font-weight: bold; }
.italic { font-style: italic; }

.quote {
  border-left-width: 3;
  border-left-color: #b2bec3;
  padding-left: 10;
  margin: 0 0 8 0;
}

.code {
  white-space: pre;
  font-size: 13;
  padding: 8;
  background-color: #2d3436;
  color: #dfe6e9;
  margin: 0 0 4 0;
}

.kw { color: #fd79a8; }
.op { color: #fdcb6e; }
.num { color: #55efc4; }

.inline { display: inline; }

.link {
  color: #0984e3;
  text-decoration: underline;
}

.kbd {
  display: inline-block;
  padding: 2 6;
  border-width: 1;
  border-color: #b2bec3;
  border-radius: 4;
  font-size: 13;
}

.chip-link {
  display: inline-block;
  padding: 4 8;
  background-color: #dfe6fd;
  border-radius: 6;
}

.scroller { overflow-x: auto; }

.md-ul {
  list-style-type: disc;
  padding-left: 24;
}

.md-ol {
  list-style-type: decimal;
  padding-left: 24;
}

.md-short {
  list-style: disc;
  padding-left: 24;
}

.md-short-ol {
  list-style: decimal outside;
  padding-left: 24;
}

.md-pad {
  padding-left: 24;
}

.li-p {
  margin: 0;
}

.md-li {
  list-style-type: disc;
}

.outline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40;
  width: 140;
  border-width: 1;
  border-color: #636e72;
  border-radius: 6;
  background-color: transparent;
  color: #2d3436;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48;
  height: 48;
  border-radius: 24;
  background-color: #a29bfe;
  color: white;
  font-weight: bold;
}

.nowrap-center {
  text-align: center;
  white-space: nowrap;
}

.pre-center {
  text-align: center;
  white-space: pre;
}

.wide-pill {
  display: flex;
  justify-content: center;
  width: 170;
  height: 48;
  align-items: center;
  text-align: center;
  white-space: nowrap;
  border-radius: 24;
  background-color: #81ecec;
}

.centred { text-align: center; }

.inline-btn {
  display: inline-block;
  padding: 4 10;
  border-width: 1;
  border-color: #636e72;
  border-radius: 6;
  background-color: transparent;
  color: #2d3436;
}

.two-line { display: inline-block; }

.row-flex {
  display: flex;
  flex-direction: row;
  gap: 6;
}

.cell {
  padding: 6 10;
  background-color: #dfe6fd;
  border-radius: 4;
}

.bar {
  height: 28;
  padding: 4;
}
.a { background-color: #74b9ff; }
.b { background-color: #fab1a0; }
.c { background-color: #55efc4; }

.neg-host {
  display: flex;
  flex-direction: column;
}

.neg-spacer {
  height: 60;
  background-color: #dfe6e9;
}

.neg-target {
  margin-top: -40;
  margin-left: 40;
  width: 160;
  height: 40;
  background-color: #e17055;
  color: white;
}

.backdrop-host {
  height: 80;
  background-color: #ffeaa7;
}

.backdrop {
  position: absolute;
  left: 20;
  top: 10;
  width: 200;
  height: 60;
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 8;
}

.cal-day {
  text-align: center;
  padding: 4;
}

.cal-week {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.cal-cell {
  width: 36;
  height: 36;
  text-align: center;
}

.progress {
  position: relative;
  height: 8;
  width: 100%;
  overflow: hidden;
  border-radius: 4;
  background-color: #dfe6e9;
  margin-bottom: 12;
}

.progress-fill {
  height: 100%;
  width: 100%;
  background-color: #6c5ce7;
  transform: translateX(-35%);
}

.skeleton {
  height: 16;
  width: 250;
  border-radius: 6;
  background-color: #b2bec3;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  50% { opacity: 0.5; }
}
</style>
