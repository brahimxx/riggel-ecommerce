// app/dashboard/pages/Users.js
"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert, App } from "antd";
import DataTable from "../components/DataTable";
import UserForm from "../components/UserForm";
import { getUsers, getUserById } from "@/lib/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { message } = App.useApp();
  const isMounted = useRef(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData] = await Promise.all([getUsers()]);
      if (isMounted.current) {
        setUsers(usersData || []);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleCancel = () => {
    if (!isMounted.current) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setError(null);
  };

  const handleSuccess = () => {
    if (!isMounted.current) return;
    fetchData();
    setIsModalOpen(false);
    setEditingUser(null);
    message.success(
      editingUser ? "User updated successfully" : "User created successfully"
    );
  };

  const handleEditUser = async (user) => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const fullUser = await getUserById(user.id);
      if (isMounted.current) {
        setEditingUser(fullUser);
        setIsModalOpen(true);
      }
    } catch (error) {
      if (isMounted.current) setError(error.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      <DataTable
        data={users}
        title="Users"
        loading={loading}
        setIsModalOpen={handleAddNew} // Use helper to clear editingUser
        onEdit={handleEditUser}
        onDeleteSuccess={fetchData}
        onReload={fetchData} // <--- ADDED THIS
        apiBaseUrl="users"
        rowKeyField="id"
      />

      <Modal
        title={editingUser ? "Edit User" : "Add User"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <UserForm user={editingUser} onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default Users;
