// @ts-expect-error
import { getTokenFromGCPServiceAccount } from "@sagi.io/workers-jwt";

declare const FIREBASE_SERVICE_KEY: string | undefined;
const serviceAccountJSON = JSON.parse(FIREBASE_SERVICE_KEY || "{}");

export async function getAccessToken() {
  const jwtToken = await getTokenFromGCPServiceAccount({
    serviceAccountJSON,
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

const getHeaders = (() => {
  let token: ReturnType<typeof getAccessToken>;
  return async () => {
    if (!token) token = getAccessToken();
    return { Authorization: `Bearer ${(await token).access_token}` };
  };
})();

async function doFetch(path: string, options?: Parameters<typeof fetch>[1]) {
  return fetch(
    `https://firestore.googleapis.com/v1beta1/projects/${serviceAccountJSON.project_id}/databases/(default)/documents` +
      path,
    {
      ...options,
      headers: {
        ...options?.headers,
        ...(await getHeaders()),
      },
    },
  );
}

export async function runQuery(collectionId: string, where: any) {
  return doFetch(`:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where,
      },
    }),
  });
}
