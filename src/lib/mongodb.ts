import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';

const FALLBACK_MONGODB_URI = "mongodb+srv://admin_jai:JaiStore2026Pass@cluster0.the3xab.mongodb.net/apple_store?retryWrites=true&w=majority";

function getMongoURI(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
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
  connectTimeoutMS: 2500,
  serverSelectionTimeoutMS: 2500,
  socketTimeoutMS: 5000,
  maxPoolSize: 10,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoCachedUri: string | undefined;
  // eslint-disable-next-line no-var
  var _mongoLastFailureTime: number | undefined;
  // eslint-disable-next-line no-var
  var _mongoLastErrorMessage: string | undefined;
}

const CIRCUIT_BREAKER_COOLDOWN_MS = 30000; // 30 seconds cooldown after a connection failure

export async function getMongoClient(): Promise<MongoClient> {
  const uri = getMongoURI();
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  // Circuit breaker: If MongoDB failed within the last 30s, fail immediately without blocking requests
  const now = Date.now();
  if (
    global._mongoLastFailureTime &&
    now - global._mongoLastFailureTime < CIRCUIT_BREAKER_COOLDOWN_MS
  ) {
    const remainingSec = Math.ceil(
      (CIRCUIT_BREAKER_COOLDOWN_MS - (now - global._mongoLastFailureTime)) / 1000
    );
    throw new Error(
      `MongoDB connection temporarily paused (${remainingSec}s remaining). Last error: ${global._mongoLastErrorMessage || 'Network / IP Access Blocked'}`
    );
  }

  // In development, reuse active promise if URI hasn't changed
  if (global._mongoClientPromise && global._mongoCachedUri === uri) {
    try {
      const client = await global._mongoClientPromise;
      return client;
    } catch {
      // If previous promise rejected, reset and retry
      global._mongoClientPromise = undefined;
    }
  }

  const client = new MongoClient(uri, options);
  const promise = client
    .connect()
    .then((connectedClient) => {
      // Clear failure record on successful connection
      global._mongoLastFailureTime = undefined;
      global._mongoLastErrorMessage = undefined;
      return connectedClient;
    })
    .catch((err) => {
      // Trigger circuit breaker so subsequent requests don't hang
      global._mongoLastFailureTime = Date.now();
      global._mongoLastErrorMessage = err?.message || 'Connection failed';
      global._mongoClientPromise = undefined;
      throw err;
    });

  if (process.env.NODE_ENV === 'development') {
    global._mongoClientPromise = promise;
    global._mongoCachedUri = uri;
  }

  return promise;
}

// Helper to safely execute a MongoDB operation with a strict timeout (e.g. 2s)
export async function withMongo<T>(
  fn: (client: MongoClient) => Promise<T>,
  fallback: T,
  timeoutMs: number = 2000
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
  },
} as unknown as Promise<MongoClient>;

export default clientPromise;
