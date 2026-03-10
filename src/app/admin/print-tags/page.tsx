"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

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

interface PrintTag {
  id: string;
  tagCode: number;
  itemType: string;
  itemName: string;
  craftingSkill: string;
  craftingLevel: number;
  quantity: number;
  masterCrafted: boolean;
  characterName: string;
}

function PrintTagsContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [tags, setTags] = useState<PrintTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  useEffect(() => {
    if (status !== "authenticated" || ids.length === 0) {
      setLoading(false);
      return;
    }
    fetch(`/api/admin/economy/tags?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((data) => {
        const approved = (data.tags ?? []).filter(
          (t: PrintTag & { status: string }) =>
            t.status === "approved" && t.tagCode && ids.includes(t.id)
        );
        setTags(approved);
      })
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handlePrint = async () => {
    // Mark tags as printed, then trigger browser print
    setMarking(true);
    try {
      await Promise.allSettled(
        tags.map((t) =>
          fetch(`/api/tags/${t.tagCode}/print`, { method: "POST" })
        )
      );
    } catch {
      // Best-effort; print anyway
    }
    setMarking(false);
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading tags...</div>;
  }
  if (tags.length === 0) {
    return <div className="p-8 text-center">No printable tags found.</div>;
  }

  // Pad to full pages of 10
  const pages: (PrintTag | null)[][] = [];
  for (let i = 0; i < tags.length; i += 10) {
    const page: (PrintTag | null)[] = [...tags.slice(i, i + 10)];
    while (page.length < 10) page.push(null);
    pages.push(page);
  }

  return (
    <div className="print-tags-root">
      <style jsx global>{`
        @media print {
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .print-tags-root { padding: 0; margin: 0; }
          .tag-page {
            width: 9.5in;
            height: 11in;
            padding: 0.5in 0.5in;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 3.5in 3.5in;
            grid-template-rows: repeat(5, 2in);
            gap: 0;
            justify-content: center;
            page-break-after: always;
          }
          .tag-page:last-child { page-break-after: auto; }
          .tag-card {
            width: 3.5in;
            height: 2in;
            box-sizing: border-box;
            overflow: hidden;
          }
          @page {
            size: 9.5in 11in;
            margin: 0;
          }
        }
        @media screen {
          .print-tags-root {
            background: #1a1a2e;
            min-height: 100vh;
            padding: 2rem;
          }
          .tag-page {
            width: 9.5in;
            height: 11in;
            padding: 0.5in 0.5in;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 3.5in 3.5in;
            grid-template-rows: repeat(5, 2in);
            gap: 0;
            justify-content: center;
            background: white;
            margin: 0 auto 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          }
          .tag-card {
            width: 3.5in;
            height: 2in;
            box-sizing: border-box;
            overflow: hidden;
          }
        }
      `}</style>

      {/* Controls - hidden on print */}
      <div className="no-print" style={{ maxWidth: "9.5in", margin: "0 auto 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#999", fontSize: "14px" }}>
          {tags.length} tag{tags.length !== 1 ? "s" : ""} across {pages.length} page{pages.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => window.close()}
            style={{
              padding: "8px 16px",
              background: "#374151",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={marking}
            style={{
              padding: "8px 20px",
              background: "#d97706",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {marking ? "Preparing..." : "Print Tags"}
          </button>
        </div>
      </div>

      {/* Tag pages */}
      {pages.map((page, pi) => (
        <div key={pi} className="tag-page">
          {page.map((tag, ti) => (
            <div key={ti} className="tag-card">
              {tag ? <TagCertificate tag={tag} /> : <EmptyCard />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TagCertificate({ tag }: { tag: PrintTag }) {
  const title = `K1 ${TYPE_TITLES[tag.itemType] ?? "Item Certificate"}`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#F5EBDC",
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: "#2D1E0F",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.15in 0.2in",
        boxSizing: "border-box",
        border: "0.5px solid #ccc",
      }}
    >
      {/* Outer border */}
      <div
        style={{
          position: "absolute",
          top: "0.06in",
          left: "0.06in",
          right: "0.06in",
          bottom: "0.06in",
          border: "1.5px solid #4B3723",
          pointerEvents: "none",
        }}
      />
      {/* Inner border */}
      <div
        style={{
          position: "absolute",
          top: "0.1in",
          left: "0.1in",
          right: "0.1in",
          bottom: "0.1in",
          border: "0.5px solid #4B3723",
          pointerEvents: "none",
        }}
      />

      {/* Top content */}
      <div style={{ textAlign: "center", zIndex: 1, paddingTop: "0.02in" }}>
        <div style={{ fontSize: "9pt", fontWeight: 700, marginBottom: "2px" }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "2px" }}>
          <div style={{ width: "30px", height: "0.5px", background: "#4B3723" }} />
          <div style={{ fontSize: "5pt", color: "#4B3723" }}>---</div>
          <div style={{ width: "30px", height: "0.5px", background: "#4B3723" }} />
        </div>
        <div style={{ fontSize: "8pt", fontWeight: 600, marginBottom: "1px" }}>
          {tag.itemName}
        </div>
        <div style={{ fontSize: "6.5pt" }}>
          {tag.craftingSkill}: Level {tag.craftingLevel}
        </div>
        <div style={{ fontSize: "6.5pt" }}>
          Tag #{tag.tagCode}
        </div>
        {tag.quantity > 1 && (
          <div style={{ fontSize: "6pt" }}>
            Quantity: {tag.quantity}
          </div>
        )}
        {tag.masterCrafted && (
          <div
            style={{
              fontSize: "5.5pt",
              color: "#6B2FAD",
              fontWeight: 700,
              border: "0.5px solid #6B2FAD",
              padding: "1px 6px",
              borderRadius: "2px",
              display: "inline-block",
              marginTop: "1px",
            }}
          >
            Master Crafted
          </div>
        )}
      </div>

      {/* Bottom content */}
      <div style={{ textAlign: "center", zIndex: 1, paddingBottom: "0.02in" }}>
        <div style={{ fontSize: "5pt", marginBottom: "1px" }}>
          Wisdom - Courage - Fortitude
        </div>
        <div style={{ fontSize: "4.5pt" }}>
          Sealed by the Order of K1
        </div>
      </div>
    </div>
  );
}

function EmptyCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        border: "0.5px dashed #ddd",
        boxSizing: "border-box",
      }}
    />
  );
}

export default function PrintTagsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PrintTagsContent />
    </Suspense>
  );
}
