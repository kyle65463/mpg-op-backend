import jwt from "jsonwebtoken";

/**
 * The type of the payload encapsulated in the auth token.
 */
interface AuthTokenPayload {
  userId: string;
}

const authTokenExpiresIn = 60 * 60; // 1 hour

/**
 * Generate a jwt token as auth token for authenticating a user.
 * @param userId - The id of the user of the auth token.
 * @see https://www.npmjs.com/package/jsonwebtoken
 */
export function generateAccessToken(
  payload: AuthTokenPayload,
  secret: string,
): string {
  const token = jwt.sign(payload, secret, {
    expiresIn: authTokenExpiresIn,
  });
  return token;
}

/**
 * Verify and decode the auth token to its payload.
 * @param token - The token to verify and decode;
 * @see https://www.npmjs.com/package/jsonwebtoken
 */
export function verifyAuthToken(
  token: string,
  secret: string,
): AuthTokenPayload {
  const payload = jwt.verify(token, secret);
  if (typeof payload === "string") {
    throw new Error("Bad auth token format");
  }
  return payload as AuthTokenPayload;
}
