# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Baseline:** Every unspecified Firestore path is denied for both reads and writes (`match /{document=**} { allow read, write: if false; }`).
2. **Admin-Only CMS Mutation:** Only the verified primary admin (`malaymaniyar2020@gmail.com` with `email_verified == true`) or a trusted UID in `/admins/{uid}` may create, update, or delete documents in `/site_config`, `/ugc_reels`, `/design_projects`, `/capabilities`, and `/custom_sections`.
3. **Strict PII Isolation on Inquiries:** `/inquiries/{inquiryId}` stores visitor names, emails, and messages. Visitors may `create` a valid inquiry with `status == 'new'` and `createdAt == request.time`, but **only `isAdmin()`** may `get`, `list`, `update`, or `delete` inquiries.
4. **No Self-Promotion:** `/admins/{uid}` denies all client writes (`allow write: if false;`).
5. **Path ID & Payload Hardening:** Every single-document target checks `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars), strict allowed/required key sets (`hasAll` + `hasOnly`), bounded string/list sizes, hex color regex validation, and server timestamps (`request.time`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return `PERMISSION_DENIED`)
1. **Unauthenticated Site Config Overwrite:** Anonymous write to `/site_config/main` attempting to change `theme.primaryAccent` or `profile.email`.
2. **Non-Admin Signed-In CMS Mutation:** Authenticated user (`attacker@gmail.com`, verified) attempting `update` on `/site_config/main` or `create` on `/custom_sections/hack`.
3. **Unverified Admin Email Spoofing:** Auth token with `email == 'malaymaniyar2020@gmail.com'` but `email_verified == false` attempting to write `/site_config/main` or read `/inquiries`.
4. **Shadow Field Injection on Site Config:** Admin write to `/site_config/main` including an undeclared ghost key `isSuperAdmin: true` (blocked by `hasOnly`).
5. **Hex Color Value Poisoning:** Admin write to `/site_config/main` setting `theme.primaryAccent: "javascript:alert(1)"` (blocked by `^#[0-9A-Fa-f]{6}$`).
6. **Admin Self-Promotion Attack:** Authenticated user attempting `create` on `/admins/{theirUid}` with `{ role: 'admin', email: 'attacker@gmail.com' }` (blocked by `allow write: if false`).
7. **PII Scraping (`get` / `list`) on Inquiries:** Unauthenticated or non-admin signed-in user attempting `get` or `list` on `/inquiries` (blocked by `isAdmin()`).
8. **Inquiry Status Tampering on Create:** Public visitor submitting `/inquiries/inq1` with `status: 'replied'` instead of `'new'` (blocked by `incoming().status == 'new'`).
9. **Inquiry Backdated Client Timestamp:** Public visitor submitting `/inquiries/inq2` with client-supplied `createdAt` not matching `request.time`.
10. **Inquiry Oversized Message / Denial of Wallet:** Public visitor submitting a 50KB `message` string to `/inquiries/inq3` (blocked by `size() <= 2000`).
11. **Path ID Poisoning:** Attacker attempting `create` on `/inquiries/invalid$id..with.spaces` (blocked by `isValidId(inquiryId)`).
12. **Custom Section Shadow Key / Unbounded Items Array:** Admin write to `/custom_sections/sec1` with `items.size() == 25` or invalid `layout: 'raw-html'` (blocked by `items.size() <= 6` and layout allowlist).
