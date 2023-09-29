// @ts-expect-error
import { getTokenFromGCPServiceAccount } from "@sagi.io/workers-jwt";
import DataLoader from "dataloader";

declare const FIREBASE_SERVICE_KEY: string | undefined;
const serviceAccountJSON = JSON.parse(
  (typeof FIREBASE_SERVICE_KEY !== "undefined"
    ? FIREBASE_SERVICE_KEY
    : undefined) || "{}",
);

async function getAccessToken() {
  if (!serviceAccountJSON.project_id) throw new Error("missing FIREBASE_SERVICE_KEY")
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

  return {
    ...accessToken,
    expiresAt: Date.now() + accessToken.expires_in * 1000,
  };
}

const getHeaders = (() => {
  let tokenPromise: ReturnType<typeof getAccessToken>;
  return async () => {
    if (!tokenPromise) tokenPromise = getAccessToken();
    let token = await tokenPromise;
    if (token.expiresAt - Date.now() < 10 * 1000) {
      tokenPromise = getAccessToken();
      token = await tokenPromise;
    }
    return { Authorization: `${token.token_type} ${token.access_token}` };
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
    ? (vv as any).values?.map(denestValue) ?? []
    : vv;
}
function denest(doc: any): any {
  return Object.fromEntries(
    Object.entries(doc.fields).map(([k, v]) => [k, denestValue(v)]),
  );
}

function snap(doc: { name: string; fields: any }) {
  let cache: { [key: string]: any };
  const ret: {
    data: () => { [key: string]: any };
    get: (key: string) => any;
    id: string;
    ref: ReturnType<typeof firestoreDoc>;
  } = {
    data: () => {
      if (!cache) cache = denest(doc);
      return cache;
    },
    get: key => ret.data()[key],
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
  const json: {
    document?: { name: string; fields: any };
    [key: string]: any;
  }[] = await res.json();
  if (json.length === 1 && json[0].error) {
    console.error(JSON.stringify(json[0], null, 2));
    console.error();
    throw new Error("query failed");
  }
  const mapped = json
    .filter(doc => doc.document)
    .map(doc => snap(doc.document!));
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

export async function queryFieldEqualsSingle(
  collectionId: string,
  field: string,
  value: string,
) {
  const docs = await queryFieldEquals(collectionId, field, value);
  if (docs.length < 1) return null;
  return docs[0];
}

export const getLoader = () =>
  new DataLoader(
    async (ids: readonly string[]): Promise<any[]> => {
      const res = await getAll(ids);
      const map = new Map<string, typeof res[0]>();
      for (const item of res) {
        if (item) map.set(item.ref.id, item);
      }
      return ids.map(id => map.get(id) ?? null);
    },
    {
      batchScheduleFn: cb => {
        setTimeout(cb, 1);
      },
    },
  );
export type LoaderType = ReturnType<typeof getLoader>;

export function firestoreDoc(id: string) {
  return {
    id,
    get: (loader: LoaderType): Promise<ReturnType<typeof snap> | null> =>
      loader.load(id),
    set: async (values: any, { merge }: { merge: boolean }) => {
      const params = new URLSearchParams();
      if (merge) {
        for (const key of Object.keys(values))
          params.append("updateMask.fieldPaths", key);
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
                    : v instanceof Date
                    ? { timestampValue: v.toISOString() }
                    : Array.isArray(v) && v.length === 0
                    ? { arrayValue: { values: [] } }
                    : null;
                if (!value) {
                  console.log(v, JSON.stringify(v));
                  throw new Error("Cannot discern value type");
                }
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

type FieldTransform = {
  fieldPath: string;
} & (
  | { setToServerValue: "REQUEST_TIME" }
  | { increment: any }
  | { maximum: any }
  | { minimum: any }
  | { appendMissingElements: { values: readonly any[] } }
  | { removeAllFromArray: { values: readonly any[] } }
);

export function firestoreIdentifier(id: string) {
  return base + "/" + id;
}

export async function firestoreFieldTransforms(
  id: string,
  fieldTransforms: readonly FieldTransform[],
) {
  return firestoreBatchWrite([
    { transform: { document: firestoreIdentifier(id), fieldTransforms } },
  ]);
}

type Write =
  | {
      update: {
        name: string;
        fields: {
          [key: string]:
            | { nullValue: null }
            | { booleanValue: boolean }
            | { integerValue: string }
            | { doubleValue: number }
            | { timestampValue: string }
            | { stringValue: string }
            | { bytesValue: string }
            | { referenceValue: string };
        };
      };
    }
  | {
      transform: {
        document: string;
        fieldTransforms: readonly FieldTransform[];
      };
    };

export async function firestoreBatchWrite(writes: readonly Write[]) {
  const res = await doFetch(":batchWrite", {
    method: "POST",
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) {
    console.error(await res.text());
    throw new Error("write failed");
  }
}

export async function getAll(docs: readonly string[]) {
  const response = await doFetch(":batchGet", {
    method: "POST",
    body: JSON.stringify({
      documents: docs.map(id => base + "/" + id),
    }),
  });
  const json: any[] = await response.json();
  return json.map(doc => (doc.found ? snap(doc.found) : null));
}

export function serverTimestamp() {
  return new Date();
}
