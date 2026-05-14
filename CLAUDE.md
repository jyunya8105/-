# CLAUDE.md

## Project Overview

This repository is a **勤怠管理・給与計算システム** (Attendance Management & Salary Calculation System).

**Core purpose (from README):** 勤怠管理、修正、給料の算出  
(Attendance tracking, correction/adjustment, and salary computation)

## Repository State

This project is in its initial phase. Only a README.md exists so far. All feature development is ahead.

## Intended Functionality

Based on the project description, the system is expected to handle:

1. **勤怠管理 (Attendance Management)** — Recording employee check-in/check-out times, work hours, absences, and leave.
2. **修正 (Correction/Adjustment)** — Allowing amendments to attendance records (e.g., missed clock-ins, overtime corrections).
3. **給料の算出 (Salary Calculation)** — Computing salaries based on attendance data, including overtime, deductions, and allowances.

## Branch Strategy

- **`main`** — Stable, production-ready code.
- **Feature branches** — Use `feature/<description>` naming for new features.
- **Claude branches** — AI-assisted work uses `claude/<description>` (e.g., `claude/add-claude-documentation-GHvnM`).

Always develop on the designated branch; never push directly to `main` without review.

## Development Guidelines

### General Conventions

- Write code and comments in **Japanese or English** (the project has Japanese-language domain terms; keep domain terminology in Japanese where it aids clarity).
- Prefer **explicit, readable code** over clever one-liners.
- Keep functions small and focused on a single responsibility.
- No dead code — remove unused variables, imports, and functions.

### Commit Messages

Use concise, imperative-mood commit messages that describe *why*, not just *what*:

```
Add overtime calculation logic for hourly employees
Fix incorrect rounding in monthly salary computation
```

Avoid vague messages like "fix bug" or "update file".

### No Premature Abstraction

Don't add layers of abstraction until there are at least three concrete use cases. Build the simplest thing that works first.

### Security Considerations

- Employee salary and attendance data is **sensitive PII** — never log or expose it unnecessarily.
- Validate all user input at system boundaries (API endpoints, form submissions).
- Do not hardcode credentials, API keys, or secrets; use environment variables.

### Testing

- Write tests for all business logic, especially salary calculation rules (edge cases: overtime thresholds, holiday pay, leave deductions).
- Test data should use clearly fictional names and values.

## Key Domain Terms (Japanese ↔ English)

| Japanese | English |
|----------|---------|
| 勤怠管理 | Attendance management |
| 出勤 | Clock-in / check-in |
| 退勤 | Clock-out / check-out |
| 残業 | Overtime |
| 有給休暇 | Paid leave |
| 欠勤 | Absence |
| 給与 / 給料 | Salary / wages |
| 控除 | Deduction |
| 手当 | Allowance / benefit |
| 締め日 | Pay period cutoff date |
| 支払日 | Pay date |

## AI Assistant Notes

- This codebase does not yet have a chosen tech stack. When implementing features, **ask the user** which language/framework to use before writing code.
- Do not invent or assume business rules (e.g., overtime rates, tax calculation methods) — confirm with the user; Japanese labor law rules may apply.
- When editing existing files, always read them first.
- Prefer editing existing files over creating new ones.
- Do not create documentation files unless explicitly requested.
