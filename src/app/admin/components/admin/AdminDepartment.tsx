"use client";

import { useEffect, useState } from "react";
import { ROLES, ALL_ROLES, type Role } from "@/lib/roles";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count: { characters: number };
}

export default function AdminDepartment() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user and all their characters?")) return;
    await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-2">
      {users.map((user) => {
        const roleInfo = ROLES[user.role as Role];
        return (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800"
          >
            <div>
              <div className="text-white font-medium">{user.name}</div>
              <div className="text-gray-500 text-sm">{user.email}</div>
              <div className="text-gray-600 text-xs mt-1">
                {user._count.characters} character(s) | Joined{" "}
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={user.role}
                onChange={(e) => changeRole(user.id, e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLES[r].label}
                  </option>
                ))}
              </select>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  roleInfo?.color ?? "bg-gray-700 text-gray-300"
                }`}
              >
                {roleInfo?.label ?? user.role}
              </span>
              <button
                onClick={() => deleteUser(user.id)}
                className="text-xs text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
