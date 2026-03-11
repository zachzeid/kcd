import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

const TAG_BASE_URL = process.env.TAG_BASE_URL || process.env.NEXTAUTH_URL || "https://k1.gg";

// Colors
const PARCHMENT_BG = "#F5EBDC";
const SEAL_DARK = "#4B3723";
const TEXT_COLOR = "#2D1E0F";
// Ghost color: slightly darker than parchment for OCR readability
const GHOST_COLOR = "#DDD1C0";

// Business card dimensions: 3.5" x 2" at 300 DPI
const CARD_WIDTH = 1050;
const CARD_HEIGHT = 600;

// Load seal image as base64 data URL at module level (server-side only)
let sealDataUrl: string;
try {
  const sealPath = join(process.cwd(), "public", "alchemy_seal.png");
  const sealBuffer = readFileSync(sealPath);
  sealDataUrl = `data:image/png;base64,${sealBuffer.toString("base64")}`;
} catch {
  sealDataUrl = "";
}

interface TagImageOptions {
  tagCode: number;
  itemType: string;
  itemName: string;
  craftingSkill: string;
  craftingLevel: number;
  masterCrafted?: boolean;
  quantity?: number;
  size?: number; // scale factor (1 = 1050x600, 0.5 = 525x300, etc.)
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

  // Seal size — fits in the center band between top and bottom text
  const sealSize = s(0.42);

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

        {/* Top text band */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: s(0.08),
            gap: s(0.005),
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: s(0.085),
              color: TEXT_COLOR,
              fontWeight: 700,
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
            }}
          >
            <div style={{ width: s(0.08), height: 1, background: SEAL_DARK, display: "flex" }} />
            <div style={{ fontSize: s(0.035), color: SEAL_DARK, display: "flex" }}>---</div>
            <div style={{ width: s(0.08), height: 1, background: SEAL_DARK, display: "flex" }} />
          </div>

          {/* Item Name */}
          <div
            style={{
              display: "flex",
              fontSize: s(0.075),
              color: TEXT_COLOR,
              fontWeight: 600,
            }}
          >
            {opts.itemName}
            {(opts.quantity ?? 1) > 1 ? ` (x${opts.quantity})` : ""}
          </div>
        </div>

        {/* Center seal */}
        {sealDataUrl && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sealDataUrl}
              alt="K1 Seal"
              width={sealSize}
              height={sealSize}
              style={{ opacity: 0.18 }}
            />
          </div>
        )}

        {/* Bottom text band */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: s(0.08),
            gap: s(0.01),
          }}
        >
          {/* Skill & Level + Tag Number */}
          <div
            style={{
              display: "flex",
              gap: s(0.06),
              fontSize: s(0.055),
              color: TEXT_COLOR,
            }}
          >
            <span>{opts.craftingSkill}: Level {opts.craftingLevel}</span>
            <span>Tag #{opts.tagCode}</span>
          </div>

          {/* Master Crafted badge */}
          {opts.masterCrafted && (
            <div
              style={{
                display: "flex",
                fontSize: s(0.045),
                color: "#6B2FAD",
                fontWeight: 700,
                border: "1px solid #6B2FAD",
                padding: `${s(0.005)}px ${s(0.025)}px`,
                borderRadius: 3,
              }}
            >
              Master Crafted
            </div>
          )}

          {/* Motto */}
          <div
            style={{
              display: "flex",
              fontSize: s(0.045),
              color: TEXT_COLOR,
            }}
          >
            Wisdom - Courage - Fortitude
          </div>
          <div
            style={{
              display: "flex",
              fontSize: s(0.035),
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
