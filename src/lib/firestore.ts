// @ts-expect-error
import { getTokenFromGCPServiceAccount } from "@sagi.io/workers-jwt";

declare const FIREBASE_SERVICE_KEY: string | undefined;

export async function getAccessToken() {
  const jwtToken = await getTokenFromGCPServiceAccount({
    serviceAccountJSON: JSON.parse(FIREBASE_SERVICE_KEY || "{}"),
    aud: "https://oauth2.googleapis.com/token",
    payloadAdditions: {
      scope: "https://www.googleapis.com/auth/datastore",
    },
  });

  const accessToken = await (
    await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken, // the JWT token generated in the previous step
      }),
    })
  ).json();

  return accessToken;
}
