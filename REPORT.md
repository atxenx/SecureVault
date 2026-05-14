# SecureVault
## Mini Project Report

**Group Members:**
1. [Student ID 1] - [Name]
2. [Student ID 2] - [Name]
3. [Student ID 3] - [Name]

---

## Abstract
Poor password hygiene, including weak and reused passwords, is a leading cause of account compromise. SecureVault is a cryptographically secure password manager designed to mitigate these risks. By leveraging a robust hybrid cryptographic architecture—combining AES-256-GCM for data confidentiality and integrity, RSA-2048-OAEP for key wrapping, and PBKDF2 for secure key derivation—SecureVault ensures that user credentials remain inaccessible even in the event of a total database breach. Furthermore, the system introduces a real-time Security Dashboard that performs local analytics to identify and alert users of reused or weak passwords, thereby actively improving their security posture.

---

## Contents
**Abstract** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . i

**Contents** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . i

**List of Figures** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ii
1 System Context Diagram . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
2 System Component Architecture . . . . . . . . . . . . . . . . . . . . . . 4

**1 Project Concept** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
1.1 Project summary . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
1.2 Typical Usage . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
1.3 Main Challenges . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2

**2 Project requirements** . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
2.1 System description . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
2.2 Computational tasks . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
2.3 Use cases and tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4

**3 Algorithm design and Implementation** . . . . . . . . . . . . . . . 5
3.1 Algorithm design . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
3.2 Implementation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5

**Appendix A Computing Password Entropy** . . . . . . . . . . . 6

---


# Chapter 1: Project Concept
SecureVault is a software system for securing user credentials. It provides a highly secure password management facility combined with a real-time security posture dashboard to prevent password reuse and weak passwords.

## 1.1 Project summary
The project implements a modern hybrid cryptographic architecture.

**Cryptographic requirements:**
*   **Implemented RSA algorithms:**
    *   **Key generation:** The system generates RSA keypairs with a fixed maximal key size of 2048 bits for optimal security and performance balance. 
    *   **Encryption/decryption algorithms:**
        *   **Data:** Binary data (specifically, randomly generated 256-bit AES keys are encrypted by RSA).
        *   **Performance:** Encryption is extremely fast because RSA is strictly used for Key Encapsulation (encrypting small 32-byte AES keys), avoiding the severe performance bottlenecks of encrypting large payloads with RSA.
*   **Used symmetric encryption algorithms:** 
    *   Yes, **AES-256 in GCM mode** (Galois/Counter Mode). GCM provides both confidentiality and data authenticity (AEAD).
*   **Used hash functions:** 
    *   Yes, **PBKDF2 with HMAC-SHA256** (100,000 iterations) is used for secure Key Derivation from the Master Password.
    *   **Bcrypt** is used for secure authentication hashing.

**Application requirements:**
SecureVault uses the implemented RSA-2048 and AES-256-GCM algorithms from the `PyCryptodome` library to provide two core security services:
*   **Authentication:** Verifying the user via `bcrypt` hashing and stateless JSON Web Tokens (JWT).
*   **Confidentiality & Integrity:** Ensuring that no one (not even the database administrator) can successfully decrypt the stored credentials without the user's Master Password. AES-GCM tags guarantee the data has not been maliciously tampered with.

## 1.2 Typical Usage
In a typical scenario, a user registers for an account using a strong Master Password. SecureVault automatically provisions their cryptographic keys in the background. The user then navigates to their Vault to add website credentials (e.g., GitHub, Facebook). 

The system securely encrypts and stores these credentials. Concurrently, the **Security Dashboard** feature analyzes the stored data locally. If the user uses the password "facebook123" for both Facebook and Netflix, the dashboard actively alerts the user of a "Reused Password" vulnerability (Credential Stuffing risk) and flags weak passwords to encourage better security hygiene.

## 1.3 Main Challenges
The hardest and most time-consuming part of the project was implementing the **Hybrid Cryptographic Key-Wrapping architecture**. Ensuring that the Master Password is never stored, while simultaneously using it to derive a Vault Key that can securely decrypt an RSA Private Key—which in turn decrypts individual AES keys for each credential—required careful handling of Nonces, Ciphertexts, and Authentication Tags for the GCM mode.

---

# Chapter 2: Project requirements

## 2.1 System description
Confidentiality protection of a credential (e.g., adding a new password) follows these strict steps:

1.  **Key Unwrapping (Login):** When the user logs in, the system derives a 256-bit **Vault Key** from their Master Password using PBKDF2-HMAC-SHA256 (100k iterations). This Vault Key decrypts the user's stored **RSA Private Key**.
2.  **Session Key Generation:** When adding a new credential, the system generates a random 256-bit number to be used as the symmetric credential key (AES Key) for this specific credential only.
3.  **Data Encryption:** The system encrypts the clear-text credential payload (JSON containing website, username, password, notes) using the symmetric encryption algorithm **AES-256-GCM** with the random AES Key. This produces a Ciphertext, a Nonce, and an Auth Tag.
4.  **Key Encapsulation:** The system then encrypts the random AES Key using **RSA-OAEP** with the user's **RSA Public Key**.
5.  **Storage:** The uniquely encrypted AES Key, along with the AES-GCM Ciphertext, Nonce, and Tag, are appended to the database.
6.  **Decryption (Read):** To view the password, the receiver uses their decrypted **RSA Private Key** to recover the AES Key, which is then used to decrypt the AES-GCM ciphertext, recovering the clear-text credential.

## 2.2 Computational tasks
1.  **Symmetric Encryption (AES-GCM)**
    *   Encrypting text strings (JSON payloads) into binary ciphertexts with Nonces and MAC Tags.
2.  **Asymmetric Encryption (RSA-2048)**
    *   Key pair generation (Prime number generation handled by PyCryptodome).
    *   Encrypting binary strings (256-bit AES keys) via RSA-OAEP.
3.  **Key Derivation Function (PBKDF2)**
    *   Stretching the Master Password into a cryptographically secure 256-bit key using 100,000 iterations of SHA-256.
4.  **Password Entropy Analysis**
    *   Computing password strength (entropy) by evaluating character set sizes and password length.

## 2.3 Use cases and tests
*   **Use Case 1 (Registration):** User registers. System verifies keys are successfully generated and the RSA Private Key is securely encrypted by the Vault Key before saving to the database.
*   **Use Case 2 (Confidentiality Test):** User adds a credential. Database administrator attempts to read the database. Result: Administrator only sees RSA-encrypted keys and AES-GCM ciphertexts; data is unreadable.
*   **Use Case 3 (Security Analytics):** User adds identical passwords for two different services. The Security Dashboard successfully detects the repetition and increments the "Reused Passwords" warning counter.

---

# Chapter 3: Algorithm design and Implementation

## 3.1 Algorithm design
For the core computational tasks, we relied on established, unbroken cryptographic standards rather than designing custom encryption algorithms (which is strongly discouraged in security engineering). 
*   **Data Encryption:** We utilize **AES in Galois/Counter Mode (GCM)**. GCM is an authenticated encryption algorithm designed to provide both data authenticity (integrity) and confidentiality.
*   **Key Wrapping:** We utilize **RSA with Optimal Asymmetric Encryption Padding (OAEP)**. OAEP adds an element of randomness, ensuring that encrypting the same AES key twice yields different ciphertexts, defending against deterministic attacks.

## 3.2 Implementation
We implemented the presented algorithms using Python's `PyCryptodome` library in our backend service. Below are code snippets demonstrating our implementation:

**1. PBKDF2 Vault Key Derivation:**
```python
from Crypto.Protocol.KDF import PBKDF2

def derive_vault_key(password: str, salt: bytes) -> bytes:
    # Derives a 256-bit AES key (32 bytes) from the master password
    return PBKDF2(password, salt, dkLen=32, count=100000)
```

**2. AES-256-GCM Encryption:**
```python
from Crypto.Cipher import AES
import base64

def aes_gcm_encrypt(key: bytes, plaintext: bytes) -> dict:
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext)
    return {
        'nonce': base64.b64encode(cipher.nonce).decode('utf-8'),
        'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
        'tag': base64.b64encode(tag).decode('utf-8')
    }
```

**3. RSA-OAEP Key Wrapping (Encrypting the AES Key):**
```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP

def rsa_encrypt(public_key_pem: bytes, aes_key: bytes) -> bytes:
    rsa_key = RSA.import_key(public_key_pem)
    cipher_rsa = PKCS1_OAEP.new(rsa_key)
    # Encrypt the 256-bit AES session key using RSA
    return cipher_rsa.encrypt(aes_key)
```

---

# Appendix A: Computing Password Entropy

The following Javascript implementation demonstrates how SecureVault locally calculates password entropy (in bits) and estimates the time required to crack the password based on an attacker computing 10 billion guesses per second. This algorithm powers the real-time Security Dashboard.

```javascript
// Purpose: To compute password entropy and estimate crack time efficiently
// where: password is a string
// Example: entropyBits("P@ssword123") returns ~65.6 bits

function entropyBits(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  
  if (pool === 0) return 0;
  
  // Calculate entropy: E = L * log2(R)
  // L = password length, R = pool size
  return Math.log2(pool) * password.length;
}

function crackTimeLabel(entropy) {
  // Total possible combinations based on calculated entropy
  const guesses = Math.pow(2, entropy);
  
  // Assume a modern cracking rig capable of 10 Billion guesses/sec
  const gps = 10000000000; 
  const seconds = guesses / gps;
  
  if (seconds < 1)          return 'Instantly';
  if (seconds < 60)         return `${Math.round(seconds)} seconds`;
  if (seconds < 3600)       return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400)      return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000)    return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000)   return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
  
  return 'Centuries';
}

// tests:
// console.log("Entropy for 'test':", entropyBits("test"));
// console.log("Crack time for 'test':", crackTimeLabel(entropyBits("test")));
```
