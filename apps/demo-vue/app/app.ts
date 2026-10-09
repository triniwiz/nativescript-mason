import { createApp } from 'nativescript-vue';
import { isAndroid } from '@nativescript/core';
import { View } from '@triniwiz/nativescript-masonkit';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/vue';
import Home from './components/Home.vue';

// Enable MasonKit's native web-normalised defaults (border-box, margin:0, etc.)
// This replaces Tailwind's CSS preflight at the native layout engine level.
View.preflight = true;

installMasonKit();

const app = createApp(Home);
// `android.systemIcon` as a template attribute throws on iOS, whose ActionItem has no `android`.
app.config.globalProperties.$backIcon = isAndroid ? { 'android.systemIcon': 'ic_menu_back' } : {};
app.start();
