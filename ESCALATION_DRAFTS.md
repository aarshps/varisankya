# Escalation Drafts — Apple Developer Program Enrolment

Pre-drafted public-escalation text. Use only if cases #102900128848 (Yana) and
#102905434551 (parallel) both remain silent past **Fri 2026-06-05 17:00 IST**.
The Friday calendar reminder will fire to prompt the trigger.

**Status as of 2026-06-03 (pre-trigger):** 
- Parallel case confirmed live.
- Forum post live: https://developer.apple.com/forums/thread/828487 (0 replies).
- Tweet live: https://x.com/aarshps/status/2061572757847187899 (0 replies).
- 0 replies from support or public as of Jun 3 evening.

This file is an operational artifact — delete after enrolment clears.

---

## 1. Tweet to @AppleSupport (280 chars)

```
@AppleSupport Apple Developer enrolment stuck at "ID Verification Rejected" — no
detail surfaced in the Developer app. Case #102900128848 silent 4+ biz days;
parallel #102905434551 also open. Built iOS app waiting only on this. Please
help route to the right team.
```

(Trim if Twitter character count complains. The two case numbers + the phrase
"ID Verification Rejected" are the load-bearing tokens — keep both.)

## 2. Tweet to @AppleDeveloper (backup, same day)

```
@AppleDeveloper Enrolment blocked at "ID Verification Rejected" with no detail
in the Developer iOS app. Two open cases (102900128848, 102905434551) silent
past their SLAs. iOS 26 / SwiftUI app ready to ship — only enrolment blocks
TestFlight. Any guidance appreciated.
```

## 3. Apple Developer Forums post

**Subforum:** Apps & Developers → Account & Organization → "Membership"
**URL:** <https://developer.apple.com/forums/tags/membership>
**Title:** Individual enrolment stuck at "ID Verification Rejected" — no detail, support silent past SLA

**Body:**

```
Hi all,

Hoping someone has hit and resolved this exact pattern.

I'm trying to enrol in the Apple Developer Program as an Individual (India,
Bengaluru). The Apple Developer iOS app shows "ID Verification Rejected"
under the Apple Developer Program status — but with no specific reason and
no retry button. The app does not surface what was actually wrong with the
verification.

What I have already done:
- Confirmed my Apple Account name ("Adarsh P S") exactly matches my Passport
  and PAN card (no extra spaces, no missing initials).
- Opened Developer Support case #102900128848 — agent replied once on
  2026-05-28 asking for a screenshot, which I provided the same day. No
  follow-up in 4+ business days.
- Filed a parallel case #102905434551 on 2026-06-02 explicitly referencing
  the first; no reply yet.
- Apple ID has 2FA enabled, trusted device active, billing address on file.

Questions for anyone who has gotten past this:

1. Did the verification reset come from support, or did re-attempting from
   the app after some delay work on its own?
2. For Indian developers — which ID type was finally accepted (Passport vs
   PAN)? Aadhaar is not accepted per UIDAI restriction; I want to submit the
   right doc first try.
3. Is there a specific support topic / contact path that routes to the
   identity-verification team faster than "Membership and Account → Program
   Enrolment → Email"?

Any pointers appreciated — happy to share more detail offline.

Thanks,
Adarsh P S
```

## 4. tcook@apple.com email (firing 2026-06-02)

**Subject:** Apple Developer Program enrolment stuck — two open support cases need routing

**Body:**

```
Dear Mr. Cook (or Executive Customer Relations),

I am an iOS developer in Bengaluru, India, trying to enrol in the Apple
Developer Program as an Individual. My iOS 26 / SwiftUI app is built,
tested, CI-green, and waiting only on enrolment to reach TestFlight.

The Apple Developer iOS app shows "ID Verification Rejected" under the
program status with no detail, no specific reason, and no retry button. I
cannot self-correct because nothing actionable is shown in the app.

I have opened two Developer Support cases:
- #102900128848 (agent Yana, asia.dev@apple.com) — I provided the requested
  screenshot on 2026-05-28; no follow-up in the 3 business days since.
- #102905434551 — parallel case filed 2026-06-02 via developer.apple.com.

My Apple Account is in good standing (aarshps@gmail.com, name "Adarsh P S"
exactly matching my Passport and PAN). Aadhaar is not accepted for
Developer Program ID verification per UIDAI restriction, so I will be
submitting Passport or PAN. I am happy to do a verification call, send
additional documents, or whatever else is needed.

Would you please route this to the team that handles identity verification
on Developer Program enrolments? Any unstick would be tremendously
appreciated.

Thank you,
Adarsh P S
aarshps@gmail.com
```

---

## Reference — supporting facts to keep handy

| Item | Value |
| --- | --- |
| Apple Account | aarshps@gmail.com |
| Apple Account name | Adarsh P S |
| Region | Bengaluru, India |
| Enrolment type | Individual |
| First case | #102900128848 — opened 2026-05-28, agent Yana (asia.dev@apple.com). Screenshot provided; silent 6+ days. |
| Parallel case | #102905434551 — filed 2026-06-02 via developer.apple.com/contact; confirmation "case ID 102905434551". |
| Public posts (Jun 1-2) | Forum: https://developer.apple.com/forums/thread/828487 (0 replies); Tweet: https://x.com/aarshps/status/2061572757847187899 (0 replies) |
| Symptom | Apple Developer iOS app, Account tab → "Apple Developer Program: ID Verification Rejected" — no detail, no retry |
| Acceptable ID | Passport or PAN (Aadhaar not accepted) |
| Build status | All CI green, head 4304194 (as of 2026-06-02); only enrolment blocks TestFlight |
| Reminders | 2026-06-04 09:00 IST Gmail check; 2026-06-05 17:00 IST full escalation if silent |
