import { createApp, registerElement } from 'nativescript-vue';
import { View } from '@triniwiz/nativescript-masonkit';
import { getMasonKitElements } from '@triniwiz/nativescript-masonkit/elements';
import Home from './components/Home.vue';

// Enable MasonKit's native web-normalised defaults (border-box, margin:0, etc.)
// This replaces Tailwind's CSS preflight at the native layout engine level.
View.preflight = true;

// Register every tag MasonKit can back, from the single canonical list
// (`@triniwiz/nativescript-masonkit/elements`) shared with demo-solid/demo-react
// and the Angular integration — so this demo can't silently drift out of
// parity with them (previously only a dozen of the ~30 tags were wired up
// here: no ul/ol/li/scroll/blockquote/strong/em/i/pre/a/h5/h6/article/main/
// nav/header/footer/aside).
// `overwriteExisting: true` on every entry, since nativescript-vue
// pre-registers some tags (e.g. `span`, `button`) against core NativeScript's
// own widgets and MasonKit's version should always win.
for (const { tag, ctor } of getMasonKitElements()) {
  registerElement(tag.toLowerCase(), () => ctor, { overwriteExisting: true });
}

createApp(Home).start();
