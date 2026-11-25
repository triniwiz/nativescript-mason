/** `[1, 2, ..., count]`, for `@for` loops over a number. */
export const range = (count: number): number[] => Array.from({ length: count }, (_, i) => i + 1);
