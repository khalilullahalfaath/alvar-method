#!/usr/bin/env node
// Hook Claude Code: gate keras (pre), suntik aturan fase hanya saat fase berganti (prompt), reset injeksi setelah compact/resume (start).
import fs from "node:fs"
import path from "node:path"
import { RULES } from "./rules.mjs"

const ev = process.argv[2]
let input = {}
try { input = JSON.parse(fs.readFileSync(0, "utf8")) } catch {}
const dir = path.join(input.cwd ?? process.cwd(), ".alvar")
if (!fs.existsSync(dir)) process.exit(0)
const sp = path.join(dir, "state.json")
const state = (() => { try { return JSON.parse(fs.readFileSync(sp, "utf8")) } catch { return {} } })()
const out = (o) => { console.log(JSON.stringify({ hookSpecificOutput: o })); process.exit(0) }

if (ev === "start") {
	if (state.injected) { state.injected = ""; fs.writeFileSync(sp, JSON.stringify(state)) }
} else if (ev === "prompt") {
	if (state.phase && state.injected !== state.phase) {
		state.injected = state.phase
		fs.writeFileSync(sp, JSON.stringify(state))
		out({ hookEventName: "UserPromptSubmit", additionalContext: RULES[state.phase] })
	}
} else if (ev === "pre") {
	const ti = input.tool_input ?? {}
	const blob = JSON.stringify(ti).replace(/\+/g, "/")
	const deny = (why) => out({ hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: why })
	if (/\.alvar\/(quiz\/|state\.json)/.test(blob)) deny("Berkas kunci kuis dan state hanya boleh diakses lewat perintah alvar.mjs.")
	if (/\.alvar\/sessions\//.test(blob) && /review_verdict:\s*READY/.test(blob) && state.phase !== "review")
		deny("review_verdict: READY hanya boleh ditulis saat fase review (alvar phase review, lalu audit).")
	if (input.tool_name === "AskUserQuestion" && state.phase === "teach" && !state.quizOpen)
		deny("Di fase teach, soal hanya lewat alvar quiz-next (jangan buat soal sendiri).")
}
process.exit(0)
