import { InputElementBase } from './common';
export class Input extends InputElementBase {
  value: string;
  checked: boolean;
  valueAsNumber: number;
  valueAsDate: Date | null;
}
