# Security Specification for Saved Side Hustles

## 1. Data Invariants
1. **Scope/Owner Boundary**: A user can only create, view (get/list), or delete saved side hustles where the `userId` field matches their authenticated `request.auth.uid`.
2. **Immutable Properties**: Once created, the fields `userId`, `hustleId`, and `createdAt` cannot be modified (any update is denied).
3. **Data Completeness**: A saved side hustle must contain exactly three fields on creation: `userId`, `hustleId`, and `createdAt`.
4. **Verified Users**: All write operations require a signed-in user whose email is verified.
5. **ID Hardening**: The document ID must be valid, conforming to length and standard character checks (alphanumeric/hyphen/underscore).

---

## 2. The "Dirty Dozen" Insecure/Malicious Payloads
Here are the 12 attack vectors designed to test and break our database constraints. Each payload must return `PERMISSION_DENIED`.

1. **Anonymous Writing**: Attempt to write without being signed in.
2. **Identity Spoofing**: Signed-in user `A` tries to create a saved hustle claiming to belong to user `B`.
3. **Ghost Field Injection (Shadow Update/Create)**: Trying to inject extra undocumented fields (e.g., `isAdmin: true` or `flagged: false`) on creation.
4. **Unset or Empty Fields**: Creating a document with missing mandatory fields (e.g., missing `hustleId`).
5. **No-Read Isolation Breach**: User `A` attempting to read a document belonging to User `B`.
6. **Query Scraping (Blanket reads)**: Trying to list all saved hustles across all users without restricting query to their own `userId`.
7. **Privilege Escalation on Update**: Modifying a saved hustle belonging to another user.
8. **Immutability Breach**: Owner of a saved hustle trying to modify the `hustleId` after creation.
9. **Timestamp Manipulation**: Sending a client-fabricated `createdAt` timestamp instead of the server timestamp (`request.time`).
10. **Malicious ID injection (Path Poisoning)**: Creating a document with a massive 1MB string or high-byte characters in the ID.
11. **Malicious field string size payload**: Inserting high-byte string fields exceeding maximum character boundaries.
12. **Malicious Delete**: User `A` trying to delete a saved hustle belonging to User `B`.

---

## 3. Security Rules draft and Test Specification
The rules will enforce direct verification. Let's draft them and write our tests/fortress rules next to secure the environment.
