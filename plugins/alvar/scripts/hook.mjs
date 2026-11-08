#!/usr/bin/env node
// Hook Claude Code: gate keras (pre), suntik aturan fase hanya saat fase berganti (prompt), reset injeksi setelah compact/resume (start).
import fs from "node:fs"
import path from "node:path"
import { RULES, ALVAR } from "./rules.mjs"

const ev = process.argv[2]
let input = {}
try { input = JSON.parse(fs.readFileSync(0, "utf8")) } catch {}
const dir = path.join(input.cwd ?? process.cwd(), ".alvar")
if (!fs.existsSync(dir)) process.exit(0)
const sp = path.join(dir, "state.json")
const state = (() => { try { return JSON.parse(fs.readFileSync(sp, "utf8")) } catch { return {} } })()
// writeSync: console.log ke pipe di Windows asinkron, process.exit sesudahnya membuang keluaran.
const out = (o) => { fs.writeSync(1, JSON.stringify({ hookSpecificOutput: o })); process.exit(0) }

if (ev === "start") {
	if (state.injected) { state.injected = ""; fs.writeFileSync(sp, JSON.stringify(state)) }
	const r = state.resume
	const resume = r && state.phase === "teach" ? `\nLanjutan Alvar (fase teach, topik ${r.topic}): node terakhir ${r.node}. ${r.next ? `Bila pelajar bilang lanjut: A next ${r.next} --topic=${r.topic}.` : "Semua node tuntas: A phase review."} Rencana dan status node: A show plan --topic=${r.topic}.` : ""
	out({ hookEventName: "SessionStart", additionalContext: `Alvar aktif. Bila CLAUDE_PLUGIN_ROOT tidak terisi, A = ${ALVAR}${resume}` })
} else if (ev === "prompt") {
	if (state.phase && state.injected !== state.phase) {
		state.injected = state.phase
		fs.writeFileSync(sp, JSON.stringify(state))
		out({ hookEventName: "UserPromptSubmit", additionalContext: RULES[state.phase] })
	}
} else if (ev === "pre") {
	const ti = input.tool_input ?? {}
	const blob = JSON.stringify(ti).replace(/\\+/g, "/")
	const deny = (why) => out({ hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: why })
	if (/\.alvar\/(quiz\/|state\.json)/.test(blob)) deny("Berkas kunci kuis dan state hanya boleh diakses lewat perintah alvar.mjs.")
	// File sesi menumpuk materi semua node; membacanya utuh membengkakkan konteks setiap giliran berikutnya.
	const SESS = "Jangan baca file sesi utuh. Pakai A show plan | A show <node>; untuk Edit, cari baris dengan Grep -n lalu Read dengan offset dan limit."
	if (input.tool_name === "Read" && /\.alvar\/sessions\/[^"]*\.md/.test(blob) && !ti.limit) deny(SESS)
	if (input.tool_name === "Bash" && /\b(cat|type|Get-Content)\s+[^|;&]*\.alvar\/sessions\//.test(blob)) deny(SESS)
	if (/\.alvar\/sessions\//.test(blob) && /review_verdict:\s*READY/.test(blob) && state.phase !== "review")
		deny("review_verdict: READY hanya boleh ditulis saat fase review (alvar phase review, lalu audit).")
	if (input.tool_name === "AskUserQuestion" && state.phase === "teach" && !state.quizOpen)
		deny("Di fase teach, soal hanya lewat alvar quiz-next (jangan buat soal sendiri).")
}
process.exit(0)
