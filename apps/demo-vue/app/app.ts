import { createApp } from 'nativescript-vue';
import { View } from '@triniwiz/nativescript-masonkit';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/vue';
import Home from './components/Home.vue';

// Enable MasonKit's native web-normalised defaults (border-box, margin:0, etc.)
// This replaces Tailwind's CSS preflight at the native layout engine level.
View.preflight = true;

installMasonKit();

createApp(Home).start();
