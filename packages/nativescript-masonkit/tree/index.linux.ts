import { Application, Screen } from '@nativescript/core';
import { InputType } from '..';
import { cssUnits, setViewportProvider } from '../units';
import { refreshViewportUnits } from '../style';
import { Br, Image, Input, Li, List, Mason, Text, TextArea, TextNode, View } from '../native.linux';

let viewport = { width: 0, height: 0 };

// `vw`/`vh` follow the window, and a resize writes the values that used them again.
function updateViewport() {
  try {
    const width = cssUnits.viewportWidth;
    const height = cssUnits.viewportHeight;
    if (width === viewport.width && height === viewport.height) return;
    viewport = { width, height };
    refreshViewportUnits();
  } catch (_) {}
}

export class Tree {
  private static _tree: Tree;

  static get instance() {
    if (!Tree._tree) {
      Tree._tree = new Tree();
      setViewportProvider(() => ({ width: Screen.mainScreen.widthDIPs, height: Screen.mainScreen.heightDIPs }));
      // Core raises orientationChanged on every window resize on Linux.
      Application.on(Application.orientationChangedEvent, updateViewport);
      Application.on(Application.displayedEvent, updateViewport);
    }
    return Tree._tree;
  }

  get native() {
    return Mason.Instance();
  }

  createView() {
    return new View();
  }

  // Tag defaults (UA font sizes, margins) are applied by Text itself.
  createTextView(_context?, _type?: number) {
    return new Text();
  }

  createTextNode() {
    return new TextNode();
  }

  createImageView() {
    return new Image();
  }

  createScrollView() {
    return new View();
  }

  createButtonView() {
    return Text.CreateButton();
  }

  createBr() {
    return new Br();
  }

  createTextArea() {
    return new TextArea();
  }

  createInputView(_context?, _type?: InputType) {
    return new Input();
  }

  createList(ordered = false) {
    return new List(ordered);
  }

  createListItem() {
    return new Li();
  }

  get preflight(): boolean {
    return this.native.Preflight;
  }

  set preflight(value: boolean) {
    this.native.Preflight = value;
  }
}
