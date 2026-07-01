import { SignJWT, jwtVerify } from "jose";

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || "ms-management-super-secret-key-1234567890";
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: Record<string, any>): Promise<string> {
  const secretKey = getSecretKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Token active for 7 days
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<Record<string, any> | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}
