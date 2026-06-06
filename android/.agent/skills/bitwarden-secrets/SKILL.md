---
name: Bitwarden Build Secrets Recovery
description: Extracting Play Store upload keystore, Firebase config, and passwords from Bitwarden on Windows.
---

# Secrets Recovery Workflow

Production signing keys and Firebase API configurations are never committed to version control. They are in Bitwarden under **"Varisankya"** in the **"Hora"** folder.

## Master Password Location

`android/.env.local` (gitignored):

```
BW_PASSWORD='<master password>'
```

## Non-Interactive Unlock (Windows Bash)

```bash
BW_SESSION=$(bw unlock "$(grep -oP "(?<=BW_PASSWORD=').*(?=')" android/.env.local)" --raw)
```

Verify the vault is unlocked:

```bash
bw --session "$BW_SESSION" status
```

## Creating a New Vault Item (Bitwarden CLI)

Use `bw encode` to prepare the JSON payload — direct heredoc injection fails on Windows:

```bash
ENCODED=$(python3 -c "
import json, subprocess, os
item = { 'object': 'item', 'type': 2, 'name': 'My Item', 'notes': '...' }
enc = subprocess.run(['bw', 'encode'], input=json.dumps(item), capture_output=True, text=True)
print(enc.stdout.strip())
")
bw --session "$BW_SESSION" create item "$ENCODED"
```

For **login items** (type 1), include a `login` object with `username`, `password`, `uris`.

**Important on Windows:** `bw` is at `C:\Users\Aarsh\AppData\Roaming\npm\bw.cmd`. When calling from Python `subprocess`, use the full `.cmd` path:

```python
bw = r'C:\Users\Aarsh\AppData\Roaming\npm\bw.cmd'
subprocess.run([bw, '--session', session, 'create', 'item', encoded], ...)
```

## What to Recover

| Item | Bitwarden reference |
| --- | --- |
| `app/google-services.json` | Secure note "Varisankya" → `google_services_json` field (base64) |
| `varisankya-upload-key` | Secure note "Varisankya" → keystore attachment (base64) |
| Keystore passwords | Secure note "Varisankya" → `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD` |
| Play Console API key | Secure note "Varisankya" → `play_console_key_json` field (base64) |
| Google test account | Login "varisankya148@gmail.com - App Store reviewer test account" |

## When to Run

- Build fails with `File google-services.json is missing`
- Release build fails due to missing keystore
- Starting in a fresh environment
- Need to save/update a new secret (use `bw create item` or `bw edit item`)
