import { createApp } from 'nativescript-vue';
import { View } from '@triniwiz/nativescript-masonkit';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/vue';
import Bench from './bench/Bench.vue';

View.preflight = true;

installMasonKit();

createApp(Bench).start();
