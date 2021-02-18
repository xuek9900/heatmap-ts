import Store, { StoreData } from './store'
import Renderer, { RendererConfig } from './renderer'
import DefaultConfig from './defaultConfig'
import { Point, DataPoint } from './interface'

interface Config extends RendererConfig {
  onExtremaChange?: Function
}

class HeatMap {

  config: Config;
  renderer: Renderer;
  store: Store;

  constructor(config: Config) {
    this.config = { ...DefaultConfig, ...config }
    this.renderer = new Renderer(this.config)
    this.store = new Store(this.config)

    this._init()
  }

  _init(): void {
    this.store.coordinator.on('renderpartial', this.renderer.renderPartial, this.renderer)
    this.store.coordinator.on('renderall', this.renderer.renderAll, this.renderer)
    this.store.coordinator.on('extremachange', (data: any) => {
      this.config.onExtremaChange &&
        this.config.onExtremaChange({
          min: data.min,
          max: data.max,
          gradient: this.config.gradient || this.config.defaultGradient
        });
    })
  }

  addData(data: DataPoint): this {
    this.store.addData(data)
    return this
  }


  setData(data: StoreData): this {
    this.store.setData(data);
    return this;
  }

  setDataMaxx(max: number): this {
    this.store.setDataMax(max)
    return this
  }

  setDataMin(min: number): this {
    this.store.setDataMin(min)
    return this
  }

  repaint(): this {
    this.store.coordinator.emit('renderall', this.store._getInternalData())
    return this
  }

  getData(): StoreData {
    return this.store.getData()
  }
  getDataURL(): string {
    return this.renderer.getDataURL()
  }

  getValueAt(point: Point): number {
    return this.renderer.getValueAt(point)
  }

}

export { Config }

export default HeatMap
