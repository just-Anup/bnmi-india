import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client();

if (typeof window !== "undefined") {
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
}

export const account = typeof window !== "undefined" ? new Account(client) : null;
export const databases = typeof window !== "undefined" ? new Databases(client) : null;
export const storage = typeof window !== "undefined" ? new Storage(client) : null;

export { ID };