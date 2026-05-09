import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
export const client = new MongoClient(uri);

export async function getDb() {
  await client.connect();
  return client.db("predictive_alpha_auth");
}
