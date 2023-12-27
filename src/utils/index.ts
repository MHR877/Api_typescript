import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const { CRYPTO_SECRET } = process.env;

if (!CRYPTO_SECRET) {
  throw new Error("CRYPTO_SECRET is not defined in the environment variables.");
}

export const generateRandomString = () => {
  try {
    const randomBytes = crypto.randomBytes(128);
    return randomBytes.toString("base64");
  } catch (error) {
    throw new Error("Error");
  }
};

export const authenticate = (salt: string, password: string) => {
  try {
    const hmac = crypto.createHmac("sha256", [salt, password].join("/"));
    const hash = hmac.update(CRYPTO_SECRET).digest("hex");
    return hash;
  } catch (error) {
    throw new Error(`Error`);
  }
};
