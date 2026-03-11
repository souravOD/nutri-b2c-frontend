// lib/appwrite.ts
import { Client, Account, Databases, Teams } from "appwrite"

/**
 * Build a browser Appwrite client.
 * - Reads NEXT_PUBLIC_* envs
 * - Throws in the browser if they’re missing (so you notice)
 * - Doesn’t crash SSR if envs are missing (no hard throw on server)
 */
function makeClient() {
  const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "").trim()
  const project = (process.env.NEXT_PUBLIC_APPWRITE_PROJECT ?? "").trim()

  if (typeof window !== "undefined") {
    if (!endpoint) throw new Error("Missing NEXT_PUBLIC_APPWRITE_ENDPOINT")
    if (!project) throw new Error("Missing NEXT_PUBLIC_APPWRITE_PROJECT")
  }

  const client = new Client()
  if (endpoint) client.setEndpoint(endpoint)
  if (project) client.setProject(project)
  return client
}

const client = makeClient()

export const account = new Account(client)
export const databases = new Databases(client)
export const teams = new Teams(client)
