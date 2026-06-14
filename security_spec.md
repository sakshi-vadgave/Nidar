# NIDAR Safety - Security Spec

## 1. Data Invariants
- A user can only read and write their own primary document under `/users/{userId}`.
- A user can only see, add, update, or delete sub-collections (`guardians`, `emergencyContacts`, `alerts`, `journeys`, `settings`, `notifications`) under their matching `userId` root.
- Document IDs must conform to proper standard identifiers (`isValidId`).
- Email and phone lengths must not exceed boundaries to prevent buffer or database resource poisoning.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing on Create**: Attempting to upload a document to `/users/alice` with `request.auth.uid = bob`.
2. **Ghost Field updates**: Attempting to inject `isVerifiedUser: true` during update.
3. **Privilege Escalation**: Non-owner trying to list or modify Alice's emergency contacts.
4. **Denial of Wallet Recursive Read**: Querying `/users/{userId}/alerts` without user constraints, forcing backend cross-document lookups.
5. **Path Poisoning via Long ID**: Creating an alert with document ID `alert_12345...[representing 5KB of dummy chars]`.
6. **Immutable field alteration**: Modifying `createdAt` date on a user record after creation.
7. **Temporal Violation (Cheat Stamp)**: Sending a client timestamp set 10 days in the future for `createdAt`.
8. **Invalid Blood Group injection**: Injecting "C negative" as blood type.
9. **Priority Level Poisoning**: Injecting "super_extreme" priority level outside [high, medium, low].
10. **Empty Name Creation**: Creating a Guardian with `name = ""`.
11. **Orphaned Journey**: Creating a journey without standard starting/ending geographic coordinates.
12. **Foreign Setting Modification**: Bob trying to inject configuration flags into Alice's settings node, disabling automatic shake detection.

## 3. Test Cases (Mental & Rules Check)
The security rules compiled under `/firestore.rules` will explicitly block each pattern with `PERMISSION_DENIED`.
