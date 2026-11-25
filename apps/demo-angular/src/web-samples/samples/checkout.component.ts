import { Component, computed, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptFormsModule } from '@nativescript/angular';
import { DemoPageComponent } from '../../shared/demo-page.component';

type CartItem = {
  name: string;
  detail: string;
  price: number;
  qty: number;
  color: string;
  glyph: string;
};

@Component({ selector: 'demo-checkout', templateUrl: 'checkout.component.html', styleUrl: 'checkout.component.scss', imports: [DemoPageComponent, NativeScriptFormsModule], schemas: [NO_ERRORS_SCHEMA] })
export class CheckoutComponent {
  readonly cart = signal<CartItem[]>([
    { name: 'Trail Runners', detail: 'Size 42 · Slate', price: 129.0, qty: 1, color: '#6c5ce7', glyph: 'S' },
    { name: 'Wool Socks ×3', detail: 'Merino · Charcoal', price: 24.0, qty: 2, color: '#00b894', glyph: 'K' },
    { name: 'Insulated Bottle', detail: '750 ml · Glacier', price: 34.5, qty: 1, color: '#0984e3', glyph: 'B' },
  ]);

  readonly promo = signal('');
  private readonly promoApplied = signal(false);
  readonly promoMessage = signal('');
  readonly subtotal = computed(() => this.cart().reduce((sum, i) => sum + i.price * i.qty, 0));
  readonly discount = computed(() => (this.promoApplied() ? this.subtotal() * 0.1 : 0));
  readonly shipping = computed(() => (this.subtotal() - this.discount() >= 100 ? 0 : 6.95));
  readonly total = computed(() => this.subtotal() - this.discount() + this.shipping());

  bump(item: CartItem, delta: number): void {
    this.cart.update((cart) => cart.map((i) => (i === item ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  }

  applyPromo(): void {
    if (this.promo().trim().toUpperCase() === 'MASON10') {
      this.promoApplied.set(true);
      this.promoMessage.set('Promo applied — 10% off your order.');
    } else {
      this.promoApplied.set(false);
      this.promoMessage.set(this.promo().trim() ? 'That code is not valid.' : 'Enter a promo code first.');
    }
  }
}
