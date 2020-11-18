import { Input, message } from 'antd'
import React, { FC, useState, useEffect } from 'react'

import './index.scss'

const DELIMITER = '†'

export type SpecItem = {
  select: boolean
  value: string
  disable?: boolean
}
type SkuItem = any
export type Spec = {
  [sk: string]: SpecItem[]
}
type SkuPathIncludeInfo = {
  [sik: string]: {
    skuId?: string
    price?: number
    hold: number
  }
}
type SpecPath = {
  path: string
  hold: number
}
type PostDody = {
  skuId: string
  itemId: string
  num: number
}
interface Props {
  /** 商品数据 */
  data: SkuItem
  /** 点击确定按钮 */
  onPressConfirm?: (p: PostDody) => void
  /** 所选规格变化触发 */
  optionsChange?: (s: Spec) => void
  /** modal关闭时触发 */
  onClose?: (s: Spec) => void
}

let skuIdBySkus: any = {}
let TotalSkuHold = 0 // 总库存

const SkuSelect: FC<Props> = (props) => {
  const { data, optionsChange, onPressConfirm, onClose = () => {} } = props
  const [count, setCount] = useState<number>(1)
  const [spec, setSpec] = useState<Spec>({})
  const [canFlag, setCanFlag] = useState(false)
  const [prodPrice, setProdPrice] = useState<number>(0)
  const [skuHold, setSkuHold] = useState(0)
  const [maxPrice, setMaxPrice] = useState<number>(0)

  const getSkuInfoByKey = (_spec: Spec, sk?: string) => {
    let skuStr = ''
    Object.keys(spec).forEach((k) => {
      const selectedValue = spec[k].find((sv) => sv.select)
      if (selectedValue) {
        skuStr += `${k}:${selectedValue.value}${DELIMITER}`
      }
    })
    if (skuIdBySkus[skuStr] && skuIdBySkus[skuStr][sk ?? '']) {
      return skuIdBySkus[skuStr][sk ?? '']
    } else if (skuIdBySkus[skuStr]) {
      return skuIdBySkus[skuStr]
    } else {
      return null
    }
  }

  /** 判断是否可以添加进购物车，比如属性是否有选，库存情况等 */
  const judgeCanAdd = (skus: any[] | undefined) => {
    const sks = Object.keys(spec)
    let s = sks.filter((sk) => spec[sk].find((sv) => sv.select)).length // 已经选择的规格个数
    let _cf = s === sks.length ? true : false
    if (skus?.length === 1 && !skus[0]?.properties?.length && skus[0].hold <= 0) {
      _cf = false
    }
    if (_cf) {
      const hold = getSkuInfoByKey(spec, 'hold')
      if (count > hold) {
        setCount(hold)
      }
    }
    setCanFlag(_cf)
    return _cf
  }

  /** 设置 规格是否可以点击，该路径上如果跟该属性的组合没库存则该属性不能点击 */
  const setSpecDisable = (tags: any, _skuIdBySkus: SkuPathIncludeInfo) => {
    Object.keys(tags).forEach((sk) => {
      tags[sk].forEach((sv: SpecItem) => {
        const str = `${sk}:${sv.value}`
        const holdArray: number[] = []
        Object.keys(_skuIdBySkus).forEach((ss) => {
          if (ss.includes(str)) {
            holdArray.push(_skuIdBySkus[ss].hold)
          }
        })
        if (!holdArray.find((h: number) => h)) {
          sv.disable = true
        } else {
          sv.disable = false
        }
      })
    })
    setSpec({ ...tags })
  }

  /** 规格选项点击事件 */
  const onPressSpecOption = (k: string, v: string, currentSpectValue: any) => {
    let _k = k
    let _v = v
    let isCancel = false
    setCount(1)
    // 找到在全部属性spec中对应的属性
    const currentSpects = spec[Object.keys(spec).find((sk) => sk === _k) || ''] || []
    // 上一个被选中的的属性
    const prevSelectedSpectValue: any = currentSpects.find((cspec) => cspec.select) || {}
    // 设置前一个被选中的值为未选中
    prevSelectedSpectValue.select = false
    // 只有当当前点击的属性值不等于上一个点击的属性值时候设置为选中状态
    if (prevSelectedSpectValue === currentSpectValue) {
      isCancel = true
    } else {
      // 设置当前点击的状态为选中
      currentSpectValue.select = true
    }

    // 全部有选中的规格数组 ##可优化
    const selectedSpec = Object.keys(spec)
      .filter((sk: string) => spec[sk].find((sv) => sv.select))
      .reduce((prev: string[], currentSpecKey) => {
        return [...prev, `${currentSpecKey}:${spec[currentSpecKey].find((__v) => __v.select)?.value}`]
      }, [])
    if (isCancel) {
      if (selectedSpec.length) {
        const k_v = selectedSpec[0].split(':')
        _k = k_v[0]
        _v = k_v[1]
      } else {
        setSpecDisable(spec, skuIdBySkus)
        _k = ''
        _v = ''
      }
    }

    // console.log('当前选中的规格字符串', selectedSpec)
    const currentSpecPath: SpecPath[] = [] // 当前选中的规格所对应的路径也就是所有组合
    Object.keys(skuIdBySkus).forEach((ssk: string) => {
      const currentSpecStr = `${_k}:${_v}`
      if (ssk.includes(currentSpecStr)) {
        currentSpecPath.push({
          path: ssk,
          hold: skuIdBySkus[ssk].hold
        })
      }
    })
    Object.keys(spec).forEach((sk: string) => {
      if (sk !== _k && _k) {
        const isSelected = spec[Object.keys(spec).find((_sk) => sk === _sk) || ''].find((sv) => sv.select)
          ? true
          : false
        spec[sk].forEach((sv: SpecItem) => {
          const _ssTemp = [...selectedSpec]
          if (isSelected) {
            const sIndex = _ssTemp.findIndex((_sv) => _sv.includes(sk))
            _ssTemp.splice(sIndex, 1)
          }
          _ssTemp.push(`${sk}:${sv.value}`)

          const ssLength = _ssTemp.length
          const _tmpPath: SpecPath[] = []
          // 优化
          currentSpecPath.forEach((csp: SpecPath) => {
            const i = _ssTemp.filter((_sst: string) => csp.path.includes(_sst)).length
            if (i === ssLength) {
              _tmpPath.push(csp)
            }
          })
          const hasHoldPath = _tmpPath.find((p) => p.hold)
          let isNotEmpty = hasHoldPath ? hasHoldPath.hold : 0
          sv.disable = !isNotEmpty
        })
      }
    })
    const skus = data?.skus
    let price = null
    if (selectedSpec.length) {
      price = getSkuInfoByKey(spec, 'price')
    } else {
      price = data?.minPrice
    }
    const hold = getSkuInfoByKey(spec, 'hold') ?? TotalSkuHold
    setSpec({ ...spec })
    if (price) {
      setProdPrice(price)
    }
    if (hold) {
      setSkuHold(hold)
    }
    judgeCanAdd(skus)
    optionsChange && optionsChange(spec)
  }

  const setDrawOptions = () => {
    const skus = data?.skus
    const _spec = data?.spec
    const dataExtraHold = data.skuHold
    let _tags: Spec = {}
    let _maxPrice = data?.minPrice ?? 0
    if (_spec) {
      _tags = _spec
      setSkuHold(dataExtraHold as number)
    } else {
      const _tempTagsStrArray: any = {} // 临时字符串数组
      let _skuHold = 0
      skus?.forEach((s) => {
        let specStr = '' // 格式 '尺寸:大#颜色:黑#' : 'xxxxxxxxx'
        _skuHold += s.hold
        s?.properties?.forEach((p) => {
          specStr += `${p.name}:${p.value}${DELIMITER}`
          if (!_tags[p.name]) {
            _tags[p.name] = []
            _tempTagsStrArray[p.name] = []
          }

          if (!_tempTagsStrArray[p.name].includes(p.value)) {
            _tempTagsStrArray[p.name].push(p.value)
            _tags[p.name].push({
              value: p.value,
              disable: false,
              select: false
            })
          }
        })
        if (!skuIdBySkus[specStr]) {
          skuIdBySkus[specStr] = {}
        }
        skuIdBySkus[specStr].skuId = s.skuId
        skuIdBySkus[specStr].price = s.price
        skuIdBySkus[specStr].hold = s.hold
        if (s.price > _maxPrice) {
          _maxPrice = s.price
        }
      })
      setSkuHold(_skuHold)
      TotalSkuHold = _skuHold
    }
    let _canFlag = !data.canFlag ? false : true
    /**  */
    if (skus?.length === 1 && !skus[0].properties?.length && skus[0].hold <= 0) {
      _canFlag = false
    }
    setCanFlag(_canFlag)
    setProdPrice(data?.minPrice ?? 0)
    setMaxPrice(_maxPrice)
    setSpecDisable(_tags, skuIdBySkus)
  }
  const openCurDrawer = () => {
    setDrawOptions()
    setCount(data?.count || 1)
  }

  const countChange = (sign: '-' | '+') => {
    let _count = count
    if (sign === '-' && _count > 1) {
      --_count
    } else if (sign === '+') {
      if (canFlag) {
        const hold = getSkuInfoByKey(spec, 'hold')
        if (_count < hold) {
          ++_count
        } else {
          message.warning('数量不能大于库存')
          _count = hold
        }
      } else {
        ++_count
      }
    }
    setCount(_count)
  }
  const addToCart = () => {
    if (!judgeCanAdd(data?.skus)) {
      return
    }

    const skuId = getSkuInfoByKey(spec, 'skuId')
    const postData: PostDody = {
      skuId,
      itemId: data?.itemId,
      num: count
    }
    if (onPressConfirm) {
      onPressConfirm(postData)
    }
  }
  useEffect(() => {
    openCurDrawer()
  }, [data])

  return (
    <div className="drawer-inner">
      <div className="prod-info">
        <div className="prod-img">
          <img src={data.image}></img>
        </div>
        <div className="content">
          <div className='price-wrap'>
            <span>¥{prodPrice}</span>
            {!canFlag && maxPrice > prodPrice ? <span>~ {maxPrice}</span> : null}
          </div>
          <div className='sku-hold'>库存 {skuHold} 件</div>
        </div>
      </div>
      <div className="spec-inner">
        {Object.keys(spec).map((k, index) => {
          return <div key={`${index + 1}`} className="items">
            <div className="title">{k}</div>
            <div className="tags">
              {
                spec[k].map((o, oi) => {
                  return (
                    <div
                      key={`${index + oi}`}
                      onClick={() => !o.disable && onPressSpecOption(k, o.value, o)}
                      className={o.select ? "tag active" : o.disable ? "tag disable" : 'tag'}>
                        {o.value}
                    </div>
                  )
                })
              }
            </div>
          </div>
        })}
        <div className="items">
          <div className="title">
            数量
            <div className="count-wrap">
              <div className="sign" onClick={() => countChange('-')}>-</div>
              <div className="count-box">{count}</div>
              <div className="sign" onClick={() => countChange('+')}>+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkuSelect
