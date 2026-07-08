import { InstallButtonLook } from "#/components/install";
import { ExternalInlineLink } from "#/components/interactive/inline-link";
import { ListButton } from "#/components/interactive/list-button";
import { PrimaryButton } from "#/components/interactive/primary-button";
import { useColors } from "#/components/themed";
import { useLogin } from "#/components/use-login";
import { Version } from "#/components/version";
import { useTranslation } from "react-i18next";

export default function Home() {
  const login = useLogin();
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <div>
      <div
        className="flex min-h-screen flex-col items-center justify-center"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <div className="flex max-w-[300px] flex-col items-stretch pb-10 pt-5">
          <img src="/static/full.svg" alt="" className="aspect-square w-full" style={{ marginBottom: "16px" }} />
          <PrimaryButton to="/all-songs">{t("All songs")}</PrimaryButton>
          <Gap height={8} />
          {login.viewer ? null : (
            <>
              <Gap />
              <ListButton to="/login">{t("Log in")}</ListButton>
            </>
          )}
          <Gap />
          <ListButton to="/new">{t("Add song")}</ListButton>
          <Gap />
          <ListButton to="/collections">{t("Song collections")}</ListButton>
          <Gap />

          <ListButton to="/about">{t("Settings and about")}</ListButton>
          <Gap />
        </div>
        <div className="flex max-w-[400px] flex-col">
          <InstallButtonLook>
            <Gap height={30} />
          </InstallButtonLook>
        </div>
        <div className="absolute bottom-2 right-4 flex flex-col">
          <Version />
        </div>
      </div>
      <div className="flex flex-col items-center p-4">
        <div className="flex max-w-prose flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Oddíl Brehoni</h2>
            <div>
              Letní tábor, víkendovky a jiné akce pro mládež 8-15 let. Nadupaný příběh, hry a hlavně skvělá parta. Pojeď
              s námi na tábor!
            </div>
            <div>Tento zpěvník vzniknul a je dále uržován především pro Brehonské tábory!</div>
            <ExternalInlineLink to="https://brehoni.cz">brehoni.cz</ExternalInlineLink>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Drobná reklama</h2>
            <div className="flex flex-row flex-wrap">
              <ExternalInlineLink to="https://www.taboreni.cz/?zdroj=8246">
                <img src="https://icon.taboreni.cz/1/8246/125x62-d-t.png" alt="Dětský tábor" />
              </ExternalInlineLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Gap({ height = 10 }: { height?: number }) {
  return <div style={{ height }} />;
}

export { Home as Component };
