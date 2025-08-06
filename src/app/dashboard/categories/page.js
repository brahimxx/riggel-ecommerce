"use client";
import { useEffect, useState } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import CategoryForm from "../components/CategoryForm"; // Assumes you have a CategoryForm component

const Categories = () => {
  const [categories, setCategories] = useState([]); // State for categories
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // State for the category being edited

  // Fetch categories data
  const fetchData = () => {
    setLoading(true);
    fetch("/api/categories")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }
        return res.json();
      })
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleSuccess = () => {
    fetchData(); // Refresh categories list after add/update
    setIsModalOpen(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleEditCategory = (category) => {
    // For a simple entity like a category, you might already have all the data.
    // If not, you could fetch full details like in the Orders component.
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  return (
    <div>
      {error && (
        <Alert message="Error" description={error} type="error" showIcon />
      )}

      <DataTable
        data={categories}
        loading={loading}
        setIsModalOpen={setIsModalOpen}
        onEdit={handleEditCategory}
        onDeleteSuccess={fetchData}
        apiBaseUrl="categories" // API endpoint for deletion
        rowKeyField="category_id" // Primary key field for the category
      />

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <CategoryForm
          category={editingCategory}
          onSuccess={handleSuccess}
          categories={categories}
        />
      </Modal>
    </div>
  );
};

export default Categories;
