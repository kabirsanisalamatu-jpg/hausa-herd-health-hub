import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { AuthField, fieldA11y } from "@/components/common/AuthCard";
import { LoadingState } from "@/components/common/LoadingState";
import { Field, FormFrame, LoadError, NoticeLine, useDateFormat, useRecordForm, type Notice } from "@/components/livestock/HealthRecords";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { healthKeys } from "@/lib/health";
import { todayIso } from "@/lib/livestock";
import {
  TREATMENT_LIMITS as L, TREATMENT_STATUSES, createTreatmentSchema, emptyTreatment, hasProfessionalAttribution,
  treatmentKeys, treatmentService, treatmentToForm, type Treatment, type TreatmentForm,
} from "@/lib/treatments";

export const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  awaiting_assessment: "outline", recommended: "secondary", prescribed: "secondary", administered: "default", completed: "default", stopped: "outline",
};

/** Collapsible group of optional fields; opens automatically when it already holds data. */
function Group({ title, hint, open, children }: { title: string; hint: string; open: boolean; children: ReactNode }) {
  return (
    <details open={open} className="rounded-md border border-border">
      <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{title}</summary>
      <div className="grid gap-4 border-t border-border p-3">
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
        {children}
      </div>
    </details>
  );
}

function TreatmentFormCard({ livestockId, record, onDone, onCancel }: { livestockId: string; record: Treatment | null; onDone: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const schema = createTreatmentSchema(t);
  const f = useRecordForm<TreatmentForm>(record ? treatmentToForm(record) : emptyTreatment(), (v) => schema.safeParse(v));
  const today = todayIso();
  const e = f.errors;
  const v = f.v;
  const input = (k: keyof TreatmentForm, label: string, max: number, hint?: string) => (
    <AuthField id={`tr-${k}`} label={label} {...(hint ? { hint } : {})} error={e[k]}>
      <Input {...fieldA11y(`tr-${k}`, e[k])} value={v[k]} maxLength={max} onChange={(x) => f.set(k, x.target.value)} className="min-h-11" />
    </AuthField>
  );
  const area = (k: keyof TreatmentForm, label: string, max: number, hint?: string) => (
    <AuthField id={`tr-${k}`} label={label} {...(hint ? { hint } : {})} error={e[k]}>
      <Textarea {...fieldA11y(`tr-${k}`, e[k])} value={v[k]} maxLength={max} rows={3} onChange={(x) => f.set(k, x.target.value)} />
    </AuthField>
  );
  const date = (k: keyof TreatmentForm, label: string, opts: { max?: string | undefined; min?: string | undefined; hint?: string | undefined }) => (
    <AuthField id={`tr-${k}`} label={label} {...(opts.hint ? { hint: opts.hint } : {})} error={e[k]}>
      <Input {...fieldA11y(`tr-${k}`, e[k])} type="date" max={opts.max} min={opts.min ?? "1950-01-01"} value={v[k]} onChange={(x) => f.set(k, x.target.value)} className="min-h-11" />
    </AuthField>
  );
  const hasErr = (...ks: (keyof TreatmentForm)[]) => ks.some((k) => !!e[k]);
  return (
    <FormFrame title={t(record ? "treatment.form.editTitle" : "treatment.form.addTitle")} formError={f.formError} saving={f.saving} onCancel={onCancel}
      onSubmit={(ev) => void f.submit(ev, "tr", (x) => treatmentService.save(livestockId, x, record?.id), onDone)}>
      <p className="text-xs leading-5 text-muted-foreground">{t("treatment.form.intro")}</p>
      {date("recordDate", t("treatment.field.recordDate"), { max: today })}
      {input("reportedProblem", t("treatment.field.problem"), L.problem, t("treatment.field.problemHint"))}
      {area("farmerObservations", t("treatment.field.observations"), L.long)}
      <AuthField id="tr-treatmentStatus" label={t("treatment.field.status")} hint={t("treatment.field.statusHint")} error={e.treatmentStatus}>
        <Select value={v.treatmentStatus} onValueChange={(x) => { if (x) f.set("treatmentStatus", x); }}>
          <SelectTrigger id="tr-treatmentStatus" className="min-h-11" aria-invalid={!!e.treatmentStatus}><SelectValue /></SelectTrigger>
          <SelectContent>{TREATMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`treatment.status.${s}`)}</SelectItem>)}</SelectContent>
        </Select>
      </AuthField>
      <Group title={t("treatment.group.assessment")} hint={t("treatment.group.assessmentHint")}
        open={!!(v.veterinaryAssessment || v.veterinarianName || v.assessmentDate) || hasErr("veterinaryAssessment", "veterinarianName", "assessmentDate")}>
        {area("veterinaryAssessment", t("treatment.field.assessment"), L.long)}
        {input("veterinarianName", t("treatment.field.vetName"), L.person, t("treatment.field.vetNameHint"))}
        {date("assessmentDate", t("treatment.field.assessmentDate"), { max: today })}
      </Group>
      <Group title={t("treatment.group.plan")} hint={t("treatment.group.planHint")}
        open={!!(v.treatmentPlan || v.medicineName || v.doseAndInstructions) || hasErr("treatmentPlan", "medicineName", "doseAndInstructions")}>
        {area("treatmentPlan", t("treatment.field.plan"), L.long)}
        {input("medicineName", t("treatment.field.medicine"), L.medicine)}
        {area("doseAndInstructions", t("treatment.field.dose"), L.dose, t("treatment.field.doseHint"))}
      </Group>
      <Group title={t("treatment.group.administered")} hint={t("treatment.group.administeredHint")}
        open={!!(v.administrationDate || v.administeredBy) || hasErr("administrationDate", "administeredBy")}>
        {date("administrationDate", t("treatment.field.administrationDate"), { max: today })}
        {input("administeredBy", t("treatment.field.administeredBy"), L.person)}
      </Group>
      {date("followUpDate", t("treatment.field.followUp"), { min: v.recordDate || undefined, hint: t("treatment.field.followUpHint") })}
      {area("notes", t("livestock.field.notes"), L.notes)}
    </FormFrame>
  );
}

export function TreatmentSection({ livestockId, canAdd }: { livestockId: string; canAdd: boolean }) {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: treatmentKeys.list(livestockId), queryFn: () => treatmentService.list(livestockId), retry: 1 });
  const [editing, setEditing] = useState<Treatment | "new" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  async function done(wasEdit: boolean) {
    setEditing(null);
    setNotice({ ok: true, key: wasEdit ? "treatment.success.updated" : "treatment.success.created" });
    await Promise.all([qc.invalidateQueries({ queryKey: treatmentKeys.all }), qc.invalidateQueries({ queryKey: healthKeys.all })]);
  }

  return (
    <section aria-labelledby="treatment-heading" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="treatment-heading" className="text-lg font-semibold">{t("treatment.section.title")}</h3>
        {canAdd && editing === null ? <Button className="min-h-11" onClick={() => { setNotice(null); setEditing("new"); }}><Plus aria-hidden="true" />{t("treatment.section.add")}</Button> : null}
      </div>
      <p className="rounded-md border border-dashed border-border px-4 py-3 text-xs leading-5 text-muted-foreground">{t("treatment.notice")}</p>
      <NoticeLine notice={notice} />
      {editing === "new" ? <TreatmentFormCard livestockId={livestockId} record={null} onDone={() => void done(false)} onCancel={() => setEditing(null)} /> : null}
      {q.isPending ? <LoadingState /> : q.isError ? <LoadError onRetry={() => void q.refetch()} /> : q.data.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">{t("treatment.empty")}</p>
      ) : (
        <ol className="grid gap-3 border-l-2 border-border pl-4">
          {q.data.map((r) => editing !== null && editing !== "new" && editing.id === r.id ? (
            <li key={r.id}><TreatmentFormCard livestockId={livestockId} record={r} onDone={() => void done(true)} onCancel={() => setEditing(null)} /></li>
          ) : (
            <li key={r.id} id={`treatment-${r.id}`} className="scroll-mt-20">
              <Card className="shadow-sm">
                <CardContent className="grid gap-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground"><time dateTime={r.record_date}>{fmt(r.record_date)}</time></p>
                      <h4 className="break-words font-semibold">{r.reported_problem}</h4>
                      <Badge variant={STATUS_BADGE[r.treatment_status]} className="mt-1">{t(`treatment.status.${r.treatment_status}` as `treatment.status.${(typeof TREATMENT_STATUSES)[number]}`)}</Badge>
                    </div>
                    {canAdd && editing === null ? (
                      <Button variant="ghost" className="min-h-11" onClick={() => { setNotice(null); setEditing(r); }} aria-label={t("treatment.editLabel", { title: r.reported_problem })}>
                        <Pencil aria-hidden="true" />{t("livestock.detail.edit")}
                      </Button>
                    ) : null}
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <Field label={t("treatment.view.reported")} value={r.farmer_observations} />
                    {r.veterinary_assessment ? (
                      <Field label={t(hasProfessionalAttribution(r) ? "treatment.view.assessmentBy" : "treatment.view.assessmentUnattributed", { name: r.veterinarian_name ?? "" })}
                        value={r.assessment_date ? `${r.veterinary_assessment}\n(${fmt(r.assessment_date)})` : r.veterinary_assessment} />
                    ) : <Field label={t("treatment.field.vetName")} value={r.veterinarian_name} />}
                    <Field label={t("treatment.view.plan")} value={r.treatment_plan} />
                    <Field label={t("treatment.field.medicine")} value={r.medicine_name} />
                    <Field label={t("treatment.field.dose")} value={r.dose_and_instructions} />
                    <Field label={t("treatment.view.administered")} value={r.administration_date || r.administered_by
                      ? [r.administration_date ? fmt(r.administration_date) : null, r.administered_by].filter(Boolean).join(" · ") : null} />
                    <Field label={t("treatment.view.followUp")} value={r.follow_up_date ? fmt(r.follow_up_date) : null} />
                    <Field label={t("livestock.field.notes")} value={r.notes} />
                  </dl>
                  <p className="text-xs text-muted-foreground">{t("treatment.view.recordedByUser")}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
