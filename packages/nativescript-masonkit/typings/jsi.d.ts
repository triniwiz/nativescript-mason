declare global {
  function __Mason_getDisplay(style: number): number;
  function __Mason_setDisplay(mason: number, node: number, style: number, display: number, update: boolean);

  function __Mason_getWidth(style: number): string;
  function __Mason_setWidth(mason: number, node: number, style: number, value: number, value_type: number, update: boolean);

  function __Mason_getHeight(style: number): string;
  function __Mason_setHeight(mason: number, node: number, style: number, value: number, value_type: number, update: boolean);

  function __Mason_getPositionType(style: number): number;
  function __Mason_setPositionType(mason: number, node: number, style: number, display: number, update: boolean);
}
