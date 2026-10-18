import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/locales";

/** Grid of future-feature placeholder cards for workspace shells. No fake data. */
export function ComingSoonGrid({ items }: { items: { titleKey: TranslationKey; descriptionKey: TranslationKey }[] }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.titleKey} className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold">{t(item.titleKey)}</h3>
              <Badge variant="outline">{t("common.comingSoon")}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(item.descriptionKey)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
