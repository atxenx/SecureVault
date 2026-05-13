# SecureVault: Video Presentation Script (Max 8 Minutes)

*Note for students: Divide the speaking parts among your 3 group members. Practice timing to ensure it stays under 8 minutes. You can record your screen showing the web application while speaking.*

---

## Part 1: Introduction & Problem Statement (Student 1)
**(Estimated time: 1.5 minutes)**

**[Screen: Show the SecureVault Login/Register screen]**
"Hello everyone. Today our group is presenting 'SecureVault', a cryptographically secure password manager. 

The core problem we are addressing is poor password hygiene. In today's digital landscape, users have dozens of accounts, leading to weak passwords and credential reuse. If one website is breached, all reused accounts are compromised. 

Our objective was to build a system that not only securely stores passwords but actively helps users improve their security posture. SecureVault provides a highly useful solution by combining military-grade encryption with a real-time security dashboard."

## Part 2: Security Dashboard & Features Demo (Student 2)
**(Estimated time: 2.5 minutes)**

**[Screen: Log into the application and show the Security Dashboard]**
"Let's look at the system in action. This is our Novelty feature: The Security Dashboard. 

Unlike basic password managers, SecureVault analyzes the user's vault in real-time. Here you can see the 'Vault Security Score' which evaluates the strength of all stored passwords. 

**[Screen: Point out the stats cards]**
Notice these warning cards. The system actively detects if the user has 'Weak Passwords' or 'Reused Passwords'. For example, if a user uses the same password for Netflix and Facebook, it highlights it here as a 'Stuffing risk'. 

**[Screen: Show adding a new credential and the password strength meter]**
When adding a new credential, we built a real-time password strength meter that analyzes entropy, ensuring users create strong passwords from the start.

## Part 3: Access Control & Cryptography (Student 3)
**(Estimated time: 3 minutes)**

**[Screen: Show the Architecture Diagram or just leave it on the Dashboard]**
"Now, let's talk about the technical challenge: the underlying security. A significant part of this project concerns cryptography and key management. 

For Access Control:
- **Subjects** are authenticated users.
- **Objects** are the credentials.
- We achieve **Confidentiality and Integrity** using Authenticated Encryption (AES-GCM).

But our main focus was on **Key Management**. We implemented a Hybrid Encryption model.
1. When a user registers, their Master Password is run through **PBKDF2 with 100,000 iterations** to derive a 256-bit Vault Key. 
2. We then generate an **RSA-2048 keypair**.
3. The RSA Private Key is encrypted using the Vault Key.
4. When a credential is saved, it is encrypted with a random AES key, and that AES key is wrapped—or encrypted—using the user's RSA Public Key.

This means the database only stores ciphertext. Even if our servers are fully compromised, the attacker gets nothing because the decryption key requires the user's master password, which is never stored."

## Part 4: Conclusion (Student 1)
**(Estimated time: 1 minute)**

"In conclusion, SecureVault successfully demonstrates advanced cryptographic concepts like PBKDF2 key derivation, RSA Key Wrapping, and AES-GCM authenticated encryption. By providing a secure, zero-knowledge architecture paired with an intuitive Security Dashboard, we've built a practical and highly secure solution to modern credential management. 

Thank you for watching our presentation."
