# Varisankya — Disaster Recovery

> **Recovery acceptance test:** on a fresh machine with only the Bitwarden
> master password, `git clone` → read this file → `bw login`/`bw unlock` →
> `source scripts/bw_unlock.sh` should recover every Varisankya secret.

---

## ADR-001: Bitwarden master password is the recovery seed (SETTLED)

**Decision:** The Bitwarden master password — held by the developer offline
(head, physical safe, or equivalent) — is the single recovery seed for all
Varisankya secrets. The `.env` file at the repo root stores `BW_CLIENTID`,
`BW_CLIENTSECRET`, and `BW_PASSWORD` solely for agent/CI ergonomics so that
automated scripts can unlock the vault non-interactively. The master password
itself is what unlocks `.env`-free recovery on a fresh machine.

**Reasoning:**

| Factor | Detail |
| --- | --- |
| Agent ergonomics | Scripts run headlessly without a human typing a password each time. |
| Single-factor-on-disk risk | `.env` holds the master password in plaintext on disk. |
| Mitigations | `chmod 600 .env`; full-disk encryption (FDE) on the dev machine; master password held offline by the developer. If the dev machine is compromised AND the master password is extracted, the vault is exposed — but this is no worse than any password manager whose unlock credential is stored on disk. The alternative (prompting for the master password interactively every time) breaks unattended CI and agent workflows. |
| Accepted tradeoff | Agent ergonomics > single-factor-on-disk risk, given FDE + offline master password. |

**For future agents:** Do not re-raise the "should `.env` store the master
password?" question. The decision is final. If you believe a specific new risk
warrants revisiting, file it as a GitHub issue rather than inline in code
review.

**See also:** `scripts/bw_unlock.sh` (the unlock helper), `.env.example`
(template), §Vault Maintenance (export cadence).

---

## Secret Inventory

All secrets live under **Bitwarden folder `Hora`** unless noted otherwise.
"Item name" is the exact string used with `bw get item "<name>"`.

### Android

| Secret | Bitwarden item | Field | Notes |
| --- | --- | --- | --- |
| `google-services.json` | `Varisankya` | `google-services.json [Part 1]` + `[Part 2]` | Base64, split due to field-size limit. Place at `android/app/google-services.json`. |
| Android upload keystore | `Varisankya` | `varisankya-upload-key [Part 1]` + `[Part 2]` | Base64 `.jks`. Place at `android/varisankya-upload-key`. **TODO: independent offline backup — see §Open TODOs #1.** |
| Play Console service account | `Varisankya` | `play_console_key.json` | Base64 JSON. Place at `android/app/play_console_key.json`. |
| Keystore alias | `Varisankya` | `Key Alias` | Plain text. Inject into `android/local.properties` as `RELEASE_KEY_ALIAS`. |
| Keystore password | `Varisankya` | `Keystore Password` | Plain text. Inject as `RELEASE_STORE_PASSWORD`. |
| Key password | `Varisankya` | `Key Password` | Plain text. Inject as `RELEASE_KEY_PASSWORD`. |

Automated retrieval: `cd android && source scripts/bw_unlock.sh && ./retrieve_secrets.sh`
(The root `scripts/bw_unlock.sh` handles unlock; `android/retrieve_secrets.sh` reads fields and writes files.)

### iOS

iOS signing materials are not yet in the vault — Apple Developer enrollment is
still pending (case #102900128848). Once enrollment completes (see
`ios/POST_ENROLLMENT.md`), create the `Varisankya iOS signing` item per
§Vault Coverage Audit.

| Secret | Bitwarden item | Field | Status |
| --- | --- | --- | --- |
| Distribution private key | `Varisankya iOS signing` | `Varisankya-key.pem [base64]` | **TODO: add after enrollment** |
| Distribution certificate + key (.p12) | `Varisankya iOS signing` | `Varisankya-Distribution.p12 [base64]` | **TODO: add after enrollment** |
| .p12 export password | `Varisankya iOS signing` | `P12_PASSWORD` | **TODO: add after enrollment** |
| Provisioning profile | `Varisankya iOS signing` | `Varisankya_AppStore.mobileprovision [base64]` | **TODO: add after enrollment** |
| App Store Connect API key | `Varisankya iOS signing` | `AuthKey_p8 [base64]` | **TODO: add after enrollment** |
| Team ID | `Varisankya iOS signing` | `APPLE_TEAM_ID` | **TODO: add after enrollment** |
| API Issuer ID | `Varisankya iOS signing` | `APPLE_API_ISSUER_ID` | **TODO: add after enrollment** |
| API Key ID | `Varisankya iOS signing` | `APPLE_API_KEY_ID` | **TODO: add after enrollment** |
| `GoogleService-Info.plist` | `Varisankya` | `GoogleService-Info.plist [base64]` | **TODO: add** (currently only in GitHub Secret `GOOGLE_SERVICE_INFO_BASE64`) |

GitHub Secrets that CI reads directly (check with `ios/scripts/check_apple_secrets.sh`):
`GOOGLE_SERVICE_INFO_BASE64`, `APPLE_TEAM_ID`, `APPLE_API_ISSUER_ID`,
`APPLE_API_KEY_ID`, `APPLE_API_KEY_BASE64`, `BUILD_CERTIFICATE_BASE64`,
`P12_PASSWORD`, `PROVISIONING_PROFILE_BASE64`, `KEYCHAIN_PASSWORD`.

### Firebase

| Secret | Bitwarden item | Field | Notes |
| --- | --- | --- | --- |
| Android config | `Varisankya` | `google-services.json [Part 1/2]` | See Android row above. |
| iOS config | `Varisankya` | `GoogleService-Info.plist [base64]` | **TODO: add** — currently only in GitHub Secrets. |
| Web config | `Varisankya web .env.local` | full `.env.local` contents | **TODO: create item** — see §Vault Coverage Audit. |

Firebase project: `helloworld-92567418`. Console: https://console.firebase.google.com  
Auth providers: Google + Apple. Firestore rules: `shared/firebase/firestore.rules` (source-controlled).

If the Firebase project itself is lost (highly unlikely — tied to `aarshps@gmail.com`
Google account), re-create via Firebase Console and re-register all three apps
with the same bundle/package IDs. The Firestore data survives until the project
is explicitly deleted.

### GitHub

| Secret | Location | Notes |
| --- | --- | --- |
| Repository | `aarshps/varisankya` on GitHub | Private repo; requires `aarshps@gmail.com` GitHub account. |
| SSH / OAuth access | GitHub account settings | Recovered via `aarshps@gmail.com` login. |
| Repository secrets (9 iOS) | GitHub → Settings → Secrets | Recoverable from Bitwarden once enrollment completes. See iOS table above. |
| 2FA backup codes | **TODO: document location** — see §Emergency Access & 2FA | |

### Google Play Console

| Secret | Location | Notes |
| --- | --- | --- |
| Developer account | `aarshps@gmail.com` | Login via Google account. |
| Service account key | `Varisankya` BW item, `play_console_key.json` field | Used by Gradle Play Publisher for automated uploads. |
| App signing key | Managed by Google Play (Play App Signing) | SHA-1: `D0:FB:3D:47…`. Not recoverable — Play holds it. Upload key (SHA-1: `4E:2E:B5:C5…`) is in Bitwarden. |

> **Important:** Once Play App Signing is enabled, Google holds the final signing
> key. The upload keystore in Bitwarden (`varisankya-upload-key`) is what you
> sign the AAB with before upload. If the upload keystore is lost, you can
> request a new upload key via Play Console (does not affect the installed app).

### Apple Developer

| Item | Detail |
| --- | --- |
| Apple ID | `aarshps@gmail.com` |
| Legal name | Adarsh P S |
| Enrollment status | Pending (case #102900128848 — see `ios/AGENTS.md`) |
| $99/year payment | Billed to the payment method on `appleid.apple.com` |
| Recovery | Log into `appleid.apple.com` with `aarshps@gmail.com`. 2FA required — see §2FA Recovery. |
| Distribution cert | Valid 1 year. If lost: regenerate via `ios/scripts/generate_csr.sh` + upload new CSR at developer.apple.com — no charge. |
| Provisioning profile | Regeneratable in Apple Developer portal — no charge. |
| App Store Connect API key | Regeneratable — old key must be revoked first. |

### Vercel

| Item | Detail |
| --- | --- |
| Account | `aarshps@gmail.com` (GitHub OAuth or email login) |
| Project | Linked to `aarshps/varisankya` repo, `web/` subdirectory |
| Environment variables | Set via Vercel dashboard; **TODO: create `Varisankya Vercel env` BW item** — see §Vault Coverage Audit |
| 2FA | **TODO: document backup codes** — see §Emergency Access & 2FA |

### App Store reviewer test account

| Field | Value |
| --- | --- |
| Email | `varisankya148@gmail.com` |
| Sign-in method | Google Sign-In |
| Bitwarden item | `varisankya148@gmail.com - App Store reviewer test account` |
| Recovery email | `aarshps@gmail.com` |
| Created | 2026-06-06 |

Retrieve password:
```bash
source scripts/bw_unlock.sh
bw get password "varisankya148@gmail.com - App Store reviewer test account"
```

### Email accounts

| Account | Role | Recovery |
| --- | --- | --- |
| `aarshps@gmail.com` | Primary developer account; recovery for all services | Google account recovery phone/email. 2FA backup codes: **TODO**. |
| `varisankya148@gmail.com` | App Store reviewer test account | Recovery email: `aarshps@gmail.com`. 2FA: N/A (not 2FA-enrolled by policy). |

### Domain / hosting

| Item | Detail |
| --- | --- |
| Domain registrar | **TODO: identify and document** |
| Domain name(s) | **TODO: confirm** (Vercel deployment domain + any custom domain) |
| DNS / SSL | Managed by Vercel for `*.vercel.app`; custom domain if configured managed via registrar + Vercel |

---

## Recovery Runbooks

### Scenario 1: Lost dev machine (primary scenario)

**Starting state:** fresh machine, only the Bitwarden master password known.

```bash
# 1. Install prerequisites
#    - git, bw CLI (https://bitwarden.com/help/cli/), jq
#    - Android SDK (for Android builds): C:\Users\<you>\AppData\Local\Android\Sdk
#    - Java 17 OpenJDK

# 2. Clone the repo
git clone https://github.com/aarshps/varisankya.git
cd varisankya

# 3. Log in to Bitwarden
bw login aarshps@gmail.com
# Enter master password when prompted. This gives you a BW_SESSION.

# 4. Create .env with credentials from Bitwarden account settings
#    (https://vault.bitwarden.com/#/settings/security/api-key)
cp .env.example .env
chmod 600 .env
# Edit .env: fill in BW_CLIENTID, BW_CLIENTSECRET, BW_PASSWORD

# 5. Restore Android secrets
source scripts/bw_unlock.sh
cd android && ./retrieve_secrets.sh
# This writes:
#   android/app/google-services.json
#   android/varisankya-upload-key
#   android/app/play_console_key.json
#   android/local.properties (signing props appended)

# 6. Restore iOS secrets (after Apple enrollment completes)
#    GitHub Secrets are set in the repo — re-set from BW item "Varisankya iOS signing":
source scripts/bw_unlock.sh
ITEM=$(bw get item "Varisankya iOS signing")
echo "$ITEM" | jq -r '.fields[] | select(.name=="Varisankya-Distribution.p12 [base64]").value' \
  | base64 --decode > Varisankya-Distribution.p12
echo "$ITEM" | jq -r '.fields[] | select(.name=="AuthKey_p8 [base64]").value' \
  | base64 --decode > AuthKey_restore.p8
gh secret set BUILD_CERTIFICATE_BASE64 < Varisankya-Distribution.p12.b64
# ... repeat for each GitHub Secret

# 7. Restore web .env.local
source scripts/bw_unlock.sh
bw get notes "Varisankya web .env.local" > web/.env.local
chmod 600 web/.env.local
```

### Scenario 2: Lost Bitwarden access

Bitwarden is the vault, not the seed. The master password is the seed.

1. If locked out of bitwarden.com account: use Bitwarden Emergency Access (see §Emergency Access) or the encrypted vault export.
2. Worst case — create a new Bitwarden account, re-import from the last encrypted export (kept offline — see §Vault Maintenance).
3. Re-add all secrets manually from known sources:
   - Android keystore: the `.jks` file may exist on old machine backups. If lost permanently, generate a new upload key via Play Console → App Integrity → Request new upload key. The installed app continues to work (Play holds the signing key).
   - Firebase configs: re-download from Firebase Console → Project Settings.
   - iOS materials: regenerate CSR and distribution cert (no charge, see `ios/POST_ENROLLMENT.md` Stage A). Provisioning profile: regenerate. API key: rotate in App Store Connect.

### Scenario 3: Lost Apple Developer account

- Distribution cert: regenerate CSR with `ios/scripts/generate_csr.sh`, upload at developer.apple.com.
- Provisioning profile: regenerate with the new cert.
- App Store Connect API key: create a new key, update `APPLE_API_KEY_ID`, `APPLE_API_KEY_BASE64` GitHub Secrets.
- App in App Store: is not deleted — it remains live. Only re-submission requires a new build.
- If the Apple ID itself is inaccessible: account recovery at iforgot.apple.com. May require Apple Support (cases can take days).

### Scenario 4: Lost GitHub access

- GitHub account recovery: https://github.com/settings/security → 2FA recovery codes (see §2FA Recovery).
- If repo is lost: the code is on the dev machine (`git push` restores it). Worst case: re-create the repo from a local clone.
- GitHub Secrets: re-set from Bitwarden once GitHub access is restored (see iOS table above).
- CI/CD: re-link Vercel to the new repo URL.

### Scenario 5: Lost Vercel access

- Vercel login: OAuth via GitHub (`aarshps@gmail.com`) or email magic link.
- If project config is lost: re-run `vercel link` in `web/`, re-set environment variables from Bitwarden item `Varisankya Vercel env` (**TODO: create**).
- The deployed app continues serving from the last deployment until the project is deleted.

### Scenario 6: Lost Firebase access

Firebase is accessed via `aarshps@gmail.com` Google account. Losing Firebase access = losing the Google account.

- Google account recovery: https://accounts.google.com/signin/recovery
- Firebase project `helloworld-92567418`: if the project is accidentally deleted, the Firestore data is gone (no automatic backup is currently configured — **TODO: enable Firestore scheduled exports to Cloud Storage**).
- To recover app configs after Google account regain: re-download `google-services.json` and `GoogleService-Info.plist` from Firebase Console.

### Scenario 7: Founder bus factor (complete handoff)

A new developer taking over needs:

1. **Bitwarden vault access** — share via Emergency Access (see §Emergency Access), or export vault and decrypt with master password.
2. **Google account (`aarshps@gmail.com`)** — transfer ownership. This controls Firebase, Play Console, and Vercel.
3. **Apple Developer account** — transfer via Apple Business Manager or by adding the new developer as an Admin/Account Holder. Enrollment cannot be transferred; the new developer may need their own enrollment.
4. **GitHub repository** — transfer ownership in GitHub Settings → Danger Zone → Transfer.
5. **Domain registrar** — transfer the domain to the new developer's registrar account (**TODO: document registrar**).
6. The new developer should create their own Bitwarden account, generate a new `BW_CLIENTID`/`BW_CLIENTSECRET`, and rotate the `.env` values.

---

## Emergency Access & 2FA Recovery

### Bitwarden Emergency Access designee

**Status: TODO — not yet configured.**

Action: In Bitwarden Web Vault → Settings → Emergency Access → Add Emergency Contact.
Choose a trusted person and set "Access" type to **View** with a 7-day wait period.
This allows them to access your vault if you are incapacitated.

### 2FA recovery code locations

| Service | 2FA Status | Recovery Codes Location |
| --- | --- | --- |
| Bitwarden | **TODO: confirm 2FA is enabled** | **TODO: store recovery codes offline (printed / physical safe)** |
| `aarshps@gmail.com` (Google) | **TODO: confirm** | **TODO: store backup codes at known physical location** |
| `varisankya148@gmail.com` (Google) | Not enrolled (reviewer test account — keep simple) | N/A |
| Apple ID (`aarshps@gmail.com`) | **TODO: confirm** | **TODO: note Apple Recovery Key location if set** |
| GitHub (`aarshps`) | **TODO: confirm** | **TODO: store recovery codes offline** |
| Vercel | **TODO: confirm** | **TODO: store recovery codes offline** |
| Google Play Console | Shares `aarshps@gmail.com` Google 2FA | See Google row above |
| Firebase Console | Shares `aarshps@gmail.com` Google 2FA | See Google row above |

---

## Vault Maintenance

### Encrypted export cadence

**Recommended:** monthly encrypted vault export, stored offline (USB drive in a
safe, or a trusted offline location separate from the dev machine).

```bash
source scripts/bw_unlock.sh
bw export --format encrypted_json --output "bitwarden-varisankya-$(date +%Y%m).json"
# Move the file to offline storage immediately; delete the local copy.
```

**TODO: establish an actual monthly cadence (calendar reminder or cron).**

---

## Vault Coverage Audit

*Audited 2026-06-10 based on code analysis. Run `bw list items` after
`source scripts/bw_unlock.sh` to verify against the live vault.*

### Known vault items (Hora folder)

| Item | Fields confirmed in code | Status |
| --- | --- | --- |
| `Varisankya` (secure note) | `google-services.json [Part 1/2]`, `varisankya-upload-key [Part 1/2]`, `play_console_key.json`, `Key Alias`, `Keystore Password`, `Key Password` | ✅ confirmed (used by `android/retrieve_secrets.sh`) |
| `varisankya148@gmail.com - App Store reviewer test account` (login) | password | ✅ confirmed (referenced in `ios/AGENTS.md`) |

### Missing items — needs to be added to vault

#### 1. `Varisankya iOS signing` (create after Apple enrollment)

```bash
source scripts/bw_unlock.sh
bw sync
FOLDER_ID=$(bw list folders | jq -r '.[] | select(.name=="Hora") | .id')

# Run from ios/ directory after completing POST_ENROLLMENT.md Stage A:
ITEM=$(bw get template item | jq \
  --arg fid    "$FOLDER_ID" \
  --arg pem    "$(base64 -w0 < Varisankya-key.pem)" \
  --arg p12    "$(base64 -w0 < Varisankya-Distribution.p12)" \
  --arg pw     "$P12_PASSWORD" \
  --arg prov   "$(base64 -w0 < Varisankya_AppStore.mobileprovision)" \
  --arg p8     "$(base64 -w0 < AuthKey_*.p8)" \
  '.type = 2 |
   .name = "Varisankya iOS signing" |
   .folderId = $fid |
   .notes = "iOS distribution signing materials. Regenerate via ios/POST_ENROLLMENT.md Stage A." |
   .fields = [
     {"type":1,"name":"Varisankya-key.pem [base64]","value":$pem},
     {"type":1,"name":"Varisankya-Distribution.p12 [base64]","value":$p12},
     {"type":1,"name":"P12_PASSWORD","value":$pw},
     {"type":1,"name":"Varisankya_AppStore.mobileprovision [base64]","value":$prov},
     {"type":1,"name":"AuthKey_p8 [base64]","value":$p8}
   ]')
echo "$ITEM" | bw encode | bw create item
```

Field names for the `bw get item` calls in recovery scripts:
- `Varisankya-key.pem [base64]`
- `Varisankya-Distribution.p12 [base64]`
- `P12_PASSWORD`
- `Varisankya_AppStore.mobileprovision [base64]`
- `AuthKey_p8 [base64]`

Also store `APPLE_TEAM_ID`, `APPLE_API_ISSUER_ID`, `APPLE_API_KEY_ID` as plain-text
fields on the same item (add via `bw edit item` or Bitwarden Web UI).

#### 2. `GoogleService-Info.plist [base64]` field on the existing `Varisankya` item

```bash
source scripts/bw_unlock.sh
bw sync
ITEM_ID=$(bw list items --search "Varisankya" | jq -r '.[] | select(.name=="Varisankya") | .id')
PLIST_B64=$(base64 -w0 < ios/Varisankya/Resources/GoogleService-Info.plist)

# Add the field to the existing item
ITEM_JSON=$(bw get item "$ITEM_ID")
UPDATED=$(echo "$ITEM_JSON" | jq \
  --arg val "$PLIST_B64" \
  '.fields += [{"type":1,"name":"GoogleService-Info.plist [base64]","value":$val}]')
echo "$UPDATED" | bw encode | bw edit item "$ITEM_ID"
```

#### 3. `Varisankya web .env.local` (new secure note)

```bash
source scripts/bw_unlock.sh
bw sync
FOLDER_ID=$(bw list folders | jq -r '.[] | select(.name=="Hora") | .id')

# Run from repo root (requires web/.env.local to exist locally):
ENV_CONTENT=$(cat web/.env.local)
ITEM=$(bw get template item | jq \
  --arg fid "$FOLDER_ID" \
  --arg content "$ENV_CONTENT" \
  '.type = 2 |
   .name = "Varisankya web .env.local" |
   .folderId = $fid |
   .notes = $content')
echo "$ITEM" | bw encode | bw create item
```

#### 4. `Varisankya Vercel env` (new secure note)

After identifying all Vercel environment variables via `vercel env list`:

```bash
source scripts/bw_unlock.sh
bw sync
FOLDER_ID=$(bw list folders | jq -r '.[] | select(.name=="Hora") | .id')
ITEM=$(bw get template item | jq \
  --arg fid "$FOLDER_ID" \
  '.type = 2 |
   .name = "Varisankya Vercel env" |
   .folderId = $fid |
   .notes = "Vercel project env vars. Retrieve via: vercel env list.\nProject linked to aarshps/varisankya web/ subdirectory."')
echo "$ITEM" | bw encode | bw create item
# Then add individual fields via Bitwarden Web UI or bw edit item.
```

---

## Open TODOs

1. **Independent offline backup of Android upload keystore.** The keystore is in Bitwarden (`Varisankya` secure note), but there is no independent offline backup (e.g., encrypted USB). If Bitwarden is inaccessible _and_ the dev machine is lost, the upload keystore is recoverable only by requesting a new upload key from Play Console. Consider a periodic export of just the keystore to encrypted offline storage.

2. **Create `Varisankya iOS signing` Bitwarden item** after Apple Developer enrollment completes. Use the pack command in §Vault Coverage Audit.

3. **Add `GoogleService-Info.plist [base64]` field** to the existing `Varisankya` BW item. Use the command in §Vault Coverage Audit.

4. **Create `Varisankya web .env.local` Bitwarden item.** Use the command in §Vault Coverage Audit.

5. **Create `Varisankya Vercel env` Bitwarden item.** Use the command in §Vault Coverage Audit.

6. **Configure Bitwarden Emergency Access** — designate a trusted person as emergency contact in Bitwarden Web Vault → Settings → Emergency Access.

7. **Document 2FA recovery codes** for each service in §Emergency Access & 2FA. Store codes offline (printed, physical safe).

8. **Identify and document domain registrar.** Add the registrar account login and domain details to Bitwarden.

9. **Enable Firestore scheduled exports** to Cloud Storage (Firebase Console → Firestore → Import/Export → Schedule export). Without this, accidental project deletion destroys all user data.

10. **Set a monthly calendar reminder** for the encrypted vault export (§Vault Maintenance). Consider a cron job on the dev machine.

11. **Verify Bitwarden 2FA is enabled** and that recovery codes are printed and stored offline. Without 2FA, the vault is one stolen master password from full compromise.
