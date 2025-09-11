// Simple encryption for localStorage data
// Uses browser's built-in SubtleCrypto API for client-side encryption

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

// Derive a key from a password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    importedKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Get or generate encryption key
function getEncryptionPassword(): string {
  // Use a combination of factors for the encryption password
  // This provides basic protection but is not foolproof
  const factors = [
    window.location.hostname,
    navigator.userAgent.slice(0, 50),
    'mobilephlebotomy-storage-v1'
  ];
  return factors.join('-');
}

// Encrypt data
export async function encryptData(data: any): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for environments without SubtleCrypto
    return JSON.stringify(data);
  }
  
  try {
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive key
    const password = getEncryptionPassword();
    const key = await deriveKey(password, salt);
    
    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      plaintext
    );
    
    // Combine salt, iv, and ciphertext
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to unencrypted storage
    return JSON.stringify(data);
  }
}

// Decrypt data
export async function decryptData(encryptedData: string): Promise<any> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for environments without SubtleCrypto
    try {
      return JSON.parse(encryptedData);
    } catch {
      return null;
    }
  }
  
  try {
    // Check if data is actually encrypted (base64)
    if (!encryptedData.match(/^[A-Za-z0-9+/]+=*$/)) {
      // Not encrypted, try to parse as JSON
      return JSON.parse(encryptedData);
    }
    
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
    
    // Derive key
    const password = getEncryptionPassword();
    const key = await deriveKey(password, salt);
    
    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );
    
    // Convert to string and parse JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(plaintext);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Try parsing as unencrypted JSON
    try {
      return JSON.parse(encryptedData);
    } catch {
      return null;
    }
  }
}

// Secure storage wrapper
export const secureStorage = {
  async setItem(key: string, value: any): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const encrypted = await encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      // Fallback to regular storage
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  
  async getItem(key: string): Promise<any> {
    if (typeof window === 'undefined') return null;
    
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      return await decryptData(encrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      // Try to get as regular JSON
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    }
  },
  
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
};