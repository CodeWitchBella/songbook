import { useTranslation } from "react-i18next";
import type { User } from "store/graphql";

import { InlineLink } from "./interactive/inline-link";

export function LoginDone({ viewer }: { viewer: User }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col text-base">
      <div>{t("login.complete")}</div>
      <div className="mb-3">
        {t("login.Your name: {{name}}", { name: viewer.name })}
      </div>
      <InlineLink to="/">{t("login.back-to-homepage")}</InlineLink>
    </div>
  );
}
