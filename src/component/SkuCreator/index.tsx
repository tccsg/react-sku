import { Button, Form, Input, Select, Space, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import React, { FC, useState, useEffect } from "react";
import cartesian from "../../utils/cartesian";
import _ from "lodash";
import { uuid } from "../../utils";

const { Option } = Select;

export interface SkuItem {
  key?: string;
  skuId?: string;
  properties?: { name: string; value: string }[];
  /** 库存 */
  hold?: number;
  /** 价格 */
  price?: number;
}

interface Props {
  skus: SkuItem[];
  onChange?: (skus: SkuItem[]) => void;
}

interface TotalPropertyValues {
  name: string;
  key: string;
  values?: string[];
}

const SkuCreator: FC<Props> = (props) => {
  const { skus, onChange } = props;
  const defaultProperties: TotalPropertyValues[] = [];

  // 计算默认展示的价格或者库存
  // let defaultPrice;
  // let defaultHold;

  skus?.forEach((sku) => {
    sku.properties?.forEach((prop, i) => {
      if (prop.name && prop.value) {
        const currentProp = defaultProperties.find((p) => p.name === prop.name);
        if (currentProp) {
          !currentProp.values?.includes(prop.value) &&
            currentProp.values?.push(prop.value);
        } else {
          defaultProperties.push({
            name: prop.name,
            key: uuid(),
            values: [prop.value],
          });
        }
      }
    });
    // if (skus.length === 1) {
    //   defaultPrice = sku.price;
    //   defaultHold = sku.hold;
    // }
  });

  const [totalProperties, setTotalProperties] = useState(defaultProperties);
  const [isShowDetail, setIsShowDetail] = useState(false);
  const [columns, setColumns] = useState<ColumnsType<SkuItem>>([]);
  const [rows, setRows] = useState<SkuItem[]>(skus ?? []);

  // 商品规格操作相关
  const property = {
    add() {
      setTotalProperties((prev) => [
        ...prev,
        {
          name: "",
          key: uuid(),
          values: [],
        },
      ]);
    },
    remove(i: number) {
      setTotalProperties((prev) => {
        const ret = JSON.parse(JSON.stringify(prev));
        ret.splice(i, 1);
        return ret;
      });
    },
    onChangeName(i: number, name: string) {
      setTotalProperties((prev) => {
        const ret = [...prev];
        ret[i].name = name;
        return ret;
      });
    },
    onChangeValues(i: number, values: string[]) {
      setTotalProperties((prev) => {
        const ret = [...prev];
        ret[i].values = values;
        return ret;
      });
    },
  };

  const sku = {
    onChangePrice(r: SkuItem, price: string) {
      setRows((prev) => {
        r.price = price as any;
        const ret = JSON.parse(JSON.stringify(prev));
        return ret;
      });
    },
    onChangeHold(r: SkuItem, hold: string) {
      setRows((prev) => {
        r.hold = Number(hold);
        const ret = JSON.parse(JSON.stringify(prev));
        return ret;
      });
    },
  };

  // 当商品规格发生改变时候改变数据
  useEffect(() => {
    let _isShowDetail = false;
    const _columns: ColumnsType<SkuItem> = [];
    const _rows: SkuItem[] = [];

    const properties: { name: string; value: string }[][] = [];
    totalProperties.forEach((prop) => {
      if (prop.name && prop.values?.length) {
        const cartesianItem: any = [];
        _isShowDetail = true;

        _columns.push({
          title: prop.name,
          dataIndex: "properties",
          key: "properties",
        });

        prop.values.forEach((value) => {
          cartesianItem.push({
            name: prop.name,
            value,
          });
        });
        properties.push(cartesianItem);
      }
    });

    // 使用笛卡尔乘积并根据属性计算所有可能的sku
    const cartesianProperties = cartesian(...properties);
    cartesianProperties?.forEach((e: any, i: any) => {
      _rows.push({
        key: i,
        skuId: uuid(),
        properties: Array.isArray(e) ? e : [e],
      });
    });
    ////////
    const colSpanArray: any = {};
    const rowCount: any = [];
    _rows.forEach((r, rindex) => {
      r.properties?.forEach((p, pindex) => {
        if (!colSpanArray[p.name]) {
          colSpanArray[p.name] = [];
        }
        if (rowCount[pindex] !== p.value) {
          colSpanArray[p.name].push(rindex - 1);
          rowCount[pindex] = p.value;
          if (rindex + 1 === _rows.length) {
            colSpanArray[p.name].push(rindex);
          }
        } else {
          if (rindex + 1 === _rows.length) {
            colSpanArray[p.name].push(rindex);
          }
        }
      });
    });
    _columns.forEach((c) => {
      c.render = (value, _, index) => {
        const item = value.find((v: any) => v.name === c.title);
        const obj: any = {
          children: item?.value,
          props: {},
        };
        obj.props.rowSpan = 0;
        colSpanArray[c.title as string]?.forEach((i, cindex) => {
          const prev = colSpanArray[c.title as string][cindex - 1];
          if (index === (prev === undefined ? 0 : prev + 1)) {
            obj.props.rowSpan = prev === undefined ? i + 1 : i - prev;
          }
        });
        return obj;
      };
    });
    // 添加额外的栏
    _columns.push({
      title: "价格",
      dataIndex: "price",
      key: "price",
      width: 200,
      render: (value, row, index) => {
        return (
          <Input
            value={value}
            prefix="￥"
            required
            onChange={(e) => sku.onChangePrice(row, e.target.value)}
          />
        );
      },
    });

    _columns.push({
      title: "库存",
      width: 200,
      dataIndex: "hold",
      key: "hold",
      render: (value, row, index) => {
        return (
          <Input
            value={value}
            required
            onChange={(e) => sku.onChangeHold(row, e.target.value)}
          />
        );
      },
    });

    setIsShowDetail(_isShowDetail);
    setColumns(_columns);
    // 当totalProperties 发生改变时候就要重置行元素
    if (!_.isEqual(totalProperties, defaultProperties)) {
      setRows(_rows);
    }
  }, [totalProperties]);

  // 调整属性顺序 暂时没用到
  // const onPressTop = (index: number) => {
  //   const topProperty = totalProperties[index];
  //   _.pullAt(totalProperties, index);
  //   totalProperties.unshift(topProperty);
  //   setTotalProperties([...totalProperties]);
  // };
  useEffect(() => {
    onChange?.(rows);
  }, [rows]);

  return (
    <>
      <Form.Item label="商品规格" wrapperCol={{ span: 18 }}>
        <Space direction="vertical">
          {totalProperties.map((prop, i) => (
            <Space key={prop.key}>
              <Input
                addonBefore="规格名"
                defaultValue={prop.name}
                onChange={(e) => property.onChangeName(i, e.target.value)}
              />
              <Select
                mode="tags"
                style={{ width: 400 }}
                placeholder="添加规格属性"
                value={prop.values}
                onChange={(v) => property.onChangeValues(i, v)}
                // onChange={handleChange}
              >
                {prop?.values?.map((value) => (
                  <Option key={value} value={value}>
                    {value}
                  </Option>
                ))}
              </Select>
              <Button type="link" danger onClick={() => property.remove(i)}>
                删除
              </Button>
              {/* {i !== 0 ? (
                <Button type="link" onClick={() => onPressTop(i)}>
                  置顶
                </Button>
              ) : null} */}
            </Space>
          ))}
          {totalProperties.length < 10 && (
            <Button type="dashed" onClick={property.add}>
              添加规格
            </Button>
          )}
        </Space>
      </Form.Item>
      {isShowDetail ? (
        <Form.Item label="规格明细" wrapperCol={{ span: 16 }}>
          <Table
            pagination={false}
            size="small"
            columns={columns}
            dataSource={rows}
            bordered
            // footer={() => 'Footer'}
          />
        </Form.Item>
      ) : null}
    </>
  );
};

export default SkuCreator;
