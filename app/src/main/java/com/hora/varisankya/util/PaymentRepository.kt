package com.hora.varisankya.util

import android.util.Log
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.WriteBatch
import com.hora.varisankya.PaymentRecord

/**
 * Centralises the read/write paths for payment records and orchestrates the
 * backward-compatible migration from the legacy nested layout to the flat
 * per-user layout.
 *
 * Layouts:
 *   Legacy (nested):   users/{uid}/subscriptions/{sid}/payments/{pid}
 *   Flat   (new):      users/{uid}/payments/{pid}            (pid is identical
 *                                                             to the nested
 *                                                             one for the same
 *                                                             payment, so writes
 *                                                             are idempotent)
 *
 * Strategy: dual-write to keep the data sources consistent for new payments;
 * read from the flat collection first (single round-trip, no composite index
 * required); on a miss, fall back to the legacy paths and backfill the flat
 * collection in the background so subsequent reads are fast.
 *
 * The flat-collection write is best-effort: if it fails (e.g. the deployed
 * Firestore security rules haven't been widened to allow it yet), the legacy
 * commit is still authoritative and the All-Payments page degrades gracefully
 * to its previous behaviour.
 *
 * **Firestore rules requirement** for full speed-up: allow read/write on
 * `/users/{userId}/payments/{paymentId}` for the matching authenticated user.
 */
object PaymentRepository {

    private const val TAG = "PaymentRepository"
    private const val BACKFILL_BATCH_SIZE = 400 // Firestore caps batches at 500

    fun nestedPaymentsCollection(
        firestore: FirebaseFirestore,
        userId: String,
        subscriptionId: String
    ): CollectionReference =
        firestore.collection("users").document(userId)
            .collection("subscriptions").document(subscriptionId)
            .collection("payments")

    fun flatPaymentsCollection(
        firestore: FirebaseFirestore,
        userId: String
    ): CollectionReference =
        firestore.collection("users").document(userId).collection("payments")

    /**
     * Adds the payment to a batch that writes to the legacy nested location
     * (atomic with the subscription's dueDate update, which the caller adds
     * separately). Returns the generated paymentId so the caller can mirror it
     * to the flat collection after the batch commits.
     */
    fun stageNestedPaymentWrite(
        firestore: FirebaseFirestore,
        batch: WriteBatch,
        userId: String,
        subscriptionId: String,
        payment: PaymentRecord
    ): String {
        val ref = nestedPaymentsCollection(firestore, userId, subscriptionId).document()
        batch.set(ref, payment)
        return ref.id
    }

    /**
     * Best-effort mirror write of [payment] under the flat collection using
     * the same document id as the nested write. Failures are swallowed and
     * logged — the flat collection is an optimization, not the source of truth.
     */
    fun mirrorPaymentToFlat(
        firestore: FirebaseFirestore,
        userId: String,
        paymentId: String,
        payment: PaymentRecord
    ) {
        flatPaymentsCollection(firestore, userId)
            .document(paymentId)
            .set(payment)
            .addOnFailureListener { e ->
                Log.w(TAG, "Flat-collection mirror failed (legacy commit unaffected)", e)
            }
    }

    /**
     * Best-effort mirror delete on the flat collection. Idempotent — deleting
     * a non-existent doc is a no-op success.
     */
    fun mirrorDeleteOnFlat(
        firestore: FirebaseFirestore,
        userId: String,
        paymentId: String
    ) {
        flatPaymentsCollection(firestore, userId)
            .document(paymentId)
            .delete()
            .addOnFailureListener { e ->
                Log.w(TAG, "Flat-collection mirror delete failed", e)
            }
    }

    /**
     * Best-effort mirror of a field update on the flat collection.
     */
    fun mirrorUpdateOnFlat(
        firestore: FirebaseFirestore,
        userId: String,
        paymentId: String,
        updates: Map<String, Any>
    ) {
        flatPaymentsCollection(firestore, userId)
            .document(paymentId)
            .update(updates)
            .addOnFailureListener { e ->
                Log.w(TAG, "Flat-collection mirror update failed", e)
            }
    }

    /**
     * Copies [payments] into the flat collection in chunks of
     * [BACKFILL_BATCH_SIZE]. Intended to be called once per user, the first
     * time the All-Payments page loads after this code ships. Failures of
     * individual chunks are logged but do not stop subsequent chunks.
     */
    fun backfillFlatCollection(
        firestore: FirebaseFirestore,
        userId: String,
        payments: List<PaymentRecord>
    ) {
        if (payments.isEmpty()) return
        val flat = flatPaymentsCollection(firestore, userId)

        payments.chunked(BACKFILL_BATCH_SIZE).forEach { chunk ->
            val batch = firestore.batch()
            for (p in chunk) {
                val docId = p.id ?: continue
                batch.set(flat.document(docId), p)
            }
            batch.commit().addOnFailureListener { e ->
                Log.w(TAG, "Backfill chunk failed (${chunk.size} payments)", e)
            }
        }
    }
}
