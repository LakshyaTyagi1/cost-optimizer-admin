export type AssessmentStatusTone =
  | "gray"
  | "grayLight"
  | "blueLight"
  | "blueMuted"
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

  if (normalizedStatusKey === "due-diligence") {
    return "blueLight";
  }

  if (normalizedStatusKey === "results-ready") {
    return "blueMuted";
  }

  if (normalizedStatusKey === "draft") {
    return "grayLight";
  }

  const normalizedStatus = normalizeStatusKey(status);

  if (normalizedStatus === "due-diligence") {
    return "blueLight";
  }

  if (normalizedStatus === "results-ready") {
    return "blueMuted";
  }

  if (normalizedStatus === "expert-booked") {
    return "blue";
  }

  if (normalizedStatus === "draft") {
    return "grayLight";
  }

  return "gray";
}

function normalizeStatusKey(value: string) {
  return value.trim().toLowerCase().replace(/_+/g, "-").replace(/\s+/g, "-");
}
