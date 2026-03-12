import { Client, Account, Databases, Storage, ID } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

let client = null;
let account = null;
let databases = null;
let storage = null;

if (endpoint && projectId && typeof window !== "undefined") {
  client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

  account = new Account(client);
  databases = new Databases(client);
  storage = new Storage(client);
}

export { client, account, databases, storage, ID };