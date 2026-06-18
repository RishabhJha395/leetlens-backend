import { Redis } from 'ioredis';

const rawUri = process.env.REDIS_URI || process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Auto-upgrade to rediss:// for Upstash to guarantee TLS connection
const redisUri = rawUri.includes('upstash.io') ? rawUri.replace('redis://', 'rediss://') : rawUri;

const isTLS = redisUri.startsWith('rediss://');

export const redis = new Redis(redisUri, {
  maxRetriesPerRequest: 3,
  family: 0, // Recommended for Upstash Redis to prevent DNS resolution issues
  ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}) // Ensure secure connection for Upstash
});

redis.on('connect', () => {
  console.log('Redis connected successfully.');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});
