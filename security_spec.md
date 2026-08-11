# Security Specification & Threat Model (TDD)

## 1. Data Invariants & Authorization Boundaries
1. **Immutable Identifiers**: Primary key fields (`id`), link references (`studentId`, `classId`), and creation timestamps (`createdAt`) must never be modified once a document is created.
2. **Access Control Hierarchy**:
   - `ADMIN` / `OWNER` has full root access.
   - `ACADEMIC_STAFF` owns educational flow (classes, schedules, student profiles).
   - `TEACHER` manages scores and assignments for authorized sections.
   - `ACCOUNTANT` oversees financial ledgers (invoices, payments, expenses).
   - `STUDENT` and `PARENT` are restricted to read-only views of their own academic profiles and billing statements.
3. **Privilege Escalation Prevention**: Standard users are blocked from changing their own `role` or `status` attributes. Self-assigned privileges are rejected outright.

---

## 2. The "Dirty Dozen" Malicious Payload Scenarios
These payloads represent targeted attacks attempting to bypass identity verification, access restrictions, or validation checks.

| Case | Attacker Role | Target Collection | Payload Details | Expected Result |
|---|---|---|---|---|
| **01** | Student | `users/{attackerUid}` | Changing their own role to `'ADMIN'` | **PERMISSION_DENIED** |
| **02** | Academic Staff | `users/{newUid}` | Registering a new `'ADMIN'` user | **PERMISSION_DENIED** |
| **03** | Teacher | `expenses/{id}` | Accessing operating financial ledgers | **PERMISSION_DENIED** |
| **04** | Parent | `scores/{scoreId}` | Modifying grade value directly | **PERMISSION_DENIED** |
| **05** | Student | `auditLogs/{logId}` | Deleting or altering audit history logs | **PERMISSION_DENIED** |
| **06** | Anonymous | `classes/{classId}` | Injecting class item without auth | **PERMISSION_DENIED** |
| **07** | Accountant | `classes/{classId}` | Creating a new class record | **PERMISSION_DENIED** |
| **08** | Student | `invoices/{invoiceId}`| Editing invoice amounts | **PERMISSION_DENIED** |
| **09** | Teacher | `employees/{empId}` | Accessing salary / basic rate records | **PERMISSION_DENIED** |
| **10** | Student | `users/{id}` | Querying complete list of profiles | **PERMISSION_DENIED** |
| **11** | Teacher | `subjects/{id}` | Creating high-level course structures | **PERMISSION_DENIED** |
| **12** | Parent | `reports/{repId}` | Reading system operating reports | **PERMISSION_DENIED** |

---

## 3. Test Validation Plan
A custom test suite outlines checks on the standard Firestore rules structure. We enforce validation against these 12 vectors:
- All operations without a valid JSON Web Token (JWT) return `PERMISSION_DENIED`.
- Role verification checks fetch `users/{uid}` synchronously, preventing client spoofing.
- System audit records are structurally immutable to clients.
- Verification constraints require email validation check `email_verified == true`.
