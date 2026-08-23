import { DefaultsCellPreview } from "@/features/data-dictionary/components/defaults-cell-preview";

type ProcessDescriptionPreviewProps = {
  activation?: "double-click" | "hover";
  description: string;
  processName: string;
  triggerText?: string;
};

export function ProcessDescriptionPreview({
  activation = "hover",
  description,
  processName,
  triggerText = description,
}: ProcessDescriptionPreviewProps) {
  return (
    <DefaultsCellPreview
      activation={activation}
      ariaLabel={`View full description for ${processName}`}
      content={description}
      label="Full description"
      title={processName}
      triggerText={triggerText}
    />
  );
}
