import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ITEM_TYPES } from "@/lib/economy";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function TagPage({ params }: Props) {
  const { code } = await params;
  const tagCode = parseInt(code, 10);

  if (isNaN(tagCode)) return notFound();

  const item = await prisma.itemSubmission.findUnique({
    where: { tagCode },
    include: {
      character: { select: { name: true } },
      user: { select: { name: true } },
    },
  });

  if (!item) return notFound();

  const typeLabel = (ITEM_TYPES as Record<string, string>)[item.itemType] ?? item.itemType;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-lg space-y-6 mt-8">
        {/* Tag image */}
        <div className="rounded-lg overflow-hidden border border-gray-800 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/tags/${tagCode}/image`}
            alt={`Tag #${tagCode} — ${item.itemName}`}
            className="w-full h-auto"
          />
        </div>

        {/* Tag details */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">{item.itemName}</h1>
            <span className="text-amber-400 font-mono text-sm">#{tagCode}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Type" value={typeLabel} />
            <Detail label="Skill" value={`${item.craftingSkill} Lv.${item.craftingLevel}`} />
            <Detail label="Character" value={item.character.name} />
            <Detail label="Player" value={item.user.name} />
            {item.quantity > 1 && <Detail label="Quantity" value={String(item.quantity)} />}
            {item.primaryMaterial && <Detail label="Primary Material" value={item.primaryMaterial} />}
            {item.secondaryMaterial && <Detail label="Secondary Material" value={item.secondaryMaterial} />}
          </div>

          {item.masterCrafted && (
            <div className="inline-block px-2 py-1 rounded text-xs font-bold bg-purple-900 text-purple-300">
              Master Crafted
            </div>
          )}

          {item.itemDescription && (
            <p className="text-gray-400 text-sm border-t border-gray-800 pt-3 mt-2">
              {item.itemDescription}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                item.status === "approved"
                  ? "bg-green-900 text-green-300"
                  : item.status === "denied"
                    ? "bg-red-900 text-red-300"
                    : "bg-yellow-900 text-yellow-300"
              }`}
            >
              {item.status}
            </span>
            {item.processedAt && (
              <span className="text-gray-600 text-xs">
                {new Date(item.processedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500 text-xs block">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
