## API AUTH Demo

The basics of this repo is to demonstrate the basic API AUTH in Hono. The idea is ur users create an API KEY, and 
use the API KEY to authenticate users to your API. 
It stores the hashed keys on cloudlfare KV and uses hono as the api 

Usage.
- pnpm i
- pnpm dev
- npx wrangler kv:namespace create API_KEYS # Copy the id and preview_id into your wrangler.toml
- curl -X POST https://your-worker.workers.dev/api/keys/generate # to generate the api key, (replace the url with localhost instead)
- curl -H "X-API-Key: your_generated_key" https://your-worker.workers.dev/api/hello