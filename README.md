# ⚙️ EzBotz Backend API

This is the backend service for **EzBotz**, a SaaS platform that automates Discord bot creation and management using a modular system and coin-based usage model.

---

## 🚀 Features

Soon 
---

## 📦 Tech Stack

- **Bun**
- **Hono** 
- **Prisma** (ORM)
- **PostgreSQL** 
- **Zod** (validation)
- **Session handling**
- **Crypto** (for token encryption)

---

## 🔐 Generate Encryption Key

Run the following command to generate a secure 64-byte encryption key (used for encrypting Discord bot tokens):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
