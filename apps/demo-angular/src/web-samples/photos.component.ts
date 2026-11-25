import { Component, computed, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Screen } from '@nativescript/core';
import { DemoPageComponent } from '../shared/demo-page.component';

type Photo = {
  seed: string;
  title: string;
  loc: string;
  year: string;
  /** Aspect ratio as height / width. */
  ratio: number;
  src: string;
};

const raw: Array<[string, string, string, number]> = [
  ['dune', 'Dune study', 'Comporta', 1.35],
  ['harbour', 'Harbour fog', 'Aveiro', 0.7],
  ['cliff', 'Granite light', 'Sagres', 1.25],
  ['pier', 'Pier at dusk', 'Nazaré', 0.8],
  ['foam', 'Sea foam', 'Ericeira', 1.4],
  ['lantern', 'Old lantern', 'Cascais', 0.9],
  ['reef', 'Reef line', 'Algarve', 1.2],
  ['boat', 'Rope & tide', 'Setúbal', 0.75],
  ['salt', 'Salt pans', 'Aveiro', 0.65],
  ['gull', 'Gull, waiting', 'Peniche', 1.3],
  ['tram', 'Yellow tram', 'Lisbon', 1.1],
  ['tile', 'Azulejo wall', 'Porto', 1.0],
  ['bridge', 'Iron bridge', 'Porto', 0.7],
  ['fort', 'Fortress at noon', 'Sagres', 0.85],
  ['net', 'Drying nets', 'Nazaré', 1.25],
  ['lighthouse', 'Lighthouse', 'Cabo da Roca', 1.45],
  ['market', 'Fish market', 'Olhão', 0.9],
  ['alley', 'Blue alley', 'Óbidos', 1.35],
  ['surf', 'First set', 'Ericeira', 0.75],
  ['cork', 'Cork oaks', 'Alentejo', 0.7],
  ['window', 'Green shutters', 'Tavira', 1.2],
  ['cafe', 'Corner café', 'Coimbra', 1.0],
  ['stairs', 'Steps to the sea', 'Sesimbra', 1.4],
  ['vineyard', 'Terraces', 'Douro', 0.65],
  ['moon', 'Moonrise', 'Comporta', 1.15],
  ['kite', 'Kite, offshore', 'Guincho', 0.8],
  ['rock', 'Sea stack', 'Benagil', 1.3],
  ['rain', 'After the rain', 'Sintra', 1.1],
  ['palace', 'Palace gate', 'Sintra', 0.9],
  ['fog', 'Morning fog', 'Serra da Estrela', 0.7],
  ['lamp', 'Street lamp', 'Évora', 1.4],
  ['cathedral', 'Cathedral', 'Braga', 1.25],
  ['ferry', 'Last ferry', 'Cacilhas', 0.75],
  ['cliffs2', 'Chalk cliffs', 'Aljezur', 0.85],
  ['pool', 'Rock pool', 'Praia da Luz', 1.0],
  ['boats', 'Moliceiros', 'Aveiro', 0.7],
];

@Component({ selector: 'demo-photos', templateUrl: 'photos.component.html', styleUrl: 'photos.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class PhotosComponent {
  readonly columns = signal(2);

  readonly photos: Photo[] = raw.map(([seed, title, loc, ratio], i) => ({
    seed,
    title,
    loc,
    year: String(2021 + (i % 5)),
    ratio,
    src: `https://picsum.photos/seed/mason-${seed}/${ratio >= 1 ? '400/560' : '560/400'}`,
  }));

  readonly featured = { ...this.photos[15], src: 'https://picsum.photos/seed/mason-lighthouse/900/560' };
  readonly recent = this.photos.slice(0, 12);

  /** Shortest-column-first placement so column bottoms stay roughly level. */
  readonly masonry = computed(() => {
    const cols: Photo[][] = Array.from({ length: this.columns() }, () => []);
    const heights = cols.map(() => 0);
    for (const p of this.photos) {
      const target = heights.indexOf(Math.min(...heights));
      cols[target].push(p);
      heights[target] += this.cellHeight(p) + 8;
    }
    return cols;
  });

  thumb(p: Photo) {
    return `https://picsum.photos/seed/mason-${p.seed}/200/200`;
  }

  /** Column width in dp for the current column count (page padding 16, gap 8). */
  cellHeight(p: Photo) {
    const width = (Screen.mainScreen.widthDIPs - 32 - 8 * (this.columns() - 1)) / this.columns();
    return Math.round(width * p.ratio);
  }
}
