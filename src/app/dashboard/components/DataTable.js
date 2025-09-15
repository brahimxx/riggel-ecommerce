import React, { useState, useMemo } from "react";
import {
  EditOutlined,
  DeleteOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { Button, Form, Radio, Space, Switch, Table, message } from "antd";
import DeletePopConfirm from "./DeletePopConfirm";

const defaultExpandable = {
  expandedRowRender: (record) => <p>{record.description}</p>,
};
const defaultTitle = () => "Here is title";
const defaultFooter = () => "Here is footer";

const DataTable = ({
  data,
  loading,
  setIsModalOpen,
  onEdit,
  onDeleteSuccess,
  apiBaseUrl, // e.g. "products", "categories"
  rowKeyField = "id", // e.g. "product_id", "category_id"
  expandable = defaultExpandable,
  showTitle = false,
  showFooter = true,
}) => {
  const [bordered, setBordered] = useState(false);
  const [size, setSize] = useState("large");
  const [ellipsis, setEllipsis] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [yScroll, setYScroll] = useState(false);
  const [xScroll, setXScroll] = useState("unset");
  const [expandableState, setExpandable] = useState(expandable);

  const showModal = (record = null) => {
    if (record) {
      if (typeof onEdit === "function") {
        onEdit(record);
      }
    } else {
      if (setIsModalOpen) setIsModalOpen(true);
    }
  };

  const handleDelete = async (record) => {
    try {
      const id = record[rowKeyField];
      if (!id) throw new Error("Invalid record id for deletion");

      const res = await fetch(`/api/${apiBaseUrl}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      message.success(`${apiBaseUrl.slice(0, -1)} deleted successfully`);

      if (typeof onDeleteSuccess === "function") {
        onDeleteSuccess();
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const actionColumn = {
    title: "Action",
    key: "action",
    sorter: true,
    render: (text, record) => (
      <Space size="middle">
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => showModal(record)}
        >
          Edit
        </Button>
        <DeletePopConfirm
          title="Delete"
          description="Are you sure you want to delete this item?"
          icon={<DeleteOutlined />}
          onConfirm={() => handleDelete(record)}
        />
      </Space>
    ),
  };

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [actionColumn];
    const baseCols = Object.keys(data[0])
      .filter((key) => key !== "key")
      .map((key) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        dataIndex: key,
        key,
        sorter: (a, b) => {
          const aVal = a[key] ?? "";
          const bVal = b[key] ?? "";
          if (typeof aVal === "number" && typeof bVal === "number") {
            return aVal - bVal;
          }
          return String(aVal).localeCompare(String(bVal));
        },
      }));
    return [...baseCols, actionColumn];
  }, [data]);

  const handleBorderChange = (checked) => setBordered(checked);
  const handleSizeChange = (e) => setSize(e.target.value);
  const handleExpandChange = (checked) =>
    setExpandable(checked ? defaultExpandable : undefined);
  const handleEllipsisChange = (checked) => setEllipsis(checked);
  const handleTitleChange = (checked) => setShowTitle(checked);
  const handleFooterChange = (checked) => setShowFooter(checked);
  const handleRowSelectionChange = (checked) =>
    setRowSelection(checked ? {} : undefined);
  const handleYScrollChange = (checked) => setYScroll(checked);
  const handleXScrollChange = (e) => setXScroll(e.target.value);

  const scroll = {};
  if (yScroll) {
    scroll.y = 240;
  }
  if (xScroll !== "unset") {
    scroll.x = "100vw";
  }
  const tableColumns = columns.map((col) => ({ ...col, ellipsis }));
  if (xScroll === "fixed") {
    tableColumns[0].fixed = true;
    tableColumns[tableColumns.length - 1].fixed = "right";
  }

  const tableProps = {
    bordered,
    loading,
    size,
    expandable: expandableState,
    title: showTitle ? defaultTitle : undefined,
    footer: showFooter ? defaultFooter : undefined,
    rowSelection,
    scroll,
    tableLayout: "unset",
  };

  return (
    <div className="flex flex-col">
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
          <Switch checked={!!expandableState} onChange={handleExpandChange} />
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
      <div className="w-[80px] mb-5 self-end mr-4">
        <Button
          type="primary"
          icon={<AppstoreAddOutlined />}
          onClick={() => showModal(null)}
        >
          Add
        </Button>
      </div>

      <Table
        {...tableProps}
        pagination={{ position: ["bottomRight"] }}
        columns={tableColumns}
        dataSource={data}
        rowKey={(record) => record[rowKeyField]}
        scroll={scroll}
      />
    </div>
  );
};

export default DataTable;
