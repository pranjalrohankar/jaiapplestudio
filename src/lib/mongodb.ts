import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';

export const FALLBACK_MONGODB_URI =
  "mongodb+srv://admin_jai:JaiStore2026Pass@cluster0.the3xab.mongodb.net/apple_store?retryWrites=true&w=majority";

function getMongoURI(): string {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    return process.env.MONGODB_URI.trim();
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/MONGODB_URI=(.*)/);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch {
    // ignore
  }
  return FALLBACK_MONGODB_URI;
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoCachedUri: string | undefined;
}

async function connectWithUri(uri: string): Promise<MongoClient> {
  const client = new MongoClient(uri, options);
  return await client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
  const primaryUri = getMongoURI();

  // Reuse active promise if available
  if (global._mongoClientPromise && global._mongoCachedUri === primaryUri) {
    try {
      const client = await global._mongoClientPromise;
      return client;
    } catch {
      global._mongoClientPromise = undefined;
    }
  }

  const promise = (async () => {
    try {
      const connectedClient = await connectWithUri(primaryUri);
      global._mongoCachedUri = primaryUri;
      return connectedClient;
    } catch (err: any) {
      // If primary URI failed with authentication error and is different from fallback URI, try fallback URI!
      const isAuthError =
        err?.message?.includes('Authentication failed') ||
        err?.message?.includes('bad auth') ||
        err?.code === 8000;

      if (isAuthError && primaryUri !== FALLBACK_MONGODB_URI) {
        console.warn('Primary MONGODB_URI had authentication failure. Retrying with default cluster URI...');
        try {
          const fallbackClient = await connectWithUri(FALLBACK_MONGODB_URI);
          global._mongoCachedUri = FALLBACK_MONGODB_URI;
          return fallbackClient;
        } catch (fallbackErr: any) {
          global._mongoClientPromise = undefined;
          throw fallbackErr;
        }
      }

      global._mongoClientPromise = undefined;
      throw err;
    }
  })();

  global._mongoClientPromise = promise;
  return promise;
}

// Helper to safely execute a MongoDB operation with a timeout (e.g. 4000ms)
export async function withMongo<T>(
  fn: (client: MongoClient) => Promise<T>,
  fallback: T,
  timeoutMs: number = 4000
): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB operation timed out')), timeoutMs)
    );

    const mongoOperation = async () => {
      const client = await getMongoClient();
      return await fn(client);
    };

    return await Promise.race([mongoOperation(), timeoutPromise]);
  } catch (error) {
    return fallback;
  }
}

// Proxy object to remain 100% backward compatible with `await clientPromise`
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
  },
} as unknown as Promise<MongoClient>;

export default clientPromise;
