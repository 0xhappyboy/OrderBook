import React from 'react';

export interface OrderFlowItem {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp?: number;
}

export interface ListHeadItem {
  key: string;
  text: string;
  width?: number;
  style?: React.CSSProperties;
}

interface OrderFlowProps {
  data?: OrderFlowItem[];
  maxItems?: number;
  buyColor?: string;
  sellColor?: string;
  textColor?: string;
  backgroundColor?: string;
  showHeader?: boolean;
  listHead?: ListHeadItem[];
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
  buyText?: string;
  sellText?: string;
  noDataText?: string;
}

interface OrderFlowState {
  orders: OrderFlowItem[];
  visibleRows: number;
}

const themeConfig: Record<string, {
  backgroundColor: string;
  textColor: string;
  headerBackground: string;
  headerText: string;
  borderColor: string;
  rowBackground1: string;
  rowBackground2: string;
  noDataColor: string;
}> = {
  light: {
    backgroundColor: '#fff',
    textColor: '#333',
    headerBackground: '#fafafa',
    headerText: '#333',
    borderColor: '#e8e8e8',
    rowBackground1: '#fff',
    rowBackground2: '#fafafa',
    noDataColor: '#999'
  },
  dark: {
    backgroundColor: '#1a1a1a',
    textColor: '#e0e0e0',
    headerBackground: '#2d2d2d',
    headerText: '#e0e0e0',
    borderColor: '#404040',
    rowBackground1: '#1a1a1a',
    rowBackground2: '#2d2d2d',
    noDataColor: '#888'
  }
};

export class OrderFlow extends React.Component<OrderFlowProps, OrderFlowState> {
  private containerRef: React.RefObject<HTMLDivElement | null>;
  constructor(props: OrderFlowProps) {
    super(props);
    this.state = {
      orders: [],
      visibleRows: 10
    };
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.calculateVisibleRows();
    window.addEventListener('resize', this.calculateVisibleRows);
  }

  componentDidUpdate(prevProps: OrderFlowProps, prevState: OrderFlowState) {
    if (
      prevProps.data !== this.props.data ||
      prevState.visibleRows !== this.state.visibleRows
    ) {
      this.updateOrders();
    }
    if (prevProps.style?.height !== this.props.style?.height) {
      setTimeout(() => this.calculateVisibleRows(), 0);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.calculateVisibleRows);
  }

  getCurrentTheme = () => {
    const { theme } = this.props;
    return theme ? themeConfig[theme] : null;
  }

  calculateVisibleRows = () => {
    const container = this.containerRef.current;
    if (!container) return;
    const { showHeader = true } = this.props;
    const containerHeight = container.clientHeight;
    const headerHeight = showHeader ? 40 : 0;
    const availableHeight = containerHeight - headerHeight;
    const estimatedRowHeight = 32;
    const visibleRows = Math.max(1, Math.floor(availableHeight / estimatedRowHeight));
    if (visibleRows !== this.state.visibleRows) {
      this.setState({ visibleRows });
    }
  }

  updateOrders = () => {
    const { data = [] } = this.props;
    const { visibleRows } = this.state;
    const sortedData = [...data].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
    const limitedData = sortedData.slice(0, visibleRows);
    this.setState({ orders: limitedData });
  }

  static getDerivedStateFromProps(nextProps: OrderFlowProps, prevState: OrderFlowState) {
    if (nextProps.data !== undefined) {
      const visibleRows = prevState.visibleRows || 10;
      const sortedData = [...(nextProps.data || [])].sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });
      const limitedData = sortedData.slice(0, visibleRows);
      return { orders: limitedData };
    }
    return null;
  }

  formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  formatTime = (timestamp?: number): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }

  getDefaultListHead = (): ListHeadItem[] => [
    { key: 'side', text: '方向', width: 20 },
    { key: 'price', text: '价格', width: 30 },
    { key: 'amount', text: '数量', width: 30 },
    { key: 'timestamp', text: '时间', width: 20 }
  ]

  getValidatedListHead = (): ListHeadItem[] => {
    const { listHead } = this.props;
    const headerConfig = listHead || this.getDefaultListHead();
    const totalWidth = headerConfig.reduce((sum, item) => sum + (item.width || 0), 0);
    if (totalWidth !== 100 && totalWidth > 0) {
      return headerConfig.map(item => ({
        ...item,
        width: Math.round((item.width || 0) * 100 / totalWidth)
      }));
    }
    return headerConfig;
  }

  getRowDataByKey = (order: OrderFlowItem, key: string): string => {
    const { buyText = '买入', sellText = '卖出' } = this.props;
    switch (key) {
      case 'side':
        return order.side === 'buy' ? buyText : sellText;
      case 'price':
        return this.formatNumber(order.price);
      case 'amount':
        return this.formatNumber(order.amount);
      case 'timestamp':
        return this.formatTime(order.timestamp);
      default:
        return String(order[key as keyof OrderFlowItem] || '');
    }
  }

  getColumnStyle = (headItem: ListHeadItem): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '0 8px',
      width: `${headItem.width}%`,
      boxSizing: 'border-box'
    };
    return { ...baseStyle, ...headItem.style };
  }

  renderHeader = () => {
    const headerConfig = this.getValidatedListHead();
    const currentTheme = this.getCurrentTheme();
    const headerStyle: React.CSSProperties = {
      display: 'flex',
      padding: '8px 0',
      backgroundColor: currentTheme?.headerBackground || '#fafafa',
      borderBottom: `1px solid ${currentTheme?.borderColor || '#e8e8e8'}`,
      fontWeight: 'bold',
      fontSize: '12px',
      height: '40px',
      boxSizing: 'border-box',
      alignItems: 'center',
      color: currentTheme?.headerText || '#333'
    };
    return (
      <div style={headerStyle}>
        {headerConfig.map((headItem) => (
          <div
            key={headItem.key}
            style={this.getColumnStyle(headItem)}
          >
            {headItem.text}
          </div>
        ))}
      </div>
    );
  }

  render() {
    const {
      buyColor = '#00a36c',
      sellColor = '#ff4d4f',
      backgroundColor,
      textColor,
      showHeader = true,
      style,
      className,
      theme,
      noDataText = '暂无数据'
    } = this.props;
    const { orders, visibleRows } = this.state;
    const currentTheme = this.getCurrentTheme();
    const finalBackgroundColor = backgroundColor || currentTheme?.backgroundColor || '#fff';
    const finalTextColor = textColor || currentTheme?.textColor || '#333';
    const finalBorderColor = currentTheme?.borderColor || '#e8e8e8';
    const finalNoDataColor = currentTheme?.noDataColor || '#999';
    const containerStyle: React.CSSProperties = {
      backgroundColor: finalBackgroundColor,
      border: `1px solid ${finalBorderColor}`,
      borderRadius: '4px',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      height: '400px',
      ...style
    };
    const rowHeightPercent = 100 / visibleRows;
    const headerConfig = this.getValidatedListHead();
    const rowStyle: React.CSSProperties = {
      display: 'flex',
      padding: '0',
      borderBottom: `1px solid ${finalBorderColor}`,
      height: `${rowHeightPercent}%`,
      boxSizing: 'border-box',
      alignItems: 'center'
    };
    const getRowBackgroundColor = (index: number) => {
      if (currentTheme) {
        return index % 2 === 0 ? currentTheme.rowBackground1 : currentTheme.rowBackground2;
      }
      return index % 2 === 0 ? '#fff' : '#fafafa';
    };
    return (
      <div
        ref={this.containerRef}
        className={className}
        style={containerStyle}
      >
        {showHeader && this.renderHeader()}
        <div style={{
          height: showHeader ? 'calc(100% - 40px)' : '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {orders.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: finalNoDataColor
              }}
            >
              {noDataText}
            </div>
          ) : (
            orders.map((order, index) => (
              <div
                key={order.id || `order-${index}`}
                style={{
                  ...rowStyle,
                  backgroundColor: getRowBackgroundColor(index)
                }}
              >
                {headerConfig.map((headItem) => {
                  const cellStyle = this.getColumnStyle(headItem);
                  const cellValue = this.getRowDataByKey(order, headItem.key);
                  if (headItem.key === 'side') {
                    return (
                      <div
                        key={headItem.key}
                        style={{
                          ...cellStyle,
                          color: order.side === 'buy' ? buyColor : sellColor,
                          fontWeight: 'bold'
                        }}
                      >
                        {cellValue}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={headItem.key}
                      style={{
                        ...cellStyle,
                        color: finalTextColor
                      }}
                    >
                      {cellValue}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}

export default OrderFlow;