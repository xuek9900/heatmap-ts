import { AxisFields, ValueFields, DataPoint } from './interface'
import { defaultConfig } from './defaultConfig'
import Coordinator from './coordinator'

interface StoreConfig extends defaultConfig {
  xField?: AxisFields;
  yField?: AxisFields;
  valueField?: ValueFields;
  radius?: number;
}

interface StoreData {
  max: number;
  min: number;
  data: DataPoint[];
}

interface StoreSourceData {
  max: number;
  min: number;
  data: number[][];
  radi: number[][];
}

class Store {

  coordinator: Coordinator;
  data: number[][];
  radi: number[][];
  min: number;
  max: number;
  xField: AxisFields;
  yField: AxisFields;
  valueField: ValueFields;
  radius: number;

  constructor(config: StoreConfig) {
    this.coordinator = new Coordinator
    this.data = []
    this.radi = []
    this.min = 10
    this.max = 1
    this.xField = config.xField || config.defaultXField
    this.yField = config.yField || config.defaultYField
    this.valueField = config.valueField || config.defaultValueField
    this.radius = config.radius || config.defaultRadius
  }

  // when forceRender = false -> called from setData, omits renderall event
  _organiseData(dataPoint: DataPoint, forceRender: boolean) {
    const x = dataPoint[this.xField]
    const y = dataPoint[this.yField]
    const radi = this.radi
    const data = this.data
    const max = this.max
    const min = this.min
    const value = dataPoint[this.valueField] || 1
    const radius = dataPoint.radius || this.radius

    if (!radi[x]) {
      data[x] = [];
      radi[x] = []
    } 
    if (!radi[x][y]) {
      data[x][y] = value;
      radi[x][y] = radius;
    } else {
      data[x][y] += value;
    }

    const storedVal = data[x][y];

    if (storedVal) {
      if (storedVal > max) {
        if (!forceRender) {
          this.max = storedVal;
        } else {
          this.setDataMax(storedVal);
        }
        return false;
      } else if (storedVal < min) {
        if (!forceRender) {
          this.min = storedVal;
        } else {
          this.setDataMin(storedVal);
        }
        return false;
      }
    } else {
      return {
        x,
        y,
        value,
        radius,
        min,
        max
      };
    }
  }

  _unOrganizeData(): StoreData {
    const unorganizedData: DataPoint[] = []

    for (let x = 0; x < this.radi.length; x++) {
      for (let y = 0; y < this.radi[x].length; y++) {
        unorganizedData.push({
          x,
          y,
          radius: this.radi[x][y],
          value: this.radi[x][y]
        });
      }
    }

    return {
      min: this.min,
      max: this.max,
      data: unorganizedData
    }
  }

  _onExtremaChange(): void {
    this.coordinator.emit('extremachange', {
      min: this.min,
      max: this.max
    })
  }

  addData(data: DataPoint): void {
    // add to store  
    const organisedEntry = this._organiseData(data, true);

    if (organisedEntry) {
      // if it's the first datapoint initialize the extremas with it
      if (this.data.length === 0) {
        this.min = organisedEntry.value
        this.max = organisedEntry.value
      }

      this.coordinator.emit('renderpartial', {
        min: this.min,
        max: this.max,
        data: [organisedEntry]
      })
    }
  }

  setData(resData: StoreData): this {
    const dataPoints = resData.data

    // reset data arrays
    this.data = []
    this.radi = []

    for (let i = 0; i < dataPoints.length; i++) {
      this._organiseData(dataPoints[i], false);
    }

    this.max = resData.max;
    this.min = resData.min || 0;

    this._onExtremaChange();
    this.coordinator.emit('renderall', this._getInternalData());

    return this;
  }

  setDataMax(max: number): this {
    this.max = max

    this._onExtremaChange()
    this.coordinator.emit('renderall', this._getInternalData())

    return this
  }

  setDataMin(min: number): this {
    this.min = min

    this._onExtremaChange()
    this.coordinator.emit('renderall', this._getInternalData())

    return this
  }

  _getInternalData(): StoreSourceData {
    return {
      max: this.max,
      min: this.min,
      data: this.data,
      radi: this.radi
    }
  }

  getData(): StoreData {
    return this._unOrganizeData()
  }

}

export { StoreConfig, StoreData, StoreSourceData }

export default Store
