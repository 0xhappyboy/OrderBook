import React from 'react';

export interface OrderDepthItem {
  price: number;
  amount: number;
  total?: number;
}

type DepthDisplayMode = 'left' | 'right' | 'split';

interface OrderDepthTheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  headerBackground: string;
  dividerColor: string;
  rowBackground: string;
  bidColor: string;
  askColor: string;
  hoverColor?: string;
}

interface OrderDepthLocale {
  direction: string;
  price: string;
  amount: string;
  bidPrefix: string;
  askPrefix: string;
}

const OrderDepthThemes = {
  light: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#e8e8e8',
    headerBackground: '#fafafa',
    dividerColor: '#f0f0f0',
    rowBackground: '#ffffff',
    bidColor: '#00a36c',
    askColor: '#ff4d4f',
    hoverColor: '#f5f5f5'
  } as OrderDepthTheme,
  dark: {
    backgroundColor: '#1f1f1f',
    textColor: '#e8e8e8',
    borderColor: '#434343',
    headerBackground: '#262626',
    dividerColor: '#303030',
    rowBackground: '#1f1f1f',
    bidColor: '#49aa19',
    askColor: '#d32029',
    hoverColor: '#2a2a2a'
  } as OrderDepthTheme
};

const OrderDepthLocales = {
  'zh-CN': {
    direction: '方向',
    price: '价格',
    amount: '数量',
    bidPrefix: '买',
    askPrefix: '卖'
  } as OrderDepthLocale,
  'en': {
    direction: 'Direction',
    price: 'Price',
    amount: 'Amount',
    bidPrefix: 'Bid',
    askPrefix: 'Ask'
  } as OrderDepthLocale
};

interface OrderDepthProps {
  bids?: OrderDepthItem[];
  asks?: OrderDepthItem[];
  depth?: number;
  displayMode?: DepthDisplayMode;
  style?: React.CSSProperties;
  bidColor?: string;
  askColor?: string;
  textColor?: string;
  backgroundColor?: string;
  showHeader?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | OrderDepthTheme;
  locale?: 'zh-CN' | 'en' | OrderDepthLocale;
}

interface OrderDepthState {
  bids: OrderDepthItem[];
  asks: OrderDepthItem[];
  hoveredRow: string | null;
}

export class OrderDepth extends React.Component<OrderDepthProps, OrderDepthState> {
  constructor(props: OrderDepthProps) {
    super(props);
    this.state = {
      bids: this.processDepthData(props.bids || [], props.depth || 5, 'bids'),
      asks: this.processDepthData(props.asks || [], props.depth || 5, 'asks'),
      hoveredRow: null
    };
  }

  componentDidUpdate(prevProps: OrderDepthProps) {
    if (prevProps.bids !== this.props.bids || prevProps.asks !== this.props.asks || prevProps.depth !== this.props.depth) {
      const depth = this.props.depth || 5;
      this.setState({
        bids: this.processDepthData(this.props.bids || [], depth, 'bids'),
        asks: this.processDepthData(this.props.asks || [], depth, 'asks')
      });
    }
  }

  getTheme = (): OrderDepthTheme => {
    const { theme = 'light' } = this.props;
    if (typeof theme === 'string') {
      return OrderDepthThemes[theme] || OrderDepthThemes.light;
    }
    return theme;
  }

  getLocale = (): OrderDepthLocale => {
    const { locale = 'zh-CN' } = this.props;
    if (typeof locale === 'string') {
      return OrderDepthLocales[locale] || OrderDepthLocales['zh-CN'];
    }
    return locale;
  }

  processDepthData = (data: OrderDepthItem[], depth: number, type: 'bids' | 'asks'): OrderDepthItem[] => {
    const sortedData = type === 'bids'
      ? [...data].sort((a, b) => b.price - a.price)
      : [...data].sort((a, b) => a.price - b.price);
    const limitedData = sortedData.slice(0, depth);
    return limitedData.map((item, index) => ({
      ...item,
      total: limitedData.slice(0, index + 1).reduce((sum, curr) => sum + curr.amount, 0)
    }));
  }

  formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  handleRowHover = (rowId: string | null) => {
    this.setState({ hoveredRow: rowId });
  }

  getRowHeight = (totalRows: number): string => {
    return `${100 / totalRows}%`;
  }

  renderLeftMode = () => {
    const { bids, asks, hoveredRow } = this.state;
    const theme = this.getTheme();
    const locale = this.getLocale();
    const { bidColor = theme.bidColor, askColor = theme.askColor } = this.props;
    const totalRows = asks.length + bids.length;
    return (
      <div style={{ height: '100%' }}>
        {asks.map((item, index) => {
          const rowId = `ask-${index}`;
          const isHovered = hoveredRow === rowId;
          return (
            <div
              key={rowId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderBottom: `1px solid ${theme.dividerColor}`,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isHovered ? theme.hoverColor : theme.rowBackground,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                height: this.getRowHeight(totalRows),
                boxSizing: 'border-box'
              }}
              onMouseEnter={() => this.handleRowHover(rowId)}
              onMouseLeave={() => this.handleRowHover(null)}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: `${Math.min((item.total || 0) / (asks[asks.length - 1]?.total || 1) * 100, 100)}%`,
                  backgroundColor: askColor,
                  opacity: 0.1,
                  zIndex: 0
                }}
              />
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.amount)}
              </span>
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.price)}
              </span>
              <span style={{ color: askColor, zIndex: 1, position: 'relative' }}>
                {locale.askPrefix}{index + 1}
              </span>
            </div>
          );
        })}
        {bids.map((item, index) => {
          const rowId = `bid-${index}`;
          const isHovered = hoveredRow === rowId;
          return (
            <div
              key={rowId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderBottom: `1px solid ${theme.dividerColor}`,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isHovered ? theme.hoverColor : theme.rowBackground,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                height: this.getRowHeight(totalRows),
                boxSizing: 'border-box'
              }}
              onMouseEnter={() => this.handleRowHover(rowId)}
              onMouseLeave={() => this.handleRowHover(null)}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: `${Math.min((item.total || 0) / (bids[bids.length - 1]?.total || 1) * 100, 100)}%`,
                  backgroundColor: bidColor,
                  opacity: 0.1,
                  zIndex: 0
                }}
              />
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.amount)}
              </span>
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.price)}
              </span>
              <span style={{ color: bidColor, zIndex: 1, position: 'relative' }}>
                {locale.bidPrefix}{index + 1}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  renderRightMode = () => {
    const { bids, asks, hoveredRow } = this.state;
    const theme = this.getTheme();
    const locale = this.getLocale();
    const { bidColor = theme.bidColor, askColor = theme.askColor } = this.props;
    const totalRows = asks.length + bids.length;
    return (
      <div style={{ height: '100%' }}>
        {asks.map((item, index) => {
          const rowId = `ask-${index}`;
          const isHovered = hoveredRow === rowId;
          return (
            <div
              key={rowId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderBottom: `1px solid ${theme.dividerColor}`,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isHovered ? theme.hoverColor : theme.rowBackground,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                height: this.getRowHeight(totalRows),
                boxSizing: 'border-box'
              }}
              onMouseEnter={() => this.handleRowHover(rowId)}
              onMouseLeave={() => this.handleRowHover(null)}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${Math.min((item.total || 0) / (asks[asks.length - 1]?.total || 1) * 100, 100)}%`,
                  backgroundColor: askColor,
                  opacity: 0.1,
                  zIndex: 0
                }}
              />
              <span style={{ color: askColor, zIndex: 1, position: 'relative' }}>
                {locale.askPrefix}{index + 1}
              </span>
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.price)}
              </span>
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.amount)}
              </span>
            </div>
          );
        })}
        {bids.map((item, index) => {
          const rowId = `bid-${index}`;
          const isHovered = hoveredRow === rowId;
          return (
            <div
              key={rowId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderBottom: `1px solid ${theme.dividerColor}`,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isHovered ? theme.hoverColor : theme.rowBackground,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                height: this.getRowHeight(totalRows),
                boxSizing: 'border-box'
              }}
              onMouseEnter={() => this.handleRowHover(rowId)}
              onMouseLeave={() => this.handleRowHover(null)}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${Math.min((item.total || 0) / (bids[bids.length - 1]?.total || 1) * 100, 100)}%`,
                  backgroundColor: bidColor,
                  opacity: 0.1,
                  zIndex: 0
                }}
              />
              <span style={{ color: bidColor, zIndex: 1, position: 'relative' }}>
                {locale.bidPrefix}{index + 1}
              </span>
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.price)}
              </span>
              <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                {this.formatNumber(item.amount)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  renderSplitMode = () => {
    const { bids, asks, hoveredRow } = this.state;
    const theme = this.getTheme();
    const locale = this.getLocale();
    const { bidColor = theme.bidColor, askColor = theme.askColor } = this.props;
    const bidRowHeight = this.getRowHeight(bids.length);
    const askRowHeight = this.getRowHeight(asks.length);
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, borderRight: `1px solid ${theme.borderColor}` }}>
          {bids.map((item, index) => {
            const rowId = `bid-${index}`;
            const isHovered = hoveredRow === rowId;
            return (
              <div
                key={rowId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  borderBottom: `1px solid ${theme.dividerColor}`,
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: isHovered ? theme.hoverColor : theme.rowBackground,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  height: bidRowHeight,
                  boxSizing: 'border-box'
                }}
                onMouseEnter={() => this.handleRowHover(rowId)}
                onMouseLeave={() => this.handleRowHover(null)}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    height: '100%',
                    width: `${Math.min((item.total || 0) / (bids[bids.length - 1]?.total || 1) * 100, 100)}%`,
                    backgroundColor: bidColor,
                    opacity: 0.1,
                    zIndex: 0
                  }}
                />
                <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                  {this.formatNumber(item.amount)}
                </span>
                <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                  {this.formatNumber(item.price)}
                </span>
                <span style={{ color: bidColor, zIndex: 1, position: 'relative' }}>
                  {locale.bidPrefix}{index + 1}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, borderLeft: `1px solid ${theme.borderColor}` }}>
          {asks.map((item, index) => {
            const rowId = `ask-${index}`;
            const isHovered = hoveredRow === rowId;
            return (
              <div
                key={rowId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  borderBottom: `1px solid ${theme.dividerColor}`,
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: isHovered ? theme.hoverColor : theme.rowBackground,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  height: askRowHeight,
                  boxSizing: 'border-box'
                }}
                onMouseEnter={() => this.handleRowHover(rowId)}
                onMouseLeave={() => this.handleRowHover(null)}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${Math.min((item.total || 0) / (asks[asks.length - 1]?.total || 1) * 100, 100)}%`,
                    backgroundColor: askColor,
                    opacity: 0.1,
                    zIndex: 0
                  }}
                />
                <span style={{ color: askColor, zIndex: 1, position: 'relative' }}>
                  {locale.askPrefix}{index + 1}
                </span>
                <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                  {this.formatNumber(item.price)}
                </span>
                <span style={{ color: theme.textColor, zIndex: 1, position: 'relative' }}>
                  {this.formatNumber(item.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  renderHeader = () => {
    const { displayMode = 'left' } = this.props;
    const theme = this.getTheme();
    const locale = this.getLocale();
    if (displayMode === 'split') {
      return (
        <div style={{ display: 'flex' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px',
            backgroundColor: theme.headerBackground,
            borderBottom: `1px solid ${theme.borderColor}`,
            fontWeight: 'bold',
            color: theme.textColor
          }}>
            <span>{locale.amount}</span>
            <span>{locale.price}</span>
            <span>{locale.direction}</span>
          </div>
          <div style={{
            width: '20px',
            backgroundColor: theme.headerBackground,
            borderBottom: `1px solid ${theme.borderColor}`
          }}></div>
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px',
            backgroundColor: theme.headerBackground,
            borderBottom: `1px solid ${theme.borderColor}`,
            fontWeight: 'bold',
            color: theme.textColor
          }}>
            <span>{locale.direction}</span>
            <span>{locale.price}</span>
            <span>{locale.amount}</span>
          </div>
        </div>
      );
    }
    if (displayMode === 'left') {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px',
            backgroundColor: theme.headerBackground,
            borderBottom: `1px solid ${theme.borderColor}`,
            fontWeight: 'bold',
            color: theme.textColor
          }}
        >
          <span>{locale.amount}</span>
          <span>{locale.price}</span>
          <span>{locale.direction}</span>
        </div>
      );
    }
    if (displayMode === 'right') {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px',
            backgroundColor: theme.headerBackground,
            borderBottom: `1px solid ${theme.borderColor}`,
            fontWeight: 'bold',
            color: theme.textColor
          }}
        >
          <span>{locale.direction}</span>
          <span>{locale.price}</span>
          <span>{locale.amount}</span>
        </div>
      );
    }
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px',
          backgroundColor: theme.headerBackground,
          borderBottom: `1px solid ${theme.borderColor}`,
          fontWeight: 'bold',
          color: theme.textColor
        }}
      >
        <span>{locale.direction}</span>
        <span>{locale.price}</span>
        <span>{locale.amount}</span>
      </div>
    );
  }

  render() {
    const {
      style,
      showHeader = true,
      className,
      displayMode = 'left',
      theme = 'light',
      locale = 'zh-CN'
    } = this.props;
    const currentTheme = this.getTheme();
    const containerStyle: React.CSSProperties = {
      backgroundColor: currentTheme.backgroundColor,
      border: `1px solid ${currentTheme.borderColor}`,
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: currentTheme.textColor,
      userSelect: 'none',
      height: '100%',
      ...style
    };
    return (
      <div className={className} style={containerStyle}>
        {showHeader && this.renderHeader()}

        <div style={{ height: showHeader ? 'calc(100% - 40px)' : '100%' }}>
          {displayMode === 'left' && this.renderLeftMode()}
          {displayMode === 'right' && this.renderRightMode()}
          {displayMode === 'split' && this.renderSplitMode()}
        </div>
      </div>
    );
  }
}

export default OrderDepth;