import os
import sys
import base64
import bcrypt
from app import app, db, User
from crypto_utils import CryptoService
from Crypto.Random import get_random_bytes

def create_sample_user():
    email = "test@example.com"
    password = "password123"
    
    with app.app_context():
        if User.query.filter_by(email=email).first():
            print("User already exists")
            return
            
        salt_bcrypt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt_bcrypt).decode('utf-8')
        
        salt_pbkdf2 = get_random_bytes(16)
        vault_key = CryptoService.derive_vault_key(password.encode('utf-8'), salt_pbkdf2)
        
        private_key_pem, public_key_pem = CryptoService.generate_rsa_keypair()
        
        enc_priv_key_data = CryptoService.aes_gcm_encrypt(vault_key, private_key_pem)
        
        new_user = User(
            email=email,
            password_hash=password_hash,
            salt=base64.b64encode(salt_pbkdf2).decode('utf-8'),
            rsa_public_key=public_key_pem.decode('utf-8'),
            rsa_private_key_enc_nonce=enc_priv_key_data['nonce'],
            rsa_private_key_enc_ciphertext=enc_priv_key_data['ciphertext'],
            rsa_private_key_enc_tag=enc_priv_key_data['tag']
        )
        
        db.session.add(new_user)
        db.session.commit()
        print("Sample user created successfully.")

if __name__ == "__main__":
    create_sample_user()
