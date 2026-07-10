export type AssessmentStatusTone =
  | "gray"
  | "blueLight"
  | "blue"
  | "green"
  | "red";

export function getStatusTone(status: string, statusKey = ""): AssessmentStatusTone {
  const normalizedStatusKey = normalizeStatusKey(statusKey);

  if (normalizedStatusKey === "closed-won") {
    return "green";
  }

  if (normalizedStatusKey === "closed-lost") {
    return "red";
  }

  if (normalizedStatusKey === "expert-booked") {
    return "blue";
  }

  if (normalizedStatusKey === "due-diligence" || normalizedStatusKey === "results-ready") {
    return "blueLight";
  }

  const normalizedStatus = normalizeStatusKey(status);

  if (normalizedStatus === "due-diligence" || normalizedStatus === "results-ready") {
    return "blueLight";
  }

  if (normalizedStatus === "expert-booked") {
    return "blue";
  }

  return "gray";
}

function normalizeStatusKey(value: string) {
  return value.trim().toLowerCase().replace(/_+/g, "-").replace(/\s+/g, "-");
}
