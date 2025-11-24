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
  apiBaseUrl,
  rowKeyField = "id",
  expandable = defaultExpandable,
  showTitle = false,
  showFooter = true,
  columnsOverride,
  onPageChange, // ← NEW: Callback for page changes
  onPageSizeChange, // ← NEW: Callback for page size changes
}) => {
  const [bordered, setBordered] = useState(false);
  const [size, setSize] = useState("large");
  const [ellipsis, setEllipsis] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [yScroll, setYScroll] = useState(false);
  const [xScroll, setXScroll] = useState("unset");
  const [expandableState, setExpandable] = useState(expandable);
  const [showTitleUI, setShowTitleUI] = useState(showTitle);
  const [showFooterUI, setShowFooterUI] = useState(showFooter);

  // Extract pagination info and products array from response
  const { validData, paginationInfo } = useMemo(() => {
    if (!data) return { validData: [], paginationInfo: null };

    // If data is already an array (old format)
    if (Array.isArray(data)) {
      return { validData: data, paginationInfo: null };
    }

    // If data has pagination structure (new format)
    if (data.products && Array.isArray(data.products)) {
      return {
        validData: data.products,
        paginationInfo: data.pagination || null,
      };
    }

    // Alternative format with 'data' property
    if (data.data && Array.isArray(data.data)) {
      return {
        validData: data.data,
        paginationInfo: data.pagination || null,
      };
    }

    console.warn("DataTable: Unexpected data format", data);
    return { validData: [], paginationInfo: null };
  }, [data]);

  const showModal = (record = null) => {
    if (record) {
      if (typeof onEdit === "function") onEdit(record);
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
        let errMsg = `Delete failed (${res.status})`;
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = await res.json();
            if (data?.error) errMsg = data.error;
          } else {
            const text = await res.text();
            if (text) errMsg = text;
          }
        } catch {}
        throw new Error(errMsg);
      }

      let msg = `${apiBaseUrl.slice(0, -1)} deleted successfully`;
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = await res.json();
          msg = data?.message || msg;
        }
      } catch {}

      message.success(msg);

      if (typeof onDeleteSuccess === "function") {
        onDeleteSuccess();
      }
    } catch (error) {
      message.error(error.message || "Delete failed");
    }
  };

  const actionColumn = {
    title: "Action",
    key: "action",
    sorter: true,
    render: (_, record) => (
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
    if (columnsOverride && columnsOverride.length) {
      return [...columnsOverride, actionColumn];
    }
    if (!validData || validData.length === 0) return [actionColumn];

    const baseCols = Object.keys(validData[0])
      .filter((key) => key !== "key" && typeof validData[0][key] !== "object")
      .map((key) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        dataIndex: key,
        key: key,
        sorter: (a, b) => {
          const aVal = a[key] ?? "";
          const bVal = b[key] ?? "";
          if (typeof aVal === "number" && typeof bVal === "number")
            return aVal - bVal;
          return String(aVal).localeCompare(String(bVal));
        },
      }));
    return [...baseCols, actionColumn];
  }, [validData, columnsOverride]);

  const handleBorderChange = (checked) => setBordered(checked);
  const handleSizeChange = (e) => setSize(e.target.value);
  const handleExpandChange = (checked) =>
    setExpandable(checked ? defaultExpandable : undefined);
  const handleEllipsisChange = (checked) => setEllipsis(checked);
  const handleTitleChange = (checked) => setShowTitleUI(checked);
  const handleFooterChange = (checked) => setShowFooterUI(checked);
  const handleRowSelectionChange = (checked) =>
    setRowSelection(checked ? {} : undefined);
  const handleYScrollChange = (checked) => setYScroll(checked);
  const handleXScrollChange = (e) => setXScroll(e.target.value);

  // ← FIX: Handle pagination changes properly
  const handleTableChange = (pagination, filters, sorter) => {
    // Check if page changed
    if (onPageChange && pagination.current !== paginationInfo?.page) {
      onPageChange(pagination.current);
    }

    // Check if page size changed
    if (onPageSizeChange && pagination.pageSize !== paginationInfo?.limit) {
      onPageSizeChange(pagination.pageSize);
    }
  };

  const scroll = {};
  if (yScroll) scroll.y = 240;
  if (xScroll !== "scroll") scroll.x = "100vw";

  const tableColumns = columns.map((col) => ({ ...col, ellipsis }));
  if (xScroll === "fixed") {
    tableColumns[0].fixed = true;
    tableColumns[tableColumns.length - 1].fixed = "right";
  }

  // ← NEW: Configure pagination based on server response
  const paginationConfig = paginationInfo
    ? {
        current: paginationInfo.page,
        pageSize: paginationInfo.limit,
        total: paginationInfo.total,
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} items`,
        pageSizeOptions: ["9", "18", "27", "50", "100"],
        position: ["bottomRight"],
      }
    : { position: ["bottomRight"] };

  const tableProps = {
    bordered,
    loading,
    size,
    expandable: expandableState,
    title: showTitleUI ? defaultTitle : undefined,
    footer: showFooterUI ? defaultFooter : undefined,
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
          <Switch checked={showTitleUI} onChange={handleTitleChange} />
        </Form.Item>
        <Form.Item label="Footer">
          <Switch checked={showFooterUI} onChange={handleFooterChange} />
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
          onClick={() => setIsModalOpen && setIsModalOpen(true)}
        >
          Add
        </Button>
      </div>

      <Table
        {...tableProps}
        pagination={paginationConfig}
        columns={tableColumns}
        dataSource={validData}
        rowKey={(record) => record[rowKeyField]}
        scroll={scroll}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default DataTable;
