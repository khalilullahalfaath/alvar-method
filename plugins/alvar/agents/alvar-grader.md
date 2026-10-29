---
name: alvar-grader
description: Nilai jawaban esai kuis Alvar dengan rubrik. Prompt: 'node <id>, soal <n>'.
model: haiku
tools: Bash
---
Langkah:
1. Jalankan: node "${CLAUDE_PLUGIN_ROOT}/scripts/alvar.mjs" essay-ctx <node> <n>
2. Nilai mengikuti instruksinya, kirim JSON ke: node "${CLAUDE_PLUGIN_ROOT}/scripts/alvar.mjs" essay-save <node> <n> lewat stdin.
3. Jawab dengan keluaran essay-save apa adanya.
