import { StoreConfig, StoreData } from './store'
import DefaultConfigs, { DefaultConfig } from './defaultConfig'
import { Point, DataPoint } from './interface'

interface RendererConfig extends StoreConfig {
  container?: HTMLElement;
  canvas?: HTMLCanvasElement;
  shadowCanvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  gradient?: DefaultConfig['defaultGradient'];
  blur?: DefaultConfig['defaultBlur'];
  backgroundColor?: string;
  opacity?: number;
  maxOpacity?: number;
  minOpacity?: number;
  useGradientOpacity?: boolean;
}

class Renderer {

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  shadowCanvas: HTMLCanvasElement;
  shadowCtx: CanvasRenderingContext2D | null;

  width: number;
  height: number;

  max: number;
  min: number;
  radius: number;

  blur: number;
  opacity: number;
  maxOpacity: number;
  minOpacity: number;
  useGradientOpacity: boolean;

  renderBoundaries: number[];
  palette: Uint8ClampedArray;
  templates: any[];

  constructor(config: RendererConfig) {

    this.canvas = config.canvas || document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')

    this.shadowCanvas = config.shadowCanvas || document.createElement('canvas')
    this.shadowCtx = this.shadowCanvas.getContext('2d')

    this.width = config.width || 512
    this.height = config.height || 512

    this.max = 100
    this.min = 1
    this.radius = config.radius || 50

    this.blur = 1
    this.opacity = 1
    this.maxOpacity = 1
    this.minOpacity = 0

    this.useGradientOpacity = false

    this.canvas.style.cssText = this.shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;'

    if (config.container) {

      config.container.style.position = 'relative'
      config.container.appendChild(this.canvas)

    }

    this.renderBoundaries = [10000, 10000, 0, 0]
    this.palette = this._getColorPalette(config)
    this.templates = []

    this._setStyles(config)
  }

  renderPartial(resData: StoreData): void {
    if (resData.data.length > 0) {
      this._drawAlpha(resData);
      this._colorize();
    }
  }

  renderAll(resData: StoreData): void {
    this._clear()
    if (resData.data.length > 0) {
      this._drawAlpha(this._prepareData(resData))
      this._colorize()
    }
  }

  updateConfig(config: RendererConfig): void {
    if (config.gradient) this._updateGradient(config)
    this._setStyles(config)
  }

  setDimensions(width: number, height: number): void {
    this.width = this.canvas.width = this.shadowCanvas.width = width;
    this.height = this.canvas.height = this.shadowCanvas.height = height;
  }

  getValueAt(point: Point): number {
    if (!this.shadowCtx) return 0

    const img = this.shadowCtx.getImageData(point.x, point.y, 1, 1)

    return (Math.abs(this.max - this.min) * (img.data[3] / 255)) >> 0
  }

  getDataURL(): string {
    return this.canvas.toDataURL()
  }

  _getColorPalette(config: RendererConfig): Uint8ClampedArray {
    const gradientConfig = config.gradient || DefaultConfigs.defaultGradient
    const paletteCanvas = document.createElement('canvas')
    const paletteCtx = paletteCanvas.getContext('2d')

    paletteCanvas.width = 256
    paletteCanvas.height = 1

    if (!paletteCtx) return new Uint8ClampedArray(1024)

    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1)
    for (var key in gradientConfig) {
      gradient.addColorStop(Number(key), gradientConfig[key])
    }

    paletteCtx.fillStyle = gradient
    paletteCtx.fillRect(0, 0, 256, 1)

    return paletteCtx.getImageData(0, 0, 256, 1).data
  }

  _getPointTemplate(radius: number, blurFactor: number): HTMLCanvasElement {
    const tplCanvas = document.createElement('canvas')
    const tplCtx = tplCanvas.getContext('2d')

    if (!tplCtx) return tplCanvas

    const x = radius
    const y = radius

    tplCanvas.width = tplCanvas.height = radius * 2

    if (blurFactor === 1) {
      tplCtx.beginPath()
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false)
      tplCtx.fillStyle = 'rgba(0,0,0,1)'
      tplCtx.fill()
    } else {
      var gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius)
      gradient.addColorStop(0, 'rgba(0,0,0,1)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      tplCtx.fillStyle = gradient
      tplCtx.fillRect(0, 0, 2 * radius, 2 * radius)
    }

    return tplCanvas
  }

  _prepareData(resData: any): StoreData {
    const renderData: DataPoint[] = [];
    const min = resData.min
    const max = resData.max
    const radi = resData.radi
    const data = resData.data

    const xValues = Object.keys(data)
    let xValuesLen = xValues.length

    while (xValuesLen--) {

      const xValue = xValues[xValuesLen]
      const yValues = Object.keys(data[xValue])

      let yValuesLen = yValues.length

      while (yValuesLen--) {

        const yValue = yValues[yValuesLen]
        const value = data[xValue][yValue]
        const radius = radi[xValue][yValue]

        renderData.push({
          x: Number(xValue),
          y: Number(yValue),
          value,
          radius
        })

      }
    }

    return {
      min: min,
      max: max,
      data: renderData
    }

  }

  _setStyles(config: RendererConfig): void {
    this.blur = config.blur === 0 ? 0 : (config.blur || DefaultConfigs.defaultBlur)

    if (config.backgroundColor) {
      this.canvas.style.backgroundColor = config.backgroundColor
    }

    this.width = this.canvas.width = this.shadowCanvas.width = config.width || this.width
    this.height = this.canvas.height = this.shadowCanvas.height = config.height || this.height

    this.opacity = (config.opacity || 0) * 255
    this.maxOpacity = (config.maxOpacity || DefaultConfigs.defaultMaxOpacity) * 255
    this.minOpacity = (config.minOpacity || DefaultConfigs.defaultMinOpacity) * 255
    this.useGradientOpacity = !!config.useGradientOpacity
  }

  _updateGradient(config: RendererConfig): void {
    this.palette = this._getColorPalette(config)
  }

  _drawAlpha(resData: StoreData): void {
    const min = this.min = resData.min || 0
    const max = this.max = resData.max || 100
    const data = resData.data || []

    let dataLen = data.length
    // on a point basis?
    const blur = 1 - this.blur

    while (dataLen--) {

      const point = data[dataLen]

      const x = point.x
      const y = point.y
      const radius = point.radius || this.radius
      
      // if value is bigger than max
      // use max as value
      const value = Math.min(point.value, max)
      const rectX = x - radius 
      const rectY = y - radius

      if (!this.shadowCtx) return

      let tpl
      if (!this.templates[radius]) {
        this.templates[radius] = tpl = this._getPointTemplate(radius, blur)
      } else {
        tpl = this.templates[radius]
      }
      // value from minimum / value range
      // => [0, 1]
      const templateAlpha = (value - min) / (max - min)
      // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
      this.shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha

      this.shadowCtx.drawImage(tpl, rectX, rectY)

      // update renderBoundaries
      if (rectX < this.renderBoundaries[0]) {
        this.renderBoundaries[0] = rectX
      }
      if (rectY < this.renderBoundaries[1]) {
        this.renderBoundaries[1] = rectY
      }
      if (rectX + 2 * radius > this.renderBoundaries[2]) {
        this.renderBoundaries[2] = rectX + 2 * radius
      }
      if (rectY + 2 * radius > this.renderBoundaries[3]) {
        this.renderBoundaries[3] = rectY + 2 * radius
      }

    }

  }

  _colorize(): void {
    let x = this.renderBoundaries[0]
    let y = this.renderBoundaries[1]
    let width = this.renderBoundaries[2] - x
    let height = this.renderBoundaries[3] - y

    const maxWidth = this.width
    const maxHeight = this.height

    if (x < 0) {
      x = 0
    }
    if (y < 0) {
      y = 0
    }
    if (x + width > maxWidth) {
      width = maxWidth - x
    }
    if (y + height > maxHeight) {
      height = maxHeight - y
    }

    if (!this.ctx || !this.shadowCtx) return

    const img: ImageData = this.shadowCtx.getImageData(x, y, width, height)

    for (var i = 3; i < img.data.length; i += 4) {
      var alpha = img.data[i]
      var offset = alpha * 4

      if (!offset) {
        continue
      }

      var finalAlpha
      if (this.opacity > 0) {
        finalAlpha = this.opacity
      } else {
        if (alpha < this.maxOpacity) {
          if (alpha < this.minOpacity) {
            finalAlpha = this.minOpacity
          } else {
            finalAlpha = alpha
          }
        } else {
          finalAlpha = this.maxOpacity
        }
      }

      img.data[i - 3] = this.palette[offset]
      img.data[i - 2] = this.palette[offset + 1]
      img.data[i - 1] = this.palette[offset + 2]
      img.data[i] = this.useGradientOpacity ? this.palette[offset + 3] : finalAlpha

    }

    this.ctx.putImageData(img, x, y)

    this.renderBoundaries = [1000, 1000, 0, 0]
  }

  _clear(): void {
    if (!this.ctx || !this.shadowCtx) return

    this.ctx.clearRect(0, 0, this.width, this.height)
    this.shadowCtx.clearRect(0, 0, this.width, this.height)
  }

}

export { RendererConfig }

export default Renderer
