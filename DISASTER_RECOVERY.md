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
| Android upload keystore | `Varisankya` | `varisankya-upload-key [Part 1]` + `[Part 2]` | Base64 `.jks`. Place at `android/varisankya-upload-key`. **Verified 2026-07-11: the stored field was corrupted (decoded to a truncated, unparseable keystore — `keytool` raised `EOFException`) and has been replaced with a verified-correct copy (SHA1 `4E:2E:B5:C5…` matches the live signing cert). No independent offline backup beyond the vault exists — see §Open TODOs #1.** |
| Play Console service account | `Varisankya` | `play_console_key.json` | Base64 JSON. Place at `android/app/play_console_key.json`. |
| Keystore alias | `Varisankya` | `Key Alias` | Plain text. Inject into `android/local.properties` as `RELEASE_KEY_ALIAS`. |
| Keystore password | `Varisankya` | `Keystore Password` | Plain text. Inject as `RELEASE_STORE_PASSWORD`. |
| Key password | `Varisankya` | `Key Password` | Plain text. Inject as `RELEASE_KEY_PASSWORD`. |

Automated retrieval: `cd android && source scripts/bw_unlock.sh && ./retrieve_secrets.sh`
(The root `scripts/bw_unlock.sh` handles unlock; `android/retrieve_secrets.sh` reads fields and writes files.)

### iOS

Full iOS signing materials (p12, provisioning profile, App Store Connect API
key) can't exist yet — Apple Developer enrollment is still pending (issue #4,
cases #102900128848 / #102905434551 / #102927880856). The pre-enrollment
materials that **do** exist (the CSR and its private key, generated ahead of
time so enrollment can move fast once it clears) **are already backed up** as
fields on the existing `Varisankya` item — verified byte-identical to the
local `ios/Varisankya-key.pem` / `ios/Varisankya.csr` on 2026-07-11. Once
enrollment completes, follow `ios/POST_ENROLLMENT.md` and create the full
`Varisankya iOS signing` item per §Vault Coverage Audit.

| Secret | Bitwarden item | Field | Status |
| --- | --- | --- | --- |
| Distribution private key (pre-generated) | `Varisankya` | `Varisankya-key.pem (base64)` | ✅ backed up, verified 2026-07-11 |
| CSR (pre-generated) | `Varisankya` | `Varisankya.csr (base64)` | ✅ backed up, verified 2026-07-11 |
| Distribution certificate + key (.p12) | `Varisankya iOS signing` | `Varisankya-Distribution.p12 [base64]` | **TODO: add after enrollment** — cert doesn't exist yet |
| .p12 export password | `Varisankya iOS signing` | `P12_PASSWORD` | **TODO: add after enrollment** |
| Provisioning profile | `Varisankya iOS signing` | `Varisankya_AppStore.mobileprovision [base64]` | **TODO: add after enrollment** |
| App Store Connect API key | `Varisankya iOS signing` | `AuthKey_p8 [base64]` | **TODO: add after enrollment** |
| Team ID | `Varisankya iOS signing` | `APPLE_TEAM_ID` | **TODO: add after enrollment** |
| API Issuer ID | `Varisankya iOS signing` | `APPLE_API_ISSUER_ID` | **TODO: add after enrollment** |
| API Key ID | `Varisankya iOS signing` | `APPLE_API_KEY_ID` | **TODO: add after enrollment** |
| `GoogleService-Info.plist` | `Varisankya` | `GoogleService-Info.plist (base64)` | ✅ backed up, verified byte-identical to `ios/Varisankya/Resources/GoogleService-Info.plist` 2026-07-11 |

GitHub Secrets that CI reads directly (check with `ios/scripts/check_apple_secrets.sh`):
`GOOGLE_SERVICE_INFO_BASE64`, `APPLE_TEAM_ID`, `APPLE_API_ISSUER_ID`,
`APPLE_API_KEY_ID`, `APPLE_API_KEY_BASE64`, `BUILD_CERTIFICATE_BASE64`,
`P12_PASSWORD`, `PROVISIONING_PROFILE_BASE64`, `KEYCHAIN_PASSWORD`.

### Firebase

| Secret | Bitwarden item | Field | Notes |
| --- | --- | --- | --- |
| Android config | `Varisankya` | `google-services.json [Part 1/2]` | See Android row above. |
| iOS config | `Varisankya` | `GoogleService-Info.plist (base64)` | ✅ backed up, verified 2026-07-11 |
| Web config | `Varisankya` | `web .env.local (base64)` | ✅ backed up, verified byte-identical to `web/.env.local` 2026-07-11 |

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
| Environment variables | Set via Vercel dashboard, sourced from Firebase web config (also mirrored in the `Varisankya` BW item's `web .env.local (base64)` field — see Firebase row above). **Still open: no Vercel CLI project link exists locally** (checked 2026-07-11 — no `.vercel/project.json`, no `vercel` CLI installed), so there's nothing project-side to lose on this machine; deploy config lives entirely in the Vercel dashboard under the `aarshps@gmail.com` account. **TODO: create a `Varisankya Vercel env` BW item anyway**, since Vercel's own env-var values could still diverge from `web/.env.local` over time — see §Vault Coverage Audit. |
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
| Domain registrar | N/A — no custom domain configured (verified 2026-07-11: no domain/CNAME config anywhere in `web/`) |
| Domain name(s) | Default Vercel deployment domain only (`*.vercel.app`) |
| DNS / SSL | Fully managed by Vercel; nothing to recover outside the Vercel account (`aarshps@gmail.com`) |

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

# 6. Restore the pre-enrollment iOS materials (CSR + private key) — these are
#    fields on the main "Varisankya" item, not a separate item, and exist today:
source scripts/bw_unlock.sh
ITEM=$(bw get item ce5c0d02-ad99-4fbc-ace3-b438009d137f)
echo "$ITEM" | jq -r '.fields[] | select(.name=="Varisankya-key.pem (base64)").value' \
  | base64 --decode > ios/Varisankya-key.pem
echo "$ITEM" | jq -r '.fields[] | select(.name=="Varisankya.csr (base64)").value' \
  | base64 --decode > ios/Varisankya.csr
echo "$ITEM" | jq -r '.fields[] | select(.name=="GoogleService-Info.plist (base64)").value' \
  | base64 --decode > ios/Varisankya/Resources/GoogleService-Info.plist

# 6b. Once Apple enrollment completes, restore the rest from "Varisankya iOS signing"
#     (only exists after POST_ENROLLMENT.md Stage A creates it — see §Vault Coverage Audit #1):
ITEM2=$(bw get item "Varisankya iOS signing")
echo "$ITEM2" | jq -r '.fields[] | select(.name=="Varisankya-Distribution.p12 [base64]").value' \
  | base64 --decode > Varisankya-Distribution.p12
echo "$ITEM2" | jq -r '.fields[] | select(.name=="AuthKey_p8 [base64]").value' \
  | base64 --decode > AuthKey_restore.p8
gh secret set BUILD_CERTIFICATE_BASE64 < Varisankya-Distribution.p12.b64
# ... repeat for each GitHub Secret

# 7. Restore web .env.local — also a field on the main "Varisankya" item:
echo "$ITEM" | jq -r '.fields[] | select(.name=="web .env.local (base64)").value' \
  | base64 --decode > web/.env.local
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
bw export --format encrypted_json --password "$BW_PASSWORD" --output "bitwarden-varisankya-$(date +%Y%m%d).json"
# Move the file to offline storage immediately; delete the local copy.
```

**2026-07-11: ran ahead of a planned machine destruction** — full encrypted
export taken, delivered to the developer, local copy deleted immediately.
**Still TODO: establish an actual recurring monthly cadence** (calendar
reminder or cron) so this isn't only done around machine-loss events.

---

## Vault Coverage Audit

*Last full audit: 2026-07-11 (Varisankya agent), verified against the live
vault (not just code analysis) ahead of a planned machine destruction — every
field below was fetched and byte-diffed against its local counterpart.*

### Known vault items (Hora folder)

| Item | Fields confirmed | Status |
| --- | --- | --- |
| `Varisankya` (secure note, id `ce5c0d02-ad99-4fbc-ace3-b438009d137f`) | `google-services.json [Part 1/2]`, `varisankya-upload-key [Part 1/2]`, `play_console_key.json`, `Key Alias`, `Keystore Password`, `Key Password`, `GCP Ubuntu VNC Password`, `GoogleService-Info.plist (base64)`, `Varisankya-key.pem (base64)`, `Varisankya.csr (base64)`, `web .env.local (base64)`, `credentials.txt` | ✅ all 14 fields verified byte-identical to local files on 2026-07-11, **except** `varisankya-upload-key [Part 1/2]` which was found corrupted and was repaired in place (see §Secret Inventory → Android). Only one `Varisankya` item exists now — the earlier duplicate-item ambiguity noted in `android/retrieve_secrets.sh`'s comments is not currently reproducible, but the script's exact-name-match workaround is left in place as cheap insurance. |
| `varisankya148@gmail.com - App Store reviewer test account` (login) | password | ✅ confirmed (referenced in `ios/AGENTS.md`) |

### Still missing — needs to be added to vault once available

#### 1. `Varisankya iOS signing` full item (blocked on Apple enrollment)

The pre-enrollment materials (`Varisankya-key.pem`, `Varisankya.csr`) are
**already** backed up as fields on the existing `Varisankya` item (verified
2026-07-11) — only the post-enrollment materials below are still missing,
because they don't exist yet:

```bash
source scripts/bw_unlock.sh
bw sync
FOLDER_ID=$(bw list folders | jq -r '.[] | select(.name=="Hora") | .id')

# Run from ios/ directory after completing POST_ENROLLMENT.md Stage A:
ITEM=$(bw get template item | jq \
  --arg fid    "$FOLDER_ID" \
  --arg p12    "$(base64 -w0 < Varisankya-Distribution.p12)" \
  --arg pw     "$P12_PASSWORD" \
  --arg prov   "$(base64 -w0 < Varisankya_AppStore.mobileprovision)" \
  --arg p8     "$(base64 -w0 < AuthKey_*.p8)" \
  '.type = 2 |
   .name = "Varisankya iOS signing" |
   .folderId = $fid |
   .notes = "iOS distribution signing materials. Regenerate via ios/POST_ENROLLMENT.md Stage A." |
   .fields = [
     {"type":1,"name":"Varisankya-Distribution.p12 [base64]","value":$p12},
     {"type":1,"name":"P12_PASSWORD","value":$pw},
     {"type":1,"name":"Varisankya_AppStore.mobileprovision [base64]","value":$prov},
     {"type":1,"name":"AuthKey_p8 [base64]","value":$p8}
   ]')
echo "$ITEM" | bw encode | bw create item
```

Also store `APPLE_TEAM_ID`, `APPLE_API_ISSUER_ID`, `APPLE_API_KEY_ID` as plain-text
fields on the same item (add via `bw edit item` or Bitwarden Web UI).

#### 2. `Varisankya Vercel env` (new secure note) — low priority

No Vercel CLI project link exists on this machine (checked 2026-07-11 — no
`.vercel/project.json`, `vercel` CLI not installed), so there's no
project-side local state to lose. This item would just be a redundant mirror
of the values already in the `web .env.local (base64)` field, kept in case
Vercel's actual configured env vars ever drift from `web/.env.local`:

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

1. **Independent offline backup of Android upload keystore.** The keystore is in Bitwarden (`Varisankya` secure note) and was verified/repaired 2026-07-11, but there is still no independent offline backup (e.g., encrypted USB) beyond the vault itself and the 2026-07-11 full vault export. If Bitwarden is inaccessible _and_ the dev machine is lost, the upload keystore is recoverable only by requesting a new upload key from Play Console. Consider a periodic export of just the keystore to encrypted offline storage.

2. **Create the post-enrollment fields of `Varisankya iOS signing`** once Apple Developer enrollment completes (issue #4). The pre-enrollment CSR/key are already backed up. Use the command in §Vault Coverage Audit #1.

3. ~~Add `GoogleService-Info.plist` field~~ — **done**, verified 2026-07-11.

4. ~~Create web env item~~ — **done**, stored as the `web .env.local (base64)` field on the `Varisankya` item, verified 2026-07-11.

5. **Create `Varisankya Vercel env` Bitwarden item** — low priority, see §Vault Coverage Audit #2 (no local Vercel state exists to lose).

6. **Configure Bitwarden Emergency Access** — designate a trusted person as emergency contact in Bitwarden Web Vault → Settings → Emergency Access. Requires manual web UI action; not something an agent can do.

7. **Document 2FA recovery codes** for each service in §Emergency Access & 2FA. Store codes offline (printed, physical safe). Requires manual action per-service.

8. ~~Identify and document domain registrar~~ — **resolved 2026-07-11**: no custom domain exists, nothing to document.

9. **Enable Firestore scheduled exports** to Cloud Storage (Firebase Console → Firestore → Import/Export → Schedule export). **Confirmed still not configured** (checked 2026-07-11 via `gcloud firestore operations list` — zero results). Without this, accidental project deletion destroys all user data. This is a data-loss risk, not a machine-loss risk — the Firestore data itself isn't affected by destroying the dev machine, but is worth fixing independently.

10. **Set a monthly calendar reminder** for the encrypted vault export (§Vault Maintenance). One-off export done 2026-07-11 ahead of machine destruction; still no recurring cadence.

11. **Verify Bitwarden 2FA is enabled** and that recovery codes are printed and stored offline. Without 2FA, the vault is one stolen master password from full compromise. Requires manual action.
