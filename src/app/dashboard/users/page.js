"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable"; // The same reusable DataTable
import UserForm from "../components/UserForm"; // The new form for users

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]); // Additional data needed for the form

  const isMounted = useRef(true);

  // Fetch both users and roles data
  const fetchData = () => {
    setLoading(true);
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((usersData) => {
        if (isMounted.current) {
          setUsers(usersData);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // Cleanup function to prevent state updates on unmounted component
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
    fetchData(); // Refresh list after add/update
    setIsModalOpen(false);
    setEditingUser(null);
    setError(null);
  };

  // Fetch full user details before opening the edit modal
  const handleEditUser = async (user) => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user details");
      const fullUser = await res.json();
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

  return (
    <div>
      {error && (
        <Alert message="Error" description={error} type="error" showIcon />
      )}

      <DataTable
        data={users}
        loading={loading}
        setIsModalOpen={setIsModalOpen}
        onEdit={handleEditUser}
        onDeleteSuccess={fetchData}
        apiBaseUrl="users"
        rowKeyField="id"
      />

      <Modal
        title={editingUser ? "Edit User" : "Add User"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600} // Adjusted width for a typical user form
      >
        <UserForm user={editingUser} onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default Users;
