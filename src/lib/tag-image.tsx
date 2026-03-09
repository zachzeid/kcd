import { ImageResponse } from "next/og";

const TAG_BASE_URL = process.env.TAG_BASE_URL || process.env.NEXTAUTH_URL || "https://k1.gg";

// Colors from the Python script
const PARCHMENT_BG = "#F5EBDC";
const SEAL_DARK = "#4B3723";
const TEXT_COLOR = "#2D1E0F";
// Ghost color: slightly darker than parchment for OCR readability
const GHOST_COLOR = "#DDD1C0";

interface TagImageOptions {
  tagCode: number;
  itemType: string;
  itemName: string;
  craftingSkill: string;
  craftingLevel: number;
  masterCrafted?: boolean;
  quantity?: number;
  size?: number;
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
  const size = opts.size ?? 900;
  const url = `${TAG_BASE_URL}/t/${opts.tagCode}`;
  const title = `K1 ${TYPE_TITLES[opts.itemType] ?? "Item Certificate"}`;
  const borderOuter = Math.round(size * 0.018);
  const borderInner = Math.round(size * 0.024);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
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
            top: borderOuter,
            left: borderOuter,
            right: borderOuter,
            bottom: borderOuter,
            border: `2px solid ${SEAL_DARK}`,
            display: "flex",
          }}
        />
        {/* Inner border */}
        <div
          style={{
            position: "absolute",
            top: borderInner,
            left: borderInner,
            right: borderInner,
            bottom: borderInner,
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
            paddingTop: Math.round(size * 0.07),
            gap: Math.round(size * 0.012),
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: Math.round(size * 0.055),
              color: TEXT_COLOR,
              fontWeight: 700,
              marginBottom: Math.round(size * 0.02),
            }}
          >
            {title}
          </div>

          {/* Decorative divider — using ASCII dashes instead of Unicode */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: Math.round(size * 0.01),
            }}
          >
            <div style={{ width: 60, height: 1, background: SEAL_DARK, display: "flex" }} />
            <div style={{ fontSize: Math.round(size * 0.022), color: SEAL_DARK, display: "flex" }}>
              ---
            </div>
            <div style={{ width: 60, height: 1, background: SEAL_DARK, display: "flex" }} />
          </div>

          {/* Item Name */}
          <div
            style={{
              display: "flex",
              fontSize: Math.round(size * 0.042),
              color: TEXT_COLOR,
              fontWeight: 600,
              marginTop: Math.round(size * 0.01),
            }}
          >
            {opts.itemName}
          </div>

          {/* Skill & Level */}
          <div
            style={{
              display: "flex",
              fontSize: Math.round(size * 0.034),
              color: TEXT_COLOR,
            }}
          >
            {opts.craftingSkill}: Level {opts.craftingLevel}
          </div>

          {/* Tag Number */}
          <div
            style={{
              display: "flex",
              fontSize: Math.round(size * 0.034),
              color: TEXT_COLOR,
              marginTop: Math.round(size * 0.005),
            }}
          >
            Tag Number: {opts.tagCode}
          </div>

          {/* Quantity (if > 1) */}
          {(opts.quantity ?? 1) > 1 && (
            <div
              style={{
                display: "flex",
                fontSize: Math.round(size * 0.030),
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
                fontSize: Math.round(size * 0.028),
                color: "#6B2FAD",
                fontWeight: 700,
                marginTop: Math.round(size * 0.01),
                border: "1px solid #6B2FAD",
                padding: "4px 16px",
                borderRadius: 4,
              }}
            >
              Master Crafted
            </div>
          )}

          {/* Motto */}
          <div
            style={{
              display: "flex",
              fontSize: Math.round(size * 0.026),
              color: TEXT_COLOR,
              marginTop: Math.round(size * 0.025),
            }}
          >
            Wisdom - Courage - Fortitude
          </div>
        </div>

        {/* Bottom text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: Math.round(size * 0.06),
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: Math.round(size * 0.022),
              color: TEXT_COLOR,
            }}
          >
            Sealed by the Order of K1
          </div>
          <div
            style={{
              display: "flex",
              fontSize: Math.round(size * 0.022),
              color: TEXT_COLOR,
            }}
          >
            This certificate attests to authenticity.
          </div>
        </div>

        {/* Ghost URL — between border lines at bottom, low contrast for OCR */}
        <div
          style={{
            position: "absolute",
            bottom: borderOuter + 1,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: Math.round(size * 0.025),
            color: GHOST_COLOR,
            fontFamily: "sans-serif",
          }}
        >
          {url}
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}

export function getTagUrl(tagCode: number): string {
  return `${TAG_BASE_URL}/t/${tagCode}`;
}

export function getTagImageUrl(tagCode: number): string {
  return `/api/tags/${tagCode}/image`;
}
