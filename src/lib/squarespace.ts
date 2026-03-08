// Squarespace Commerce integration for Kanar payments
// Maps internal ticket types to Squarespace product URLs on kanar.club

const BASE_URL = "https://kanar.club";

export const SQUARESPACE_PRODUCTS: Record<string, { path: string; label: string; priceInCents: number }> = {
  // Single event tickets
  single_a: {
    path: "/payment/kanar-standard-event-a-fee",
    label: "(A) Single Event Ticket 2026",
    priceInCents: 3500,
  },
  single_b: {
    path: "/payment/kanar-standard-event-b-fee",
    label: "(B) Single Event Ticket 2026",
    priceInCents: 4500,
  },
  day_pass: {
    path: "/payment/kanar-standard-event-fee-day-pass",
    label: "Day Pass Event Ticket",
    priceInCents: 2000,
  },
  // Season passes - Tier 1
  season_t1a: {
    path: "/payment/kanar-t1-a-2026-season-pass",
    label: "T1 A 2026 Season Pass",
    priceInCents: 31500,
  },
  season_t1b: {
    path: "/payment/kanar-t1-b-2026-season-pass",
    label: "T1 B 2026 Season Pass",
    priceInCents: 40500,
  },
  season_t1c: {
    path: "/payment/kanar-t1-c-2026-season-pass",
    label: "T1 C 2026 Season Pass",
    priceInCents: 54000,
  },
  // Season passes - Tier 2
  season_t2a: {
    path: "/payment/kanar-t2-a-2026-season-pass",
    label: "T2 A 2026 Season Pass",
    priceInCents: 41500,
  },
  season_t2b: {
    path: "/payment/kanar-t2-b-2026-season-pass",
    label: "T2 B 2026 Season Pass",
    priceInCents: 50500,
  },
  season_t2c: {
    path: "/payment/kanar-t2-c-2026-season-pass",
    label: "T2 C 2026 Season Pass",
    priceInCents: 64000,
  },
  // Membership dues
  membership: {
    path: "/payment/kge-2026-annual-membership-dues",
    label: "2026 KGE Annual Membership Dues",
    priceInCents: 4000,
  },
  membership_probationary: {
    path: "/payment/kge-2026-annual-probationary-membership-dues",
    label: "Probationary 2026 KGE Membership Dues",
    priceInCents: 3000,
  },
};

export function getPaymentUrl(ticketType: string): string {
  const product = SQUARESPACE_PRODUCTS[ticketType];
  if (!product) return `${BASE_URL}/payments`;
  return `${BASE_URL}${product.path}`;
}

export function getProductLabel(ticketType: string): string {
  return SQUARESPACE_PRODUCTS[ticketType]?.label ?? ticketType;
}

export function getProductPrice(ticketType: string): number {
  return SQUARESPACE_PRODUCTS[ticketType]?.priceInCents ?? 0;
}

// Squarespace Orders API integration (for payment verification)
// API Key should be set in SQUARESPACE_API_KEY env var
const API_BASE = "https://api.squarespace.com/1.0/commerce";

export async function verifyPaymentByEmail(email: string): Promise<{
  found: boolean;
  orders: Array<{ id: string; orderNumber: string; total: number; createdOn: string; lineItems: string[] }>;
}> {
  const apiKey = process.env.SQUARESPACE_API_KEY;
  if (!apiKey) {
    return { found: false, orders: [] };
  }

  try {
    const res = await fetch(`${API_BASE}/orders?customerEmail=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "KanarCharacterCheckout/1.0",
      },
    });

    if (!res.ok) {
      console.error("Squarespace API error:", res.status);
      return { found: false, orders: [] };
    }

    const data = await res.json();
    const orders = (data.result ?? []).map((order: Record<string, unknown>) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: (order.grandTotal as { value?: string })?.value ?? "0",
      createdOn: order.createdOn,
      lineItems: ((order.lineItems as Array<{ productName?: string }>) ?? []).map(
        (li) => li.productName ?? "Unknown"
      ),
    }));

    return { found: orders.length > 0, orders };
  } catch (err) {
    console.error("Squarespace API error:", err);
    return { found: false, orders: [] };
  }
}
