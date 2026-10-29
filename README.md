# alvar-local

Port native metode Alvar dari pi ke Claude Code (tanpa MCP).

- `skills/`: teach, probe, learn-profile, learn-verify, learn-visual
- `agents/`: auditor, clarifier, quiz-writer, grader, plan-reviewer (konteks bersih, tiap model sendiri)
- `hooks/` + `scripts/hook.mjs`: gate keras + suntik aturan fase hanya saat fase berganti
- `scripts/alvar.mjs`: CLI pencatat sesi/Ledger/map dan kuis (kunci soal tidak pernah masuk konteks tutor)
- Logika murni dipakai bersama pi dari `~/.pi-learn-tools/alvar-core.js` (override: `ALVAR_CORE`)

Pasang: `claude plugin marketplace add C:/Users/HP/alvar-marketplace` lalu `claude plugin install alvar@alvar-local`.
