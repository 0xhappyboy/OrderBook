<h1 align="center">
   OrderBook
</h1>
<h4 align="center">
a collection of components related to an order book.
</h4>
<p align="center">
  <a href="https://github.com/0xhappyboy/solana-trader/LICENSE"><img src="https://img.shields.io/badge/License-Apache2.0-d1d1f6.svg?style=flat&labelColor=1C2C2E&color=BEC5C9&logo=googledocs&label=license&logoColor=BEC5C9" alt="License"></a>
</p>
<p align="center">
<a href="./README_zh-CN.md">简体中文</a> | <a href="./README.md">English</a>
</p>

# OrderDepth

## Basic Usage

```typescript
import { OrderDepth } from './OrderDepth';

<OrderDepth
  bids={bidsData}
  asks={asksData}
  depth={10}
  displayMode="split"
  theme="dark"
/>

<OrderDepth
  bids={bidsData}
  asks={asksData}
  depth={5}
  displayMode="left"
  theme={{
    backgroundColor: '#1a1a1a',
    bidColor: '#10b981',
    askColor: '#ef4444'
  }}
  locale="en"
  showHeader={true}
/>
```

## Props

| Property          | Type                                   | Default   | Description                       |
| ----------------- | -------------------------------------- | --------- | --------------------------------- |
| `bids`            | `OrderDepthItem[]`                     | `[]`      | Bid data array                    |
| `asks`            | `OrderDepthItem[]`                     | `[]`      | Ask data array                    |
| `depth`           | `number`                               | `5`       | Number of depth levels to display |
| `displayMode`     | `'left' \| 'right' \| 'split'`         | `'left'`  | Layout display mode               |
| `theme`           | `'light' \| 'dark' \| OrderDepthTheme` | `'light'` | Theme configuration               |
| `locale`          | `'zh-CN' \| 'en' \| OrderDepthLocale`  | `'zh-CN'` | Language localization             |
| `showHeader`      | `boolean`                              | `true`    | Whether to show table header      |
| `style`           | `React.CSSProperties`                  | `-`       | Custom container styles           |
| `className`       | `string`                               | `-`       | CSS class name for styling        |
| `bidColor`        | `string`                               | `-`       | Custom color for bid levels       |
| `askColor`        | `string`                               | `-`       | Custom color for ask levels       |
| `textColor`       | `string`                               | `-`       | Custom text color                 |
| `backgroundColor` | `string`                               | `-`       | Custom background color           |

## Preview

<div style="display: flex; gap: 5px;"> 
<img src="./assets/orderdepth_preview_1.png"  width="200" /> 
<img src="./assets/orderdepth_preview_2.png" width="200" /> 
<img src="./assets/orderdepth_preview_3.png"  width="200" /> 
</div>

# OrderFlow

## Basic Usage

```typescript
import OrderFlow, { OrderFlowItem } from './OrderFlow';

const orderData: OrderFlowItem[] = [
  {
    id: "1",
    price: 100.5,
    amount: 10,
    side: "buy",
    timestamp: Date.now(),
  },
  {
    id: "2",
    price: 101.2,
    amount: 5,
    side: "sell",
    timestamp: Date.now() - 1000,
  },
];

function App() {
  return (
    <OrderFlow
      data={orderData}
      theme="light"
      buyColor="#00a36c"
      sellColor="#ff4d4f"
    />
  );
}
```

## Props

### OrderFlowProps

| Prop              | Type                  | Default        | Description                        |
| ----------------- | --------------------- | -------------- | ---------------------------------- |
| `data`            | `OrderFlowItem[]`     | `[]`           | Order data                         |
| `maxItems`        | `number`              | -              | Maximum number of items to display |
| `buyColor`        | `string`              | `'#00a36c'`    | Buy text color                     |
| `sellColor`       | `string`              | `'#ff4d4f'`    | Sell text color                    |
| `textColor`       | `string`              | -              | Text color                         |
| `backgroundColor` | `string`              | -              | Background color                   |
| `showHeader`      | `boolean`             | `true`         | Whether to show header             |
| `listHead`        | `ListHeadItem[]`      | Default header | Custom header configuration        |
| `style`           | `React.CSSProperties` | -              | Container styles                   |
| `className`       | `string`              | -              | CSS class name                     |
| `theme`           | `'light' \| 'dark'`   | `'light'`      | Theme style                        |
| `buyText`         | `string`              | `'Buy'`        | Buy button text                    |
| `sellText`        | `string`              | `'Sell'`       | Sell button text                   |
| `noDataText`      | `string`              | `'No data'`    | Text to display when no data       |

### OrderFlowItem

| Prop        | Type              | Description          |
| ----------- | ----------------- | -------------------- |
| `id`        | `string`          | Order ID             |
| `price`     | `number`          | Price                |
| `amount`    | `number`          | Amount               |
| `side`      | `'buy' \| 'sell'` | Buy/Sell direction   |
| `timestamp` | `number`          | Timestamp (optional) |

### ListHeadItem

| Prop    | Type                  | Description                        |
| ------- | --------------------- | ---------------------------------- |
| `key`   | `string`              | Column key                         |
| `text`  | `string`              | Column display text                |
| `width` | `number`              | Column width percentage (optional) |
| `style` | `React.CSSProperties` | Column styles (optional)           |

## Preview

<div style="display: flex; gap: 5px;">
  <img src="./assets/orderflow_preview_1.png" alt="Light Theme Preview" width="400" />
  <img src="./assets/orderflow_preview_2.png" alt="Dark Theme Preview" width="400" />
</div>
