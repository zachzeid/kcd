"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count: { characters: number };
}

interface CharRow {
  id: string;
  name: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "characters">("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [characters, setCharacters] = useState<CharRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !isAdmin) router.push("/");
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    if (tab === "users") {
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then(setUsers)
        .finally(() => setLoading(false));
    } else {
      fetch("/api/admin/characters")
        .then((r) => r.json())
        .then(setCharacters)
        .finally(() => setLoading(false));
    }
  }, [tab, isAdmin]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user and all their characters?")) return;
    await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const deleteCharacter = async (charId: string) => {
    if (!confirm("Delete this character?")) return;
    await fetch(`/api/admin/characters?id=${charId}`, { method: "DELETE" });
    setCharacters((prev) => prev.filter((c) => c.id !== charId));
  };

  if (status === "loading" || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Admin Dashboard</h1>
            <p className="text-gray-500 text-xs">Kanar Character Checkout</p>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "users" ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setTab("characters")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "characters" ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            All Characters
          </button>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-8">Loading...</div>
        ) : tab === "users" ? (
          <div className="space-y-2">
            {users.map((user) => (
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
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      user.role === "admin" ? "bg-red-900 text-red-300" : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {user.role}
                  </span>
                  <button
                    onClick={() => toggleRole(user.id, user.role)}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Toggle Role
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {characters.length === 0 && (
              <div className="text-gray-500 text-center py-8">No characters yet.</div>
            )}
            {characters.map((char) => (
              <div
                key={char.id}
                className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800"
              >
                <div>
                  <div className="text-white font-medium">{char.name}</div>
                  <div className="text-gray-500 text-sm">
                    Owner: {char.userName} ({char.userEmail})
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Updated {new Date(char.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => deleteCharacter(char.id)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
