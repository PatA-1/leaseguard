// Derives a room condition status from its annotations' severities.
// Returns { label, className } for consistent display across pages.
export function getRoomCondition(issueCount, hasHighSeverity, hasMediumSeverity) {
  if (issueCount === 0) {
    return { label: "Clean", className: "status-clean" };
  }
  if (hasHighSeverity) {
    return { label: "Significant Issues", className: "status-significant" };
  }
  if (hasMediumSeverity) {
    return { label: "Minor Issues", className: "status-minor" };
  }
  return { label: "Minor Issues", className: "status-minor" };
}

// Derives condition directly from an array of annotations.
export function conditionFromAnnotations(annotations = []) {
  const issueCount = annotations.length;
  const hasHigh = annotations.some((a) => a.severity === "High");
  const hasMedium = annotations.some((a) => a.severity === "Medium");
  return getRoomCondition(issueCount, hasHigh, hasMedium);
}

// Standard documentation checklist prompts shown per room.
export const ROOM_CHECKLIST = [
  "General condition (wide shot of the whole room)",
  "Floor and carpet",
  "Walls and ceiling",
  "Windows and blinds or curtains",
  "Fixtures and fittings (sockets, lights, radiators)",
  "Any existing damage or wear"
];
