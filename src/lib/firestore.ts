import { Firestore } from "@google-cloud/firestore";

declare const FIREBASE_SERVICE_KEY: string | undefined;
const credentials = parseCredentials(
  (typeof FIREBASE_SERVICE_KEY === "string" ? FIREBASE_SERVICE_KEY : "") ||
    process.env.FIREBASE_SERVICE_KEY ||
    "{}",
);
export const firestore = new Firestore({
  credentials,
  projectId: credentials.project_id,
});

// this is here because now env pull performs weird mangling which I need to undo
function parseCredentials(creds: string) {
  creds = creds.replace(/\n/g, "\\n");
  return JSON.parse(creds);
}
