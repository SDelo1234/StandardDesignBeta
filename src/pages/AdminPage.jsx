import React from "react";
import AdminPinManager from "../components/AdminPinManager";

const AdminPage = () => (
  <div className="mx-auto max-w-5xl p-6">
    <h1 className="mb-1 text-2xl font-semibold">PIN Management</h1>
    <p className="mb-6 text-sm text-gray-600">
      Create, edit, and control access for PIN accounts.
    </p>
    <AdminPinManager />
  </div>
);

export default AdminPage;
