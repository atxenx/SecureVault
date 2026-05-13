# SecureVault

A complete university-level cybersecurity mini project demonstrating modern cryptographic principles, hybrid encryption, and secure access control.

## Overview
SecureVault is a cryptographically secure password manager. It is designed to evaluate and demonstrate:
- Confidentiality (AES-GCM encryption)
- Authentication (bcrypt, JWT)
- Integrity (AES-GCM AEAD tags)
- Access Control (Discretionary Access Control)
- Key Management (PBKDF2, RSA-OAEP key wrapping)

## Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Python, Flask, Flask-SQLAlchemy
- **Security**: PyCryptodome (AES/RSA/PBKDF2), bcrypt, PyJWT

## Setup Instructions

### The Easy Way (One-Click Start)
The project includes a convenient bash script that automatically installs dependencies and starts both the backend and frontend simultaneously.

```bash
# Make sure the script is executable (first time only)
chmod +x start.sh

# Run the project
./start.sh
```
- **Backend API:** runs on http://localhost:5001
- **Frontend UI:** runs on http://localhost:5173
- *To stop both servers, simply press `Ctrl+C` in the terminal.*

---

### Manual Setup (Optional)
If you prefer to start the servers separately:

**1. Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure
- `/backend`: Flask API, Models, and Cryptography Utilities.
- `/frontend`: React Dashboard, Login, and API interface.
- `/docs`: Contains the University Report and Presentation guide.

## Key Cryptographic Flow
1. **PBKDF2**: Master Password is used to derive a `VaultKey`.
2. **RSA**: Each user gets a 2048-bit RSA keypair. The Private Key is encrypted with the `VaultKey`.
3. **AES-GCM**: Each credential is encrypted with a randomly generated 256-bit AES `CredKey`.
4. **Hybrid Security**: The `CredKey` is encrypted with the User's RSA Public Key and stored in the database.
