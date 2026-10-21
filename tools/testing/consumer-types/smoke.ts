import { View, Text } from '@triniwiz/nativescript-masonkit';
import { Label } from '@nativescript/core';

const root = new View();
const child = new Text();
const label = new Label();
root.style.display = 'flex';
root.style.flexDirection = 'column';
root.addChild(child);
root.insertChild(label, 0);
const masonIndex: number = root.getChildIndex(child);
const coreIndex: number = root.getChildIndex(label);
root.getChildAt(masonIndex);
root.removeChild(label);
root.removeChildren();
void coreIndex;
