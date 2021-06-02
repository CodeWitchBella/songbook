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

const base = `projects/${serviceAccountJSON.project_id}/databases/(default)/documents`;
async function doFetch(path: string, options?: Parameters<typeof fetch>[1]) {
  return fetch(`https://firestore.googleapis.com/v1/${base}` + path, {
    ...options,
    headers: {
      ...options?.headers,
      ...(await getHeaders()),
    },
  });
}
function denestValue(v: any): any {
  const [kk, vv] = Object.entries(v as any)[0];
  return kk === "mapValue"
    ? denest(vv)
    : kk === "arrayValue"
    ? (vv as any).values.map(denestValue)
    : vv;
}
function denest(doc: any): any {
  return Object.fromEntries(
    Object.entries(doc.fields).map(([k, v]) => [k, denestValue(v)]),
  );
}

function snap(doc: { name: string; fields: any }) {
  let cache: { [key: string]: any };
  const ret = {
    data: () => {
      if (!cache) cache = denest(doc);
      return cache;
    },
    get: (key: string) => ret.data()[key],
    id: doc.name.replace(/^.*\/documents\/[^/]+\//, ""),
    ref: firestoreDoc(doc.name.replace(/^.*\/documents\//, "")),
  };
  return ret;
}

export async function runQuery(collectionId: string, where: any) {
  const res = await doFetch(`:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where,
      },
    }),
  });
  const json: { document: { name: string; fields: any } }[] = await res.json();
  const mapped = json.map(doc => snap(doc.document));
  return mapped;
}

export async function queryFieldEquals(
  collectionId: string,
  field: string,
  value: string,
) {
  return runQuery(collectionId, {
    fieldFilter: {
      field: { fieldPath: field },
      op: "EQUAL",
      value: { stringValue: value },
    },
  });
}

export function firestoreDoc(id: string) {
  return {
    id,
    get: async () => {
      const response = await doFetch("/" + id);
      if (!response.ok) return null;
      return snap(await response.json());
    },
    set: async (values: any, { merge }: { merge: boolean }) => {
      const params = new URLSearchParams();
      if (merge) {
        for (const key of Object.keys(values)) params.append("updateMask", key);
      }
      const paramsString = params.toString();
      const response = await doFetch(
        "/" + id + (paramsString ? "?" + paramsString : ""),
        {
          method: "PATCH",
          body: JSON.stringify({
            name: base + "/" + id,
            fields: Object.fromEntries(
              Object.entries(values).map(([k, v]) => {
                const value =
                  typeof v === "string"
                    ? { stringValue: v }
                    : Number.isInteger(v)
                    ? { integerValue: v }
                    : typeof v === "number"
                    ? { doubleValue: v }
                    : typeof v === "boolean"
                    ? { booleanValue: v }
                    : null;
                if (!value) throw new Error("Cannot discern value type");
                return [k, value];
              }),
            ),
          }),
        },
      );
      if (!response.ok) {
        console.error(await response.text());
        throw new Error("Fail");
      }
    },
    delete: async () => {
      await doFetch("/" + id, { method: "DELETE" });
    },
  };
}

export async function getAll(docs: readonly { id: string }[]) {
  const response = await doFetch(":batchGet", {
    method: "POST",
    body: JSON.stringify({
      documents: docs.map(doc => base + "/" + doc.id),
    }),
  });
  const json: any[] = await response.json();
  return json.map(doc => (doc.found ? snap(doc.found) : null)).filter(Boolean);
}

export function serverTimestamp() {
  return { TODO: "todo" };
}
