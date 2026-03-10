import { ImageResponse } from "next/og";

const TAG_BASE_URL = process.env.TAG_BASE_URL || process.env.NEXTAUTH_URL || "https://k1.gg";

// Colors from the Python script
const PARCHMENT_BG = "#F5EBDC";
const SEAL_DARK = "#4B3723";
const TEXT_COLOR = "#2D1E0F";
// Ghost color: slightly darker than parchment for OCR readability
const GHOST_COLOR = "#DDD1C0";

// Business card dimensions: 3.5" × 2" at 300 DPI
const CARD_WIDTH = 1050;
const CARD_HEIGHT = 600;

interface TagImageOptions {
  tagCode: number;
  itemType: string;
  itemName: string;
  craftingSkill: string;
  craftingLevel: number;
  masterCrafted?: boolean;
  quantity?: number;
  size?: number; // scale factor (1 = 1050×600, 0.5 = 525×300, etc.)
}

/** Friendly display name for item types */
const TYPE_TITLES: Record<string, string> = {
  alchemy: "Alchemy Certificate",
  armor: "Armor Certificate",
  herbs: "Herbalism Certificate",
  enchanting: "Enchanting Certificate",
  magic_item: "Magical Item Certificate",
  potions: "Potion Certificate",
  scrolls: "Scroll Certificate",
  toxins: "Toxin Certificate",
  traps: "Trap Certificate",
  weapons: "Weapon Certificate",
  misc_craft: "Craft Certificate",
  coin_earning: "Trade Certificate",
};

export function generateTagImageResponse(opts: TagImageOptions): ImageResponse {
  const scale = opts.size ? opts.size / 900 : 1; // backwards compat: old callers passed 900
  const w = Math.round(CARD_WIDTH * scale);
  const h = Math.round(CARD_HEIGHT * scale);
  const url = `${TAG_BASE_URL}/t/${opts.tagCode}`;
  const title = `K1 ${TYPE_TITLES[opts.itemType] ?? "Item Certificate"}`;

  // All font sizes and spacing scale relative to card height
  const s = (pct: number) => Math.round(h * pct);

  return new ImageResponse(
    (
      <div
        style={{
          width: w,
          height: h,
          background: PARCHMENT_BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Outer border */}
        <div
          style={{
            position: "absolute",
            top: s(0.025),
            left: s(0.025),
            right: s(0.025),
            bottom: s(0.025),
            border: `2px solid ${SEAL_DARK}`,
            display: "flex",
          }}
        />
        {/* Inner border */}
        <div
          style={{
            position: "absolute",
            top: s(0.045),
            left: s(0.045),
            right: s(0.045),
            bottom: s(0.045),
            border: `1px solid ${SEAL_DARK}`,
            display: "flex",
          }}
        />

        {/* Certificate content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: s(0.1),
            gap: s(0.015),
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: s(0.1),
              color: TEXT_COLOR,
              fontWeight: 700,
              marginBottom: s(0.02),
            }}
          >
            {title}
          </div>

          {/* Decorative divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: s(0.01),
            }}
          >
            <div style={{ width: s(0.08), height: 1, background: SEAL_DARK, display: "flex" }} />
            <div style={{ fontSize: s(0.04), color: SEAL_DARK, display: "flex" }}>---</div>
            <div style={{ width: s(0.08), height: 1, background: SEAL_DARK, display: "flex" }} />
          </div>

          {/* Item Name */}
          <div
            style={{
              display: "flex",
              fontSize: s(0.085),
              color: TEXT_COLOR,
              fontWeight: 600,
              marginTop: s(0.005),
            }}
          >
            {opts.itemName}
          </div>

          {/* Skill & Level + Tag Number on same line */}
          <div
            style={{
              display: "flex",
              gap: s(0.06),
              fontSize: s(0.06),
              color: TEXT_COLOR,
            }}
          >
            <span>{opts.craftingSkill}: Level {opts.craftingLevel}</span>
            <span>Tag #{opts.tagCode}</span>
          </div>

          {/* Quantity (if > 1) */}
          {(opts.quantity ?? 1) > 1 && (
            <div
              style={{
                display: "flex",
                fontSize: s(0.055),
                color: TEXT_COLOR,
              }}
            >
              Quantity: {opts.quantity}
            </div>
          )}

          {/* Master Crafted badge */}
          {opts.masterCrafted && (
            <div
              style={{
                display: "flex",
                fontSize: s(0.05),
                color: "#6B2FAD",
                fontWeight: 700,
                marginTop: s(0.01),
                border: "1px solid #6B2FAD",
                padding: `${s(0.008)}px ${s(0.03)}px`,
                borderRadius: 3,
              }}
            >
              Master Crafted
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: s(0.08),
            gap: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: s(0.05),
              color: TEXT_COLOR,
            }}
          >
            Wisdom - Courage - Fortitude
          </div>
          <div
            style={{
              display: "flex",
              fontSize: s(0.04),
              color: TEXT_COLOR,
            }}
          >
            Sealed by the Order of K1
          </div>
        </div>

        {/* Ghost URL — between border lines at bottom, low contrast for OCR */}
        <div
          style={{
            position: "absolute",
            bottom: s(0.025) + 1,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: s(0.038),
            color: GHOST_COLOR,
            fontFamily: "sans-serif",
          }}
        >
          {url}
        </div>
      </div>
    ),
    {
      width: w,
      height: h,
    }
  );
}

export function getTagUrl(tagCode: number): string {
  return `${TAG_BASE_URL}/t/${tagCode}`;
}

export function getTagImageUrl(tagCode: number): string {
  return `/api/tags/${tagCode}/image`;
}
