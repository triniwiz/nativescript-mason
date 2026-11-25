export const samples = [
  { path: 'pricing', title: 'Pricing', desc: 'Three tiers, featured plan, monthly/annual toggle', color: '#6c5ce7', load: () => import('./pricing.component').then((m) => m.PricingComponent) },
  { path: 'checkout', title: 'Checkout', desc: 'Cart with quantity steppers, promo code, order summary', color: '#00b894', load: () => import('./checkout.component').then((m) => m.CheckoutComponent) },
  { path: 'profile', title: 'Profile', desc: 'Avatar, stats, bio, and a tabbed post grid', color: '#0984e3', load: () => import('./profile.component').then((m) => m.ProfileComponent) },
  { path: 'analytics', title: 'Analytics', desc: 'Stat cards, flexbox bar chart, activity feed', color: '#e17055', load: () => import('./analytics.component').then((m) => m.AnalyticsComponent) },
  { path: 'settings', title: 'Settings', desc: 'Grouped settings with inputs and switches', color: '#636e72', load: () => import('./settings.component').then((m) => m.SettingsComponent) },
  { path: 'events', title: 'Events', desc: 'Event list with date badges, chips, and RSVP toggles', color: '#e84393', load: () => import('./events.component').then((m) => m.EventsComponent) },
  { path: 'ratings', title: 'Ratings', desc: 'Tap-to-rate stars, breakdown bars, review cards', color: '#fdcb6e', load: () => import('./ratings.component').then((m) => m.RatingsComponent) },
  { path: 'login', title: 'Sign in', desc: 'Reactive form with validation and social buttons', color: '#1a1a2e', load: () => import('./login.component').then((m) => m.LoginComponent) },
  { path: 'music-player', title: 'Music player', desc: 'Album art, progress bar, transport controls', color: '#fd79a8', load: () => import('./music-player.component').then((m) => m.MusicPlayerComponent) },
  { path: 'article', title: 'Article', desc: 'Reader page with byline, hero, and pull quote', color: '#4ecdc4', load: () => import('./article.component').then((m) => m.ArticleComponent) },
];
