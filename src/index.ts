import { Hono, Next, Context } from "hono";
import { nanoid } from "nanoid";
import { createHash } from "crypto";


// defining type bindings
type Bindings = {
  API_KEYS: KVNamespace;
};

type APIKEY = {
  hashedKey: string;
  userId: string;
  createdAt: string;
  prefix: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Hash function for API keys
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

// Generate API key with prefix
function generateApiKey(): { fullKey: string; prefix: string } {
  const prefix = 'sk_live_'
  const randomPart = nanoid(32)
  return {
    fullKey: `${prefix}${randomPart}`,
    prefix
  }
}

// middleware that checks the api-key
const authenticateApiKey = async (c: Context, next: Next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return c.json({ error: "API key is required" }, 401);
  }

  // Hash the provided API key
  const hashedKey = hashApiKey(apiKey);

  // Get the stored data using the hash
  const storedData = (await c.env.API_KEYS.get(
    hashedKey,
    "json"
  )) as APIKEY | null;

  if (!storedData) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  // Add key data to context for use in routes
  c.set("apiKeyData", storedData);
  await next();
};


// Route to generate new API key

app.post("/api/keys/generate", async (c) => {
  try {
    // should fetch from the session on prod
    const userId = "user_" + nanoid(10);
    const { fullKey, prefix } = generateApiKey();
    const hashedKey = hashApiKey(fullKey);

    const keyData: APIKEY = {
      hashedKey,
      userId,
      createdAt: new Date().toISOString(),
      prefix,
    };


    // Try to store and immediately retrieve to verify
    await c.env.API_KEYS.put(hashedKey, JSON.stringify(keyData));
    const verified = await c.env.API_KEYS.get(hashedKey);
    console.log("Verification get:", verified);

    return c.json({
      apiKey: fullKey,
      hashedKey, // Temporarily add this for debugging
      message: "Store this API key securely",
    });
  } catch (error) {
    console.error("Error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Protected route example
app.get("/api/hello", authenticateApiKey, (c) => {
  const keyData = c.get("apiKeyData");
  return c.json({
    message: "Hello World!",
    userId: keyData.userId,
  });
});

// Add a debug endpoint
app.get('/api/debug/keys', async (c) => {
  // List all keys
  const keys = await c.env.API_KEYS.list()
  return c.json({ keys })
})

export default app;
