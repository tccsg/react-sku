import React from "react";
import "./index.scss";

let TotalSkuHold = 0; // 总库存

type IProps = {
  /** 商品数据 */
  data?: any;
  /** 是否可以编辑数量 */
  editCount?: boolean;
  /** 以什么方式打开 选项，立即购买，添加到购物车 */
  drawerOpenType?: "options" | "buy" | "cart";
  /** 购物车按钮显示的文案 */
  carBtnLabel?: string;
  /** 购买按钮的文案 */
  buyBtnLabel?: string;
  /** 购买按钮的背景色 */
  buyBtnBackgroundColor?: string;
  /** 是否是修改sku信息 */
  modify?: boolean;
  /** 不重新初始化数据，比如在商品详细页那边，每次打开不初始化 */
  noReInit?: boolean;
  /** 完成时候的事件 */
  onPressConfirm?: (p: any) => void;
  /** 选项改变是触发 s: 规格， p：价格 */
  optionsChange?: (s: any, p: number | null) => void;
  /** 关闭弹窗的事件 */
  onClose?: (s: any, p: number | null, sku: any) => void;
  /** 点击buy按钮的事件，阻止内部buy事件 */
  onClickBuy?: (skuId: string) => void;
};
type IState = {
  count: any;
  spec: any;
  canFlag: boolean;
  prodPrice: any;
  skuHold: number;
  maxPrice: any;
  membershipPrice: number | null;
};
type PrivateState = {
  isInit: boolean;
  currentSku: any;
};
interface ProdDrawer extends PrivateState {
  props: IProps;
  state: IState;
}
class ProdDrawer extends React.Component {
  constructor(props: IProps) {
    super(props);
    this.state = {
      count: 1,
      spec: {},
      canFlag: false,
      prodPrice: "",
      skuHold: 0,
      membershipPrice: null,
      maxPrice: "",
    };
    this.isInit = false;
  }
  static options = {
    addGlobalClass: true,
  };
  componentWillReceiveProps(next: IProps) {
    const { data } = next;
    if (data) {
      this.openCurDrawer();
    }
  }
  // 根据规格属性的key 获取对应的 库存，id，价格
  getSkuInfoByKey = (_spec, sk?) => {
    // 已选的规格：[{ name:规格名称, value:已选规格内容 }]
    const selectedSpec: string[] = [];

    Object.keys(_spec).forEach((k) => {
      const selectedValue = _spec[k].find((sv) => sv.select);
      if (selectedValue) {
        // 这块部分也可以在选择的时候直接处理
        selectedSpec.push(`${k}:${selectedValue.value}`);
      }
    });
    // 在规格没有全选的情况下 不执行查询操作
    if (selectedSpec.length !== Object.keys(_spec).length) {
      return;
    }
    const { skus } = this.props.data;
    const querySku = skus.find((sku) => {
      // 对比两个数组找到 两个都不存在的sku 如果为0 则说明完全匹配就是该sku
      let flag = true;
      sku.properties.forEach((sp) => {
        if (!selectedSpec.includes(`${sp.name}:${sp.value}`)) {
          flag = false;
        }
      });
      return flag;
    });
    if (querySku && querySku[sk]) {
      return querySku[sk];
    } else if (querySku) {
      return querySku;
    } else {
      return null;
    }
  };
  skuCore = (selectedSpec, currentSpecName?) => {
    const { data } = this.props;
    const { skus } = data;
    const { spec } = this.state;
    const currentSpecPath: any[] = []; // 当前选中的规格所对应的路径也就是所有组合

    skus.forEach((sku) => {
      currentSpecPath.push({
        path: sku.properties,
        hold: sku["hold"],
      });
    });

    Object.keys(spec).forEach((sk: string) => {
      if (sk !== currentSpecName) {
        const currentSpecSelectedValue = spec[
          Object.keys(spec).find((_sk) => sk === _sk) || ""
        ].find((sv) => sv.select);
        spec[sk].forEach((sv: any) => {
          if (!sv.select) {
            const _ssTemp = [...selectedSpec];
            if (!!currentSpecSelectedValue) {
              const sIndex = _ssTemp.findIndex(
                (_sv) => _sv === `${sk}:${currentSpecSelectedValue.value}`
              );
              _ssTemp.splice(sIndex, 1);
            }
            _ssTemp.push(`${sk}:${sv.value}`);

            const _tmpPath: any[] = [];
            // 优化
            currentSpecPath.forEach((csp: any) => {
              const i = _ssTemp.filter((_sst: string) => {
                const querySpec = csp.path.some((p) => {
                  return `${p.name}:${p.value}` === _sst;
                });
                return querySpec;
              }).length;
              if (i === _ssTemp.length) {
                _tmpPath.push(csp);
              }
            });
            const hasHoldPath = _tmpPath.find((p) => p["hold"]);
            const isNotEmpty = hasHoldPath ? hasHoldPath["hold"] : 0;
            sv.disable = !isNotEmpty;
          }
        });
      }
    });
  };
  /**
   * 核心代码 点击某个属性的某个值的时候，判断那个属性的哪个值不能点
   * @param k  属性名称
   * @param v  该属性的值
   * @param currentSpectValue 当前点击的属性
   */
  drawOptionClick = (k: string, currentSpectValue: any) => {
    const { spec } = this.state;
    const { data, optionsChange } = this.props;
    const { skus } = data;

    let isCancel = false; // 该属性属于取消行为
    // 找到在全部属性spec中对应的属性
    const currentSpects =
      spec[Object.keys(spec).find((sk) => sk === k) || ""] || [];
    // 上一个被选中的的属性
    const prevSelectedSpectValue =
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
            spec[currentSpecKey].find((v) => v.select).value
          }`,
        ];
      }, []);
    if (isCancel) {
      if (!selectedSpec.length) {
        this.setSpecDisable(spec);
      }
    }
    if (selectedSpec.length) {
      this.skuCore(selectedSpec, k);
    }
    const prices = skus.map((sku) => sku["price"]);
    const currentSKu = this.getSkuInfoByKey(spec);
    let price: any = null;
    if (selectedSpec.length) {
      price = currentSKu?.["price"] ?? null;
    } else {
      price = Math.min(...prices);
    }
    const hold = currentSKu?.["hold"] || TotalSkuHold;
    const setVal: any = {
      spec: { ...spec },
    };
    if (price) {
      setVal.prodPrice = price;
    }
    if (hold) {
      setVal.skuHold = hold;
    }
    setVal.membershipPrice = currentSKu?.["membershipPrice"] ?? null;
    this.setState(setVal, () => {
      this.judgeCanAdd(skus);
    });
    this.currentSku = currentSKu;
    optionsChange && optionsChange(spec, price);
  };
  setDrawOptions() {
    const { data } = this.props;
    const skus = data.skus;
    const _spec = data.spec;
    let _tags = {};

    const prices = skus.map((sku) => sku["price"]);
    const maxPrice = Math.max(...prices);

    if (_spec) {
      _tags = _spec;
    } else {
      let _skuHold = 0; // 总库存
      skus.forEach((s) => {
        _skuHold += s["hold"];
        s.properties.forEach((p) => {
          // 生成弹窗显示的规格属性
          if (!_tags[p.name]) {
            _tags[p.name] = [];
          }
          if (!_tags[p.name].find((t) => t.value === p.value)) {
            _tags[p.name].push({
              value: p.value,
              disable: false,
              select: false,
            });
          }
        });
      });
      TotalSkuHold = _skuHold;
      this.setState({
        skuHold: _skuHold,
      });
    }
    // 针对只有一个规格的产品
    let _canFlag = Object.keys(_tags).length ? false : true;
    // 针对只有一个规格且库存为0 的
    if (
      skus.length === 1 &&
      !skus[0].properties.length &&
      skus[0]["hold"] <= 0
    ) {
      _canFlag = false;
    }
    this.setState({
      canFlag: _canFlag,
      prodPrice: Math.min(...prices),
      maxPrice,
    });
    this.setSpecDisable(_tags);
  }
  /** 设置哪些规格属性不能点，就是该路径上库存为0 */
  setSpecDisable = (tags) => {
    const { skus } = this.props.data;
    Object.keys(tags).forEach((sk) => {
      tags[sk].forEach((sv: any) => {
        const currentSpec = `${sk}:${sv.value}`;
        // 找到含有该规格的路径下 库存不为0的 sku
        const querySku = skus.find((sku) => {
          const queryProperty = sku.properties.find(
            (sp) => `${sp.name}:${sp.value}` === currentSpec
          );
          return queryProperty && sku["hold"];
        });
        // 如果找到 对应该属性的路径 sku有不为0 的则可选
        sv.disable = !querySku;
      });
    });
    this.setState({
      spec: { ...tags },
    });
  };
  /** 打开弹窗并初始化 弹窗里面的数据 */
  openCurDrawer = () => {
    const { data, noReInit } = this.props;
    // 如果进行初始化弹窗的话 把一些数据初始化
    if (this.isInit) {
      // 判断是否已经初始化
      if (!noReInit) {
        this.setDrawOptions();
        this.setState({
          count: 1,
          membershipPrice: null,
        });
      }
    } else {
      this.setDrawOptions();
      this.setState({
        count: data.count || 1,
      });
      this.isInit = true;
    }
  };
  onCloseCurDrawer = () => {
    const { onClose } = this.props;
    const { spec, prodPrice } = this.state;
    onClose?.(spec, prodPrice, this.currentSku);
  };
  countChange = (sign: "-" | "+") => {
    let { count } = this.state;
    const { canFlag, spec } = this.state;
    if (sign === "-" && count > 1) {
      --count;
    } else if (sign === "+") {
      if (canFlag) {
        const hold = this.getSkuInfoByKey(spec, "hold");
        if (count < hold) {
          ++count;
        } else {
          console.log("数量不能大于库存");
          count = hold;
        }
      } else {
        ++count;
      }
    }
    this.setState({
      count: count,
    });
  };
  /**
   * 判断是否可以添加到购物车
   * @param skus
   */
  judgeCanAdd = (skus) => {
    const { spec, count } = this.state;
    const sks = Object.keys(spec);
    const s = sks.filter((sk) => spec[sk].some((sv) => sv.select)).length; // 已经选择的规格个数
    let _cf = s === sks.length;
    if (!skus || !skus.length) {
      _cf = false;
    }
    // 针对只有一种sku 而且没填规格的
    if (
      skus.length === 1 &&
      !skus[0].properties.length &&
      skus[0]["hold"] <= 0
    ) {
      _cf = false;
    }
    const setVal: any = {
      canFlag: _cf,
    };
    if (_cf) {
      // 如果可以添加到购物车，则获取当前的库存值
      const hold = this.getSkuInfoByKey(spec, "hold");
      // 如果所填的值大于库存则 数量变成库存值
      if (count > hold) {
        setVal.count = hold;
      }
    }
    this.setState(setVal);
    return _cf;
  };
  countInputChange = (e) => {
    const { value } = e.detail;
    const setVal = {
      count: value,
    };
    this.setState({ ...setVal });
  };
  inputOnblur = (e) => {
    const { value } = e.detail;
    if (!value || value === "0") {
      this.setState({
        count: 1,
      });
    }
    const { spec, canFlag } = this.state;
    if (canFlag) {
      const hold = this.getSkuInfoByKey(spec, "hold");
      if (value > hold) {
        console.log("数量不能大于库存");
        this.setState({
          count: `${hold}`,
        });
      }
    }
  };
  onPressConfirmButton = () => {
    const { data, onPressConfirm } = this.props;
    const { spec, count } = this.state;
    if (!this.judgeCanAdd(data?.skus)) {
      return;
    }
    const skuId = this.getSkuInfoByKey(spec, "skuId");
    const postData: any = {
      skuId,
      itemId: data?.itemId,
      num: count,
    };
    onPressConfirm?.(postData);
  };
  render() {
    const { data } = this.props;
    const { count, spec, canFlag, prodPrice, skuHold, maxPrice } = this.state;
    return (
      <div className="drawer-inner">
        <div className="prod-info">
          <div className="prod-img">
            <img alt="" src={data.image} />
          </div>
          <div className="content">
            <div className="item-title">{data.title}</div>
            <div>
              <div className="price-wrap">
                <span>¥{prodPrice}</span>
                {!canFlag && maxPrice > prodPrice ? (
                  <span>~ {maxPrice}</span>
                ) : null}
              </div>
              <div className="sku-hold">库存 {skuHold} 件</div>
            </div>
          </div>
        </div>
        <div className="spec-inner">
          {Object.keys(spec).map((k, index) => {
            return (
              <div key={`${index + 1}`} className="items">
                <div className="title">{k}</div>
                <div className="tags">
                  {spec[k].map((o, oi) => {
                    return (
                      <div
                        key={`${index + oi}`}
                        onClick={() => !o.disable && this.drawOptionClick(k, o)}
                        className={
                          o.select
                            ? "tag active"
                            : o.disable
                            ? "tag disable"
                            : "tag"
                        }
                      >
                        {o.value}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="items">
            <div className="title">
              数量
              <div className="count-wrap">
                <div className="sign" onClick={() => this.countChange("-")}>
                  -
                </div>
                <div className="count-box">{count}</div>
                <div className="sign" onClick={() => this.countChange("+")}>
                  +
                </div>
              </div>
            </div>
          </div>
          <div className="btn-wrap">
            <div
              className={canFlag ? "btn" : "btn disable"}
              onClick={this.onPressConfirmButton}
            >
              确认
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ProdDrawer;
