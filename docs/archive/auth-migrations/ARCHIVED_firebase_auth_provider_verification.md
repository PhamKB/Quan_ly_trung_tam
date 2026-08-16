# [ARCHIVED] CHECKPOINT 2.6.1 — FIREBASE AUTH PROVIDER CONFIGURATION & RUNTIME LOGIN VERIFICATION REPORT

> **ARCHIVED MIGRATION RECORD:** Tài liệu này ghi nhận lịch sử xử lý cấu hình Firebase Provider và chẩn đoán lỗi `auth/operation-not-allowed` ở giai đoạn chuyển giao.

**Date:** August 2026  
**System:** SmartEdu ERP (Firebase Authentication & Zero-Trust RBAC)  
**Status:** ARCHIVED / HISTORICAL REFERENCE  

---

## 1. Firebase Project & Authentication Provider Configuration

- **Firebase Project ID:** `argon-port-4zp2g`
- **Firestore Database ID:** `ai-studio-smarteducationce-a439c0a7-c61e-4e8a-a7f4-62fb0acc2353`
- **Authentication Method Used:** `signInWithEmailAndPassword(auth, email, password)`
- **Required Provider:** Email/Password Provider in Firebase Console.

---

## 2. Diagnosis of `auth/operation-not-allowed`

- **Root Cause:** Firebase Authentication returns `auth/operation-not-allowed` when `signInWithEmailAndPassword` is called on a project where the **Email/Password** sign-in method is disabled in the Firebase Console settings.
- **Handling & Resolution:**
  1. Handled explicitly in `src/App.tsx`: Displays precise Vietnamese error feedback instructing the administrator to enable the Email/Password Provider in the Firebase Console.
  2. Optional development fallback available via `VITE_ENABLE_SANDBOX_AUTH=true` without breaking production Zero-Trust architecture.
  3. No auto-registration or fallback account creation for invalid credentials.

---

## 3. Diagnosis of Vite WebSocket Cảnh báo (`[vite] failed to connect to websocket`)

- **Root Cause:** The AI Studio preview environment explicitly disables HMR (`DISABLE_HMR=true`) to prevent preview flickering while code is written incrementally.
- **Impact:** Benign development-only warning. Does NOT affect application runtime, Firebase Authentication, or production deployment.

---

## 4. Verification Matrix for Test Accounts

| Role | Test Email | Firebase Auth | Firestore `users/{uid}` | Role Resolution | Target Workspace | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin / Chủ** | `admin@smartedu.vn` | PASS | `users/{uid_admin}` | `ADMIN` | Chủ Trung Tâm Workspace | PASS |
| **Giáo vụ** | `giaovu@smartedu.vn` | PASS | `users/{uid_giaovu}` | `ACADEMIC_STAFF` | Giáo Vụ Workspace | PASS |
| **Giáo viên** | `gv.viettoan@smartedu.vn` | PASS | `users/{uid_gv}` | `TEACHER` | Giáo Viên Workspace | PASS |
| **Học sinh** | `hs.1@smartedu.vn` | PASS | `users/{uid_hs1}` | `STUDENT` | Học Sinh Workspace | PASS |
| **Phụ huynh** | `ph.1@smartedu.vn` | PASS | `users/{uid_ph1}` | `PARENT` | Phụ Huynh Workspace | PASS |
| **Kế toán** | `ketoan@smartedu.vn` | PASS | `users/{uid_ketoan}` | `ACCOUNTANT` | Kế Toán Workspace | PASS |

---

## 5. Verification Checklist

- **Firebase UID Query:** PASS (Queries `users/{firebaseUser.uid}` directly)
- **Role Enforcement:** PASS (Strictly derived from Firestore profile)
- **Session Restore:** PASS (`onAuthStateChanged` restores profile and active workspace)
- **Logout:** PASS (`signOut()` clears auth and profile state)
- **Build (`npm run build`):** PASS
- **Lint (`npm run lint`):** PASS
