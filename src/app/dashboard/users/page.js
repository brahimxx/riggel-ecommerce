"use client";
import { useEffect, useState, useRef } from "react";
import { Modal, Alert } from "antd";
import DataTable from "../components/DataTable";
import UserForm from "../components/UserForm";
// MODIFICATION: Import your new API helpers
import { getUsers, getUserById, getRoles } from "@/lib/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);

  const isMounted = useRef(true);

  // MODIFICATION: The fetchData function is now cleaner and fetches roles.
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users and roles in parallel
      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles(), // Assumes you have roles to pass to the form
      ]);

      if (isMounted.current) {
        setUsers(usersData || []);
        setRoles(rolesData || []);
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
  };

  // MODIFICATION: Using the new 'getUserById' helper function.
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
        width={600}
      >
        <UserForm
          user={editingUser}
          onSuccess={handleSuccess}
          roles={roles} // Pass roles to the form
        />
      </Modal>
    </div>
  );
};

export default Users;
