import crypto from "crypto";
export function signPayload(obj: unknown) {
  const json = JSON.stringify(obj);
  const sig = crypto.createHmac("sha256", process.env.LICENSE_SIGNING_SECRET!).update(json).digest("base64");
  return { json, sig };
}
