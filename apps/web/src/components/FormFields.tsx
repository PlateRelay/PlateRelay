import { type FormField, formAnswerIssue } from "@platerelay/shared";
import { Checkbox } from "./Checkbox";
import { Field, Select, TextArea, TextInput } from "./Field";
import { Markdown } from "./Markdown";

/*
 * One field of the application form as applicants see it. The submit page and the form editor's
 * preview both render through here, so the preview is exactly what applicants get.
 */

export type Answer = string | string[];

const chars = (s: string) => [...s.trim()].length;

/** The answer as the panel takes it: numbers as numbers, everything else as typed. */
export function answerValue(f: FormField, a: Answer | undefined): string | string[] | number {
  if (f.type === "number" && typeof a === "string" && a.trim()) return Number(a.trim());
  return a ?? "";
}

export function answerError(f: FormField, a: Answer | undefined): string {
  const issue = formAnswerIssue(f, answerValue(f, a));
  const n = typeof a === "string" ? chars(a) : 0;
  switch (issue) {
    case "required": return "必填";
    case "type": return f.type === "number" ? "要填数字" : "请从选项中选择";
    case "too_short": return `至少 ${f.minLength} 个字，现在 ${n}`;
    case "too_long": return `最多 ${f.maxLength} 个字，现在 ${n}`;
    case "too_small": return `不能小于 ${f.min}`;
    case "too_large": return `不能大于 ${f.max}`;
    default: return "";
  }
}

/** "范围 1–10", "不小于 1", "不大于 10", or nothing. */
export const rangeText = (f: Pick<FormField, "min" | "max">) =>
  f.min !== undefined && f.max !== undefined ? `范围 ${f.min}–${f.max}` : f.min !== undefined ? `不小于 ${f.min}` : f.max !== undefined ? `不大于 ${f.max}` : "";

/** Long text and multiple choice take the whole row of a two-column form. */
export const isWide = (f: FormField) => f.type === "textarea" || f.type === "multi" || !!f.description?.trim();

export function FormFieldInput({ field: f, value: a, error, onChange, onBlur, className }: {
  field: FormField;
  value: Answer | undefined;
  error?: string;
  onChange: (a: Answer) => void;
  onBlur?: () => void;
  className?: string;
}) {
  const v = typeof a === "string" ? a : "";
  const counter = f.maxLength !== undefined ? `${chars(v)}/${f.maxLength}` : f.minLength ? `${chars(v)} / ${f.minLength}+` : undefined;
  const hint = f.type === "number" ? rangeText(f) || undefined : undefined;
  return (
    <Field label={f.label || "未命名字段"} required={f.required} error={error || undefined} hint={hint} counter={f.type === "text" || f.type === "textarea" ? counter : undefined} className={className}>
      {(id, cls) => (
        <>
          {f.description?.trim() && <Markdown text={f.description} className="-mt-0.5 mb-0.5" />}
          {f.type === "single" ? (
            <Select id={id} className={cls} options={f.options ?? []} placeholder={f.placeholder || "请选择"} value={v} onChange={(e) => (onChange(e.target.value), onBlur?.())} />
          ) : f.type === "multi" ? (
            <div id={id} className="flex flex-wrap gap-x-5 gap-y-1">
              {(f.options ?? []).map((o) => {
                const cur = Array.isArray(a) ? a : [];
                return (
                  <Checkbox key={o} checked={cur.includes(o)} onChange={(on) => (onChange(on ? [...cur, o] : cur.filter((x) => x !== o)), onBlur?.())}>
                    {o}
                  </Checkbox>
                );
              })}
            </div>
          ) : f.type === "textarea" ? (
            <TextArea id={id} className={cls} placeholder={f.placeholder} value={v} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
          ) : (
            <TextInput id={id} className={cls} placeholder={f.placeholder} inputMode={f.type === "number" ? "decimal" : undefined} value={v} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
          )}
        </>
      )}
    </Field>
  );
}
