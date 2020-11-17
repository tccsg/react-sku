import React, { useState } from 'react'
import { Button } from 'antd'
import './App.css';
import SkuCreator from './component/SkuCreator'
import SkuSelect from './component/SkuSelect'

let tempSKus: any = []
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
        <Button onClick={confirmSkus}>添加</Button>
      </div>
      <div style={{ background: '#f7f7f7' }}>
        <div className="sku-select-wrap">
          <SkuSelect
            optionsChange={(spec) => {
              console.log(spec)
            }}
            data={{skus, title: 'react-sku测试', minPrice: 1}} />
        </div>
      </div>
    </div>
  );
}

export default App;
