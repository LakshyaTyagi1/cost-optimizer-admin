import { AdminShell } from "@/components/admin-shell/admin-shell";
import { StackSelectionsSection } from "@/components/missing-features/stack-selections-section";

/**
 * The Missing Features page: the technology stack customers selected, for QA to read before
 * updating the Master Inventory catalog. It holds only the Technology stack section.
 */
export function MissingFeaturesPage() {
  return (
    <AdminShell activeItem="Missing Features">
      <div className="flex max-w-full flex-col gap-6 overflow-hidden lg:pr-6">
        <StackSelectionsSection />
      </div>
    </AdminShell>
  );
}
