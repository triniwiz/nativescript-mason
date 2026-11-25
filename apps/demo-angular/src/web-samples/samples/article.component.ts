import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-article', templateUrl: 'article.component.html', styleUrl: 'article.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class ArticleComponent {
  readonly saved = signal(false);
}
