# heatmap-ts

Forked from [pa7/heatmap.js](https://github.com/pa7/heatmap.js) for TypeScript.

> Tips: plugin register is not yet implemented. If you need it, please mention the problem or push your code through PR.

## Install
```bash
yarn add heatmap-ts -S
# or
npm i heatmap-ts -S
```

## Use

For more details, see [heatmap.js](https://github.com/pa7/heatmap.js).

```ts
import HeatMap from 'heatmap-ts'

const heatMap = new HeatMap({
  container: document.getElementById('view'),
  maxOpacity: .6,
  radius: 50,
  blur: 0.90,
})

heatMap.setData({
  max: 100,
  min: 1,
  data: [
    {
      x: 100,
      y: 100,
      value: 100,
      radius: 20
    },
    {
      x: 200,
      y: 250,
      value: 50,
      radius: 30
    }
  ]
})

```

