// Mirrors client/src/utils/condition.js logic to lock the rules in place.
function conditionFromAnnotations(annotations = []) {
  const issueCount = annotations.length;
  const hasHigh = annotations.some((a) => a.severity === "High");
  const hasMedium = annotations.some((a) => a.severity === "Medium");
  if (issueCount === 0) return { label: "Clean" };
  if (hasHigh) return { label: "Significant Issues" };
  if (hasMedium) return { label: "Minor Issues" };
  return { label: "Minor Issues" };
}

describe("Room condition derivation", () => {
  test("no annotations = Clean", () => {
    expect(conditionFromAnnotations([]).label).toBe("Clean");
  });
  test("any High = Significant Issues", () => {
    expect(conditionFromAnnotations([{ severity: "Low" }, { severity: "High" }]).label)
      .toBe("Significant Issues");
  });
  test("Medium but no High = Minor Issues", () => {
    expect(conditionFromAnnotations([{ severity: "Medium" }]).label).toBe("Minor Issues");
  });
  test("only Low = Minor Issues", () => {
    expect(conditionFromAnnotations([{ severity: "Low" }]).label).toBe("Minor Issues");
  });
});
