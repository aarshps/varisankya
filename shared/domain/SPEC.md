# Varisankya — Canonical Domain Spec

This is the **single source of truth** for Varisankya's cross-platform behaviour. The
Android (Kotlin), iOS (Swift), and Web (TypeScript) clients each re-implement this logic
natively; they must all agree, because they read and write the **same** Firestore
documents in project `helloworld-92567418`. The machine-checkable cases live in
[`golden-vectors.json`](golden-vectors.json) — every platform should run them.

| Concern | Web | Android | iOS |
| --- | --- | --- | --- |
| Subscription model | `web/lib/types.ts` | `app/.../Subscription.kt` | `Varisankya/Models/Subscription.swift` |
| Payment model | `web/lib/types.ts` | `app/.../PaymentRecord.kt` | `Varisankya/Models/PaymentRecord.swift` |
| Recurrence | `web/lib/recurrence.ts` | `app/.../util/DateHelper.kt` | `Varisankya/Models/Recurrence.swift` |
| Currency | `web/lib/currency.ts` | `app/.../CurrencyHelper.kt` | `Varisankya/Models/Currency.swift` |
| Hero / "this month" | `web/lib/hero.ts` | `app/.../viewmodel/MainViewModel.kt` | `Varisankya/ViewModels/MainViewModel.swift` |
| Persistence | `web/lib/firestore.ts` | `app/.../util/PaymentRepository.kt` | `Varisankya/Services/FirestoreService.swift` |

## 1. Data model

```
users/{uid}/subscriptions/{subId}                      ← subscription document
users/{uid}/subscriptions/{subId}/payments/{paymentId} ← payment (AUTHORITATIVE)
users/{uid}/payments/{paymentId}                        ← flat mirror (fast All-Payments reads)
```

**Subscription** fields — names/defaults must match on every platform:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | string | `""` | |
| `dueDate` | timestamp \| null | `null` | next due date (UTC) |
| `cost` | number | `0` | |
| `currency` | string | `"USD"` | ISO-ish code, see §4 |
| `recurrence` | string | `"Monthly"` | encoded string, see §3 |
| `active` | bool | `true` | inactive items excluded from totals |
| `autopay` | bool | `false` | |

**PaymentRecord** fields: `date` (timestamp), `amount` (number), `subscriptionName`
(string), `subscriptionId` (string), `currency` (string), `userId` (string).

## 2. Payments — dual write & "mark paid"

- A payment is written to **both** the nested authoritative path
  (`…/subscriptions/{subId}/payments/{pid}`) **and** the flat mirror
  (`users/{uid}/payments/{pid}`). The mirror carries `userId` so the All-Payments view
  can read it via a collection-group query (see the security rules).
- **Mark paid** advances the subscription's `dueDate` by one recurrence step (§3) and
  writes the payment record **atomically** with that update. The amount defaults to the
  subscription `cost` but may be overridden (extra/partial payments) without disturbing
  the schedule.

## 3. Recurrence

Stored as a human-readable string so one document reads everywhere: `"Monthly"`,
`"Yearly"`, `"Weekly"`, `"Daily"`, `"Every N Months|Years|Weeks|Days"`, or `"Custom"`.

**Encode** `(unit, frequency) → string`:
- `Custom` → `"Custom"` (frequency ignored).
- `frequency <= 1` → the bare unit (`"Monthly"`).
- otherwise → `"Every {n} {Months|Years|Weeks|Days}"`.

**Decode** `string → (unit, frequency)`: inverse of encode; `"Custom"` → `{Custom, 1}`;
anything unrecognised → `{that string, 1}`.

**nextDueDate** `(baseDate, recurrence) → date | null` — **all math in UTC**:
- `"Custom"` → `null` (no automatic schedule).
- Normalise base to UTC start-of-day, then add the step (`1` for a preset, `n` for
  `"Every n …"`).
- **Day-of-month clamping** matches Foundation's `Calendar` (and is implemented the same
  way on Android/Web): if the target month is shorter, clamp to its last day.
  - `Jan 31 + 1 month → Feb 28` (or Feb 29 in a leap year).
  - `2024-02-29 + 1 year → 2025-02-28`.
- Month arithmetic wraps the year correctly (`Dec 15 + 1 month → next Jan 15`).

## 4. Currency

`CURRENCIES` is a fixed ordered list (INR, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, HKD,
NZD, SEK, KRW, SGD, MXN, KES, UNT). Unknown code → symbol `"$"`.

- **format** `(amount, code) → "<symbol> <number>"`: integer when the amount is whole,
  otherwise two decimals. e.g. `649 INR → "₹ 649"`, `9.99 USD → "$ 9.99"`.
- **compact** `amount → string` using Indian-influenced suffixes: `k` (≥1 000), `l` lakh
  (≥100 000), `m` (≥1 000 000). One decimal, trailing `.0` trimmed. `0 → "0"`.
  e.g. `1500 → "1.5k"`, `250000 → "2.5l"`, `3000000 → "3m"`.

## 5. Hero / "this month"

Computed from the in-memory subscription list using the **local** (gregorian) calendar:
- Consider only `active` subscriptions with a non-null `dueDate`.
- `totalAmount` = sum of `cost` for items that are **overdue** (dueDay < today) **or**
  whose `dueDate` falls in the **current calendar month**.
- `nextPayment` = the soonest non-overdue (dueDay ≥ today) item.
- `overdueSubscriptions` = all overdue items; `activeSubscriptions` = all considered.

## Keeping platforms in sync

When you change any rule here, update **all three** implementations and the
[`golden-vectors.json`](golden-vectors.json) cases in the same change. The web suite
already asserts the vectors (`npm test` in `web/`); Android and iOS should load the same
JSON in their unit tests so drift fails CI on every platform.
