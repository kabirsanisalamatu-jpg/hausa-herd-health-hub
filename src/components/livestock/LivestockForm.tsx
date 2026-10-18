import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AuthField, fieldA11y } from "@/components/common/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AGE_UNITS, LIMITS, PURPOSES, RECORD_TYPES, SEXES, SPECIES, createLivestockSchema, todayIso,
  type LivestockFormValues,
} from "@/lib/livestock";
import type { TranslationKey } from "@/locales";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<keyof LivestockFormValues, string>>;
const NONE = "__none__";

/** Guarded select: shadcn Select can emit "" during hydration, which is ignored. */
function ChoiceSelect({ id, value, onChange, options, allowNone, invalid, describedBy }: {
  id: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
  allowNone?: boolean; invalid?: boolean; describedBy?: string | undefined;
}) {
  const { t } = useTranslation();
  return (
    <Select value={value || (allowNone ? NONE : undefined)} onValueChange={(v) => { if (v) onChange(v === NONE ? "" : v); }}>
      <SelectTrigger id={id} className="min-h-11" aria-invalid={invalid} aria-describedby={describedBy}>
        <SelectValue placeholder={t("livestock.field.choose")} />
      </SelectTrigger>
      <SelectContent>
        {allowNone ? <SelectItem value={NONE}>{t("livestock.field.none")}</SelectItem> : null}
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RadioCards<T extends string>({ name, legend, value, onChange, options, disabled }: {
  name: string; legend: string; value: T; onChange: (v: T) => void; disabled?: boolean;
  options: { value: T; label: string; hint?: string }[];
}) {
  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-input p-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              value === o.value && "border-primary bg-accent",
              disabled && "cursor-not-allowed opacity-70",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-1 size-4 accent-primary" />
            <span>
              <span className="block font-medium">{o.label}</span>
              {o.hint ? <span className="mt-1 block text-xs text-muted-foreground">{o.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function LivestockForm({ initial, lockRecordType, submitLabel, onSubmit, footer }: {
  initial: LivestockFormValues;
  lockRecordType?: boolean;
  submitLabel: string;
  /** Returns an error key, or null on success. */
  onSubmit: (values: LivestockFormValues) => Promise<TranslationKey | null>;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const [v, setV] = useState<LivestockFormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const today = todayIso();
  const group = v.recordType === "group";

  const set = <K extends keyof LivestockFormValues>(k: K, val: LivestockFormValues[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    const values = group && v.ageMode === "dob" ? { ...v, ageMode: "unknown" as const } : v;
    const parsed = createLivestockSchema(t).safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof LivestockFormValues;
        if (k && !next[k]) next[k] = issue.message;
      }
      setErrors(next);
      setFormError(t("livestock.validation.fixErrors"));
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`ls-${first}`)?.focus();
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setFormError(null);
    const errKey = await onSubmit(values);
    inFlight.current = false;
    setSaving(false);
    if (errKey) {
      setFormError(t(errKey));
      if (errKey === "livestock.error.duplicateCode") setErrors((x) => ({ ...x, identificationCode: t(errKey) }));
    }
  }

  const opts = <T extends string>(list: readonly T[], prefix: string) =>
    list.map((x) => ({ value: x, label: t(`${prefix}.${x}` as TranslationKey) }));

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      {formError ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p>
      ) : null}

      <RadioCards
        name="recordType"
        legend={t("livestock.recordType.label")}
        value={v.recordType}
        disabled={!!lockRecordType}
        onChange={(x) => set("recordType", x)}
        options={RECORD_TYPES.map((x) => ({ value: x, label: t(`livestock.recordType.${x}`), hint: t(`livestock.recordType.${x}Hint`) }))}
      />
      {lockRecordType ? <p className="-mt-4 text-xs text-muted-foreground">{t("livestock.edit.typeLocked")}</p> : null}

      <AuthField id="ls-species" label={t("livestock.field.species")} error={errors.species}>
        <ChoiceSelect id="ls-species" value={v.species} onChange={(x) => set("species", x)} options={opts(SPECIES, "livestock.species")} invalid={!!errors.species} describedBy={errors.species ? "ls-species-error" : undefined} />
      </AuthField>

      <AuthField id="ls-name" label={t(group ? "livestock.field.groupName" : "livestock.field.name")} hint={t(group ? "livestock.field.groupNameHint" : "livestock.field.nameHint")} error={errors.name}>
        <Input {...fieldA11y("ls-name", errors.name)} value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={LIMITS.name} className="min-h-11" />
      </AuthField>

      <AuthField id="ls-identificationCode" label={t("livestock.field.code")} hint={t("livestock.field.codeHint")} error={errors.identificationCode}>
        <Input {...fieldA11y("ls-identificationCode", errors.identificationCode)} value={v.identificationCode} onChange={(e) => set("identificationCode", e.target.value)} maxLength={LIMITS.code} autoCapitalize="characters" className="min-h-11" />
      </AuthField>

      {group ? (
        <AuthField id="ls-quantity" label={t("livestock.field.quantity")} hint={t("livestock.field.quantityHint")} error={errors.quantity}>
          <Input {...fieldA11y("ls-quantity", errors.quantity)} value={v.quantity} onChange={(e) => set("quantity", e.target.value)} inputMode="numeric" type="number" min={1} max={LIMITS.quantity} step={1} className="min-h-11" />
        </AuthField>
      ) : null}

      <div className="grid gap-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">{t("livestock.field.moreDetails")}</h2>

        <AuthField id="ls-breed" label={t("livestock.field.breed")} hint={t("livestock.field.breedHint")} error={errors.breed}>
          <Input {...fieldA11y("ls-breed", errors.breed)} value={v.breed} onChange={(e) => set("breed", e.target.value)} maxLength={LIMITS.breed} className="min-h-11" />
        </AuthField>

        {!group ? (
          <div className="grid gap-2">
            <Label htmlFor="ls-sex">{t("livestock.field.sex")}</Label>
            <ChoiceSelect id="ls-sex" value={v.sex} onChange={(x) => set("sex", x)} options={opts(SEXES, "livestock.sex")} allowNone />
          </div>
        ) : null}

        <RadioCards
          name="ageMode"
          legend={t("livestock.field.ageMode")}
          value={group && v.ageMode === "dob" ? "unknown" : v.ageMode}
          onChange={(x) => set("ageMode", x)}
          options={(group ? (["unknown", "estimate"] as const) : (["unknown", "dob", "estimate"] as const)).map((m) => ({
            value: m,
            label: t(m === "unknown" ? "livestock.field.ageUnknown" : m === "dob" ? "livestock.field.ageDob" : "livestock.field.ageEstimate"),
          }))}
        />

        {!group && v.ageMode === "dob" ? (
          <AuthField id="ls-dateOfBirth" label={t("livestock.field.dateOfBirth")} error={errors.dateOfBirth}>
            <Input {...fieldA11y("ls-dateOfBirth", errors.dateOfBirth)} type="date" max={today} min="1950-01-01" value={v.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className="min-h-11" />
          </AuthField>
        ) : null}

        {v.ageMode === "estimate" ? (
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <AuthField id="ls-ageValue" label={t("livestock.field.ageValue")} error={errors.ageValue}>
              <Input {...fieldA11y("ls-ageValue", errors.ageValue)} type="number" inputMode="decimal" min={0.1} step="any" value={v.ageValue} onChange={(e) => set("ageValue", e.target.value)} className="min-h-11" />
            </AuthField>
            <div className="space-y-2">
              <Label htmlFor="ls-ageUnit">{t("livestock.field.ageUnit")}</Label>
              <ChoiceSelect id="ls-ageUnit" value={v.ageUnit} onChange={(x) => set("ageUnit", x)} options={opts(AGE_UNITS, "livestock.unit")} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="ls-purpose">{t("livestock.field.purpose")}</Label>
          <ChoiceSelect id="ls-purpose" value={v.purpose} onChange={(x) => set("purpose", x)} options={opts(PURPOSES, "livestock.purpose")} allowNone />
        </div>

        <AuthField id="ls-acquisitionDate" label={t("livestock.field.acquisitionDate")} error={errors.acquisitionDate}>
          <Input {...fieldA11y("ls-acquisitionDate", errors.acquisitionDate)} type="date" max={today} value={v.acquisitionDate} onChange={(e) => set("acquisitionDate", e.target.value)} className="min-h-11" />
        </AuthField>

        <AuthField id="ls-acquisitionSource" label={t("livestock.field.acquisitionSource")} hint={t("livestock.field.acquisitionSourceHint")} error={errors.acquisitionSource}>
          <Input {...fieldA11y("ls-acquisitionSource", errors.acquisitionSource)} value={v.acquisitionSource} onChange={(e) => set("acquisitionSource", e.target.value)} maxLength={LIMITS.source} className="min-h-11" />
        </AuthField>

        <AuthField id="ls-notes" label={t("livestock.field.notes")} error={errors.notes}>
          <Textarea {...fieldA11y("ls-notes", errors.notes)} value={v.notes} onChange={(e) => set("notes", e.target.value)} maxLength={LIMITS.notes} rows={3} />
        </AuthField>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="min-h-11" disabled={saving} aria-busy={saving}>
          {saving ? t("livestock.new.saving") : submitLabel}
        </Button>
        {footer}
      </div>
    </form>
  );
}
