# SecureVault: Cryptographically Secure Password Manager

## 1. Introduction
With the exponential growth of digital services, users are overwhelmed by the number of credentials they must manage. SecureVault is a cryptographically secure password manager designed to address the challenges of credential management. It provides a robust, zero-knowledge architecture where users can securely store and manage their sensitive credentials using industry-standard cryptography.

## 2. Problem Definition
The human brain is incapable of remembering dozens of highly complex, unique passwords. This limitation leads to poor security practices, where users either create weak passwords or reuse the same password across multiple platforms. When a single service suffers a data breach, credential stuffing attacks compromise the user's entire digital identity.

## 3. Existing Problems with Password Reuse
- **Credential Stuffing**: Attackers use automated tools to inject breached username/password pairs into other sites.
- **Domino Effect**: A breach in a low-security website can compromise a user's high-security accounts (e.g., banking or email).
- **Weak Entropy**: Human-generated passwords often rely on predictable patterns, making them susceptible to dictionary attacks.

## 4. Proposed Solution
SecureVault proposes a centralized, cryptographically secure vault where users only need to remember a single "Master Password". This Master Password acts as the foundation for a complex key-derivation and encryption process. The application automatically generates high-entropy passwords for individual services and encrypts them before they ever touch the database.

## 5. System Architecture
SecureVault implements a full-stack client-server architecture:
- **Frontend**: A React.js application featuring a modern, responsive "glassmorphism" UI built with Tailwind CSS.
- **Backend**: A RESTful Python Flask application acting as the API and cryptographic engine.
- **Database**: SQLite (scalable to PostgreSQL/MongoDB) for persistent storage.

**Data Flow**:
1. Client sends a request with the Master Password over TLS.
2. Backend authenticates and derives transient cryptographic keys.
3. Keys are used to perform encryption/decryption in memory.
4. Encrypted ciphertexts are stored in the database. 

## 6. Security Design
SecureVault is built upon the foundational principles of Information Security (CIA Triad):
- **Confidentiality**: All credential data is encrypted using AES-256-GCM. The plaintext data is never stored on disk.
- **Integrity**: AES-GCM provides Authenticated Encryption with Associated Data (AEAD), ensuring ciphertexts cannot be tampered with.
- **Authentication**: Users are authenticated using bcrypt-hashed passwords.

## 7. Cryptography Implementation
The system employs a sophisticated Hybrid Encryption model:
1. **Key Derivation (PBKDF2)**: The Master Password and a cryptographic salt are passed through PBKDF2 (100,000 iterations) to derive a 256-bit `VaultKey`.
2. **Asymmetric Cryptography (RSA)**: Upon registration, a 2048-bit RSA key pair is generated. The Public Key is stored in plaintext. The Private Key is encrypted using the `VaultKey` (AES-GCM).
3. **Symmetric Cryptography (AES-GCM)**: Each credential record is assigned a unique, randomly generated 256-bit AES key (`CredKey`). The credential data is encrypted with this `CredKey`.
4. **Key Encapsulation**: The `CredKey` is then encrypted using the user's RSA Public Key (RSA-OAEP) before being stored.

*Why symmetric for bulk data?* AES is significantly faster and computationally cheaper for encrypting large amounts of data (like website notes and passwords) compared to RSA. RSA is strictly used to securely wrap the symmetric keys.

## 8. Access Control Design
The system enforces strict Discretionary Access Control (DAC):
- **Subjects**: Authenticated Users.
- **Objects**: Encrypted Credentials.
- **Rules**: A user can only Create, Read, Update, or Delete (CRUD) objects where `owner_id == user.id`.
- **Enforcement**: Access control is enforced at the database query level and via JWT authentication middleware. Unauthorized users receive a 401/403 response.

## 9. Key Management
Effective cryptography relies heavily on secure key management:
- **Zero-Knowledge Principle**: The Master Password is never stored.
- **Ephemeral Keying**: The `VaultKey` is kept in the server's memory only for the duration of the request or temporarily encrypted within a stateless JWT.
- **Unique Initialization Vectors**: Every AES encryption operation utilizes a newly generated, cryptographically secure random nonce.

## 10. Feature Description
- **Secure Registration/Login**: Bcrypt authentication.
- **Cryptographic Vault**: AES-GCM encrypted credential storage.
- **Password Generator**: Client-side generation of cryptographically strong passwords.
- **Decryption on Demand**: Passwords remain visually masked until explicitly revealed by the user.

## 11. Screenshots
*(Placeholder for screenshots of the Dark-mode React Dashboard, Login screen, and Add Credential modal)*

## 12. Evaluation
SecureVault successfully mitigates the primary threats of credential theft. Even if the database is completely compromised (stolen), the attacker only obtains AES and RSA ciphertexts. Without the user's Master Password, decrypting the RSA Private Key—and subsequently the `CredKeys`—is computationally infeasible.

## 13. Limitations
- The current architecture relies on TLS to securely transmit the Master Password to the backend for key derivation. A pure Zero-Knowledge architecture would perform the PBKDF2 derivation and RSA encryption entirely in the browser using WebCrypto API.

## 14. Future Improvements
- Implement WebCrypto API for pure client-side encryption.
- Add Multi-Factor Authentication (MFA/TOTP).
- Implement secure credential sharing between users utilizing their respective RSA Public Keys.

## 15. Conclusion
SecureVault demonstrates a practical, rigorous application of modern cryptographic primitives. By combining PBKDF2, AES-GCM, and RSA-OAEP, the project delivers a highly secure password management solution that prevents unauthorized access while providing an intuitive, premium user experience.
