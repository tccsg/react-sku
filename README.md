[这里安利一个买莆田鞋的网站: putian.io](https://putian.io)

演示地址：https://tccsg.github.io/react-sku/

因为业务的需求不得不对 sku 进行深入的研究，在还没写代码之前感觉是简单的，一天就搞定了

![](https://upload-images.jianshu.io/upload_images/6080408-e39ce5976aa26873.jpeg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

结果几天过后..

![](https://upload-images.jianshu.io/upload_images/6080408-c2c3cf2a2cf4de73.jpeg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

甚至想打人了，在想当初是谁给我的自信。还好最后还是写出来了，差 a 点误了进度。

仓库的版本是针对普通的 `react hook`结合`ant`版的
因为我是用`React-Native`写的 App 也是用 hook 写的比较好迁移
小程序方面用的是`Taro`这个框架，不过是用`class`方式写的，迁移起来稍微麻烦 🤏，不过问题不大。

##### 代码解析(sku 选择器)

代码方面重点解析 sku 选择器。
![sku格式](https://upload-images.jianshu.io/upload_images/6080408-bc8a5127f24848cd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

```js
/**
   * 通过skus初始化 各个规格
   */
  const setDrawOptions = () => {
    const skus = data?.skus
    const _spec = data?.spec
    const dataExtraHold = data.skuHold
    let _tags: Spec = {}
    let _maxPrice = data?.minPrice ?? 0
    // 用于初始化默认选项
    if (_spec) {
      _tags = _spec
      setSkuHold(dataExtraHold as number)
    } else {
      const _tempTagsStrArray: any = {} // 临时字符串数组
      let _skuHold = 0 // 用于计算总库存
      skus?.forEach((s) => {
        _skuHold += s.hold
        s?.properties?.forEach((p) => {
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
    setSpecDisable(_tags)
  }
```

初始化各个选项用的，把 sku 的格式转成以下格式

```js
{
  颜色: [
    {
      value: "红色",
      disable: fasle, // 是否可点击
      select: false, // 是否选中
    },
    //.....
  ];
  容量: [
    {
      value: "16G",
      disable: fasle, // 是否可点击
      select: false, // 是否选中
    },
    // .....
  ];
}
```

```js
/** 用于规格都没选中的时候 设置 规格是否可以点击，该路径上如果跟该属性的组合没库存则该属性不能点击 */
// 可合并在 skuCore中
const setSpecDisable = (tags: any) => {
  const { skus } = data;
  Object.keys(tags).forEach((sk) => {
    tags[sk].forEach((sv: SpecItem) => {
      const currentSpec = `${sk}:${sv.value}`;
      // 找到含有该规格的路径下 库存不为0的 sku
      const querySku = skus.find((sku) => {
        const queryProperty = sku.properties.find(
          (sp) => `${sp.name}:${sp.value}` === currentSpec
        );
        return queryProperty && sku.hold;
      });
      // 如果找到 对应该属性的路径 sku有不为0 的则可选
      sv.disable = !querySku;
    });
  });
  setSpec({ ...tags });
};
```

这个是用于在规格都没选中的判断哪些不能点，因为是早起版本留下来的，也不敢动，应该是可以合并到下面的会提到的`skuCore`中。

```js
/** 规格选项点击事件 */
const onPressSpecOption = (k: string, currentSpectValue: any) => {
  let isCancel = false;
  setCount(1);
  // 找到在全部属性spec中对应的属性
  const currentSpects =
    spec[Object.keys(spec).find((sk) => sk === k) || ""] || [];
  // 上一个被选中的的属性
  const prevSelectedSpectValue: any =
    currentSpects.find((cspec) => cspec.select) || {};
  // 设置前一个被选中的值为未选中
  prevSelectedSpectValue.select = false;
  // 只有当当前点击的属性值不等于上一个点击的属性值时候设置为选中状态
  if (prevSelectedSpectValue === currentSpectValue) {
    isCancel = true;
  } else {
    // 设置当前点击的状态为选中
    currentSpectValue.select = true;
  }

  // 全部有选中的规格数组 ##可优化
  const selectedSpec = Object.keys(spec)
    .filter((sk: string) => spec[sk].find((sv) => sv.select))
    .reduce((prev: string[], currentSpecKey) => {
      return [
        ...prev,
        `${currentSpecKey}:${
          spec[currentSpecKey].find((__v) => __v.select)?.value
        }`,
      ];
    }, []);
  if (isCancel) {
    // 如果是取消且全部没选中
    if (!selectedSpec.length) {
      // 初始化是否可点
      setSpecDisable(spec);
    }
  }
  // 如果规格中有选中的 则对整个规格就行 库存判断 是否可点
  if (selectedSpec.length) {
    skuCore(selectedSpec, k);
  }

  let price = null;
  if (selectedSpec.length) {
    price = getSkuInfoByKey(spec, "price");
  } else {
    price = data?.minPrice;
  }
  const hold = getSkuInfoByKey(spec, "hold") ?? TotalSkuHold;
  setSpec({ ...spec });
  if (price) {
    setProdPrice(price);
  }
  setSkuHold(hold);
  optionsChange && optionsChange(spec);
};
```

代码也都有注释这里就不做解释了。

```js
/**
 * 核心代码
 * @param selectedSpec 已选中的数组
 * @param currentSpecName 当前点击的规格的名称
 */
const skuCore = (selectedSpec: string[], currentSpecName?: string) => {
  const { skus } = data;
  Object.keys(spec).forEach((sk: string) => {
    if (sk !== currentSpecName) {
      // 找出该规格中选中的值
      const currentSpecSelectedValue = spec[
        Object.keys(spec).find((_sk) => sk === _sk) || ""
      ].find((sv) => sv.select);
      spec[sk].forEach((sv: SpecItem) => {
        // 判断当前的规格的值是否是选中的，如果是选中的 就不要判断是否可以点击直接跳过循环
        if (!sv.select) {
          const _ssTemp = [...selectedSpec];
          // 如果当前规格有选中的值
          if (!!currentSpecSelectedValue) {
            const sIndex = _ssTemp.findIndex(
              (_sv) => _sv === `${sk}:${currentSpecSelectedValue.value}`
            );
            _ssTemp.splice(sIndex, 1);
          }
          _ssTemp.push(`${sk}:${sv.value}`);
          const _tmpPath: SkuItem[] = [];
          // 找到包含该路径的全部sku
          skus.forEach((sku: SkuItem) => {
            // 找出skus里面包含目前所选中的规格的路径的数组的数量
            const querSkus = _ssTemp.filter((_sst: string) => {
              const querySpec = sku.properties.some((p) => {
                return `${p.name}:${p.value}` === _sst;
              });
              return querySpec;
            });
            const i = querSkus.length;
            if (i === _ssTemp.length) {
              _tmpPath.push(sku); // 把包含该路径的sku全部放到一个数组里
            }
          });
          const hasHoldPath = _tmpPath.find((p) => p.hold); // 判断里面是要有个sku不为0 则可点击
          let isNotEmpty = hasHoldPath ? hasHoldPath.hold : 0;
          sv.disable = !isNotEmpty;
        }
      });
    }
  });
  judgeCanAdd(skus);
};
```

这个就是用来判断，当我们点击一个规格值后，除了`当前规格的所有值`和`其他规格选中值`以外的值都要判断是否可点，这些值要跟当前所选中的规格值组合成一个路径，然后从 skus 中找到包含当前路径的所有 sku，然后通过判断这些 sku 中是否含有非 0 的库存则说明这个规格值可以点。

```js
/**
 *
 * @param _spec 规格属性
 * @param sk 该sku下的 sk这个key的值
 *
 * 不传sk的话返回所有信息
 */
const getSkuInfoByKey = (_spec: Spec, sk?: string) => {
  // 已选的规格：[{ name:规格名称, value:已选规格内容 }]
  const selectedSpec: { name: string, value: string }[] = [];

  Object.keys(_spec).forEach((k) => {
    const selectedValue = _spec[k].find((sv) => sv.select);
    if (selectedValue) {
      // 这块部分也可以在选择的时候直接处理
      selectedSpec.push({
        name: k,
        value: selectedValue.value,
      });
    }
  });
  // 在规格没有全选的情况下 不执行查询操作
  if (selectedSpec.length !== Object.keys(_spec).length) {
    return;
  }
  const { skus } = data;
  const querySku = skus.find((sku) => {
    // 对比两个数组找到 两个都不存在的sku 如果为0 则说明完全匹配就是该sku
    const diffSkus = _.xorWith(selectedSpec, sku.properties, _.isEqual);
    return !diffSkus.length;
  });
  if (querySku && querySku[sk ?? ""]) {
    return querySku[sk ?? ""];
  } else if (querySku) {
    return querySku;
  } else {
    return null;
  }
};
```

用于当全部规格值都选中的时候，找到含这个路径的 sku，就可以知道库存和价格了，也可以单独获取价格或者库存等的这些信息。

好了当我知道可以用的时候我是

![](https://upload-images.jianshu.io/upload_images/6080408-49ed154ac481343d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

##### 演示图片

![演示图片](https://upload-images.jianshu.io/upload_images/6080408-4b5b0ffdfd927cc2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

演示地址：https://tccsg.github.io/react-sku/
