import { InputBase } from './common';
export class Input extends InputBase {
  value: string;
  valueAsNumber: number;
  valueAsDate: Date | null;
}
