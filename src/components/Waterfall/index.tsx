import React, { useEffect, useState, useRef, useImperativeHandle } from 'react'
import { useThrottleFn } from 'ahooks'
import './index.css'
const classPrefix = `waterfall`

export interface Rect {
  top?: number
  left?: number | string
  width?: number
  height?: number
  // isInsideScreen: boolean
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
  screenRange: ScreenRangeType
  children: React.ReactNode
  rect?: Rect
  itemLoaded: (index: number) => void
  itemUpdated: (index: number) => void
}

// 第三个参数为额外传入的每列宽度
type ScreenRangeType = [number, number]

// 列表项容器组件
export const Cell = React.forwardRef(({index, columnWidth, screenRange, children, rect, itemLoaded, itemUpdated}: WaterfallCellProps, ref) => {

  let cellRef= useRef<HTMLDivElement>(null);

  // 自动监听瀑布流元素变化
  // const onObserver = (mutationsList: MutationRecord[], observer: MutationObserver) => {
  //   // console.log('mutationsList', mutationsList)
  //   for (let mutation of mutationsList) {
  //     if (mutation.target.parentElement?.className !== classPrefix) {
  //       // itemUpdated(index)
  //     }
  //   }
  // }

  useEffect(() => {
    itemLoaded(index)
    
  }, [])

  useEffect(()=> {
    // console.log('rect变化', index, rect)
  }, [rect])

  // useEffect(() => {
  //   if (cellRef.current) {
  //     console.warn('建立监听', index)
  //     const observer = new MutationObserver(onObserver as MutationCallback);
  //     observer.observe(cellRef.current, { subtree: true, childList: true, attributeOldValue: true, attributes: true });
  //     return () => observer.disconnect();
  //   }
  // }, [cellRef.current])

  useEffect(() => {
    // console.log('建立监听', index, cellRef.current)
    let ro = null;
    if (cellRef.current){
      let timeout = null;
      ro = new ResizeObserver(entries => {
        // console.log('触发监听',entries)
        for (let entry of entries) {
          // console.log('entry', entry.target.dataset.index, entry)
          // queue.push(Number(entry.target.dataset.index))
          // queue.sort((a, b) => a- b)
          // console.log('queue', queue)
        //   cancelAnimationFrame(timeout);
        //   timeout = requestAnimationFrame(() => {
        //     itemUpdated(parseInt(entry.target.dataset.index))
        //   })
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            itemUpdated(index)
          }, 16)
        }
      })
      ro.observe(cellRef.current as Element)
    }
    return () => {
        ro && ro.disconnect();
        ro = null;
    }
  }, [cellRef.current])

  useImperativeHandle(ref, () => cellRef.current)

  const top = rect?.top || 0;
  const [screenTop, screenBottom] = screenRange;
  let isInScreen = false;

  if (!rect?.top || ((top + (rect?.height || 0)) >= screenTop && top <= screenBottom)){
    isInScreen = true;
  }

  // 屏幕外隐藏元素
  if (!isInScreen) {
    return null;
  }

  

  return <div
    ref={cellRef}
    className='waterfall-item'
    data-index={index}
    style={{
      position: 'absolute',
      left: (rect?.left !== undefined ? rect?.left : '-100%'),
      top: (rect?.top || 0) as number,
      width: columnWidth,
      background: 'white',
      overflow: 'hidden',
  }}>{children}</div>
})



/**
 *
 * @param {number} columns - 列数
 * @param {number} gapX - 水平间隙
 * @param {number} gapY - 垂直间隙
 * @param {number} pageSize - 分页加载每页加载条数
 */
const Waterfall = React.forwardRef((props: WaterfallProps, ref) => {
  const {
    children,
    columns = 2,
    gapX: _gapX,
    gapY: _gapY,
    initialNumToRender = 50,
    pageSize = 20,
    threshold = 250,
    bufferHeight = 500,
    throttleTime = 300,
    autoObserve = true,
    className,
    virtualEnable=false,
    onScroll: _onScroll,
    ...restProps
  } = props;

  const gapX = typeof _gapX === 'number' ? _gapX : 0;
  const gapY = typeof _gapY === 'number' ? _gapY : 0;

  // 记录列表容器高度，计算是否在屏幕内
  let containerRect = useRef<{ width: number, height: number, columnWidth: number }>({
    width: 0,
    height: 0,
    columnWidth: 0,
  });
  let [columnWidth, setColumnWidth] = useState(0);
  // 列表元素高度集合, value为最新拿到的元素高度，每次高度更新，将历史高度存入history,若当前拿到高度为历史高度，则直接取history中最新的高度
  const heightCollect = useRef<Record<number, { value: number, history: number[] }>>({});
  // 瀑布流关键计算参数
  const stateRef = useRef<WaterfallState>({
    // 当前元素指针，每计算一个元素位置递增一次
    currentIndex: 0,

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
  const [page, setPage] = useState(0);

  // 计算列表位置
  const computerRects = () => {
    const { currentIndex, columnsHeight } = stateRef.current;
    if (heightCollect.current[currentIndex] !== undefined && Array.isArray(columnsHeight[currentIndex])) {
      const currentColumnsHeight = [...columnsHeight[currentIndex]];
      // console.warn('开始计算第', currentIndex, '个元素计算位置', currentColumnsHeight)
      if (!Array.isArray(currentColumnsHeight)) {
        console.log(columnsHeight,currentIndex, currentColumnsHeight)
      }
      let asceColumns = [...currentColumnsHeight]
      asceColumns.sort((a,b) => a - b);
      const minColumnsIndex = currentColumnsHeight.findIndex(item => item === asceColumns[0]);
      // 如果是第一排元素，顶部不用添加竖直空隙，非第一排元素都需要添加竖直空隙
      const mixHeight = currentColumnsHeight[minColumnsIndex];
      const currentTop = mixHeight === 0 ? mixHeight : mixHeight + gapY;
      currentColumnsHeight[minColumnsIndex] = currentTop + (heightCollect.current[currentIndex].value || 0);
      // 计算每列宽度，需要减掉水平空隙
      
      let left = (gapX + containerRect.current.columnWidth) * minColumnsIndex
      if (minColumnsIndex === columns - 1) {
        left = containerRect.current.width - containerRect.current.columnWidth;
      }
      // 计算是否在渲染屏幕内
      const [screenTop, screenBottom] = screenRange;
      // const isInsideScreen = ((currentTop + heightCollect.current[currentIndex].value) >= screenTop) && (currentTop <= screenBottom)
      // 如果是已计算过的元素，且距离超过屏幕底部1屏后面的元素不用计算
    //   if (
    //     Number(stateRef.current.rects[currentIndex]?.top) > 0
    //     && currentIndex > stateRef.current.endIndex
    //     && currentTop > screenBottom + containerRect.current.height
    //   ) { 
    //     console.log(currentIndex+'停止计算','超过一屏后面的元素且元素是计算过了的不用计算')
    //     return 
    //   }

      stateRef.current.rects[currentIndex] = {
        top: currentTop,
        left: left,
        width: containerRect.current.columnWidth,
        height: heightCollect.current[currentIndex].value,
        // isInsideScreen,
      }
      stateRef.current.currentIndex = currentIndex + 1
      stateRef.current.columnsHeight[currentIndex + 1] = [...currentColumnsHeight]
      setRects(JSON.parse(JSON.stringify(stateRef.current.rects)))
      console.warn('计算结束第', currentIndex, '个元素计算位置', stateRef.current.currentIndex, stateRef.current.rects[currentIndex],asceColumns, minColumnsIndex)
      computerRects();
    } else {
      console.log(`${currentIndex}停止计算，Array.isArray(columnsHeight[currentIndex])=${Array.isArray(columnsHeight[currentIndex])}`)
    }
  }

  // 刷新瀑布流，从刷新队列中取出最靠前的元素开始重新计算瀑布流位置
  const refreshRects = () => {
    if (updateIndexQueue.current.length > 0) {
      updateIndexQueue.current.sort((a, b) => a - b);
      console.log('更新队列updateIndexQueue.current', updateIndexQueue.current, heightCollect.current)
      stateRef.current.currentIndex = updateIndexQueue.current[0]
      stateRef.current.endIndex = updateIndexQueue.current[updateIndexQueue.current.length - 1];
      updateIndexQueue.current = [];
      computerRects();
    }
  }


  const { run: runRefreshRects } = useThrottleFn(refreshRects, { wait: throttleTime })


  const findWaterfallItem: any = (target: any) => {
    if (target.className === 'waterfall-item') {
      return target;
    } else if (target.parentElement){
      return findWaterfallItem(target.parentElement)
    } else {
      return null;
    }
  }

  // 获取屏幕高度
  const getContainerHeight = (ref: HTMLDivElement | null) => {
    if (ref) {
      const rect = ref.getBoundingClientRect();
      if (containerRect.current.height !== rect.height) {
        containerRect.current.height = rect.height;
        containerRect.current.width = rect.width;
        containerRect.current.columnWidth = Number(((containerRect.current.width - ((columns - 1) * gapX)) / columns).toFixed(0));
        setScreenRange([0, containerRect.current.height])
        setColumnWidth(containerRect.current.columnWidth);
      }
    }
  }

  const scrollHandle = (e) => {
    const screenTop = e.nativeEvent.target.scrollTop - bufferHeight;
    const screenBottom = e.nativeEvent.target.scrollTop + containerRect.current.height + bufferHeight
    setScreenRange([screenTop, screenBottom])
    // 最后一个元素距离页面底部半屏时
    // console.log('setPage', Number(stateRef.current.rects[page * pageSize - 1]?.top), (screenBottom + (containerRect.current.height / 2)))
    if (
      React.Children.count(children) > initialNumToRender + page * pageSize
      && stateRef.current.rects[initialNumToRender + page * pageSize - 1]
      ) {
        const { top = 0, height = 0 } = stateRef.current.rects[initialNumToRender + page * pageSize - 1];
        if ((top + height) < (screenBottom + threshold)) {
          console.log('setPage + 1', page + 1)
          setPage(page + 1)
        }
    }
  }

  const { run: runScroll } = useThrottleFn(scrollHandle, { wait: 500 })

  // 滚动实时获取可视屏幕范围
  const onScroll = (e: any) => {
    if (typeof _onScroll === 'function') {
      _onScroll(e);
    }
    // console.log('ScreenRange', [e.nativeEvent.target.scrollTop, e.nativeEvent.target.scrollTop + containerRect.current.height])
    runScroll(e)
  }

  // 列表项渲染完成后计算位置
  const itemLoaded = (index: number) => {
    if (cellRefs.current[index] && heightCollect.current[index] === undefined) {
      const rect = cellRefs.current[index].getBoundingClientRect();
      console.log('第',index,'个元素加载完成',rect, containerRect.current.columnWidth);
      const scaleHeight = rect.width ? rect.height / rect.width * containerRect.current.columnWidth : 0;
      heightCollect.current[index] = {
        value: scaleHeight,
        history: [scaleHeight]
      }
      computerRects()
    }
  }


  // 列表项高度更新，重新计算瀑布流
  const itemUpdated = (index: number) => {
    if (index !==undefined && cellRefs.current[index]) {
      const rect = cellRefs.current[index].getBoundingClientRect();
      // console.log('itemUpdated', index ,rect, heightCollect.current[index]?.history)
      // const last = heightCollect.current[index].history[heightCollect.current[index].history.length - 1] !== rect.height
      // 如果和最后一个历史高度不一样说明高度更新了，需要刷新瀑布流
      if (
        Array.isArray(heightCollect.current[index]?.history)
        && heightCollect.current[index].history[heightCollect.current[index].history.length - 1] !== rect.height
      ) {
        heightCollect.current[index].value = rect.height;
        heightCollect.current[index].history.push(rect.height);
        updateIndexQueue.current.push(index);
        runRefreshRects()
      }
    } else {
      console.warn('第', index, '元素未获取到')
    }
  }

  // useEffect(() => {
  //   if (document.querySelector(`.${classPrefix}`)){
  //     console.log('建立监听')
  //     const ro = new ResizeObserver(enties => {
  //       console.log('触发监听',enties)
  //     })
  //     ro.observe(document.querySelector(`.${classPrefix}`) as Element)
  //   }
  // }, [])

  // const onObserver = (mutationsList: MutationRecord[], observer: MutationObserver) => {
  //   for (let mutation of mutationsList) {
  //     if ((mutation.target as any)?.className !== classPrefix && mutation.target.parentElement?.className !== classPrefix) {
  //       // console.log('监听item', item);
  //       const item = findWaterfallItem(mutation.target);
  //       if (item) {
  //         // console.log('监听item', item);
  //         setTimeout(() => itemUpdated(Number(item.dataset.index)), 1600)
  //       }
  //     }
  //   }
  // }

  // useEffect(() => {
  //   console.log('MutationObserver');
  //   if (autoObserve && document.querySelector(`.${classPrefix}`)) {
  //     const observer = new MutationObserver(onObserver as MutationCallback);
  //     observer.observe(document.querySelector(`.${classPrefix}`) as Element, { subtree: true, childList: true, attributeOldValue: true, attributes: true });
  //     return () => observer.disconnect();
  //   }
  // }, [])


  // 对外暴露方法
  useImperativeHandle(ref, () => {
    return {
      itemUpdated,
    }
  }, [])

  const childrens = React.Children.map(children, (child, index) => {
    if (index < (initialNumToRender + pageSize * page)) {
      return <Cell
        ref={(ref: HTMLDivElement) => cellRefs.current[index] = ref}
        key={index}
        index={index}
        screenRange={screenRange}
        rect={rects[index]}
        columnWidth={columnWidth}
        itemLoaded={itemLoaded}
        itemUpdated={itemUpdated}
      >
        {child}
      </Cell>
    }
    return null

  })
  const lastheightCollect = [...(stateRef.current.columnsHeight[React.Children.count(children) - 1] || [])];
  lastheightCollect.sort((a,b) => a - b);
  // const maxHeight = lastheightCollect[columns - 1];

  return <div
    ref={(ref) => getContainerHeight(ref)}
    className={`waterfall ${className || ''}`}
    onScroll={onScroll}
    {...restProps}
    >
      {/* <div style={{height: maxHeight, background: 'pink'}}></div> */}
      {childrens}
    </div>
})

export default Waterfall;
