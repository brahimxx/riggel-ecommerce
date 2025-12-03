"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Modal, App, Tag, Badge } from "antd"; // Added Tag, Badge
import DataTable from "../components/DataTable";
import CategoryForm from "../components/CategoryForm";
import { getCategories } from "@/lib/api";

const Categories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);

  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      message.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSuccess = () => {
    fetchData();
    setIsModalOpen(false);
    setEditingCategory(null);
    message.success(editingCategory ? "Category updated" : "Category created");
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // NEW: Define specific columns based on your API data
  const columnsOverride = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name, record) => (
          <div>
            <span className="font-medium text-base">{name}</span>
            {record.description && (
              <p className="text-xs text-gray-400 m-0">{record.description}</p>
            )}
          </div>
        ),
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: "Type",
        dataIndex: "category_type",
        key: "category_type",
        width: 120,
        render: (type) => {
          const color = type === "style" ? "purple" : "blue";
          return (
            <Tag color={color} className="capitalize m-0">
              {type}
            </Tag>
          );
        },
        filters: [
          { text: "Style", value: "style" },
          { text: "Type", value: "type" },
        ],
        onFilter: (value, record) => record.category_type === value,
      },
      {
        title: "Parent Category",
        dataIndex: "parent_category_id",
        key: "parent_category_id",
        render: (parentId) => {
          if (!parentId) return <span className="text-gray-300">-</span>;
          // Find the parent name from the existing list
          const parent = categories.find((c) => c.category_id === parentId);
          return parent ? (
            <Tag className="bg-gray-100 text-gray-600 border-gray-200">
              {parent.name}
            </Tag>
          ) : (
            <span className="text-gray-400 italic">Unknown ({parentId})</span>
          );
        },
      },
      {
        title: "Products",
        dataIndex: "product_count",
        key: "product_count",
        width: 100,
        align: "center",
        sorter: (a, b) => a.product_count - b.product_count,
        render: (count) => (
          <Badge
            count={count}
            showZero
            overflowCount={999}
            color={count > 0 ? "#108ee9" : "#d9d9d9"}
          />
        ),
      },
    ],
    [categories]
  ); // Re-calculate if categories list changes (for parent lookup)

  return (
    <div>
      <DataTable
        title="Categories"
        data={categories}
        loading={loading}
        apiBaseUrl="categories"
        rowKeyField="category_id"
        onReload={fetchData}
        setIsModalOpen={handleAddNew}
        onEdit={handleEditCategory}
        onDeleteSuccess={fetchData}
        columnsOverride={columnsOverride} // Inject custom columns
      />

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <CategoryForm
          key={editingCategory ? editingCategory.category_id : "new"}
          category={editingCategory}
          onSuccess={handleSuccess}
          categories={categories}
        />
      </Modal>
    </div>
  );
};

export default Categories;
