import { createApp, registerElement } from 'nativescript-vue';
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

createApp(Home).start();
