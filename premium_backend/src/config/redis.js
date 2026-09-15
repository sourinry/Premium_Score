const Redis = require("ioredis");

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    lazyConnect: false,

    maxRetriesPerRequest: null,

    retryStrategy(times) {
      console.log(
        `🔄 Redis reconnecting... attempt ${times}`
      );

      return Math.min(
        times * 1000,
        5000
      );
    },
  }
);

redisClient.on("connect", () => {
  console.log("🔌 Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis connected");
});

redisClient.on("error", (error) => {
  console.error(
    "❌ Redis error:",
    error.message
  );
});

redisClient.on("close", () => {
  console.log("🔴 Redis connection closed");
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

module.exports = redisClient;