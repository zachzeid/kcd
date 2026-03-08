"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ROLES,
  isStaff,
  canAccessCBD,
  canAccessEconomy,
  canAccessGM,
  canManageUsers,
  type Role,
} from "@/lib/roles";
import CBDDepartment from "./components/cbd/CBDDepartment";
import EconomyDepartment from "./components/economy/EconomyDepartment";
import GMDepartment from "./components/gm/GMDepartment";
import AdminDepartment from "./components/admin/AdminDepartment";

type DepartmentTab = "cbd" | "economy" | "gm" | "admin";

interface TabDef {
  key: DepartmentTab;
  label: string;
  check: (role: string) => boolean;
}

const DEPARTMENT_TABS: TabDef[] = [
  { key: "cbd", label: "Character Book", check: canAccessCBD },
  { key: "economy", label: "Economy", check: canAccessEconomy },
  { key: "gm", label: "Game Master", check: canAccessGM },
  { key: "admin", label: "Admin", check: canManageUsers },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const userRole = (session?.user as { role?: string })?.role ?? "user";
  const userIsStaff = isStaff(userRole);

  const visibleTabs = DEPARTMENT_TABS.filter((t) => t.check(userRole));
  const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].key : null;

  const [activeTab, setActiveTab] = useState<DepartmentTab | null>(null);

  // Set initial tab once role is known (after session loads)
  const currentTab = activeTab ?? defaultTab;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !userIsStaff) router.push("/");
  }, [status, userIsStaff, router]);

  if (status === "loading" || !userIsStaff) {
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
            <h1 className="text-2xl font-bold text-amber-500">Staff Dashboard</h1>
            <p className="text-gray-500 text-xs">
              {ROLES[userRole as Role]?.label ?? userRole} — Kanar Character Checkout
            </p>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Department tab bar */}
        <div className="flex gap-2 mb-6">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentTab === tab.key
                  ? "bg-amber-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active department */}
        {currentTab === "cbd" && <CBDDepartment userRole={userRole} />}
        {currentTab === "economy" && <EconomyDepartment />}
        {currentTab === "gm" && <GMDepartment />}
        {currentTab === "admin" && <AdminDepartment />}
      </main>
    </div>
  );
}
