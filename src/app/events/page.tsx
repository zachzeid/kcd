"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EventData {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  location: string | null;
  description: string | null;
  ticketPriceA: number;
  ticketPriceB: number;
  dayPassPrice: number;
  status: string;
  registrationCount: number;
  myRegistration: {
    ticketType: string;
    paymentStatus: string;
    arfSignedAt: string | null;
  } | null;
}

const TICKET_LABELS: Record<string, string> = {
  single_a: "Single Event (A)",
  single_b: "Single Event (B)",
  day_pass: "Day Pass",
  season_t1a: "Season Pass T1-A",
  season_t1b: "Season Pass T1-B",
  season_t1c: "Season Pass T1-C",
  season_t2a: "Season Pass T2-A",
  season_t2b: "Season Pass T2-B",
  season_t2c: "Season Pass T2-C",
};

const SEASON_PRICES: Record<string, number> = {
  season_t1a: 31500,
  season_t1b: 40500,
  season_t1c: 54000,
  season_t2a: 41500,
  season_t2b: 50500,
  season_t2c: 64000,
};

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/events")
      .then((r) => r.json())
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [status]);

  const handleRegister = async (eventId: string, ticketType: string, arfSigned: boolean) => {
    setRegistering(eventId);
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketType, arfSigned }),
    });
    if (res.ok) {
      const updated = await fetch("/api/events").then((r) => r.json());
      setEvents(updated);
    }
    setRegistering(null);
  };

  const handlePay = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/payment`);
    if (res.ok) {
      const { paymentUrl } = await res.json();
      window.open(paymentUrl, "_blank");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Upcoming Events</h1>
            <p className="text-gray-500 text-xs">Kanar Gaming Enterprises</p>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            Back to Characters
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
            <p className="text-gray-500">No upcoming events.</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registering={registering === event.id}
              onRegister={handleRegister}
              onPay={handlePay}
            />
          ))
        )}
      </main>
    </div>
  );
}

function EventCard({
  event,
  registering,
  onRegister,
  onPay,
}: {
  event: EventData;
  registering: boolean;
  onRegister: (eventId: string, ticketType: string, arfSigned: boolean) => void;
  onPay: (eventId: string) => void;
}) {
  const [ticketType, setTicketType] = useState("single_a");
  const [arfAgreed, setArfAgreed] = useState(false);
  const [showRegForm, setShowRegForm] = useState(false);

  const priceForType = (t: string) => {
    if (SEASON_PRICES[t]) return SEASON_PRICES[t];
    switch (t) {
      case "single_a": return event.ticketPriceA;
      case "single_b": return event.ticketPriceB;
      case "day_pass": return event.dayPassPrice;
      default: return 0;
    }
  };

  const isRegistered = !!event.myRegistration;
  const arfOk = !!event.myRegistration?.arfSignedAt;
  const isPaid = event.myRegistration?.paymentStatus === "paid" || event.myRegistration?.paymentStatus === "comped";

  return (
    <div className="p-5 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{event.name}</h2>
          <div className="text-gray-400 text-sm mt-1">
            {new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
          </div>
          {event.location && <div className="text-gray-500 text-sm">{event.location}</div>}
          {event.description && <p className="text-gray-400 text-sm mt-2">{event.description}</p>}
        </div>
        <div className="text-right">
          <div className="text-gray-500 text-xs">{event.registrationCount} registered</div>
          {isRegistered && (
            <div className="mt-1 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-900 text-green-300">
                {TICKET_LABELS[event.myRegistration!.ticketType] ?? event.myRegistration!.ticketType}
              </span>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                  event.myRegistration!.paymentStatus === "paid" ? "bg-green-900 text-green-300" :
                  event.myRegistration!.paymentStatus === "comped" ? "bg-blue-900 text-blue-300" :
                  "bg-yellow-900 text-yellow-300"
                }`}>
                  {event.myRegistration!.paymentStatus}
                </span>
              </div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${arfOk ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                  ARF {arfOk ? "Signed" : "Not Signed"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {/* Pay button for registered but unpaid */}
        {isRegistered && !isPaid && (
          <button
            onClick={() => onPay(event.id)}
            className="px-4 py-2 rounded-lg bg-green-700 text-white font-medium hover:bg-green-600 text-sm"
          >
            Pay via Squarespace — ${(priceForType(event.myRegistration!.ticketType) / 100).toFixed(2)}
          </button>
        )}

        {!isRegistered && !showRegForm && (
          <button
            onClick={() => setShowRegForm(true)}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-500 text-sm"
          >
            Register for Event
          </button>
        )}

        {/* View Recap link */}
        <a
          href={`/events/${event.id}/recap`}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 text-sm inline-block"
        >
          View Recap
        </a>
      </div>

      {!isRegistered && showRegForm && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ticket Type</label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            >
              <optgroup label="Single Event">
                <option value="single_a">Single Event (A) — ${(event.ticketPriceA / 100).toFixed(2)}</option>
                <option value="single_b">Single Event (B) — ${(event.ticketPriceB / 100).toFixed(2)}</option>
                <option value="day_pass">Day Pass — ${(event.dayPassPrice / 100).toFixed(2)}</option>
              </optgroup>
              <optgroup label="Season Pass — Tier 1">
                <option value="season_t1a">T1 A Season Pass — $315.00</option>
                <option value="season_t1b">T1 B Season Pass — $405.00</option>
                <option value="season_t1c">T1 C Season Pass — $540.00</option>
              </optgroup>
              <optgroup label="Season Pass — Tier 2">
                <option value="season_t2a">T2 A Season Pass — $415.00</option>
                <option value="season_t2b">T2 B Season Pass — $505.00</option>
                <option value="season_t2c">T2 C Season Pass — $640.00</option>
              </optgroup>
            </select>
          </div>

          <div className="p-3 bg-gray-900 rounded border border-gray-700">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={arfAgreed}
                onChange={(e) => setArfAgreed(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-300">
                I have read and agree to the{" "}
                <a
                  href="https://forms.gle/883dfduKKtyA8DZ58"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline"
                >
                  KGE Annual Registration Form (ARF)
                </a>
                , including the Assumption of Risk, Waiver and Release of Claims, and Authorization for Medical Treatment.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onRegister(event.id, ticketType, arfAgreed)}
              disabled={registering}
              className="px-4 py-2 rounded-lg bg-green-700 text-white font-medium hover:bg-green-600 disabled:opacity-50 text-sm"
            >
              {registering ? "Registering..." : `Register — $${(priceForType(ticketType) / 100).toFixed(2)}`}
            </button>
            <button
              onClick={() => setShowRegForm(false)}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
