import React, { useId, useState } from "react";
import {
  addAccount,
  deleteAccount,
  getAccounts,
  toggleActive,
  updateAccount,
} from "../utils/pinStore";

/* ------------------------------------------------------------------ */
/*  Add-account form                                                   */
/* ------------------------------------------------------------------ */

const AddAccountForm = ({ onSaved }) => {
  const id = useId();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setPin("");
    setIsAdmin(false);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = addAccount({ name, pin, isAdmin });
    if (result.error) {
      setError(result.error);
      return;
    }
    reset();
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-medium">Add new PIN account</h3>

      <div className="mb-3">
        <label htmlFor={`${id}-name`} className="mb-1 block text-sm font-medium">
          Account name
        </label>
        <input
          id={`${id}-name`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Smith"
          className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]"
        />
      </div>

      <div className="mb-3">
        <label htmlFor={`${id}-pin`} className="mb-1 block text-sm font-medium">
          PIN code
        </label>
        <input
          id={`${id}-pin`}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="4-6 digits"
          className="w-full rounded-xl border border-gray-300 p-2.5 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]"
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          id={`${id}-admin`}
          type="checkbox"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor={`${id}-admin`} className="text-sm">
          Admin access
        </label>
      </div>

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm"
        style={{ background: "#003A5D" }}
      >
        Add account
      </button>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/*  Inline edit row                                                    */
/* ------------------------------------------------------------------ */

const EditRow = ({ account, onSaved, onCancel }) => {
  const [name, setName] = useState(account.name);
  const [pin, setPin] = useState(account.pin);
  const [isAdmin, setIsAdmin] = useState(account.isAdmin);
  const [error, setError] = useState("");

  const handleSave = () => {
    const result = updateAccount(account.id, { name, pin, isAdmin });
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--mwp-navy)]"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-24 rounded-lg border border-gray-300 px-2 py-1 font-mono text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-[var(--mwp-navy)]"
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-2 text-center text-sm">
        {account.isActive ? "Active" : "Inactive"}
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
};

/* ------------------------------------------------------------------ */
/*  Account table                                                      */
/* ------------------------------------------------------------------ */

const AccountTable = ({ accounts, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleToggle = (id) => {
    toggleActive(id);
    onRefresh();
  };

  const handleDelete = (id) => {
    deleteAccount(id);
    setConfirmDeleteId(null);
    onRefresh();
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">No PIN accounts yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">PIN</th>
              <th className="px-4 py-3 text-center">Admin</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {accounts.map((a) =>
              editingId === a.id ? (
                <EditRow
                  key={a.id}
                  account={a}
                  onSaved={() => {
                    setEditingId(null);
                    onRefresh();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 font-mono tracking-widest">{a.pin}</td>
                  <td className="px-4 py-3 text-center">
                    {a.isAdmin ? (
                      <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(a.id)}
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {a.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(a.id)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs shadow-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      {confirmDeleteId === a.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(a.id)}
                          className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const AdminPinManager = () => {
  const [accounts, setAccounts] = useState(() => getAccounts());

  const refresh = () => setAccounts(getAccounts());

  return (
    <div className="space-y-6">
      <AccountTable accounts={accounts} onRefresh={refresh} />
      <AddAccountForm onSaved={refresh} />
    </div>
  );
};

export default AdminPinManager;
