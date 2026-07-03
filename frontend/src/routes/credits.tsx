import { InlineLink } from "#/components/interactive/inline-link";
import { PageHeader } from "#/components/page-header";
import { AddToCollection, QuickSettings } from "#/components/song-look/song-menu-icons";
import { Trans, useTranslation } from "react-i18next";

export default function Credits() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-lg px-1 pb-2 text-black dark:text-white">
      <PageHeader>{t("Asset credits")}</PageHeader>
      <p className="mt-2 text-base">
        <Trans>
          credits-blurp <InlineLink to="https://isbl.cz">author</InlineLink>
        </Trans>
      </p>

      <p className="mt-2 text-base">
        <Trans>
          Icon for adding to collection <AddToCollection /> is taken from{" "}
          <InlineLink to="https://smashicons.com/">Smashicons</InlineLink>
        </Trans>
      </p>
      <p className="mt-2 text-base">
        <Trans>
          Icon for quick settings <QuickSettings /> is taken from{" "}
          <InlineLink to="https://iconic.app/">{{ iconicApp } as any}</InlineLink>
        </Trans>
      </p>
      <p className="mt-2 text-base">{t("other-icons")}</p>
    </div>
  );
}
const iconicApp = "iconic.app";
