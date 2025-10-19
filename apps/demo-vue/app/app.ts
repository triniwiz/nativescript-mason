import { createApp, registerElement, ELEMENT_REF } from 'nativescript-vue';
import { View, Scroll, Img, Text } from '@triniwiz/nativescript-masonkit';
import { P, Span, B } from '@triniwiz/nativescript-masonkit/web';
import Home from './components/Home.vue';

registerElement('view', () => View);
registerElement('div', () => Scroll);
registerElement('img', () => Img);
registerElement('text', () => Text);
registerElement('p', () => P);
registerElement('sspan', () => Span);
registerElement('b', () => B);

global.VUE3_ELEMENT_REF = ELEMENT_REF;

createApp(Home).start();
