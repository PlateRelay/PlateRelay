import { describe, expect, it } from "vitest";
import { type FormField, formAnswerIssue, formFieldProblem } from "../src/index.js";

const field = (p: Partial<FormField>): FormField => ({ id: "f", label: "字段", type: "text", required: false, ...p });

describe("formAnswerIssue", () => {
  it("treats blank text as empty", () => {
    expect(formAnswerIssue(field({ required: true }), "   ")).toBe("required");
    expect(formAnswerIssue(field({ minLength: 5 }), "  ")).toBeNull();
  });

  it("counts characters after trimming, not UTF-16 units", () => {
    const f = field({ minLength: 3, maxLength: 4 });
    expect(formAnswerIssue(f, " 打印 ")).toBe("too_short");
    expect(formAnswerIssue(f, "打印零件")).toBeNull();
    expect(formAnswerIssue(f, "🖨️🖨️")).toBeNull();
    expect(formAnswerIssue(f, "打印零件啊")).toBe("too_long");
  });

  it("checks number ranges inclusively", () => {
    const f = field({ type: "number", min: 1, max: 10 });
    expect(formAnswerIssue(f, 1)).toBeNull();
    expect(formAnswerIssue(f, 10)).toBeNull();
    expect(formAnswerIssue(f, 0)).toBe("too_small");
    expect(formAnswerIssue(f, 11)).toBe("too_large");
    expect(formAnswerIssue(f, "3")).toBe("type");
  });

  it("only accepts listed options", () => {
    expect(formAnswerIssue(field({ type: "single", options: ["甲", "乙"] }), "丙")).toBe("type");
    expect(formAnswerIssue(field({ type: "multi", options: ["甲", "乙"] }), ["甲", "乙"])).toBeNull();
    expect(formAnswerIssue(field({ type: "multi", options: ["甲"], required: true }), [])).toBe("required");
  });
});

describe("formFieldProblem", () => {
  it("refuses crossed limits and choice fields without options", () => {
    expect(formFieldProblem(field({ minLength: 5, maxLength: 2 }))).not.toBeNull();
    expect(formFieldProblem(field({ type: "number", min: 5, max: 2 }))).not.toBeNull();
    expect(formFieldProblem(field({ type: "single" }))).not.toBeNull();
    expect(formFieldProblem(field({ minLength: 2, maxLength: 2 }))).toBeNull();
  });
});
