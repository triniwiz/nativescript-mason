/** Opcodes in the flat command list: M x y, L x y, C x1 y1 x2 y2 x y, Q x1 y1 x y, Z. */
export declare const PATH_MOVE = 0;
export declare const PATH_LINE = 1;
export declare const PATH_CUBIC = 2;
export declare const PATH_QUAD = 3;
export declare const PATH_CLOSE = 4;

/** SVG path data as absolute commands for Direct2D. Windows only. */
export declare function pathCommands(d: string): number[];
