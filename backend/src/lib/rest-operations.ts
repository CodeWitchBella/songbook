/**
 * REST endpoints are thin wrappers over GraphQL: each operation below is
 * exposed at `/api/<name>`, takes the GraphQL variables as its JSON body,
 * and is executed against the same GraphQL schema. This keeps a single source
 * of truth for the queries while letting the frontend hit plain REST paths.
 */

const userFragment = `
  fragment user on User {
    name
    admin
    handle
    picture {
      url
      width
      height
    }
  }
`;

const songRecordFragment = `
  fragment songRecord on SongRecord {
    id
    lastModified
    data {
      slug
      author
      title
      text
      fontSize
      paragraphSpace
      titleSpace
      spotify
      pretranspose
      extraSearchable
      extraNonSearchable
      editor {
        ...user
      }
      insertedAt
    }
  }
  ${userFragment}
`;

const collectionRecordFragment = `
  fragment collectionRecord on CollectionRecord {
    id
    lastModified
    data {
      slug
      name
      owner {
        ...user
      }
      songList {
        id
      }
      insertedAt
      locked
    }
  }
  ${userFragment}
`;

export const restOperations: Record<string, string> = {
  register: `
    mutation($input: RegisterInput!) {
      register(input: $input) {
        __typename
        ... on RegisterError {
          message
        }
        ... on RegisterSuccess {
          user {
            ...user
          }
        }
      }
    }
    ${userFragment}
  `,
  songs: `
    query($modifiedAfter: String, $deletedAfter: String!, $skipDeleted: Boolean!) {
      songs(modifiedAfter: $modifiedAfter) {
        ...songRecord
      }
      viewer {
        ...user
      }
      deletedSongs(deletedAfter: $deletedAfter) @skip(if: $skipDeleted)
    }
    ${songRecordFragment}
  `,
  "update-song": `
    mutation($id: String!, $input: UpdateSongInput!) {
      updateSong(id: $id, input: $input) {
        id
      }
    }
  `,
  collections: `
    query($modifiedAfter: String) {
      collections(modifiedAfter: $modifiedAfter) {
        __typename
        ...collectionRecord
        ... on Deleted {
          id
        }
      }
    }
    ${collectionRecordFragment}
  `,
  "add-to-collection": `
    mutation($collection: String!, $song: String!) {
      addToCollection(collection: $collection, song: $song)
    }
  `,
  "remove-from-collection": `
    mutation($collection: String!, $song: String!) {
      removeFromCollection(collection: $collection, song: $song)
    }
  `,
  "create-collection": `
    mutation($name: String!) {
      createCollection(name: $name) {
        id
      }
    }
  `,
};
