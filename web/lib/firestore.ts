"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { PaymentRecord, Subscription } from "./types";
import { sortSubscriptions } from "./subscription";

/**
 * Ports varisankya-ios/Varisankya/Services/FirestoreService.swift.
 *
 *   users/{uid}/subscriptions/{sid}
 *   users/{uid}/subscriptions/{sid}/payments/{pid}   (authoritative)
 *   users/{uid}/payments/{pid}                       (flat mirror)
 *
 * Payments are dual-written: the nested write is the source of truth and is
 * committed atomically with the dueDate advance; the flat mirror is
 * best-effort.
 */

// ---- collection refs ----
const subsCol = (uid: string) =>
  collection(db, "users", uid, "subscriptions");
const nestedPaymentsCol = (uid: string, subId: string) =>
  collection(db, "users", uid, "subscriptions", subId, "payments");
const flatPaymentsCol = (uid: string) =>
  collection(db, "users", uid, "payments");

// ---- (de)serialization ----
function subFromDoc(d: QueryDocumentSnapshot<DocumentData>): Subscription {
  const x = d.data();
  return {
    id: d.id,
    name: x.name ?? "",
    dueDate: x.dueDate instanceof Timestamp ? x.dueDate.toDate() : null,
    cost: typeof x.cost === "number" ? x.cost : 0,
    currency: x.currency ?? "USD",
    recurrence: x.recurrence ?? "Monthly",
    category: x.category ?? "Entertainment",
    active: x.active ?? true,
    autopay: x.autopay ?? false,
  };
}

function paymentFromDoc(d: QueryDocumentSnapshot<DocumentData>): PaymentRecord {
  const x = d.data();
  return {
    id: d.id,
    date: x.date instanceof Timestamp ? x.date.toDate() : null,
    amount: typeof x.amount === "number" ? x.amount : 0,
    subscriptionName: x.subscriptionName ?? "",
    subscriptionId: x.subscriptionId ?? "",
    currency: x.currency ?? "USD",
    userId: x.userId ?? "",
  };
}

function subToData(sub: Subscription): DocumentData {
  return {
    name: sub.name,
    cost: sub.cost,
    currency: sub.currency,
    recurrence: sub.recurrence,
    category: sub.category,
    active: sub.active,
    autopay: sub.autopay,
    dueDate: sub.dueDate ? Timestamp.fromDate(sub.dueDate) : null,
  };
}

// ---- live subscription list ----
export function observeSubscriptions(
  uid: string,
  onChange: (subs: Subscription[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(subsCol(uid), orderBy("dueDate", "asc"));
  return onSnapshot(
    q,
    (snap) => onChange(sortSubscriptions(snap.docs.map(subFromDoc))),
    (err) => onError(err),
  );
}

export async function fetchActiveSubscriptions(
  uid: string,
): Promise<Subscription[]> {
  const snap = await getDocs(query(subsCol(uid), where("active", "==", true)));
  return snap.docs.map(subFromDoc);
}

export async function fetchAllSubscriptions(
  uid: string,
): Promise<Subscription[]> {
  const snap = await getDocs(subsCol(uid));
  return snap.docs.map(subFromDoc);
}

// ---- subscription mutations ----
export async function upsertSubscription(
  sub: Subscription,
  uid: string,
): Promise<void> {
  const data = subToData(sub);
  if (sub.id) {
    await setDoc(doc(subsCol(uid), sub.id), data);
  } else {
    await addDoc(subsCol(uid), data);
  }
}

export async function setActive(
  sub: Subscription,
  active: boolean,
  uid: string,
): Promise<void> {
  if (!sub.id) return;
  await updateDoc(doc(subsCol(uid), sub.id), { active });
}

export async function deleteSubscription(
  sub: Subscription,
  uid: string,
): Promise<void> {
  if (!sub.id) return;
  await deleteDoc(doc(subsCol(uid), sub.id));
}

// ---- payment dual-write ----
export async function recordPayment(
  sub: Subscription,
  paymentDate: Date,
  nextDue: Date | null,
  uid: string,
): Promise<void> {
  if (!sub.id) return;
  const subId = sub.id;

  const paymentRef = doc(nestedPaymentsCol(uid, subId));
  const paymentId = paymentRef.id;
  const payment: DocumentData = {
    date: Timestamp.fromDate(paymentDate),
    amount: sub.cost,
    subscriptionName: sub.name,
    subscriptionId: subId,
    currency: sub.currency,
    userId: uid,
  };

  const batch = writeBatch(db);
  batch.set(paymentRef, payment);
  if (nextDue) {
    batch.update(doc(subsCol(uid), subId), {
      dueDate: Timestamp.fromDate(nextDue),
    });
  }
  await batch.commit();

  // Best-effort flat mirror — optimization, not source of truth.
  void setDoc(doc(flatPaymentsCol(uid), paymentId), payment).catch(() => {});
}

// ---- payment reads ----
export async function fetchPayments(
  subscriptionId: string,
  uid: string,
  max = 50,
): Promise<PaymentRecord[]> {
  const snap = await getDocs(
    query(
      nestedPaymentsCol(uid, subscriptionId),
      orderBy("date", "desc"),
    ),
  );
  return snap.docs.slice(0, max).map(paymentFromDoc);
}

export async function fetchAllPayments(uid: string): Promise<PaymentRecord[]> {
  // Flat collection first — single round-trip, no composite index.
  try {
    const snap = await getDocs(
      query(flatPaymentsCol(uid), orderBy("date", "desc")),
    );
    if (!snap.empty) return snap.docs.map(paymentFromDoc);
  } catch {
    // fall through to nested fan-out
  }

  const subs = await fetchAllSubscriptions(uid);
  const chunks = await Promise.all(
    subs
      .filter((s) => s.id)
      .map((s) => fetchPayments(s.id!, uid, 500)),
  );
  const combined = chunks.flat();
  combined.sort(
    (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0),
  );
  return combined;
}

// ---- payment edits ----
export async function updatePaymentDate(
  payment: PaymentRecord,
  newDate: Date,
  uid: string,
): Promise<void> {
  if (!payment.id || !payment.subscriptionId) return;
  const ts = Timestamp.fromDate(newDate);
  await updateDoc(
    doc(nestedPaymentsCol(uid, payment.subscriptionId), payment.id),
    { date: ts },
  );
  void updateDoc(doc(flatPaymentsCol(uid), payment.id), { date: ts }).catch(
    () => {},
  );
}

export async function deletePayment(
  payment: PaymentRecord,
  uid: string,
): Promise<void> {
  if (!payment.id || !payment.subscriptionId) return;
  await deleteDoc(
    doc(nestedPaymentsCol(uid, payment.subscriptionId), payment.id),
  );
  void deleteDoc(doc(flatPaymentsCol(uid), payment.id)).catch(() => {});
}

// ---- account deletion ----
export async function deleteAllUserData(uid: string): Promise<void> {
  const subsSnap = await getDocs(subsCol(uid));
  for (const subDoc of subsSnap.docs) {
    const payments = await getDocs(collection(subDoc.ref, "payments"));
    await Promise.all(payments.docs.map((p) => deleteDoc(p.ref).catch(() => {})));
    await deleteDoc(subDoc.ref).catch(() => {});
  }
  const flatSnap = await getDocs(flatPaymentsCol(uid));
  await Promise.all(flatSnap.docs.map((p) => deleteDoc(p.ref).catch(() => {})));
  await deleteDoc(doc(db, "users", uid)).catch(() => {});
}
