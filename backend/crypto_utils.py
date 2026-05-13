import os
import base64
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Protocol.KDF import PBKDF2

class CryptoService:
    @staticmethod
    def derive_vault_key(password: str, salt: bytes) -> bytes:
        """Derive a 256-bit AES key from the master password and salt using PBKDF2."""
        return PBKDF2(password, salt, dkLen=32, count=100000)

    @staticmethod
    def generate_rsa_keypair():
        """Generate a 2048-bit RSA key pair."""
        key = RSA.generate(2048)
        private_key = key.export_key()
        public_key = key.publickey().export_key()
        return private_key, public_key

    @staticmethod
    def aes_gcm_encrypt(key: bytes, plaintext: bytes) -> dict:
        """Encrypt data using AES-GCM."""
        cipher = AES.new(key, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(plaintext)
        return {
            'nonce': base64.b64encode(cipher.nonce).decode('utf-8'),
            'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
            'tag': base64.b64encode(tag).decode('utf-8')
        }

    @staticmethod
    def aes_gcm_decrypt(key: bytes, encrypted_data: dict) -> bytes:
        """Decrypt data using AES-GCM."""
        nonce = base64.b64decode(encrypted_data['nonce'])
        ciphertext = base64.b64decode(encrypted_data['ciphertext'])
        tag = base64.b64decode(encrypted_data['tag'])
        
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        return plaintext

    @staticmethod
    def rsa_encrypt(public_key_pem: bytes, plaintext: bytes) -> bytes:
        """Encrypt data (e.g., an AES key) using RSA Public Key."""
        rsa_key = RSA.import_key(public_key_pem)
        cipher_rsa = PKCS1_OAEP.new(rsa_key)
        return cipher_rsa.encrypt(plaintext)

    @staticmethod
    def rsa_decrypt(private_key_pem: bytes, ciphertext: bytes) -> bytes:
        """Decrypt data (e.g., an AES key) using RSA Private Key."""
        rsa_key = RSA.import_key(private_key_pem)
        cipher_rsa = PKCS1_OAEP.new(rsa_key)
        return cipher_rsa.decrypt(ciphertext)
