# SecureVault: 8-Minute Presentation Flow

## Slide 1: Title Slide (0:00 - 0:30)
- **Title**: SecureVault - Cryptographically Secure Password Manager
- **Subtitle**: Protecting Digital Identities with Hybrid Encryption
- **Talking Points**: Introduce yourself. State the project goal: to solve the password reuse problem by building a vault secured by military-grade cryptography.

## Slide 2: The Core Problem (0:30 - 1:30)
- **Visuals**: Diagram of Credential Stuffing / Domino Effect.
- **Talking Points**: 
  - Humans can't remember 50+ strong passwords.
  - We reuse passwords. When one site is breached, attackers use scripts to break into our banking, email, and social accounts.
  - **Keywords**: Credential Stuffing, Entropy, Data Breach.

## Slide 3: The SecureVault Solution (1:30 - 2:30)
- **Visuals**: High-level Architecture (Frontend -> Backend API -> Encrypted DB).
- **Talking Points**: 
  - We built a centralized vault.
  - You only remember ONE Master Password.
  - Everything is encrypted. Even as the database administrator, we cannot see your passwords.
  - **Keywords**: Zero-Knowledge, Confidentiality, Integrity.

## Slide 4: Cryptography Deep Dive (2:30 - 4:00) *Most Important Slide*
- **Visuals**: Diagram showing PBKDF2 -> AES -> RSA flow.
- **Talking Points**:
  - *How do we encrypt?* We use a **Hybrid Encryption Model**.
  - **Key Derivation**: We pass your Master Password through `PBKDF2` (100,000 iterations) to derive a 256-bit AES Vault Key.
  - **Symmetric (AES-GCM)**: Every credential gets a unique AES key. Why? AES is incredibly fast for bulk data.
  - **Asymmetric (RSA-OAEP)**: We encrypt that unique AES key using your RSA Public Key.
  - **Keywords**: PBKDF2, AES-GCM (Authenticated Encryption), RSA-OAEP, Hybrid Encryption.

## Slide 5: Access Control & Key Management (4:00 - 5:00)
- **Visuals**: JWT Authentication flow and User Isolation.
- **Talking Points**:
  - **Access Control**: Strict Discretionary Access Control (DAC). JWT tokens verify identity. Users can only fetch objects where `owner_id` matches their verified token.
  - **Key Management**: Keys are generated ephemerally. The Master Password is never stored on disk. If you lose your Master Password, your vault is mathematically impossible to recover.
  - **Keywords**: Discretionary Access Control (DAC), Ephemeral Keys, JWT.

## Slide 6: LIVE DEMO (5:00 - 7:00)
- **Action 1**: Register a new user. Show that the backend is generating RSA keys.
- **Action 2**: Login. Show the dark-mode, responsive UI.
- **Action 3**: Add a credential. Use the "Generate Strong Password" feature.
- **Action 4**: Show the SQLite Database (optional via DB browser or screenshot) to prove that the database only contains base64/hex ciphertexts, not plaintext.
- **Action 5**: Click "Reveal Password" in the UI to show seamless decryption.

## Slide 7: Evaluation & Limitations (7:00 - 7:30)
- **Talking Points**:
  - The system successfully defends against database leaks.
  - **Limitation**: Currently, crypto operations happen on the backend. True zero-knowledge would push this to the browser using WebCrypto API.

## Slide 8: Conclusion & Q&A (7:30 - 8:00)
- **Talking Points**:
  - SecureVault demonstrates how modern primitives (AES, RSA, PBKDF2) can be combined to build a highly secure, practical application.
  - Thank the audience and open the floor for questions.
