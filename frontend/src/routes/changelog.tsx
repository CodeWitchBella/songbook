import { BackArrow, BackButton } from "#/components/back-button";
import { ChangelogEntry } from "#/components/changelog-entry";
import { InlineLink } from "#/components/interactive/inline-link";
import { useLanguage } from "#/components/localisation";
import { LanguageSettings } from "#/components/settings/language-settings";
import { TP, TText } from "#/components/themed";
import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChangelog } from "#/utils/use-changelog";

function ChangelogBody() {
  const changelog = useChangelog();
  const [lng] = useLanguage();
  if (changelog.status === "initializing") return null;

  if (changelog.status === "loading") {
    return <TText>Načítám...</TText>;
  }
  if (changelog.status === "error") {
    return <TText>Načítání selhalo.</TText>;
  }
  return (
    <>
      {changelog.data.map(entry => (
        <ChangelogEntry key={entry.cz.tagName} date={entry.cz.tagName.slice(1)}>
          <ChangeBody body={lng === "en" ? entry.en.body : entry.cz.body} />
        </ChangelogEntry>
      ))}
      <ChangelogEntry date="2016-08-03">
        <ChangeBody
          body={
            lng === "en"
              ? `- Before web version there was LaTeX version
                 - Date is only a guess from memory, I did not version this in git
                 `.replace(/\n[ \t]+/g, "\n")
              : `- Před tímto zpěvníkem jsem měla systém založený na LaTeXu
                 - Datum je pouze odhad po paměti - toto jsem neukládala do gitu
                 `.replace(/\n[ \t]+/g, "\n")
          }
        />
      </ChangelogEntry>
      <div className="h-4" />
    </>
  );
}

function Link({ href, children }: { href?: string; children: any }) {
  if (!href) return <TText>{children}</TText>;
  return <InlineLink to={href}>{children}</InlineLink>;
}

const depthCtx = createContext(0);
function Ul({ children, depth }: { children: any; depth: number }) {
  return (
    <depthCtx.Provider value={depth}>
      <div className="flex flex-col">{children.filter((child: any) => typeof child !== "string")}</div>
    </depthCtx.Provider>
  );
}
function Li({ children }: { children: any }) {
  const depth = useContext(depthCtx);
  return (
    <div className="flex flex-row">
      <TText className="mr-1 font-bold">{depth === 1 ? "-" : "•"} </TText>
      <TText>{children}</TText>
    </div>
  );
}

function ChangeBody({ body }: { body: string }) {
  return (
    <div className="ml-2 mt-1 flex flex-col">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // slight typing mismatches are almost inevitable
        components={{ a: Link, text: TText, ul: Ul, li: Li, p: TP } as any}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
export default function Changelog() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Head />
      <ChangelogBody />
    </div>
  );
}

function Head() {
  const { t } = useTranslation();
  return (
    <div className="mb-1 mt-6 flex w-full flex-wrap items-center">
      <BackButton className="py-4 pr-2">
        <BackArrow />
      </BackButton>
      <div className="text-3xl font-bold">{t("Changelog")}</div>
      <div className="grow" />
      <LanguageSettings compact={true} />
    </div>
  );
}

export { Changelog as Component };
