import localForage from "localforage";
import { useEffect, useState } from "react";
import { jsonGet } from "store/fetchers";

const storage = localForage.createInstance({ name: "changelog" });

type Translated<T> = { cz: T; en: T };

const loadChangelog = (() => {
  async function doFetch() {
    const res = await jsonGet<{
      data: { name: string; tagName: string; body: string }[];
    }>("/api/releases");
    if (!res.success) {
      console.log(res);
      throw new Error("Failed to load data");
    }
    return res.body.data
      .map(
        (
          item,
        ): Translated<{ title: string; tagName: string; body: string }> => {
          const titles = item.name.split("/").map((i) => i.trim());
          const base = { tagName: item.tagName };
          return {
            en: {
              ...base,
              title: titles.length > 1 ? titles[0] : item.name,
              tagName: item.tagName,
              body: parseBodyLanguage(item.body, "English"),
            },
            cz: {
              ...base,
              title: titles.length > 1 ? titles[1] : item.name,
              body: parseBodyLanguage(item.body, "Česky"),
            },
          };
        },
      )
      .sort((a, b) => b.en.tagName.localeCompare(a.en.tagName));
  }
  let promise: ReturnType<typeof doFetch> | null = null;
  return () => {
    if (!promise) {
      promise = pfinally(doFetch(), () => {
        promise = null;
      });
    }
    return promise;
  };
})();

function parseBodyLanguage(body: string, language: string) {
  const index = body.indexOf("## " + language);
  if (index < 0) return body;
  body = body.substring(index + 3 + language.length).trimStart();
  const indexEnd = body.indexOf("\n## ");
  if (indexEnd >= 0) {
    body = body.substring(0, indexEnd);
  }
  return body;
}

function pfinally<T>(promise: Promise<T>, handler: () => void): Promise<T> {
  return promise.then(
    (val) => {
      handler();
      return val;
    },
    (err) => {
      handler();
      throw err;
    },
  );
}

type DePromise<T extends Promise<any>> = T extends Promise<infer V> ? V : never;
export function useChangelog() {
  const [data, setData] = useState<
    | { status: "data"; data: DePromise<ReturnType<typeof loadChangelog>> }
    | { status: "initializing" }
    | { status: "loading" }
    | { status: "error" }
  >({ status: "initializing" });
  useEffect(() => {
    let ended = false;
    loadChangelog().then(
      (val) => {
        storage.setItem("changelog", val);
        if (!ended) setData({ status: "data", data: val });
      },
      (err) => console.error(err),
    );
    storage.getItem("changelog", (err, value: any) => {
      if (value) {
        setData((prev) => {
          const s = prev.status;
          if (s === "initializing" || s === "error" || s === "loading")
            return { status: "data", data: value };
          return prev;
        });
      } else {
        setData((d) =>
          d.status === "initializing" ? { status: "loading" } : d,
        );
      }
    });
    return () => {
      ended = true;
    };
  }, []);
  return data;
}
