import React, { useEffect, useState, useRef, useImperativeHandle, useLayoutEffect } from 'react'
import classNames from 'classnames'
import { useThrottleFn } from 'ahooks'
import './index.css'

const classPrefix = `waterfall`

export interface Rect {
  top?: number
  left?: number | string
  isLastColumn: boolean
  height?: number
}

export interface WaterfallProps {
  children: React.ReactNode
  columns: number
  gapX?: number
  gapY?: number
  pageSize?: number
  threshold?: number
  onScroll?: (e: any) => void
  [key: string]: any
}

export interface WaterfallState {
  currentIndex: number
  endIndex: number
  rects: Rect[]
  columnsHeight: Record<number, number[]>
}

export interface WaterfallCellProps {
  index: number
  columnWidth: number
  screenRange: ScreenRangeType
  children: React.ReactNode
  rect?: Rect
  itemLoaded: (index: number) => void
  itemUpdated: (index: number) => void
}

type ScreenRangeType = [number, number]



// 列表项容器组件
export const Cell = React.forwardRef(({columnWidth, index, screenRange, children, rect, itemLoaded, itemUpdated}: WaterfallCellProps, ref) => {

  let cellRef= useRef<HTMLDivElement>(null);

  useEffect(() => {
    itemLoaded(index)
  }, [])

  useEffect(() => {
    if (cellRef.current){
      const ro = new ResizeObserver(entries => {
        itemUpdated(index)
      })
      ro.observe(cellRef.current as Element)
      return () => ro.disconnect();
    }
  }, [cellRef.current])

  useImperativeHandle(ref, () => cellRef.current)

  const top = rect?.top || 0;
  const [screenTop, screenBottom] = screenRange;
  let isInScreen = false;

  if (rect?.top === undefined || ((top + (rect?.height || 0)) >= screenTop && top <= screenBottom)){
    isInScreen = true;
  }

  // 屏幕外隐藏元素
  if (!isInScreen) {
    return null;
  }

  let style: React.CSSProperties = {}
  // 已经计算过位置
  if (rect?.left !== undefined) {
    style = {
      position: 'absolute',
      top: (rect?.top || 0) as number,
    }
    // 最右侧列设置right为0
    if (rect.isLastColumn) {
      style.right = 0;
    } else {
      style.left = rect.left;
    }
  // 初始化未计算过位置，将元素设置成不可见
  } else {
    style = {
      position: 'fixed',
      left: '200%',
      top: '200%',
    }
  }
  style.width = columnWidth;

  return <div
    ref={cellRef}
    data-index={index}
    style={style}
    >
      {children}
    </div>
})



/**
 *
 * @param {number} columns - 列数
 * @param {number} gapX - 水平间隙
 * @param {number} gapY - 垂直间隙
 * @param {number} pageSize - 分页加载每页加载条数,暂不支持
 */
export const Waterfall = React.forwardRef((props: WaterfallProps, ref) => {
  const {
    children,
    columns = 2,
    gapX: _gapX,
    gapY: _gapY,
    pageSize = 20,
    threshold = 250,
    bufferHeight = 500,
    throttleTime = 300,
    autoObserve = true,
    sliceThreshold = 200,
    className,
    onScroll: _onScroll,
    ...restProps
  } = props;

  const gapX = typeof _gapX === 'number' ? _gapX : 0;
  const gapY = typeof _gapY === 'number' ? _gapY : 0;

  // 记录列表容器高度，计算是否在屏幕内
  let containerRect = useRef<{ width: number, height: number, columnWidth: number, columnLeftMap: Record<number, number> }>({
    width: 0,
    height: 0,
    columnWidth: 0,
    columnLeftMap: {}
  });
  // 列表元素高度集合, value为最新拿到的元素高度，每次高度更新，将历史高度存入history,若当前拿到高度为历史高度，则直接取history中最新的高度
  // history暂未使用，待废弃
  const heightCollect = useRef<Record<number, { value: number, history: number[] }>>({});
  // 瀑布流关键计算参数
  const stateRef = useRef<WaterfallState>({
    // 当前元素指针，每计算一个元素位置递增一次
    currentIndex: 0,
    // 记录需要更新的最后元素下标，确保需要更新的元素全部都计算到
    endIndex: 0,
    // 元素位置数据数组
    rects: [],
    // 每列高度统计，保存每次高度变化的快照，便于从中间任意位置刷新瀑布流（解决元素高度会变化的情况）
    columnsHeight: {
      0: new Array(columns).fill(0)
    },

  });
  // 保存列表所有元素的实例
  const cellRefs = useRef<HTMLDivElement[]>([]);

  // 待刷新元素下标队列，取下标最靠前的元素刷新
  const updateIndexQueue = useRef<number[]>([]);

  // 保存列表位置数据
  const [rects, setRects] = useState<Rect[]>([]);
  // 可视屏幕范围
  const [screenRange, setScreenRange] = useState<ScreenRangeType>([0, 0])
  // 加载批次
  const [page, setPage] = useState(1);

  const limitComputerCount = useRef(0);

  // 计算列表位置
  const computerRects = () => {
    const { currentIndex, columnsHeight } = stateRef.current;
    if (heightCollect.current[currentIndex] !== undefined && Array.isArray(columnsHeight[currentIndex])) {

      // console.log('limitComputerCount',limitComputerCount.current, currentIndex)
      // 支持计算任务分片执行，超过的放到下一次的更新队列中
      if (limitComputerCount.current > sliceThreshold) {
        limitComputerCount.current = 0;
          updateIndexQueue.current.push(currentIndex);
          runRefreshRects()
        return;
      }

      const currentColumnsHeight = [...columnsHeight[currentIndex]];
      // console.warn('开始计算第', currentIndex, '个元素计算位置', currentColumnsHeight)
      let asceColumns = [...currentColumnsHeight]
      asceColumns.sort((a,b) => a - b);
      const minColumnsIndex = currentColumnsHeight.findIndex(item => item === asceColumns[0]);
      // 如果是第一排元素，顶部不用添加竖直空隙，非第一排元素都需要添加竖直空隙
      const mixHeight = currentColumnsHeight[minColumnsIndex];
      const currentTop = mixHeight === 0 ? mixHeight : mixHeight + gapY;
      currentColumnsHeight[minColumnsIndex] = currentTop + (heightCollect.current[currentIndex].value || 0);
      // 计算是否在渲染屏幕内
      const [screenTop, screenBottom] = screenRange;
      // const isInsideScreen = ((currentTop + heightCollect.current[currentIndex].value) >= screenTop) && (currentTop <= screenBottom)
      // 如果是已计算过的元素，且距离超过屏幕底部1屏后面的元素不用计算
      // if (
      //   Number(stateRef.current.rects[currentIndex]?.top) > 0
      //   && currentIndex > stateRef.current.endIndex
      //   && currentTop > screenBottom + containerRect.current.height
      // ) { return }

      stateRef.current.rects[currentIndex] = {
        top: currentTop,
        left: containerRect.current.columnLeftMap[minColumnsIndex],
        isLastColumn: minColumnsIndex === columns - 1,
        height: heightCollect.current[currentIndex].value,
      }

      stateRef.current.currentIndex = currentIndex + 1
      stateRef.current.columnsHeight[currentIndex + 1] = [...currentColumnsHeight]
      setRects([...stateRef.current.rects])
      // console.warn('计算结束第', currentIndex, '个元素计算位置', stateRef.current.rects[currentIndex],asceColumns, minColumnsIndex)
      try {
        limitComputerCount.current += 1;
        computerRects();
      } catch(e) {
        // console.log('内存溢出')
      }

    }
  }

  // 刷新瀑布流，从刷新队列中取出最靠前的元素开始重新计算瀑布流位置
  const refreshRects = () => {
    if (updateIndexQueue.current.length > 0) {
      updateIndexQueue.current.sort((a, b) => a - b);
      stateRef.current.currentIndex = updateIndexQueue.current[0]
      stateRef.current.endIndex = updateIndexQueue.current[updateIndexQueue.current.length - 1];
      // console.log('开始：', stateRef.current.currentIndex,' 结束：', stateRef.current.endIndex, updateIndexQueue.current)
      updateIndexQueue.current = [];
      limitComputerCount.current = 0;
      computerRects();
      limitComputerCount.current = 0;
    }
  }

  const { run: runRefreshRects } = useThrottleFn(refreshRects, { wait: throttleTime, leading: false })

  // 获取屏幕高度
  const getContainerHeight = (ref: HTMLDivElement | null) => {
    if (ref) {
      const rect = ref.getBoundingClientRect();
      if (containerRect.current.height !== rect.height) {
        containerRect.current.height = rect.height;
        containerRect.current.width = rect.width;
        // 计算列宽
        containerRect.current.columnWidth = Number(((containerRect.current.width - ((columns - 1) * gapX)) / columns));
        // 计算每列对应的left值
        new Array(columns).fill(0).forEach((_, index) => {
          containerRect.current.columnLeftMap[index] = (gapX + containerRect.current.columnWidth) * index
        })
        setScreenRange([0, containerRect.current.height])
      }
    }
  }

  // 滚动实时获取可视屏幕范围
  const onScroll = (e: any) => {
    if (typeof _onScroll === 'function') {
      _onScroll(e);
    }
    // console.log('ScreenRange', [e.nativeEvent.target.scrollTop, e.nativeEvent.target.scrollTop + containerRect.current.height])
    const screenTop = e.nativeEvent.target.scrollTop - bufferHeight;
    const screenBottom = e.nativeEvent.target.scrollTop + containerRect.current.height + bufferHeight
    setScreenRange([screenTop, screenBottom])
    // 最后一个元素距离页面底部半屏时
    // console.log('setPage', Number(stateRef.current.rects[page * pageSize - 1]?.top), (screenBottom + (containerRect.current.height / 2)))
    if (
      pageSize !== null
      && React.Children.count(children) > page * pageSize
      && stateRef.current.rects[page * pageSize - 1]
      ) {
        const { top = 0, height = 0 } = stateRef.current.rects[page * pageSize - 1];
        if ((top + height) < (screenBottom + threshold)) {
          // console.log('setPage + 1', page + 1)
          setPage(page + 1)
        }

    }
  }

  // 列表项渲染完成后计算位置
  const itemLoaded = (index: number) => {
    if (cellRefs.current[index] && heightCollect.current[index] === undefined) {
      const rect = cellRefs.current[index].getBoundingClientRect();
      // console.log('第',index,'个元素加载完成',rect);
      heightCollect.current[index] = {
        value: rect.height,
        history: [rect.height]
      }
      limitComputerCount.current = 0;
      computerRects()
      limitComputerCount.current = 0;
    }
  }


  // 列表项高度更新，重新计算瀑布流
  const itemUpdated = (index: number) => {
    if (index !==undefined && cellRefs.current[index]) {
      const rect = cellRefs.current[index].getBoundingClientRect();
      if (heightCollect.current[index] === undefined) {
        heightCollect.current[index] = {
          value: rect.height,
          history: [rect.height]
        }
        updateIndexQueue.current.push(index);
        runRefreshRects()
      } else if (
        heightCollect.current[index]?.value !== undefined
        && rect.height !== heightCollect.current[index].value
      ) {
        // console.log('itemUpdated2', index, rect, heightCollect.current[index])
        heightCollect.current[index].value = rect.height;
        heightCollect.current[index].history.push(rect.height);
        updateIndexQueue.current.push(index);
        runRefreshRects()
      }
    }
  }

  // 对外暴露方法
  useImperativeHandle(ref, () => {
    return {
      itemUpdated,
    }
  }, [])

  const childrens = React.Children.map(children, (child, index) => {
    // pageSize为null禁用分页加载
    if (pageSize === null || index < pageSize * page) {
      return <Cell
        columnWidth={containerRect.current.columnWidth}
        ref={(ref: HTMLDivElement) => cellRefs.current[index] = ref}
        key={index}
        index={index}
        screenRange={screenRange}
        rect={rects[index]}
        itemLoaded={itemLoaded}
        itemUpdated={itemUpdated}
      >
        {child}
      </Cell>
    }
    return null

  })

  return <div
    ref={(ref) => getContainerHeight(ref)}
    className={classNames(classPrefix, className)}
    onScroll={onScroll}
    {...restProps}
    >
      {childrens}
    </div>
})
