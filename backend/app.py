import os
import json
import base64
import datetime
import bcrypt
import jwt
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Credential, ActivityLog
from crypto_utils import CryptoService
from Crypto.Random import get_random_bytes

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///securevault.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-server-key-change-in-prod'

db.init_app(app)

# ---------------------------------------------------------------------------
# Key helpers
# ---------------------------------------------------------------------------
def encrypt_vault_key_for_jwt(vault_key: bytes) -> dict:
    """Wrap VaultKey with a server-side AES key before embedding in JWT."""
    server_key = app.config['SECRET_KEY'].encode('utf-8').ljust(32, b'\0')[:32]
    return CryptoService.aes_gcm_encrypt(server_key, vault_key)

def decrypt_vault_key_from_jwt(encrypted_data: dict) -> bytes:
    server_key = app.config['SECRET_KEY'].encode('utf-8').ljust(32, b'\0')[:32]
    return CryptoService.aes_gcm_decrypt(server_key, encrypted_data)

def log_activity(user_id, action, details=""):
    try:
        entry = ActivityLog(user_id=user_id, action=action, details=details,
                            ip_address=request.remote_addr)
        db.session.add(entry)
        db.session.commit()
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Auth middleware
# ---------------------------------------------------------------------------
def token_required(f):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise Exception("User not found")
            vault_key = decrypt_vault_key_from_jwt(data['enc_vault_key'])
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
        return f(current_user, vault_key, *args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User already exists'}), 400

    # 1. Hash master password with bcrypt (authentication)
    salt_bcrypt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt_bcrypt).decode('utf-8')

    # 2. Derive VaultKey via PBKDF2 (100k iterations) — key management
    salt_pbkdf2 = get_random_bytes(16)
    vault_key = CryptoService.derive_vault_key(password.encode('utf-8'), salt_pbkdf2)

    # 3. Generate 2048-bit RSA keypair — hybrid encryption
    private_key_pem, public_key_pem = CryptoService.generate_rsa_keypair()

    # 4. Encrypt RSA private key with VaultKey (AES-GCM) — confidentiality
    enc_priv_key_data = CryptoService.aes_gcm_encrypt(vault_key, private_key_pem)

    new_user = User(
        email=email,
        password_hash=password_hash,
        salt=base64.b64encode(salt_pbkdf2).decode('utf-8'),
        rsa_public_key=public_key_pem.decode('utf-8'),
        rsa_private_key_enc_nonce=enc_priv_key_data['nonce'],
        rsa_private_key_enc_ciphertext=enc_priv_key_data['ciphertext'],
        rsa_private_key_enc_tag=enc_priv_key_data['tag'],
        created_at=datetime.datetime.utcnow(),
        last_login=None
    )
    db.session.add(new_user)
    db.session.commit()
    log_activity(new_user.id, "REGISTER", f"New account created for {email}")
    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'message': 'Invalid credentials'}), 401

    # Derive VaultKey from master password + stored salt
    salt_pbkdf2 = base64.b64decode(user.salt)
    vault_key = CryptoService.derive_vault_key(password.encode('utf-8'), salt_pbkdf2)

    # Update last login
    user.last_login = datetime.datetime.utcnow()
    db.session.commit()

    # Embed encrypted VaultKey inside stateless JWT (1-hour expiry)
    enc_vault_key = encrypt_vault_key_for_jwt(vault_key)
    token = jwt.encode({
        'user_id': user.id,
        'enc_vault_key': enc_vault_key,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    log_activity(user.id, "LOGIN", f"Login from {request.remote_addr}")
    return jsonify({'token': token, 'email': user.email,
                    'last_login': user.last_login.isoformat() + 'Z' if user.last_login else None})


# ---------------------------------------------------------------------------
# Credential routes
# ---------------------------------------------------------------------------
@app.route('/api/credentials', methods=['POST'])
@token_required
def create_credential(current_user, vault_key):
    data = request.get_json()
    plaintext_data = json.dumps(data).encode('utf-8')

    # Recover RSA Private Key (decrypted with VaultKey in-memory)
    enc_priv_data = {
        'nonce': current_user.rsa_private_key_enc_nonce,
        'ciphertext': current_user.rsa_private_key_enc_ciphertext,
        'tag': current_user.rsa_private_key_enc_tag
    }
    private_key_pem = CryptoService.aes_gcm_decrypt(vault_key, enc_priv_data)

    # Unique 256-bit AES key per credential (key encapsulation)
    cred_key = get_random_bytes(32)

    # Encrypt credential payload with AES-GCM (AEAD — confidentiality + integrity)
    enc_data = CryptoService.aes_gcm_encrypt(cred_key, plaintext_data)

    # Encrypt the AES key with RSA-OAEP (key wrapping)
    enc_cred_key = CryptoService.rsa_encrypt(current_user.rsa_public_key.encode('utf-8'), cred_key)

    new_cred = Credential(
        owner_id=current_user.id,
        enc_cred_key=base64.b64encode(enc_cred_key).decode('utf-8'),
        data_enc_nonce=enc_data['nonce'],
        data_enc_ciphertext=enc_data['ciphertext'],
        data_enc_tag=enc_data['tag']
    )
    db.session.add(new_cred)
    db.session.commit()
    log_activity(current_user.id, "ADD_CREDENTIAL", f"Added credential for {data.get('website','?')}")
    return jsonify({'message': 'Credential stored securely', 'id': new_cred.id}), 201


@app.route('/api/credentials', methods=['GET'])
@token_required
def get_credentials(current_user, vault_key):
    enc_priv_data = {
        'nonce': current_user.rsa_private_key_enc_nonce,
        'ciphertext': current_user.rsa_private_key_enc_ciphertext,
        'tag': current_user.rsa_private_key_enc_tag
    }
    private_key_pem = CryptoService.aes_gcm_decrypt(vault_key, enc_priv_data)

    credentials = Credential.query.filter_by(owner_id=current_user.id).all()
    result = []
    for cred in credentials:
        try:
            enc_cred_key = base64.b64decode(cred.enc_cred_key)
            cred_key = CryptoService.rsa_decrypt(private_key_pem, enc_cred_key)
            enc_data = {
                'nonce': cred.data_enc_nonce,
                'ciphertext': cred.data_enc_ciphertext,
                'tag': cred.data_enc_tag
            }
            plaintext_data = CryptoService.aes_gcm_decrypt(cred_key, enc_data)
            data = json.loads(plaintext_data.decode('utf-8'))
            data['id'] = cred.id
            data['created_at'] = cred.created_at.isoformat() + 'Z'
            result.append(data)
        except Exception as e:
            print(f"Error decrypting credential {cred.id}: {e}")

    return jsonify(result), 200


@app.route('/api/credentials/<int:id>', methods=['DELETE'])
@token_required
def delete_credential(current_user, vault_key, id):
    cred = Credential.query.filter_by(id=id, owner_id=current_user.id).first()
    if not cred:
        return jsonify({'message': 'Credential not found or access denied'}), 404
    db.session.delete(cred)
    db.session.commit()
    log_activity(current_user.id, "DELETE_CREDENTIAL", f"Deleted credential id={id}")
    return jsonify({'message': 'Credential deleted'}), 200


# ---------------------------------------------------------------------------
# Security dashboard analytics
# ---------------------------------------------------------------------------
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def dashboard_stats(current_user, vault_key):
    """Return vault-wide security analytics after in-memory decryption."""
    enc_priv_data = {
        'nonce': current_user.rsa_private_key_enc_nonce,
        'ciphertext': current_user.rsa_private_key_enc_ciphertext,
        'tag': current_user.rsa_private_key_enc_tag
    }
    private_key_pem = CryptoService.aes_gcm_decrypt(vault_key, enc_priv_data)

    credentials = Credential.query.filter_by(owner_id=current_user.id).all()
    passwords = []
    for cred in credentials:
        try:
            enc_cred_key = base64.b64decode(cred.enc_cred_key)
            cred_key = CryptoService.rsa_decrypt(private_key_pem, enc_cred_key)
            enc_data = {'nonce': cred.data_enc_nonce, 'ciphertext': cred.data_enc_ciphertext, 'tag': cred.data_enc_tag}
            plaintext_data = CryptoService.aes_gcm_decrypt(cred_key, enc_data)
            data = json.loads(plaintext_data.decode('utf-8'))
            passwords.append(data.get('password', ''))
        except Exception:
            pass

    from password_analysis import analyze_passwords
    stats = analyze_passwords(passwords)
    stats['total'] = len(passwords)
    stats['last_login'] = current_user.last_login.isoformat() + 'Z' if current_user.last_login else None
    stats['encryption_algo'] = 'AES-256-GCM + RSA-2048-OAEP'
    stats['kdf'] = 'PBKDF2-SHA256 (100,000 iterations)'

    # Recent activity logs
    logs = ActivityLog.query.filter_by(user_id=current_user.id)\
                            .order_by(ActivityLog.timestamp.desc()).limit(10).all()
    stats['activity'] = [{'action': l.action, 'details': l.details,
                          'timestamp': l.timestamp.isoformat() + 'Z', 'ip': l.ip_address} for l in logs]

    return jsonify(stats), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)
