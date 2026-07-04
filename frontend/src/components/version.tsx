import { buildData } from "#/build-data";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

import { TText } from "./themed";

const repoUrl = "https://forgejo.isbl.cz/isabella/songbook";

export function Version() {
  const [t] = useTranslation();
  const commitSha = /^[0-9a-f]{40}$/.test(buildData.commitSha) ? buildData.commitSha : "";
  const href = commitSha ? `${repoUrl}/commit/${commitSha}` : repoUrl;
  return (
    <TText>
      {t("Current version")}
      {": "}
      <a href={href} target="_blank" rel="noopener noreferrer">
        <TText style={buildData.fallback ? { fontStyle: "italic" } : {}}>{format(buildData.commitTime)}</TText>
      </a>
    </TText>
  );
}

function format(date: string) {
  let dt = DateTime.fromISO(date);
  if (!dt.isValid) dt = DateTime.local();
  return dt.setZone(DateTime.local().zone).toFormat("d. M. yyyy HH:mm:ss");
}
