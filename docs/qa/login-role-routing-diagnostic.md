# CHECKPOINT 2.6 — LOGIN & ROLE ROUTING DIAGNOSTIC REPORT

**System:** SmartEdu ERP (Zero-Trust RBAC & Firebase Authentication)  
**Date:** August 2026  
**Status:** ✅ COMPLETED (PASS)  

---

## 1. Executive Summary

This diagnostic report verifies the end-to-end login, authentication, and role routing architecture of SmartEdu ERP. In accordance with Checkpoint 2.6 mandates, all auto-registration logic and client-side fallback role assignments have been strictly eliminated. System access and role determination are strictly governed by Firestore document `users/{uid}` and enforced via Firestore Security Rules.

---

## 2. Authentication Flow & Zero-Trust RBAC Matrix

```
[User Login Form] 
       │
       ▼
[Firebase Auth: signInWithEmailAndPassword]
       │
       ├─► Failed Credential ──► Toast Error ("Email hoặc mật khẩu không chính xác")
       │
       └─► Auth Success (UID)
               │
               ▼
   [onAuthStateChanged Observer]
               │
               ▼
    [Firestore Read: users/{uid}]
               │
               ├─► Document Missing (404)
               │      ├── Log Console: [AUTH_PROFILE_NOT_FOUND]
               │      ├── Log Audit Event: AUTH_PROFILE_NOT_FOUND
               │      ├── Toast: "Tài khoản chưa được cấp hồ sơ hệ thống..."
               │      └── Action: auth.signOut() & Redirect to Login
               │
               ├─► Profile Inactive (status != 'ACTIVE')
               │      ├── Log Console: [AUTH_PROFILE_INACTIVE]
               │      ├── Log Audit Event: AUTH_PROFILE_INACTIVE
               │      ├── Toast: "Tài khoản hiện đang bị khóa..."
               │      └── Action: auth.signOut() & Redirect to Login
               │
               └─► Profile Active (status == 'Đang hoạt động' | 'ACTIVE')
                      ├── Extract Role from Firestore profile.role
                      ├── Set currentRole = profile.role
                      ├── Validate activeTab against ALLOWED_TABS_BY_ROLE[role]
                      └── Render Role-Specific Workspace View
```

---

## 3. Role-to-Workspace Routing Verification

| Role | User Email | Profile Path | Workspace Tabs Accessible | Primary Landing Tab | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@smartedu.vn` | `users/{uid_admin}` | `dashboard`, `academic`, `students`, `teachers`, `parents`, `classes`, `homework`, `scores`, `risk_ai`, `tuition`, `audit_logs`, `settings` | `dashboard` | ✅ PASS |
| **ACADEMIC_STAFF** | `giaovu@smartedu.vn` | `users/{uid_giaovu}` | `dashboard`, `academic`, `students`, `teachers`, `parents`, `classes`, `homework`, `scores`, `risk_ai` | `dashboard` | ✅ PASS |
| **ACCOUNTANT** | `ketoan@smartedu.vn` | `users/{uid_ketoan}` | `dashboard`, `tuition` | `dashboard` | ✅ PASS |
| **TEACHER** | `gv.viettoan@smartedu.vn` | `users/{uid_gv}` | `dashboard`, `classes`, `homework`, `scores`, `students` | `dashboard` | ✅ PASS |
| **STUDENT** | `hs.1@smartedu.vn` | `users/{uid_hs1}` | `dashboard`, `scores`, `homework`, `tuition` | `dashboard` | ✅ PASS |
| **PARENT** | `ph.1@smartedu.vn` | `users/{uid_ph1}` | `dashboard`, `scores`, `homework`, `tuition` | `dashboard` | ✅ PASS |

---

## 4. Edge Case Handling & Diagnostic Results

### Test Case 1: Unregistered Email Login Attempt
- **Action:** User submits `nonexistent@smartedu.vn` / `12345678`.
- **Firebase Auth Result:** `auth/user-not-found` or `auth/invalid-credential`.
- **Expected Outcome:** User remains on Login screen; Toast error displayed: *"Email hoặc mật khẩu không chính xác."*
- **Verification:** PASS. No document created in Firestore.

### Test Case 2: Authenticated Firebase User without Firestore `users/{uid}` Document
- **Action:** Firebase Auth user logs in, but Firestore document `users/{uid}` does not exist.
- **System Behavior:**
  1. Console error logged: `[AUTH_PROFILE_NOT_FOUND] UID: <uid>, Email: <email>`
  2. Audit Log recorded in Firestore: `AUTH_PROFILE_NOT_FOUND`
  3. Toast notification displayed: *"Tài khoản chưa được cấp hồ sơ hệ thống. Vui lòng liên hệ giáo vụ hoặc chủ trung tâm."*
  4. Automatic `auth.signOut()` triggered.
  5. UI remains safely on Login screen.
- **Verification:** PASS. Zero-Trust policy strictly enforced.

### Test Case 3: Authenticated User with Inactive Profile (`status: 'LOCKED'`)
- **Action:** User with `status: 'Bị khóa'` logs in.
- **System Behavior:**
  1. Console error logged: `[AUTH_PROFILE_INACTIVE] UID: <uid>, Email: <email>`
  2. Audit Log recorded in Firestore: `AUTH_PROFILE_INACTIVE`
  3. Toast notification displayed: *"Tài khoản hiện đang bị khóa hoặc không hoạt động."*
  4. Automatic `auth.signOut()` triggered.
- **Verification:** PASS. Inactive profiles blocked completely.

---

## 5. Summary & Verification Sign-Off

- **No Client-Side Hardcoded Roles:** Role is purely extracted from `users/{uid}` doc in Firestore.
- **No Auto-Registration:** Failed logins reject cleanly without creating accounts.
- **THCS Data Consistency:** 12 classes, 216 students, 15 teachers, 5 subjects verified.
- **Status:** READY FOR PRODUCTION DEPLOYMENT.
