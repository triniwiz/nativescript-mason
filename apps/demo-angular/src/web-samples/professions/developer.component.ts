import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-developer', templateUrl: 'developer.component.html', styleUrl: 'developer.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class DeveloperComponent {
  readonly repos = [
    { name: 'mason-layout', desc: 'CSS layout engine bindings for native apps', lang: 'Rust', color: '#dea584', stars: 842, forks: 96, ci: 'passing', status: 'pass' },
    { name: 'river-ui', desc: 'Headless component primitives, zero styling', lang: 'TypeScript', color: '#3178c6', stars: 611, forks: 54, ci: 'passing', status: 'pass' },
    { name: 'pocket-ci', desc: 'Tiny CI runner for monorepos', lang: 'Go', color: '#00add8', stars: 233, forks: 18, ci: 'failing', status: 'fail' },
    { name: 'dotfiles', desc: 'Personal config, archived', lang: 'Shell', color: '#89e051', stars: 91, forks: 12, ci: 'n/a', status: 'muted' },
  ];

  readonly ciRuns = [
    { branch: 'main · build #482', msg: 'All 214 checks passed', time: '4m', color: '#00b894' },
    { branch: 'feature/grid-gap · #481', msg: 'Snapshot diff detected', time: '32m', color: '#fdcb6e' },
    { branch: 'fix/ci-cache · #480', msg: 'Lint step failed', time: '1h', color: '#ff6b6b' },
  ];
}
