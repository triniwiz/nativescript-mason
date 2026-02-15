export class TextNode {
  data: string;

  readonly length: number;

  appendData(s: string): this;

  deleteData(offset: number, count: number): this;

  insertData(s: string, offset: number): this;

  substringData(offset: number, count: number): string;
}
