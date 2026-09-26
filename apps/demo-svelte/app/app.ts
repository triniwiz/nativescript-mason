import { svelteNative } from 'svelte-native';
import { View } from '@triniwiz/nativescript-masonkit';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/svelte';
import App from './App.svelte';

View.preflight = true;

installMasonKit();

svelteNative(App, {});
