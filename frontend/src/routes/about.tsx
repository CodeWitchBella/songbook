import { InlineLink } from "#/components/interactive/inline-link";
import { ListButton } from "#/components/interactive/list-button";
import { PageHeader } from "#/components/page-header";
import { DarkModeSettings } from "#/components/settings/dark-mode";
import { LanguageSettings } from "#/components/settings/language-settings";
import { TH2 } from "#/components/themed";
import { useLogin } from "#/components/use-login";
import { Version } from "#/components/version";
import { Trans, useTranslation } from "react-i18next";

const wiki = "https://outline.isbl.cz/s/f7cb675c-bbe5-48ea-b1bb-7a4a9a8f1bb6";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-lg px-1 pb-2">
      <PageHeader>{t("Settings and about")}</PageHeader>

      <ListButton to="/credits">{t("Asset credits")}</ListButton>
      <Gap />
      <ListButton to="/changelog">{t("Changelog")}</ListButton>
      <Gap />
      <ListButton to={wiki}>{t("Roadmap")}</ListButton>
      <TH2>{t("My account")}</TH2>
      <User />
      <TH2>{t("Appearance")}</TH2>
      <DarkModeSettings />
      <TH2>{t("Language")}</TH2>
      <LanguageSettings />
      <TH2>{t("About the app")}</TH2>
      <div className="flex flex-col">
        <span className="h-[18px] text-black dark:text-white">
          <Trans>
            Created by <InlineLink to="https://isbl.cz">Isabella Skořepová</InlineLink>
          </Trans>
          {` 2016${endash}2026`}
        </span>
      </div>
      <Gap />
      <Version />
    </div>
  );
}

function User() {
  const login = useLogin();
  const [t] = useTranslation();
  return login.viewer ? (
    <>
      <span className="text-base text-black dark:text-white">{login.viewer.name}</span>
      <Gap />
      <ListButton onPress={login.logout}>{t("Log out")}</ListButton>
    </>
  ) : (
    <>
      <ListButton to="/login">{t("Log in")}</ListButton>
      <Gap />
      <ListButton to="/register">{t("Register")}</ListButton>
    </>
  );
}

function Gap({ height = 10 }: { height?: number }) {
  return <div style={{ height }} />;
}

const endash = "–";

export { About as Component };
