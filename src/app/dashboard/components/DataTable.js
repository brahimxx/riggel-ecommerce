import React, { useState, useMemo } from "react";
import { DownOutlined } from "@ant-design/icons";
import { Form, Radio, Space, Switch, Table } from "antd";

const actionColumn = {
  title: "Action",
  key: "action",
  sorter: true,
  render: () => (
    <Space size="middle">
      <a>Delete</a>
      <a>
        <Space>
          More actions
          <DownOutlined />
        </Space>
      </a>
    </Space>
  ),
};

const defaultExpandable = {
  expandedRowRender: (record) => <p>{record.description}</p>,
};
const defaultTitle = () => "Here is title";
const defaultFooter = () => "Here is footer";
const DataTable = ({ data, loading, setLoading }) => {
  const [bordered, setBordered] = useState(false);
  const [size, setSize] = useState("large");
  const [expandable, setExpandable] = useState(defaultExpandable);
  const [showTitle, setShowTitle] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [ellipsis, setEllipsis] = useState(false);
  const [yScroll, setYScroll] = useState(false);
  const [xScroll, setXScroll] = useState("unset");

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [actionColumn];
    // Generate one column for every property in the data except "key"
    const baseCols = Object.keys(data[0])
      .filter((key) => key !== "key")
      .map((key) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        dataIndex: key,
        key,
        sorter: (a, b) => {
          // You can customize this logic as needed
          return String(a[key]).localeCompare(String(b[key]));
        },
      }));
    // Add your custom action column at the end
    return [...baseCols, actionColumn];
  }, [data]);

  const handleBorderChange = (enable) => {
    setBordered(enable);
  };

  const handleSizeChange = (e) => {
    setSize(e.target.value);
  };
  const handleExpandChange = (enable) => {
    setExpandable(enable ? defaultExpandable : undefined);
  };
  const handleEllipsisChange = (enable) => {
    setEllipsis(enable);
  };
  const handleTitleChange = (enable) => {
    setShowTitle(enable);
  };

  const handleFooterChange = (enable) => {
    setShowFooter(enable);
  };
  const handleRowSelectionChange = (enable) => {
    setRowSelection(enable ? {} : undefined);
  };
  const handleYScrollChange = (enable) => {
    setYScroll(enable);
  };
  const handleXScrollChange = (e) => {
    setXScroll(e.target.value);
  };

  const scroll = {};
  if (yScroll) {
    scroll.y = 240;
  }
  if (xScroll !== "unset") {
    scroll.x = "100vw";
  }
  const tableColumns = columns.map((item) =>
    Object.assign(Object.assign({}, item), { ellipsis })
  );
  if (xScroll === "fixed") {
    tableColumns[0].fixed = true;
    tableColumns[tableColumns.length - 1].fixed = "right";
  }
  const tableProps = {
    bordered,
    loading,
    size,
    expandable,
    title: showTitle ? defaultTitle : undefined,
    showHeader: "true",
    footer: showFooter ? defaultFooter : undefined,
    rowSelection,
    scroll,
    tableLayout: "unset",
  };
  return (
    <>
      <Form
        layout="inline"
        className="table-demo-control-bar"
        style={{ marginBottom: 16 }}
      >
        <Form.Item label="Bordered">
          <Switch checked={bordered} onChange={handleBorderChange} />
        </Form.Item>
        <Form.Item label="Title">
          <Switch checked={showTitle} onChange={handleTitleChange} />
        </Form.Item>
        <Form.Item label="Footer">
          <Switch checked={showFooter} onChange={handleFooterChange} />
        </Form.Item>
        <Form.Item label="Expandable">
          <Switch checked={!!expandable} onChange={handleExpandChange} />
        </Form.Item>
        <Form.Item label="Checkbox">
          <Switch
            checked={!!rowSelection}
            onChange={handleRowSelectionChange}
          />
        </Form.Item>

        <Form.Item label="Ellipsis">
          <Switch checked={!!ellipsis} onChange={handleEllipsisChange} />
        </Form.Item>
        <Form.Item label="Size">
          <Radio.Group value={size} onChange={handleSizeChange}>
            <Radio.Button value="large">Large</Radio.Button>
            <Radio.Button value="middle">Middle</Radio.Button>
            <Radio.Button value="small">Small</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="Table Scroll">
          <Radio.Group value={xScroll} onChange={handleXScrollChange}>
            <Radio.Button value="unset">Unset</Radio.Button>
            <Radio.Button value="scroll">Scroll</Radio.Button>
            <Radio.Button value="fixed">Fixed Columns</Radio.Button>
          </Radio.Group>
        </Form.Item>
      </Form>
      <Table
        {...tableProps}
        pagination={{ position: ["bottomRight"] }}
        columns={columns}
        dataSource={data}
        rowKey={(record) => {
          // Use first property as row key
          const keys = Object.keys(record);
          return record[keys[0]];
        }}
        scroll={scroll}
      />
    </>
  );
};
export default DataTable;
