import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-chef', templateUrl: 'chef.component.html', styleUrl: 'chef.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class ChefComponent {
  readonly menu = [
    { name: 'Pan-seared salmon', desc: 'Crispy skin, lemon beurre blanc, asparagus', price: '€28', orders: 84, tag: 'Special', tagClass: 'special' },
    { name: 'Wild mushroom risotto', desc: 'Carnaroli rice, parmesan, truffle oil', price: '€22', orders: 61, tag: 'Veggie', tagClass: 'veggie' },
    { name: 'Braised lamb shank', desc: 'Red wine jus, root vegetable purée', price: '€31', orders: 47, tag: 'Hearty', tagClass: 'hearty' },
    { name: 'Citrus tart', desc: 'Torched meringue, shortcrust base', price: '€9', orders: 72, tag: 'Dessert', tagClass: 'dessert' },
  ];

  readonly stations = [
    { name: 'Grill', load: 78, color: '#e17055' },
    { name: 'Sauté', load: 64, color: '#fdcb6e' },
    { name: 'Pastry', load: 41, color: '#00b894' },
  ];
}
