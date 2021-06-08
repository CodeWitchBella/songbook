import { gql, UserInputError } from "apollo-server-cloudflare";

import { DateTime, Duration } from "luxon";
import { notNull } from "@codewitchbella/ts-utils";
import * as bcrypt from "bcryptjs";
import { MyContext } from "./context";
import {
  firestoreDoc,
  firestoreFieldTransforms,
  getAll,
  queryFieldEquals,
  runQuery,
  serverTimestamp,
} from "./firestore";
import { randomID, slugify } from "./utils";

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Song {
    slug: String!
    author: String!
    title: String!
    text: String!

    fontSize: Float!
    paragraphSpace: Float!
    titleSpace: Float!
    spotify: String
    pretranspose: Int!

    extraSearchable: String
    extraNonSearchable: String

    editor: User
    insertedAt: String
  }

  type SongRecord {
    data: Song!
    id: String!
    lastModified: String!
  }

  type Deleted {
    id: String!
  }

  type Query {
    hello: String
    songs(modifiedAfter: String): [SongRecord!]!
    deletedSongs(deletedAfter: String!): [String!]!
    songsBySlugs(slugs: [String!]!): [SongRecord!]!
    songsByIds(ids: [String!]!): [SongRecord!]!
    viewer: User
    collections(modifiedAfter: String): [DeletableCollectionRecord!]!
    collectionsByIds(ids: [String!]!): [CollectionRecord!]!
  }

  input UpdateSongInput {
    slug: String
    author: String
    title: String
    text: String

    fontSize: Float
    paragraphSpace: Float
    titleSpace: Float
    spotify: String
    pretranspose: Int

    extraSearchable: String
    extraNonSearchable: String
  }

  type LoginSuccess {
    user: User!
  }
  type LoginError {
    message: String!
  }
  union LoginPayload = LoginSuccess | LoginError

  type RegisterSuccess {
    user: User!
  }
  type RegisterError {
    message: String!
  }
  union RegisterPayload = RegisterSuccess | RegisterError

  type UserPicture {
    url: String!
    width: Int!
    height: Int!
  }

  type User {
    name: String!
    picture: UserPicture
    handle: String
  }

  type Collection {
    slug: String!
    name: String!
    owner: User!
    songList: [SongRecord!]!
    insertedAt: String!
  }

  type CollectionRecord {
    data: Collection!
    id: String!
    lastModified: String!
  }

  union DeletableCollectionRecord = CollectionRecord | Deleted

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  type Mutation {
    updateSong(id: String!, input: UpdateSongInput!): SongRecord
    login(email: String!, password: String!): LoginPayload!
    register(input: RegisterInput!): RegisterPayload!
    logout: String
    setHandle(handle: String!): String
    createCollection(name: String!, global: Boolean): CollectionRecord
    addToCollection(collection: String!, song: String!): String
    removeFromCollection(collection: String!, song: String!): String
  }
`;

async function songBySlug(slug: string) {
  const docs = await queryFieldEquals("songs", "slug", slug);

  if (docs.length < 1) return null;
  return docs[0];
}
async function collectionBySlug(slug: string) {
  const docs = await queryFieldEquals("collections", "slug", slug);

  if (docs.length < 1) return null;
  return docs[0];
}

async function getViewer(context: MyContext) {
  const token = (context.sessionCookie || "").trim();
  if (!token) return;
  const session = firestoreDoc("sessions/" + token);
  const data = (await session.get())?.data();
  if (!data) return;
  return { viewer: firestoreDoc(data.user), session };
}

export async function getViewerCheck(context: MyContext) {
  const viewer = await getViewer(context);
  if (!viewer) throw new UserInputError("Not logged in");
  return viewer;
}

async function whereModifiedAfter(
  path: string,
  {
    filterDeleted = true,
    modifiedAfter,
  }: { filterDeleted?: boolean; modifiedAfter: string | null },
) {
  return runQuery(path, {
    compositeFilter: {
      op: "AND",
      filters: [
        modifiedAfter
          ? {
              fieldFilter: {
                field: { fieldPath: "lastModified" },
                op: "GREATER_THAN",
                value: { timestampValue: modifiedAfter },
              },
            }
          : null,
        filterDeleted
          ? {
              fieldFilter: {
                field: { fieldPath: "deleted" },
                op: "EQUAL",
                value: { booleanValue: false },
              },
            }
          : null,
      ].filter(Boolean),
    },
  });
}

export const comparePassword = (password: string, hash: string) => {
  return new Promise<boolean>((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
};

export const hashPassword = (password: string): Promise<string> => {
  return new Promise((res, rej) =>
    bcrypt.genSalt(10, (err, salt) => {
      if (err) rej(err);
      else {
        bcrypt.hash(password, salt, (err2, hash) => {
          if (err2) rej(err2);
          else res(hash);
        });
      }
    }),
  );
};

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: (_: unknown, _2: unknown, context: MyContext) =>
      "world " + context.url,
    songs: async (
      _: {},
      { modifiedAfter }: { modifiedAfter: string | null },
    ) => {
      const docs = await whereModifiedAfter("songs", { modifiedAfter });
      return docs;
    },
    deletedSongs: async (_: {}, { deletedAfter }: { deletedAfter: string }) => {
      const docs = await whereModifiedAfter("deletedSongs", {
        filterDeleted: false,
        modifiedAfter: deletedAfter,
      });
      return docs.map(d => d.id);
    },
    collections: async (
      _: {},
      { modifiedAfter }: { modifiedAfter: string | null },
    ) => {
      const docs = await whereModifiedAfter("collections", { modifiedAfter });
      return docs;
    },
    songsByIds: async (_: {}, { ids }: { ids: string[] }) => {
      const list = await getAll(ids.map(id => "songs/" + id));
      return list.filter(Boolean);
    },
    collectionsByIds: async (_: {}, { ids }: { ids: string[] }) => {
      const list = await getAll(ids.map(id => "collections/" + id));
      return list.filter(Boolean);
    },
    songsBySlugs: async (_: {}, { slugs }: { slugs: string[] }) => {
      const songs = await Promise.all(slugs.map(songBySlug));
      return songs.filter(notNull);
    },
    viewer: async (_: {}, _2: {}, context: MyContext) => {
      const data = await getViewer(context);
      if (data) return (await data.viewer.get())?.data() ?? null;
      return null;
    },
  },
  Song: {
    editor: async (src: any) => {
      if (src.editor)
        return (await firestoreDoc(src.editor).get())?.data() ?? null;
      return null;
    },
    insertedAt: (src: any) => src.insertedAt || null,
    fontSize: (src: any) =>
      typeof src.fontSize === "number" ? src.fontSize : 1,
    paragraphSpace: (src: any) =>
      typeof src.paragraphSpace === "number" ? src.paragraphSpace : 1,
    titleSpace: (src: any) =>
      typeof src.titleSpace === "number" ? src.titleSpace : 1,
    pretranspose: (src: any) =>
      typeof src.pretranspose === "number" ? src.pretranspose : 0,
  },
  SongRecord: {
    data: (src: any) => src.data(),
    lastModified: (src: any) => src.data().lastModified,
  },
  CollectionRecord: {
    lastModified: (src: any) => src.data().lastModified,
  },
  DeletableCollectionRecord: {
    __resolveType: (src: any) =>
      src.data().deleted ? "Deleted" : "CollectionRecord",
  },
  Collection: {
    insertedAt: (src: any) => src.insertedAt || null,
    owner: async (src: any) => {
      const owner = await firestoreDoc(src.owner).get();
      return owner?.data() ?? null;
    },
    songList: async (src: any) => {
      if (src.list.length < 1) return [];
      const list = await getAll(src.list);
      return list.filter(Boolean);
    },
  },
  LoginPayload: {
    __resolveType: (src: any) => src.__typename,
  },
  RegisterPayload: {
    __resolveType: (src: any) => src.__typename,
  },
  Mutation: {
    setHandle: async (
      _: {},
      { handle }: { handle: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context);

      await viewer.set({ handle }, { merge: true });
      const collections = await queryFieldEquals(
        "collections",
        "owner",
        viewer.id,
      );
      await Promise.all(
        collections
          .filter(doc => !doc.get("global"))
          .map(doc =>
            doc.ref.set(
              {
                slug: slugify(handle) + "/" + slugify(doc.get("name") as any),
                lastModified: serverTimestamp(),
              },
              { merge: true },
            ),
          ),
      );
      return "success";
    },
    createCollection: async (
      _: {},
      {
        name: requestedName,
        global = false,
      }: { name: string; global: boolean },
      context: MyContext,
    ) => {
      const vsrc = await getViewerCheck(context);
      const viewerId = vsrc.viewer.id;
      const viewer = (await vsrc.viewer.get())?.data();
      if (!viewer || !viewerId) throw new Error("Cannot load viewer");
      if (global && !viewer.admin)
        throw new UserInputError("Only admin can create global songbooks");

      const slug =
        (global ? "" : slugify(viewer?.handle || viewer?.name) + "/") +
        slugify(requestedName);
      const existing = await queryFieldEquals("collections", "slug", slug);
      if (existing.length > 0)
        throw new Error("Collection with given name already exists");

      const doc = firestoreDoc("collections/" + (await randomID(20)));
      await doc.set(
        {
          name: requestedName,
          owner: viewerId,
          insertedAt: serverTimestamp(),
          lastModified: serverTimestamp(),
          global,
          slug,
          deleted: false,
          list: [],
        },
        { merge: false },
      );
      return doc.get();
    },
    addToCollection: async (
      _: {},
      { song, collection }: { song: string; collection: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context);
      const collectionSnap =
        (await firestoreDoc("collections/" + collection).get()) ||
        (await collectionBySlug(collection));
      if (!collectionSnap)
        throw new UserInputError("Collection does not exist");
      if (collectionSnap.get("owner") !== viewer.id)
        throw new UserInputError("Not your collection");
      const songSnap = await firestoreDoc("songs/" + song).get();
      if (!songSnap) throw new UserInputError("Song does not exist");

      await firestoreFieldTransforms("collections/" + collectionSnap.id, [
        {
          fieldPath: "list",
          appendMissingElements: {
            values: [{ stringValue: "songs/" + song }],
          },
        },
        { fieldPath: "lastModified", setToServerValue: "REQUEST_TIME" },
      ]);
      return "Success!";
    },
    removeFromCollection: async (
      _: {},
      { song, collection }: { song: string; collection: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context);
      const collectionSnap =
        (await firestoreDoc("collections/" + collection).get()) ||
        (await collectionBySlug(collection));
      if (!collectionSnap)
        throw new UserInputError("Collection does not exist");
      if (collectionSnap.get("owner") !== viewer.id)
        throw new UserInputError("Not your collection");
      const songSnap = await firestoreDoc("songs/" + song).get();
      if (!songSnap) throw new UserInputError("Song does not exist");

      await firestoreFieldTransforms("collections/" + collectionSnap.id, [
        {
          fieldPath: "list",
          removeAllFromArray: { values: [{ stringValue: "songs/" + song }] },
        },
        { fieldPath: "lastModified", setToServerValue: "REQUEST_TIME" },
      ]);

      return "Success!";
    },
    updateSong: async (_: {}, { id, input }: { input: any; id: string }) => {
      const doc = firestoreDoc("songs/" + id);
      const prev = await doc.get();
      if (!prev) throw new Error("Song does not exist");
      await doc.set(
        {
          ...Object.fromEntries(
            Object.entries(input).filter(([, v]) => v !== null),
          ),
          lastModified: serverTimestamp(),
        },
        { merge: true },
      );
      return doc.get();
    },
    async login(
      _: {},
      { email, password }: { email: string; password: string },
      context: MyContext,
    ) {
      const user = await queryFieldEquals("users", "email", email);
      const doc = user[0];
      if (!doc) {
        return {
          __typename: "LoginError",
          message: "Uživatel s daným emailem nenalezen",
        };
      }

      const passwordHash = doc.get("passwordHash");
      if (!passwordHash) {
        doc.ref.set(
          { passwordHash: await hashPassword(password) },
          { merge: true },
        );
      } else {
        if (!(await comparePassword(password, passwordHash))) {
          return { __typename: "LoginError", message: "Chybné heslo" };
        }
      }

      await createSession(context, doc.id);

      return {
        __typename: "LoginSuccess",
        user: await doc.data(),
      };
    },
    async register(
      _: {},
      { input }: { input: { name: string; email: string; password: string } },
      context: MyContext,
    ) {
      if (!input.name || !input.email || !input.password)
        return {
          __typename: "RegisterError",
          message: "Všechna pole jsou povinná",
        };
      const users = await queryFieldEquals("users", "email", input.email);
      if (users.length > 0)
        return { __typename: "RegisterError", message: "Email je již použit" };
      const id = await randomID(30);
      const doc = firestoreDoc("users/" + id);
      await doc.set(
        {
          name: input.name,
          passwordHash: await hashPassword(input.password),
          email: input.email,
          registeredAt: serverTimestamp(),
        },
        { merge: false },
      );
      await createSession(context, id);
      return {
        __typename: "RegisterSuccess",
        user: (await doc.get())?.data(),
      };
    },
    logout: async (_: {}, _2: {}, context: MyContext) => {
      const data = await getViewer(context);
      // make it expire
      context.setSessionCookie("", Duration.fromObject({ second: 1 }));
      if (data) {
        await data.session.delete();
      }
      return "Success!";
    },
  },
};

async function createSession(context: MyContext, id: string) {
  const sessionToken = await randomID(30);
  const session = firestoreDoc("sessions/" + sessionToken);
  const sessionDuration = Duration.fromObject({ months: 2 });
  await session.set(
    {
      user: "users/" + id,
      token: sessionToken,
      expires: DateTime.utc()
        .plus(sessionDuration)
        .toISO(),
    },
    { merge: false },
  );

  context.setSessionCookie(sessionToken, sessionDuration);
}

export default {
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  //tracing: true,
};
