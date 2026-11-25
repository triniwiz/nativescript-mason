import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../shared/demo-page.component';

@Component({ selector: 'demo-gradient', templateUrl: 'gradient.component.html', styleUrl: 'gradient.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class GradientComponent {
  // Each `css` string must match the class of the same name in the stylesheet, where the gradient is applied.
  readonly sections = [
    {
      title: 'Stop positions',
      samples: [
        { cls: 'even', title: 'Evenly spread', css: 'red, blue, green', note: 'No positions: the stops sit at 0%, 50% and 100%.' },
        { cls: 'neighbours', title: 'Between neighbours', css: 'red, blue 80%, green, white', note: 'Green has no position, so it lands halfway between blue at 80% and white at 100%.' },
        { cls: 'backwards', title: 'Out of order', css: 'red 50%, blue 20%, green', note: 'Blue asks for 20%, before red. It moves up to 50%, leaving a hard edge.' },
      ],
    },
    {
      title: 'Two-position stops',
      samples: [
        { cls: 'halves', title: 'Hard split', css: 'red 0% 50%, blue 50% 100%', note: 'Each colour holds for its whole range, so the halves meet without blending.' },
        { cls: 'stripes', title: 'Stripes', css: 'red 0 25%, white 25% 50%, blue 50% 75%, black 75%', note: 'Four solid bands from two positions per stop.' },
        { cls: 'progress', title: 'Progress bar', css: '#00b894 0 64%, #dfe6e9 64% 100%', note: 'One gradient draws both the filled and empty track.' },
      ],
    },
    {
      title: 'Showcase',
      samples: [
        { cls: 'sunset', title: 'Sunset', css: '160deg, #fd9644, #fc5c65 45%, #4b0082', note: 'An angled gradient with one positioned stop.' },
        { cls: 'glow', title: 'Radial glow', css: 'circle, #ffeaa7, #fdcb6e 30%, #2d3436', note: 'Radial gradients use the same stop rules.' },
      ],
    },
  ];
}
