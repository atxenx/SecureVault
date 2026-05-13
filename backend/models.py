from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    # Base64-encoded PBKDF2 salt — unique per user, stored in plaintext
    salt = db.Column(db.String(255), nullable=False)

    # RSA keypair: public key stored plaintext, private key encrypted with VaultKey
    rsa_public_key = db.Column(db.Text, nullable=False)
    rsa_private_key_enc_nonce = db.Column(db.String(255), nullable=False)
    rsa_private_key_enc_ciphertext = db.Column(db.Text, nullable=False)
    rsa_private_key_enc_tag = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    credentials = db.relationship('Credential', backref='owner', lazy=True,
                                  cascade='all, delete-orphan')
    activity_logs = db.relationship('ActivityLog', backref='user', lazy=True,
                                    cascade='all, delete-orphan')


class Credential(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Unique per-credential AES key, RSA-OAEP encrypted
    enc_cred_key = db.Column(db.Text, nullable=False)

    # Credential payload (website, username, password, notes) — AES-256-GCM encrypted
    data_enc_nonce = db.Column(db.String(255), nullable=False)
    data_enc_ciphertext = db.Column(db.Text, nullable=False)
    data_enc_tag = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class ActivityLog(db.Model):
    """Audit log — records all security-relevant events for a user."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)      # e.g. LOGIN, ADD_CREDENTIAL
    details = db.Column(db.String(255), default="")
    ip_address = db.Column(db.String(50), default="")
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
