import { DataDictionaryPanel } from "@/features/data-dictionary/components/data-dictionary-panel";
import { TierPill } from "@/features/data-dictionary/components/tier-pill";
import { automationLevels, processTiers } from "@/features/data-dictionary/model";

export function AutomationLevelsCard() {
  return (
    <DataDictionaryPanel title="Automation Levels (1-5 Scale)" className="min-h-[309px]">
      <div className="mt-5 space-y-4">
        {automationLevels.map((level) => (
          <div key={level.level} className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
            <span
              className="flex size-6 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ backgroundColor: level.color }}
            >
              {level.level}
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-none font-bold">{level.label}</p>
              <p className="mt-1 text-xs font-semibold text-[#86868B]">{level.description}</p>
            </div>
          </div>
        ))}
      </div>
    </DataDictionaryPanel>
  );
}

export function ProcessTiersCard() {
  return (
    <DataDictionaryPanel title="Process Tiers" className="min-h-[309px]">
      <div className="mt-7 space-y-4">
        {processTiers.map((tier) => (
          <div
            key={tier.label}
            className="flex min-w-0 items-center justify-between gap-5 text-xs font-bold"
          >
            <TierPill tier={tier.label} />
            <span className="min-w-0 text-right text-[#86868B] break-words">{tier.slug}</span>
          </div>
        ))}
      </div>
    </DataDictionaryPanel>
  );
}

