declare global {
  function __Mason_getDisplay(style: number): number;
  function __Mason_setDisplay(style: number, display: number);

  function __Mason_getWidth(style: number): string;
  function __Mason_setWidth(style: number, value: number, value_type: number);

  function __Mason_getHeight(style: number): string;
  function __Mason_setHeight(style: number, value: number, value_type: number);

  function __Mason_getPositionType(style: number): number;
  function __Mason_setPositionType(style: number, display: number);
}
