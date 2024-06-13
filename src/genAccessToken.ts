import { randomUUID } from "crypto";

import { generateAccessToken } from "./utils/api/auth";
import { env } from "./utils/env";

export async function exec() {
  const userId = randomUUID();
  console.log(
    `Bearer ${generateAccessToken({ userId }, env.accessTokenSecret)}`,
  );
}
