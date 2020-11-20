import React, { useState } from 'react'
import { Button } from 'antd'
import './App.css';
import SkuCreator from './component/SkuCreator'
import SkuSelect from './component/SkuSelect'

let tempSKus: any = []
const mockItemData = {
  title: 'react-sku组件',
  minPrice: 1,
  itemId: 'test_csdfdge8je3nnc'
}
const App = () => {
  const [skus, setSkus] = useState<any[]>([])
  const confirmSkus = () => {
    setSkus([...tempSKus])
  }
  return (
    <div className="app">
      <div className="sku-creator-wrap">
        <SkuCreator onChange={(skus) => {
          tempSKus = skus
        }} skus={[]} />
        <Button type="primary" onClick={confirmSkus}>确认添加</Button>
      </div>
      <div style={{ background: '#f7f7f7' }}>
        <div className="sku-select-wrap">
          <SkuSelect
            optionsChange={(spec) => {
              console.log('点击的规格属性变化', spec)
            }}
            onPressConfirm={(data) => {
              console.info('提交的数据', data)
            }}
            data={{skus, ...mockItemData}} />
        </div>
      </div>
    </div>
  );
}

export default App;
