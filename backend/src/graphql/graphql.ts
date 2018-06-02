import express from 'express'
import { makeExecutableSchema } from 'graphql-tools'
import fs from 'fs'
import path from 'path'
import resolvers from './resolvers'

export async function getContext(req: express.Request) {
  return { url: req.url }
}

function readGraphQLFile(src: string) {
  return fs.readFileSync(
    path.join(__dirname, '../../src/graphql', `${src}.graphql`),
    'utf-8',
  )
}

const schema = makeExecutableSchema({
  typeDefs: readGraphQLFile('schema'),
  resolvers,
})

export async function getSchema() {
  return schema
}
