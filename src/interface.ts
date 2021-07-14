export type AxisFields = 'x' | 'y'
export type ValueFields = AxisFields | 'value'

export interface Point {
  x: number;
  y: number;
}

export interface DataPoint extends Point {
  value: number;
  radius?: number;
}
