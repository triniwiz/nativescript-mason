import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

type Tier = {
  name: string;
  monthly: number;
  blurb: string;
  features: string[];
  featured?: boolean;
};

@Component({ selector: 'demo-pricing', templateUrl: 'pricing.component.html', styleUrl: 'pricing.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class PricingComponent {
  readonly billing = signal<'monthly' | 'annual'>('annual');

  readonly tiers: Tier[] = [
    {
      name: 'Starter',
      monthly: 12,
      blurb: 'For side projects and experiments.',
      features: ['3 projects', 'Community support', 'Basic analytics'],
    },
    {
      name: 'Pro',
      monthly: 29,
      blurb: 'For professionals shipping every week.',
      features: ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom domains'],
      featured: true,
    },
    {
      name: 'Team',
      monthly: 79,
      blurb: 'For teams that collaborate at scale.',
      features: ['Everything in Pro', 'SSO & roles', 'Audit log', '99.9% SLA'],
    },
  ];

  price(tier: Tier) {
    return this.billing() === 'monthly' ? tier.monthly : Math.round(tier.monthly * 0.8);
  }
}
