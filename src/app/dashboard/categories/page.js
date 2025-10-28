"use client";
import { useEffect, useState } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import CategoryForm from "../components/CategoryForm"; // Assumes you have a CategoryForm component

const Categories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

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
    // MODIFICATION: Use setIsModalOpen to close the modal.
    setIsModalOpen(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleSuccess = () => {
    fetchData();
    // MODIFICATION: Use setIsModalOpen to close the modal.
    setIsModalOpen(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    // MODIFICATION: Use setIsModalOpen to open the modal.
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
        // MODIFICATION: Pass 'setIsModalOpen' as the prop that DataTable expects.
        setIsModalOpen={setIsModalOpen}
        onEdit={handleEditCategory}
        onDeleteSuccess={fetchData}
        apiBaseUrl="categories"
        rowKeyField="category_id"
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
