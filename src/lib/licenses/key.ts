import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
export function generateLicenseKey(chunks = 4, len = 5) {
  const bytes = crypto.randomBytes(chunks * len);
  let i = 0;
  const parts: string[] = [];
  for (let c = 0; c < chunks; c++) {
    let s = "";
    for (let j = 0; j < len; j++) s += ALPHABET[bytes[i++] % ALPHABET.length];
    parts.push(s);
  }
  return `SK-${parts.join("-")}`;
}
