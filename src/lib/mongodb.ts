import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';

function getMongoURI(): string | undefined {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/MONGODB_URI=(.*)/);
      if (match) {
        return match[1].trim();
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoCachedUri: string | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = getMongoURI();
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  // In development, reuse promise if URI hasn't changed
  if (global._mongoClientPromise && global._mongoCachedUri === uri) {
    try {
      const client = await global._mongoClientPromise;
      return client;
    } catch {
      // If previous promise rejected, reset and retry below
      global._mongoClientPromise = undefined;
    }
  }

  const client = new MongoClient(uri, options);
  const promise = client.connect();

  if (process.env.NODE_ENV === 'development') {
    global._mongoClientPromise = promise;
    global._mongoCachedUri = uri;
  }

  return promise;
}

// Proxy object or thenable to remain 100% backward compatible with `await clientPromise`
const clientPromise = {
  then<TResult1 = MongoClient, TResult2 = never>(
    onfulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return getMongoClient().then(onfulfilled, onrejected);
  },
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<MongoClient | TResult> {
    return getMongoClient().catch(onrejected);
  }
} as unknown as Promise<MongoClient>;

export default clientPromise;
