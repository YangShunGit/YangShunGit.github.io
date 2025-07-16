

import React, { useEffect, useState, useRef } from 'react'
import Waterfall from '../components/Waterfall'

const DATA_LENGTH =10;
let data1 = [
  'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
  'https://img0.baidu.com/it/u=3739429570,2783758709&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=750',
  'https://gw.alipayobjects.com/zos/antfincdn/LlvErxo8H9/photo-1503185912284-5271ff81b9a8.webp',
  'https://img0.baidu.com/it/u=8013311,3592244460&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=617',
  'https://img2.baidu.com/it/u=3018303209,1765139986&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=722',
  'https://img2.baidu.com/it/u=1533484450,2625314894&fm=253&fmt=auto&app=138&f=JPEG?w=664&h=500',
]
new Array(DATA_LENGTH).fill(1).forEach(() => data1 = data1.concat(data1));

const DynamicHeightDiv = ({ index, item }) => {

  return <div style={{ width: '100%', overflow: 'hidden', display: 'flex',flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
    <div>{index+1}</div><img width="100%" height='auto' src={item} ></img>
  </div>
}


export default () => {
  const [data, setData] = useState<string[]>([])

  useEffect(() => {
    setTimeout(() => {
      setData(data1)
      console.warn('data1', data1)
    }, 0)
  }, [])

  return <Waterfall
      style={{background: 'white'}}
      className={'my-waterfall'}
      initialNumToRender={50}
      pageSize={20}
      columns={5}
      gapX={20}
      gapY={20}
      autoObserve={true}
    >
      {data.map((item, index) => {
        return <DynamicHeightDiv item={`${item}?time=${Date.now()}`} index={index}/>
      })}
  </Waterfall>
}
