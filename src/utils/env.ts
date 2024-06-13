import dotenv from "dotenv";

dotenv.config();

export const env = {
  isLoggerDisabled: process.env.NODE_ENV === "test",
  isDebugMode: process.env.NODE_ENV !== "production",
  buildNumber: process.env.BUILD_NUMBER,
  port: process.env.PORT ? Number(process.env.PORT) : 8080,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "nksnfoiehhrekwqnrlkje",
  redisUrl: process.env.REDIS_URL || "localhost",
  redisPassword: process.env.REDIS_PASSWD || "",
  redisDbIndex: Number(process.env.REDIS_DB_INDEX || "0"),
};
