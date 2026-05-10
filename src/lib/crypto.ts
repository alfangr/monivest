import _sodium from "libsodium-wrappers";
import { argon2id } from "@noble/hashes/argon2.js";
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from "bip39";

let sodium: typeof _sodium;

async function initSodium() {
  if (!sodium) {
    await _sodium.ready;
    sodium = _sodium;
  }
  return sodium;
}

export async function generateSalt(): Promise<string> {
  const sodium = await initSodium();
  const salt = sodium.randombytes_buf(16);
  return sodium.to_base64(salt, sodium.base64_variants.ORIGINAL);
}

export async function deriveKey(password: string, salt: string): Promise<Uint8Array> {
  const sodium = await initSodium();
  const saltBytes = sodium.from_base64(salt, sodium.base64_variants.ORIGINAL);
  
  const keyBytes = argon2id(password, saltBytes, {
    t: 3,
    m: 65536,
    p: 4,
    dkLen: 32,
    maxmem: 2 ** 32 - 1,
  });
  
  return keyBytes;
}

export async function encrypt(data: string, key: Uint8Array): Promise<string> {
  const sodium = await initSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(data, nonce, key);
  
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  
  return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
}

export async function decrypt(ciphertext: string, key: Uint8Array): Promise<string> {
  const sodium = await initSodium();
  
  if (!ciphertext || typeof ciphertext !== "string") {
    throw new Error("Ciphertext tidak valid");
  }
  
  try {
    const combined = sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL);
    
    if (combined.length < sodium.crypto_secretbox_NONCEBYTES) {
      throw new Error("Ciphertext terlalu pendek");
    }
    
    const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
    const ciphertextBytes = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
    
    const plaintext = sodium.crypto_secretbox_open_easy(ciphertextBytes, nonce, key);
    return sodium.to_string(plaintext);
  } catch {
    throw new Error("Gagal decrypt data, kemungkinan kunci salah atau data corrupt");
  }
}

export function generateRecoveryKey(): string {
  return generateMnemonic(256);
}

export async function recoveryKeyToKey(recoveryKey: string): Promise<Uint8Array> {
  if (!validateMnemonic(recoveryKey)) {
    throw new Error("Recovery key tidak valid");
  }
  
  const seed = await mnemonicToSeed(recoveryKey);
  return seed.slice(0, 32);
}

export function encryptNumber(num: number, key: Uint8Array): Promise<string> {
  return encrypt(num.toString(), key);
}

export async function decryptNumber(ciphertext: string | number, key: Uint8Array): Promise<number> {
  if (typeof ciphertext === "number") {
    return ciphertext;
  }
  
  try {
    const plaintext = await decrypt(ciphertext, key);
    return parseFloat(plaintext);
  } catch {
    if (!isNaN(parseFloat(ciphertext))) {
      return parseFloat(ciphertext);
    }
    throw new Error("Gagal decrypt number");
  }
}
