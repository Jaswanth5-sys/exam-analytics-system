# Online Quiz & Examination Analytics System

A complete, modern Online Quiz & Examination Analytics System powered by **MonetDB 11.55.9** as its primary and only database.

---

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Visual Analytics & Charts**: Recharts
- **Backend**: Node.js v24, Express, TypeScript
- **Database**: MonetDB 11.55.9 (Running locally on Windows via native MAPI protocol)
- **Authentication**: JWT, bcryptjs password hashing, Role-Based Access Control (RBAC)
- **Version Control**: Git

---

## 🏛️ System Architecture & MonetDB Integration

MonetDB operates on **port 50000** over its native socket protocol (**MAPI**).
The backend uses the official `monetdb` connector (`monetdb@2.2.0`) to run high-performance columnar aggregations and ACID transactional operations directly against MonetDB:

```
[ Browser / Client ] (React + Vite + Tailwind + Recharts :3000)
        │
        ▼ (HTTP REST + Bearer Token)
[ Express API Server ] (Node.js + TypeScript :5000)
        │
        ▼ (Native MAPI Protocol :50000)
[ MonetDB 11.55.9 ] (Column Store Database: demo)
```

### Normalized MonetDB Schema:
1. `app_users`: User identities, hashed credentials, roles (`admin`, `teacher`, `student`).
2. `subjects`: Academic departments and courses (`CS101`, `CS201`, `CS301`, `MATH101`).
3. `questions`: Multiple-choice question bank with difficulty tiers, points, and explanations.
4. `question_options`: Option choices linked to questions with correct flag.
5. `exams`: Scheduled examination definitions, time constraints, and grading policies.
6. `exam_questions`: Exam-to-question association with custom order and weightings.
7. `exam_attempts`: Student assessment attempts with server-synchronized timing and grading state.
8. `student_answers`: Individual responses, correctness evaluation, and awarded marks.

---

## 👥 User Roles & Capabilities

### 1. 🎓 Student (`student@exam.com` / `student123`)
- Browse available quizzes, time limits, and point values.
- Take timed exams with:
  - **Server-enforced countdown timer**.
  - **Question Palette**: Navigate easily with visual statuses (Answered: Green, Flagged for Review: Amber, Unanswered: Gray).
  - **Background Autosave**: Continually safeguards answers against disconnects.
  - **Automatic Expiration Submission**: Ensures timely evaluation when time expires.
  - **Answer Key Security**: Correct options and explanations are strictly withheld until permitted submission.
- View immediate scores, percentage, pass/fail status, and question-by-question explanations.
- Inspect chronological performance trends and subject mastery charts.

### 2. 👩‍🏫 Teacher (`teacher@exam.com` / `teacher123`)
- Maintain a comprehensive Question Bank filtered by subject and difficulty (Easy, Medium, Hard).
- Build and schedule exams with custom duration, passing threshold, and question shuffling.
- **Deep Exam Analytics (Recharts)**:
  - Score distribution histograms (0-20%, 21-40%, 41-60%, 61-80%, 81-100%).
  - Cohort Pass vs. Fail ratio pie chart.
  - Question-by-question accuracy and item difficulty bar chart.
  - Student attempt leaderboard and audit table.

### 3. 🛡️ Administrator (`admin@exam.com` / `admin123`)
- System-wide operations dashboard.
- User management directory: Provision, edit, or deactivate accounts.
- Subject catalog management: Add academic disciplines and codes.
- Global participation and academic health metrics.

---

## ⚡ Quick Start Instructions

### Prerequisites
- Node.js (v18+) & npm
- MonetDB 11.55.9 installed and running on port 50000 (`demo` database)

### Running the Application:

1. **Start the Backend**:
   ```bash
   cd server
   npm install
   npm run seed    # (Optional: Reseeds fresh demo data)
   npm run dev     # Starts Express server on http://localhost:5000
   ```

2. **Start the Frontend**:
   ```bash
   cd client
   npm install
   npm run dev     # Starts Vite on http://localhost:3000
   ```

3. Open **`http://localhost:3000`** in your browser.
4. Use the **1-Click Demo Accounts** or the **Role Switcher** in the top navigation bar to test Admin, Teacher, and Student features instantly.

---

## 🔒 Security Best Practices Implemented
- **Answer Masking**: Answer keys (`is_correct`) and learning explanations are strictly filtered out on the backend during active exams.
- **Server-Side Timing**: Exam start, end, and duration are verified server-side against MonetDB timestamps.
- **Credential Protection**: Passwords hashed with bcrypt; credentials stored in backend `.env` and never transmitted to the browser.
- **Injection Prevention**: Parameterized queries and sanitized escaping for MonetDB SQL statements.
