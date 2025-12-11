import React from 'react';

export interface ListHeadItem {
  key: string;
  text: string;
  width?: number;
  style?: React.CSSProperties;
  formatter?: (value: any, order: Record<string, any>) => string;
  onClickData?: (data: Record<string, any>) => void;
  onTouchData?: (data: Record<string, any>) => React.ReactNode;
}

interface OrderFlowProps {
  data?: Record<string, any>[];
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
  scrollbarWidth?: number;
  scrollbarThumbColor?: string;
  scrollbarTrackColor?: string;
  showScrollbar?: boolean;
}

interface OrderFlowState {
  orders: Record<string, any>[];
  visibleRows: number;
  hoveredRowIndex: number | null;
  hoveredCell: string | null;
  touchedCell: {
    rowIndex: number;
    columnKey: string;
    data: Record<string, any>;
    x: number;
    y: number;
  } | null;
  scrollPosition: number;
  isScrolling: boolean;
  showScrollbar: boolean;
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
  hoverBackground: string;
  activeBackground: string;
  tooltipBackground: string;
  tooltipTextColor: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
  scrollbarThumbHover: string;
}> = {
  light: {
    backgroundColor: '#fff',
    textColor: '#333',
    headerBackground: '#fafafa',
    headerText: '#333',
    borderColor: '#e8e8e8',
    rowBackground1: '#fff',
    rowBackground2: '#fafafa',
    noDataColor: '#999',
    hoverBackground: '#f0f0f0',
    activeBackground: '#e0e0e0',
    tooltipBackground: '#333',
    tooltipTextColor: '#fff',
    scrollbarThumb: '#c1c1c1',
    scrollbarTrack: '#f1f1f1',
    scrollbarThumbHover: '#a8a8a8'
  },
  dark: {
    backgroundColor: '#1a1a1a',
    textColor: '#e0e0e0',
    headerBackground: '#2d2d2d',
    headerText: '#e0e0e0',
    borderColor: '#404040',
    rowBackground1: '#1a1a1a',
    rowBackground2: '#2d2d2d',
    noDataColor: '#888',
    hoverBackground: '#2a2a2a',
    activeBackground: '#3a3a3a',
    tooltipBackground: '#e0e0e0',
    tooltipTextColor: '#1a1a1a',
    scrollbarThumb: '#555',
    scrollbarTrack: '#2a2a2a',
    scrollbarThumbHover: '#666'
  }
};

export class OrderFlow extends React.Component<OrderFlowProps, OrderFlowState> {
  private containerRef: React.RefObject<HTMLDivElement | null>;
  private contentRef: React.RefObject<HTMLDivElement | null>;
  private scrollbarRef: React.RefObject<HTMLDivElement | null>;
  private rowRefs: (HTMLDivElement | null)[] = [];
  private touchTimer: NodeJS.Timeout | null = null;
  private scrollTimer: NodeJS.Timeout | null = null;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScrollTop = 0;

  constructor(props: OrderFlowProps) {
    super(props);
    this.state = {
      orders: [],
      visibleRows: 10,
      hoveredRowIndex: null,
      hoveredCell: null,
      touchedCell: null,
      scrollPosition: 0,
      isScrolling: false,
      showScrollbar: false
    };
    this.containerRef = React.createRef();
    this.contentRef = React.createRef();
    this.scrollbarRef = React.createRef();
  }

  componentDidMount() {
    this.calculateVisibleRows();
    this.updateScrollbarVisibility();
    window.addEventListener('resize', this.calculateVisibleRows);
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('mousemove', this.handleDocumentMouseMove);
    document.addEventListener('mouseup', this.handleDocumentMouseUp);
  }

  componentDidUpdate(prevProps: OrderFlowProps, prevState: OrderFlowState) {
    if (
      prevProps.data !== this.props.data ||
      prevState.visibleRows !== this.state.visibleRows
    ) {
      this.updateOrders();
    }
    if (prevProps.style?.height !== this.props.style?.height) {
      setTimeout(() => {
        this.calculateVisibleRows();
        this.updateScrollbarVisibility();
      }, 0);
    }
    if (prevProps.data !== this.props.data || prevState.visibleRows !== this.state.visibleRows) {
      this.updateScrollbarVisibility();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.calculateVisibleRows);
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('mousemove', this.handleDocumentMouseMove);
    document.removeEventListener('mouseup', this.handleDocumentMouseUp);
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
    }
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  }

  handleDocumentClick = (event: MouseEvent) => {
    if (this.state.touchedCell) {
      this.setState({ touchedCell: null });
    }
  }

  handleDocumentMouseMove = (event: MouseEvent) => {
    if (this.isDragging && this.contentRef.current) {
      const deltaY = event.clientY - this.dragStartY;
      const contentHeight = this.contentRef.current.scrollHeight;
      const containerHeight = this.contentRef.current.clientHeight;
      const maxScrollTop = contentHeight - containerHeight;

      const newScrollTop = Math.max(0, Math.min(maxScrollTop, this.dragStartScrollTop + deltaY));
      this.contentRef.current.scrollTop = newScrollTop;
      this.updateScrollPosition();
    }
  }

  handleDocumentMouseUp = () => {
    if (this.isDragging) {
      this.isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      this.setState({ isScrolling: false });
    }
  }

  getCurrentTheme = () => {
    const { theme } = this.props;
    return theme ? themeConfig[theme] : themeConfig.light;
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
    const { data = [], showScrollbar = true } = this.props;
    const { visibleRows } = this.state;
    const sortedData = [...data].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
    let limitedData;
    if (showScrollbar) {
      limitedData = sortedData;
    } else {
      limitedData = sortedData.slice(0, visibleRows);
    }
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
      let limitedData;
      if (nextProps.showScrollbar !== false) {
        limitedData = sortedData;
      } else {
        limitedData = sortedData.slice(0, visibleRows);
      }
      return { orders: limitedData };
    }
    return null;
  }

  updateScrollbarVisibility = () => {
    const content = this.contentRef.current;
    if (!content) return;

    const hasScrollbar = content.scrollHeight > content.clientHeight;
    this.setState({ showScrollbar: hasScrollbar });
  }

  handleScroll = () => {
    this.updateScrollPosition();
    this.setState({ isScrolling: true });

    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }

    this.scrollTimer = setTimeout(() => {
      this.setState({ isScrolling: false });
    }, 300);
  }

  updateScrollPosition = () => {
    const content = this.contentRef.current;
    if (!content) return;

    const scrollTop = content.scrollTop;
    const scrollHeight = content.scrollHeight;
    const clientHeight = content.clientHeight;

    if (scrollHeight > clientHeight) {
      const position = scrollTop / (scrollHeight - clientHeight);
      this.setState({ scrollPosition: position });
    }
  }

  handleScrollbarMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    this.isDragging = true;
    this.dragStartY = event.clientY;
    this.dragStartScrollTop = this.contentRef.current?.scrollTop || 0;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    this.setState({ isScrolling: true });
  }

  handleScrollbarClick = (event: React.MouseEvent) => {
    if (!this.scrollbarRef.current || !this.contentRef.current) return;
    const scrollbarRect = this.scrollbarRef.current.getBoundingClientRect();
    const clickY = event.clientY - scrollbarRect.top;
    const scrollbarHeight = scrollbarRect.height;
    const thumbHeight = this.getThumbHeight();
    const position = clickY / scrollbarHeight;
    const content = this.contentRef.current;
    const contentHeight = content.scrollHeight;
    const containerHeight = content.clientHeight;
    const maxScrollTop = contentHeight - containerHeight;
    const newScrollTop = position * maxScrollTop;
    content.scrollTop = newScrollTop;
    this.updateScrollPosition();
  }

  getThumbHeight = () => {
    const content = this.contentRef.current;
    if (!content) return 0;
    const containerHeight = content.clientHeight;
    const contentHeight = content.scrollHeight;
    if (contentHeight <= containerHeight) return 0;
    const ratio = containerHeight / contentHeight;
    return Math.max(20, containerHeight * ratio);
  }

  formatNumber = (num: any): string => {
    if (typeof num !== 'number' || isNaN(num)) return String(num || '');
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  formatTime = (timestamp: any): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return String(timestamp);
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

  getCellValue = (order: Record<string, any>, headItem: ListHeadItem): string => {
    const { buyText = '买入', sellText = '卖出' } = this.props;
    const rawValue = order[headItem.key];
    if (headItem.formatter) {
      return headItem.formatter(rawValue, order);
    }
    if (headItem.key === 'side') {
      return rawValue === 'buy' ? buyText : sellText;
    }
    if (typeof rawValue === 'number') {
      if (headItem.key.toLowerCase().includes('time') ||
        headItem.key.toLowerCase().includes('date') ||
        (rawValue > 1000000000000 && rawValue < 2000000000000)) {
        return this.formatTime(rawValue);
      }
      return this.formatNumber(rawValue);
    }
    return String(rawValue || '');
  }

  getColumnStyle = (headItem: ListHeadItem): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '0 8px',
      width: `${headItem.width}%`,
      boxSizing: 'border-box',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };
    return { ...baseStyle, ...headItem.style };
  }

  handleRowMouseEnter = (index: number) => {
    this.setState({ hoveredRowIndex: index });
  }

  handleRowMouseLeave = () => {
    this.setState({ hoveredRowIndex: null });
  }

  handleCellClick = (headItem: ListHeadItem, order: Record<string, any>) => {
    if (headItem.onClickData) {
      headItem.onClickData(order);
    }
  }

  handleCellTouchStart = (event: React.TouchEvent, rowIndex: number, headItem: ListHeadItem, order: Record<string, any>) => {
    if (headItem.onTouchData) {
      event.preventDefault();
      if (this.touchTimer) {
        clearTimeout(this.touchTimer);
      }
      this.touchTimer = setTimeout(() => {
        const touch = event.touches[0];
        const container = this.containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          this.setState({
            touchedCell: {
              rowIndex,
              columnKey: headItem.key,
              data: order,
              x,
              y
            }
          });
        }
      }, 500);
    }
  }

  handleCellTouchEnd = (event: React.TouchEvent, headItem: ListHeadItem, order: Record<string, any>) => {
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }
    if (!this.state.touchedCell && headItem.onClickData) {
      headItem.onClickData(order);
    }
  }

  handleCellTouchCancel = () => {
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }

    this.setState({ touchedCell: null });
  }

  handleTooltipClose = () => {
    this.setState({ touchedCell: null });
  }

  renderTooltip = () => {
    const { touchedCell } = this.state;
    if (!touchedCell) return null;
    const currentTheme = this.getCurrentTheme();
    const headerConfig = this.getValidatedListHead();
    const headItem = headerConfig.find(item => item.key === touchedCell.columnKey);
    if (!headItem || !headItem.onTouchData) return null;
    const tooltipContent = headItem.onTouchData(touchedCell.data);
    if (!tooltipContent) return null;
    const container = this.containerRef.current;
    let x = touchedCell.x;
    let y = touchedCell.y;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      x = Math.max(100, Math.min(x, containerWidth - 100));
      if (y < containerHeight / 2) {
        y = touchedCell.y + 20;
      } else {
        y = touchedCell.y - 10;
      }
      y = Math.max(20, Math.min(y, containerHeight - 100));
    }

    const tooltipStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: currentTheme?.tooltipBackground || '#333',
      color: currentTheme?.tooltipTextColor || '#fff',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '200px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      border: `1px solid ${currentTheme?.borderColor || '#404040'}`,
      transform: 'translateX(-50%)',
      pointerEvents: 'none'
    };
    return (
      <div style={tooltipStyle}>
        {tooltipContent}
      </div>
    );
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
            title={headItem.text}
          >
            {headItem.text}
          </div>
        ))}
      </div>
    );
  }

  renderScrollbar = () => {
    const { scrollbarWidth = 8, showScrollbar = true } = this.props;
    const { showScrollbar: shouldShowScrollbar, scrollPosition, isScrolling } = this.state;
    const currentTheme = this.getCurrentTheme();
    if (!shouldShowScrollbar || !showScrollbar) return null;
    const thumbHeight = this.getThumbHeight();
    const thumbTop = scrollPosition * (100 - (thumbHeight / (this.contentRef.current?.clientHeight || 100) * 100));
    const scrollbarStyle: React.CSSProperties = {
      position: 'absolute',
      right: '-2px',
      top: '40px',
      bottom: '2px',
      width: scrollbarWidth + 4,
      backgroundColor: 'transparent',
      zIndex: 100,
      cursor: 'pointer'
    };

    const trackStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      right: 2,
      bottom: 0,
      width: scrollbarWidth,
      backgroundColor: currentTheme.scrollbarTrack,
      borderRadius: scrollbarWidth / 2,
      opacity: isScrolling ? 1 : 0.6,
      transition: 'opacity 0.3s ease'
    };

    const thumbStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${thumbTop}%`,
      right: 2,
      width: scrollbarWidth,
      height: thumbHeight,
      backgroundColor: currentTheme.scrollbarThumb,
      borderRadius: scrollbarWidth / 2,
      cursor: 'grab',
      transition: isScrolling ? 'none' : 'background-color 0.2s ease, height 0.2s ease',
      opacity: isScrolling ? 1 : 0.8
    };

    return (
      <div
        ref={this.scrollbarRef}
        style={scrollbarStyle}
        onClick={this.handleScrollbarClick}
        onMouseEnter={() => {
          if (this.scrollTimer) clearTimeout(this.scrollTimer);
          this.setState({ isScrolling: true });
        }}
        onMouseLeave={() => {
          if (!this.isDragging) {
            this.scrollTimer = setTimeout(() => {
              this.setState({ isScrolling: false });
            }, 300);
          }
        }}
      >
        <div style={trackStyle} />
        <div
          style={thumbStyle}
          onMouseDown={this.handleScrollbarMouseDown}
          onMouseEnter={() => {
            const thumb = this.scrollbarRef.current?.firstChild?.nextSibling as HTMLElement;
            if (thumb && !this.isDragging) {
              thumb.style.backgroundColor = currentTheme.scrollbarThumbHover;
              thumb.style.height = `${thumbHeight + 2}px`;
            }
          }}
          onMouseLeave={() => {
            const thumb = this.scrollbarRef.current?.firstChild?.nextSibling as HTMLElement;
            if (thumb && !this.isDragging) {
              thumb.style.backgroundColor = currentTheme.scrollbarThumb;
              thumb.style.height = `${thumbHeight}px`;
            }
          }}
        />
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
      noDataText = 'null',
      showScrollbar = true
    } = this.props;
    const { orders, hoveredRowIndex } = this.state;
    const currentTheme = this.getCurrentTheme();
    const finalBackgroundColor = backgroundColor || currentTheme?.backgroundColor || '#fff';
    const finalTextColor = textColor || currentTheme?.textColor || '#333';
    const finalBorderColor = currentTheme?.borderColor || '#e8e8e8';
    const finalNoDataColor = currentTheme?.noDataColor || '#999';
    const hoverBackgroundColor = currentTheme?.hoverBackground || '#f0f0f0';
    const activeBackgroundColor = currentTheme?.activeBackground || '#e0e0e0';

    const containerStyle: React.CSSProperties = {
      backgroundColor: finalBackgroundColor,
      border: `1px solid ${finalBorderColor}`,
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      height: '400px',
      userSelect: 'none',
      position: 'relative',
      ...style
    };

    const rowStyle: React.CSSProperties = {
      display: 'flex',
      padding: '0',
      borderBottom: `1px solid ${finalBorderColor}`,
      height: '32px',
      minHeight: '32px',
      boxSizing: 'border-box',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    };

    const contentStyle: React.CSSProperties = {
      height: showHeader ? 'calc(100% - 40px)' : '100%',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    };

    const getRowBackgroundColor = (index: number) => {
      if (hoveredRowIndex === index) {
        return hoverBackgroundColor;
      }

      if (currentTheme) {
        return index % 2 === 0 ? currentTheme.rowBackground1 : currentTheme.rowBackground2;
      }
      return index % 2 === 0 ? '#fff' : '#fafafa';
    };

    const handleRowMouseDown = (index: number) => {
      if (this.rowRefs[index]) {
        this.rowRefs[index]!.style.backgroundColor = activeBackgroundColor;
      }
    }

    const handleRowMouseUp = (index: number) => {
      if (this.rowRefs[index]) {
        const backgroundColor = getRowBackgroundColor(index);
        this.rowRefs[index]!.style.backgroundColor = backgroundColor;
      }
    }

    return (
      <div
        ref={this.containerRef}
        className={className}
        style={containerStyle}
      >
        {showHeader && this.renderHeader()}
        <div
          ref={this.contentRef}
          style={contentStyle}
          onScroll={this.handleScroll}
        >
          <div style={{ position: 'relative', height: '100%' }}>
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
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                {orders.map((order, index) => (
                  <div
                    key={order.id || `order-${index}`}
                    ref={(el) => { this.rowRefs[index] = el; }}
                    data-row-index={index}
                    style={{
                      ...rowStyle,
                      backgroundColor: getRowBackgroundColor(index)
                    }}
                    onMouseEnter={() => this.handleRowMouseEnter(index)}
                    onMouseLeave={() => this.handleRowMouseLeave()}
                    onMouseDown={() => handleRowMouseDown(index)}
                    onMouseUp={() => handleRowMouseUp(index)}
                    onTouchStart={() => handleRowMouseDown(index)}
                    onTouchEnd={() => handleRowMouseUp(index)}
                    onTouchCancel={() => handleRowMouseUp(index)}
                  >
                    {this.getValidatedListHead().map((headItem) => {
                      const cellValue = this.getCellValue(order, headItem);
                      const isSideColumn = headItem.key === 'side';
                      const hasClickHandler = !!headItem.onClickData;
                      const hasTouchHandler = !!headItem.onTouchData;

                      return (
                        <div
                          key={`${order.id || index}-${headItem.key}`}
                          style={{
                            ...this.getColumnStyle(headItem),
                            cursor: hasClickHandler || hasTouchHandler ? 'pointer' : 'default'
                          }}
                          title={cellValue}
                          onClick={() => hasClickHandler && this.handleCellClick(headItem, order)}
                        >
                          <span
                            style={{
                              color: isSideColumn
                                ? (order.side === 'buy' ? buyColor : sellColor)
                                : finalTextColor,
                              fontWeight: isSideColumn ? 'bold' : 'normal',
                              userSelect: 'none',
                              cursor: hasClickHandler || hasTouchHandler ? 'pointer' : 'default',
                              textDecoration: (hasClickHandler || hasTouchHandler) && this.state.hoveredCell === `${index}-${headItem.key}` ? 'underline' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (hasTouchHandler) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const container = this.containerRef.current;

                                if (container) {
                                  const containerRect = container.getBoundingClientRect();
                                  const x = rect.left + rect.width / 2 - containerRect.left;
                                  const y = rect.top - containerRect.top - 5;

                                  this.setState({
                                    touchedCell: {
                                      rowIndex: index,
                                      columnKey: headItem.key,
                                      data: order,
                                      x,
                                      y
                                    },
                                    hoveredCell: `${index}-${headItem.key}`
                                  });
                                }
                              } else if (hasClickHandler) {
                                this.setState({ hoveredCell: `${index}-${headItem.key}` });
                              }
                            }}
                            onMouseLeave={() => {
                              this.setState({ touchedCell: null });
                              if (hasClickHandler || hasTouchHandler) {
                                this.setState({ hoveredCell: null });
                              }
                            }}
                          >
                            {cellValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {showScrollbar && this.renderScrollbar()}
        {this.renderTooltip()}
      </div>
    );
  }
}

export default OrderFlow;