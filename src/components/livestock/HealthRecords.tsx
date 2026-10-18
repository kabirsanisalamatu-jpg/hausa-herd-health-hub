import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { AuthField, fieldA11y } from "@/components/common/AuthCard";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import {
  EVENT_TYPES, HEALTH_LIMITS, HealthError, createEventSchema, createVaccinationSchema, dueStatus, emptyEvent, emptyVaccination,
  eventToForm, healthKeys, healthService, vaccinationToForm, type HealthEvent, type HealthEventForm, type Vaccination, type VaccinationForm,
} from "@/lib/health";
import { todayIso } from "@/lib/livestock";
import type { TranslationKey } from "@/locales";

type Notice = { ok: boolean; key: TranslationKey } | null;

export function useDateFormat() {
  const { language } = useTranslation();
  return (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(language === "ha" ? "ha-NG" : "en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export const DUE_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  upcoming: "secondary", due_today: "default", overdue: "destructive", no_due: "outline",
};

function NoticeLine({ notice }: { notice: Notice }) {
  const { t } = useTranslation();
  if (!notice) return null;
  return (
    <p role={notice.ok ? "status" : "alert"} className={notice.ok ? "rounded-md border border-border bg-card px-4 py-3 text-sm" : "rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"}>
      {t(notice.key)}
    </p>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <p className="text-destructive">{t("health.error.load")}</p>
      <Button variant="outline" className="mt-3 min-h-11" onClick={onRetry}>{t("common.retry")}</Button>
    </div>
  );
}

/** Generic validated form: schema errors map to fields; server errors to a top alert. */
function useRecordForm<T extends object>(initial: T, parse: (v: T) => { success: true } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } }) {
  const { t } = useTranslation();
  const [v, setV] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const set = <K extends keyof T>(k: K, val: T[K]) => { setV((p) => ({ ...p, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })); };
  async function submit(e: FormEvent, prefix: string, save: (v: T) => Promise<void>, onDone: () => void) {
    e.preventDefault();
    if (inFlight.current) return;
    const parsed = parse(v);
    if (!parsed.success) {
      const next: Partial<Record<keyof T, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof T;
        if (k && !next[k]) next[k] = issue.message;
      }
      setErrors(next);
      setFormError(t("livestock.validation.fixErrors"));
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`${prefix}-${first}`)?.focus();
      return;
    }
    inFlight.current = true; setSaving(true); setFormError(null);
    try { await save(v); onDone(); }
    catch (err) { setFormError(t(err instanceof HealthError ? err.key : "livestock.error.network")); }
    finally { inFlight.current = false; setSaving(false); }
  }
  return { v, set, errors, formError, saving, submit };
}

function FormFrame({ title, formError, saving, onSubmit, onCancel, children }: {
  title: string; formError: string | null; saving: boolean; onSubmit: (e: FormEvent) => void; onCancel: () => void; children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-primary/40 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <h4 className="text-base font-semibold">{title}</h4>
          {formError ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p> : null}
          {children}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="min-h-11" disabled={saving} aria-busy={saving}>{saving ? t("livestock.new.saving") : t("common.save")}</Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>{t("common.cancel")}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EventFormCard({ livestockId, record, onDone, onCancel }: { livestockId: string; record: HealthEvent | null; onDone: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const schema = createEventSchema(t);
  const f = useRecordForm<HealthEventForm>(record ? eventToForm(record) : emptyEvent(), (v) => schema.safeParse(v));
  const today = todayIso();
  const e = f.errors;
  return (
    <FormFrame title={t(record ? "health.form.editTitle" : "health.form.addTitle")} formError={f.formError} saving={f.saving} onCancel={onCancel}
      onSubmit={(ev) => void f.submit(ev, "he", (v) => healthService.saveEvent(livestockId, v, record?.id), onDone)}>
      <p className="text-xs leading-5 text-muted-foreground">{t("health.form.notDiagnosis")}</p>
      <AuthField id="he-eventType" label={t("health.field.type")} error={e.eventType}>
        <Select value={f.v.eventType} onValueChange={(x) => { if (x) f.set("eventType", x); }}>
          <SelectTrigger id="he-eventType" className="min-h-11" aria-invalid={!!e.eventType} aria-describedby={e.eventType ? "he-eventType-error" : undefined}>
            <SelectValue placeholder={t("livestock.field.choose")} />
          </SelectTrigger>
          <SelectContent>{EVENT_TYPES.map((x) => <SelectItem key={x} value={x}>{t(`health.type.${x}`)}</SelectItem>)}</SelectContent>
        </Select>
      </AuthField>
      <AuthField id="he-eventDate" label={t("health.field.date")} error={e.eventDate}>
        <Input {...fieldA11y("he-eventDate", e.eventDate)} type="date" max={today} min="1950-01-01" value={f.v.eventDate} onChange={(x) => f.set("eventDate", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="he-title" label={t("health.field.title")} hint={t("health.field.titleHint")} error={e.title}>
        <Input {...fieldA11y("he-title", e.title)} value={f.v.title} maxLength={HEALTH_LIMITS.title} onChange={(x) => f.set("title", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="he-description" label={t("health.field.description")} error={e.description}>
        <Textarea {...fieldA11y("he-description", e.description)} value={f.v.description} maxLength={HEALTH_LIMITS.description} rows={3} onChange={(x) => f.set("description", x.target.value)} />
      </AuthField>
      <AuthField id="he-reportedBy" label={t("health.field.reportedBy")} hint={t("health.field.reportedByHint")} error={e.reportedBy}>
        <Input {...fieldA11y("he-reportedBy", e.reportedBy)} value={f.v.reportedBy} maxLength={HEALTH_LIMITS.person} onChange={(x) => f.set("reportedBy", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="he-professionalInvolved" label={t("health.field.professional")} hint={t("health.field.professionalHint")} error={e.professionalInvolved}>
        <Input {...fieldA11y("he-professionalInvolved", e.professionalInvolved)} value={f.v.professionalInvolved} maxLength={HEALTH_LIMITS.person} onChange={(x) => f.set("professionalInvolved", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="he-followUpDate" label={t("health.field.followUp")} error={e.followUpDate}>
        <Input {...fieldA11y("he-followUpDate", e.followUpDate)} type="date" min={f.v.eventDate || undefined} value={f.v.followUpDate} onChange={(x) => f.set("followUpDate", x.target.value)} className="min-h-11" />
      </AuthField>
    </FormFrame>
  );
}

function VaccinationFormCard({ livestockId, record, onDone, onCancel }: { livestockId: string; record: Vaccination | null; onDone: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const schema = createVaccinationSchema(t);
  const f = useRecordForm<VaccinationForm>(record ? vaccinationToForm(record) : emptyVaccination(), (v) => schema.safeParse(v));
  const today = todayIso();
  const e = f.errors;
  return (
    <FormFrame title={t(record ? "vaccination.form.editTitle" : "vaccination.form.addTitle")} formError={f.formError} saving={f.saving} onCancel={onCancel}
      onSubmit={(ev) => void f.submit(ev, "vx", (v) => healthService.saveVaccination(livestockId, v, record?.id), onDone)}>
      <p className="text-xs leading-5 text-muted-foreground">{t("vaccination.form.intro")}</p>
      <AuthField id="vx-vaccineName" label={t("vaccination.field.name")} error={e.vaccineName}>
        <Input {...fieldA11y("vx-vaccineName", e.vaccineName)} value={f.v.vaccineName} maxLength={HEALTH_LIMITS.vaccine} onChange={(x) => f.set("vaccineName", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="vx-vaccinationDate" label={t("vaccination.field.date")} error={e.vaccinationDate}>
        <Input {...fieldA11y("vx-vaccinationDate", e.vaccinationDate)} type="date" max={today} min="1950-01-01" value={f.v.vaccinationDate} onChange={(x) => f.set("vaccinationDate", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="vx-nextDueDate" label={t("vaccination.field.nextDue")} hint={t("vaccination.field.nextDueHint")} error={e.nextDueDate}>
        <Input {...fieldA11y("vx-nextDueDate", e.nextDueDate)} type="date" min={f.v.vaccinationDate || undefined} value={f.v.nextDueDate} onChange={(x) => f.set("nextDueDate", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="vx-administeredBy" label={t("vaccination.field.administeredBy")} hint={t("vaccination.field.administeredByHint")} error={e.administeredBy}>
        <Input {...fieldA11y("vx-administeredBy", e.administeredBy)} value={f.v.administeredBy} maxLength={HEALTH_LIMITS.person} onChange={(x) => f.set("administeredBy", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="vx-batchNumber" label={t("vaccination.field.batch")} error={e.batchNumber}>
        <Input {...fieldA11y("vx-batchNumber", e.batchNumber)} value={f.v.batchNumber} maxLength={HEALTH_LIMITS.batch} onChange={(x) => f.set("batchNumber", x.target.value)} className="min-h-11" />
      </AuthField>
      <AuthField id="vx-notes" label={t("livestock.field.notes")} error={e.notes}>
        <Textarea {...fieldA11y("vx-notes", e.notes)} value={f.v.notes} maxLength={HEALTH_LIMITS.notes} rows={3} onChange={(x) => f.set("notes", x.target.value)} />
      </AuthField>
    </FormFrame>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 whitespace-pre-line break-words text-sm">{value}</dd></div>;
}

export function HealthHistorySection({ livestockId, canAdd }: { livestockId: string; canAdd: boolean }) {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: healthKeys.events(livestockId), queryFn: () => healthService.listEvents(livestockId), retry: 1 });
  const [editing, setEditing] = useState<HealthEvent | "new" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  async function done(wasEdit: boolean) {
    setEditing(null);
    setNotice({ ok: true, key: wasEdit ? "health.success.updated" : "health.success.created" });
    await qc.invalidateQueries({ queryKey: healthKeys.all });
  }

  return (
    <section aria-labelledby="health-heading" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="health-heading" className="text-lg font-semibold">{t("health.section.title")}</h3>
        {canAdd && editing === null ? <Button className="min-h-11" onClick={() => { setNotice(null); setEditing("new"); }}><Plus aria-hidden="true" />{t("health.section.add")}</Button> : null}
      </div>
      <p className="rounded-md border border-dashed border-border px-4 py-3 text-xs leading-5 text-muted-foreground">{t("health.notice")}</p>
      <NoticeLine notice={notice} />
      {editing === "new" ? <EventFormCard livestockId={livestockId} record={null} onDone={() => void done(false)} onCancel={() => setEditing(null)} /> : null}
      {q.isPending ? <LoadingState /> : q.isError ? <LoadError onRetry={() => void q.refetch()} /> : q.data.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">{t("health.empty")}</p>
      ) : (
        <ol className="grid gap-3 border-l-2 border-border pl-4">
          {q.data.map((ev) => editing !== null && editing !== "new" && editing.id === ev.id ? (
            <li key={ev.id}><EventFormCard livestockId={livestockId} record={ev} onDone={() => void done(true)} onCancel={() => setEditing(null)} /></li>
          ) : (
            <li key={ev.id}>
              <Card className="shadow-sm">
                <CardContent className="grid gap-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground"><time dateTime={ev.event_date}>{fmt(ev.event_date)}</time></p>
                      <h4 className="break-words font-semibold">{ev.title}</h4>
                      <Badge variant="outline" className="mt-1">{t(`health.type.${ev.event_type}` as TranslationKey)}</Badge>
                    </div>
                    {canAdd && editing === null ? (
                      <Button variant="ghost" className="min-h-11" onClick={() => { setNotice(null); setEditing(ev); }} aria-label={t("health.editLabel", { title: ev.title })}>
                        <Pencil aria-hidden="true" />{t("livestock.detail.edit")}
                      </Button>
                    ) : null}
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <Field label={t("health.field.description")} value={ev.description} />
                    <Field label={t("health.field.reportedBy")} value={ev.reported_by} />
                    <Field label={t("health.field.professional")} value={ev.professional_involved} />
                    <Field label={t("health.field.followUp")} value={ev.follow_up_date ? fmt(ev.follow_up_date) : null} />
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function VaccinationSection({ livestockId, canAdd }: { livestockId: string; canAdd: boolean }) {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: healthKeys.vaccinations(livestockId), queryFn: () => healthService.listVaccinations(livestockId), retry: 1 });
  const [editing, setEditing] = useState<Vaccination | "new" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const today = todayIso();

  async function done(wasEdit: boolean) {
    setEditing(null);
    setNotice({ ok: true, key: wasEdit ? "vaccination.success.updated" : "vaccination.success.created" });
    await qc.invalidateQueries({ queryKey: healthKeys.all });
  }

  return (
    <section aria-labelledby="vax-heading" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="vax-heading" className="text-lg font-semibold">{t("vaccination.section.title")}</h3>
        {canAdd && editing === null ? <Button className="min-h-11" onClick={() => { setNotice(null); setEditing("new"); }}><Plus aria-hidden="true" />{t("vaccination.section.add")}</Button> : null}
      </div>
      <NoticeLine notice={notice} />
      {editing === "new" ? <VaccinationFormCard livestockId={livestockId} record={null} onDone={() => void done(false)} onCancel={() => setEditing(null)} /> : null}
      {q.isPending ? <LoadingState /> : q.isError ? <LoadError onRetry={() => void q.refetch()} /> : q.data.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">{t("vaccination.empty")}</p>
      ) : (
        <ul className="grid gap-3">
          {q.data.map((v) => editing !== null && editing !== "new" && editing.id === v.id ? (
            <li key={v.id}><VaccinationFormCard livestockId={livestockId} record={v} onDone={() => void done(true)} onCancel={() => setEditing(null)} /></li>
          ) : (
            <li key={v.id}>
              <Card className="shadow-sm">
                <CardContent className="grid gap-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="break-words font-semibold">{v.vaccine_name}</h4>
                      <p className="text-xs text-muted-foreground">{t("vaccination.givenOn", { date: fmt(v.vaccination_date) })}</p>
                      <Badge variant={DUE_BADGE[dueStatus(v.next_due_date, today)]} className="mt-1">{t(`vaccination.status.${dueStatus(v.next_due_date, today)}`)}</Badge>
                    </div>
                    {canAdd && editing === null ? (
                      <Button variant="ghost" className="min-h-11" onClick={() => { setNotice(null); setEditing(v); }} aria-label={t("vaccination.editLabel", { name: v.vaccine_name })}>
                        <Pencil aria-hidden="true" />{t("livestock.detail.edit")}
                      </Button>
                    ) : null}
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <Field label={t("vaccination.field.nextDue")} value={v.next_due_date ? fmt(v.next_due_date) : null} />
                    <Field label={t("vaccination.field.administeredBy")} value={v.administered_by_name} />
                    <Field label={t("vaccination.field.batch")} value={v.batch_number} />
                    <Field label={t("livestock.field.notes")} value={v.notes} />
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
