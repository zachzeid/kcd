"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isStaff } from "@/lib/roles";

interface EventRecap {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  location: string | null;
  status: string;
  ticketPriceA: number;
  ticketPriceB: number;
  dayPassPrice: number;
  registrations: {
    id: string;
    userName: string;
    userEmail: string;
    ticketType: string;
    paymentStatus: string;
    arfSignedAt: string | null;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    xpEarned: number;
    npcMinutes: number;
  }[];
}

export default function EventRecapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<EventRecap | null>(null);
  const [loading, setLoading] = useState(true);

  const eventId = params.id as string;
  const userRole = (session?.user as { role?: string })?.role ?? "user";
  const userIsStaff = isStaff(userRole);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !eventId) return;
    fetch(`/api/events/${eventId}/recap`)
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [status, eventId]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Event not found</div>
      </div>
    );
  }

  const attendees = event.registrations.filter((r) => r.checkedInAt);
  const totalXP = attendees.reduce((sum, r) => sum + r.xpEarned, 0);
  const totalNPCTime = attendees.reduce((sum, r) => sum + r.npcMinutes, 0);
  const avgXP = attendees.length > 0 ? Math.round(totalXP / attendees.length) : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/events" className="text-amber-400 hover:underline">
            ← Back to Events
          </Link>
          <div className="flex items-center gap-4">
            {userIsStaff && (
              <Link href="/admin" className="text-amber-400 text-sm hover:underline">
                Staff Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Event Header */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
                <div className="text-gray-400">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {event.endDate && (
                    <span>
                      {" - "}
                      {new Date(event.endDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                {event.location && (
                  <div className="text-gray-500 text-sm mt-1">{event.location}</div>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-bold ${
                  event.status === "completed"
                    ? "bg-gray-700 text-gray-300"
                    : event.status === "active"
                    ? "bg-green-900 text-green-300"
                    : "bg-blue-900 text-blue-300"
                }`}
              >
                {event.status}
              </span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Registered</div>
              <div className="text-white text-3xl font-bold">{event.registrations.length}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Attended</div>
              <div className="text-green-400 text-3xl font-bold">{attendees.length}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Avg XP</div>
              <div className="text-amber-400 text-3xl font-bold">{avgXP}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Total NPC Time</div>
              <div className="text-purple-400 text-3xl font-bold">
                {Math.floor(totalNPCTime / 60)}h {totalNPCTime % 60}m
              </div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Attendance</h2>
            {attendees.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No attendance records yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="text-left py-2 px-3">Player</th>
                      <th className="text-center py-2 px-3">Ticket</th>
                      <th className="text-center py-2 px-3">Checked In</th>
                      <th className="text-center py-2 px-3">Checked Out</th>
                      <th className="text-right py-2 px-3">XP</th>
                      <th className="text-right py-2 px-3">NPC Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((r) => (
                      <tr key={r.id} className="border-b border-gray-800/50">
                        <td className="py-2 px-3 text-white">{r.userName}</td>
                        <td className="py-2 px-3 text-center text-gray-400">
                          {r.ticketType.replace(/_/g, " ")}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-400">
                          {r.checkedInAt
                            ? new Date(r.checkedInAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-400">
                          {r.checkedOutAt
                            ? new Date(r.checkedOutAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-amber-400 font-medium">{r.xpEarned}</span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {r.npcMinutes > 0 && (
                            <span className="text-purple-400">{r.npcMinutes}m</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Registration List (non-attendees) */}
          {event.registrations.length > attendees.length && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Registered (Not Checked In)
              </h2>
              <div className="space-y-2">
                {event.registrations
                  .filter((r) => !r.checkedInAt)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between bg-gray-800/50 px-4 py-2 rounded"
                    >
                      <span className="text-white">{r.userName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm">
                          {r.ticketType.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            r.paymentStatus === "paid"
                              ? "bg-green-900 text-green-300"
                              : r.paymentStatus === "comped"
                              ? "bg-blue-900 text-blue-300"
                              : "bg-yellow-900 text-yellow-300"
                          }`}
                        >
                          {r.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
