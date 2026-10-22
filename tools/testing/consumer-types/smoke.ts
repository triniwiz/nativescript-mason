import { View, Text } from '@triniwiz/nativescript-masonkit';
import { Label } from '@nativescript/core';

// Mason and core children both type-check through the published entry point.
const root = new View();
const index: number = root.getChildIndex(new Text()) + root.getChildIndex(new Label());
void index;
