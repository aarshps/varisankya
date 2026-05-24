# Payment Storage Migration Plan

Status: **Phase 1 shipped in v3.8-beta.5** (this branch). Tracks GitHub issue [#6](https://github.com/aarshps/varisankya-android/issues/6).

## Why

Payments are stored under each subscription:

```
users/{uid}/subscriptions/{sid}/payments/{pid}
```

To render the **All Payments** page we have to fan out across every
subscription, which is O(N) round trips and visibly slow once a user has
more than a handful of subscriptions. A `collectionGroup("payments")` query
was added as an optimization, but it silently falls back to the N+1 path when
the corresponding Firestore composite index isn't deployed — so the perceived
slowness persisted.

## What we changed (Phase 1, shipped)

We introduced a **flat per-user payments collection**:

```
users/{uid}/payments/{pid}
```

Reading from this collection is a single round-trip and needs **no composite
index**, so the All Payments page is fast for every user that has had at
least one new payment written since this release.

### Dual-write

Every write site keeps writing to the legacy nested location (atomic with the
parent subscription's `dueDate` update, in a batch) and then **best-effort
mirrors** the write to the flat collection. A failure on the flat write does
**not** invalidate the legacy commit; it is logged and dropped. Affected
files:

- `app/src/main/java/com/hora/varisankya/PaymentBottomSheet.kt`
  – `recordPayment()`, `deletePayment()`, `updatePaymentDate()`
- `app/src/main/java/com/hora/varisankya/viewmodel/MainViewModel.kt`
  – `markAsPaid()` (used by the swipe-to-paid gesture)
- `app/src/main/java/com/hora/varisankya/receiver/NotificationActionReceiver.kt`
  – `markAsPaid()` (used by the "Mark Paid" notification action)
- `app/src/main/java/com/hora/varisankya/UnifiedHistoryActivity.kt`
  – `deleteInvalidRecords()` (the data-cleanup sheet)

The shared logic lives in
`app/src/main/java/com/hora/varisankya/util/PaymentRepository.kt`.

### Read path (UnifiedHistoryActivity.loadAllPayments)

1. Try `users/{uid}/payments` (flat). If non-empty → done.
2. On miss, try `collectionGroup("payments").whereEqualTo("userId", uid)` and
   **backfill** the flat collection in chunks of 400 (Firestore's batch
   limit is 500).
3. On miss again (index missing), fall back to the legacy N+1 fan-out and
   backfill from its result.

The user sees the existing slow load **once** after upgrading; from the next
visit onwards, the flat-collection read takes over.

### Document IDs

Flat documents reuse the same id Firestore auto-generates for the nested
write, which makes the dual-write idempotent and lets future deletes/edits
target both copies with the same id.

## Firestore security rules — required follow-up

The default project rules likely do not allow writes under
`/users/{userId}/payments/{paymentId}` (only the nested
`/users/{userId}/subscriptions/{sid}/payments/{pid}` path). Update the
deployed rules to include:

```
match /databases/{db}/documents {
  match /users/{userId} {
    match /payments/{paymentId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // existing nested rule stays in place
  }
}
```

If the rules are not updated, the flat-collection writes will quietly fail
in `PaymentRepository.mirrorPaymentToFlat()` (logged at WARN as
`Flat-collection mirror failed`) and the app degrades to its pre-Phase-1
behaviour — correct, just slow.

## Phase 2 (not in this release)

Once Phase 1 has soaked for a release or two and we are confident the dual
write is healthy:

1. Promote the flat collection from "optimization" to "source of truth" for
   reads. Stop reading from the nested location at all.
2. Optionally write a one-shot Cloud Function (or a one-time client task) to
   sweep any nested payments that the lazy-backfill hasn't picked up.
3. Stop writing to the nested location entirely. Existing subscription docs
   can keep their nested `payments` sub-collection for historical archival.

This phased plan honours the bug reporter's request for "backward-compatible
planning so that going forward slowly it gets migrated over the period of
time without crossing much of an issue to the existing subscription and
existing data for all customers".
