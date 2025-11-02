import { createApp, registerElement, ELEMENT_REF } from 'nativescript-vue';
import { View, Scroll, Img, Text } from '@triniwiz/nativescript-masonkit';
import { P, Span, B, H1, H2, H3, H4, Code, Div } from '@triniwiz/nativescript-masonkit/web';
import Home from './components/Home.vue';

registerElement('view', () => View);
registerElement('div', () => Div);
registerElement('img', () => Img);
registerElement('text', () => Text);
registerElement('p', () => P);
registerElement('sspan', () => Span);
registerElement('b', () => B);
registerElement('h1', () => H1);
registerElement('h2', () => H2);
registerElement('h3', () => H3);
registerElement('h4', () => H4);
registerElement('code', () => Code);

global.VUE3_ELEMENT_REF = ELEMENT_REF;

createApp(Home).start();
