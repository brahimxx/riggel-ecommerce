import React, { useState, useMemo, useCallback } from "react";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  ColumnHeightOutlined,
} from "@ant-design/icons";
import {
  Button,
  Space,
  Table,
  App,
  Tooltip,
  Card,
  Segmented,
  Typography,
} from "antd";
import DeletePopConfirm from "./DeletePopConfirm";

const { Title } = Typography;

const defaultExpandable = {
  expandedRowRender: (record) => (
    <p className="m-0 pl-4 text-gray-500">
      {record.description || "No description available."}
    </p>
  ),
};

const DataTable = ({
  data,
  loading,
  setIsModalOpen,
  onEdit,
  onDeleteSuccess,
  apiBaseUrl,
  rowKeyField = "id",
  expandable = defaultExpandable,
  columnsOverride,
  onPageChange,
  onPageSizeChange,
  onReload,
  title = "Data Management",
}) => {
  const { message } = App.useApp();

  // UI State
  const [size, setSize] = useState("middle");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // ← NEW: Track selections
  const [batchLoading, setBatchLoading] = useState(false); // ← NEW: Loading state for bulk delete

  // 1. Robust Data Extraction
  const { validData, paginationInfo } = useMemo(() => {
    if (!data) return { validData: [], paginationInfo: null };
    if (data.products && Array.isArray(data.products)) {
      return {
        validData: data.products,
        paginationInfo: data.pagination || null,
      };
    }
    if (data.data && Array.isArray(data.data)) {
      return { validData: data.data, paginationInfo: data.pagination || null };
    }
    if (Array.isArray(data)) {
      return { validData: data, paginationInfo: null };
    }
    return { validData: [], paginationInfo: null };
  }, [data]);

  // Helper: Core Delete Logic (Refactored to be reusable)
  const deleteItemById = useCallback(
    async (id) => {
      const res = await fetch(`/api/${apiBaseUrl}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        let errMsg = `Delete failed (${res.status})`;
        try {
          const json = await res.json();
          errMsg = json?.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      return true;
    },
    [apiBaseUrl]
  );

  // 2. Single Delete Handler
  const handleDelete = useCallback(
    async (record) => {
      try {
        const id = record[rowKeyField];
        await deleteItemById(id);
        message.success("Item deleted successfully");
        if (typeof onDeleteSuccess === "function") onDeleteSuccess();
      } catch (error) {
        message.error(error.message || "Delete failed");
      }
    },
    [rowKeyField, deleteItemById, message, onDeleteSuccess]
  );

  // 3. ← NEW: Bulk Delete Handler
  const handleBulkDelete = useCallback(async () => {
    setBatchLoading(true);
    try {
      // Execute all deletes in parallel
      // Note: Ideally, your backend should have a bulk delete endpoint (e.g., POST /delete-batch)
      // But this works universally by reusing the single delete endpoint.
      await Promise.all(selectedRowKeys.map((id) => deleteItemById(id)));

      message.success(`${selectedRowKeys.length} items deleted successfully`);
      setSelectedRowKeys([]); // Clear selection
      if (typeof onDeleteSuccess === "function") onDeleteSuccess();
    } catch (error) {
      message.error("Some items could not be deleted.");
    } finally {
      setBatchLoading(false);
    }
  }, [selectedRowKeys, deleteItemById, message, onDeleteSuccess]);

  const handleShowModal = useCallback(
    (record = null) => {
      if (record) {
        if (typeof onEdit === "function") onEdit(record);
      } else {
        if (setIsModalOpen) setIsModalOpen(true);
      }
    },
    [onEdit, setIsModalOpen]
  );

  // 4. ← NEW: Row Selection Configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
    preserveSelectedRowKeys: true,
  };

  const columns = useMemo(() => {
    const actionCol = {
      title: "Action",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              icon={<EditOutlined />}
              onClick={() => handleShowModal(record)}
            />
          </Tooltip>
          <DeletePopConfirm
            title="Delete"
            description="Are you sure?"
            icon={<DeleteOutlined className="text-red-500" />}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </DeletePopConfirm>
        </Space>
      ),
    };

    if (columnsOverride?.length) return [...columnsOverride, actionCol];
    if (!validData?.length) return [actionCol];

    const baseCols = Object.keys(validData[0])
      .filter((key) => key !== "key" && typeof validData[0][key] !== "object")
      .map((key) => ({
        title: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        dataIndex: key,
        key: key,
        sorter: (a, b) => {
          const aVal = a[key] ?? "";
          const bVal = b[key] ?? "";
          return typeof aVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));
        },
        ellipsis: true,
      }));

    return [...baseCols, actionCol];
  }, [validData, columnsOverride, handleShowModal, handleDelete]);

  const handleTableChange = (newPagination) => {
    const currentPage = paginationInfo?.page || 1;
    const currentLimit = paginationInfo?.limit || 10;

    if (onPageChange && newPagination.current !== currentPage) {
      onPageChange(newPagination.current);
    }
    if (onPageSizeChange && newPagination.pageSize !== currentLimit) {
      onPageSizeChange(newPagination.pageSize);
    }
  };

  const paginationConfig = paginationInfo
    ? {
        current: paginationInfo.page,
        pageSize: paginationInfo.limit,
        total: paginationInfo.total,
        showSizeChanger: true,
        showTotal: (total, range) => (
          <span className="text-gray-400 text-xs">
            {range[0]}-{range[1]} of {total}
          </span>
        ),
        pageSizeOptions: ["10", "20", "50", "100"],
      }
    : false;

  return (
    <Card
      className="shadow-sm border-gray-100 rounded-lg"
      styles={{ body: { padding: 0 } }}
      variant={false}
    >
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Title level={4} style={{ margin: 0, fontSize: "1.1rem" }}>
            {title}
          </Title>

          {/* ← NEW: Batch Selection Indicator */}
          {selectedRowKeys.length > 0 && (
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
              {selectedRowKeys.length} Selected
            </span>
          )}
        </div>

        <Space wrap>
          {/* ← NEW: Bulk Delete Button (Only visible when selecting) */}
          {selectedRowKeys.length > 0 && (
            <DeletePopConfirm
              title={`Delete ${selectedRowKeys.length} Items?`}
              description="This action cannot be undone."
              onConfirm={handleBulkDelete}
              okText="Yes, Delete All"
            >
              <Button
                danger
                type="primary"
                loading={batchLoading}
                icon={<DeleteOutlined />}
              >
                Delete ({selectedRowKeys.length})
              </Button>
            </DeletePopConfirm>
          )}

          <Tooltip title="Table Density">
            <Segmented
              options={[
                {
                  value: "large",
                  icon: <ColumnHeightOutlined className="rotate-90" />,
                },
                { value: "middle", icon: <ColumnHeightOutlined /> },
                {
                  value: "small",
                  icon: <ColumnHeightOutlined className="-rotate-90" />,
                },
              ]}
              value={size}
              onChange={setSize}
            />
          </Tooltip>

          {onReload && (
            <Tooltip title="Refresh Data">
              <Button icon={<ReloadOutlined />} onClick={onReload} />
            </Tooltip>
          )}

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleShowModal(null)}
            className="bg-blue-600 hover:bg-blue-500"
          >
            Add New
          </Button>
        </Space>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={validData}
        rowKey={(record) => record[rowKeyField]}
        pagination={paginationConfig}
        onChange={handleTableChange}
        size={size}
        expandable={expandable} // Use prop passed from parent
        rowSelection={rowSelection} // ← NEW: Enable selection
        scroll={{ x: "max-content" }}
        className="w-full"
      />
    </Card>
  );
};

export default DataTable;
