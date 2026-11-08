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
const learnerSetting = (k) => { try { return fs.readFileSync(path.join(dir, "LEARNER.md"), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1].match(new RegExp(`^${k}:\\s*([^#\\r\\n]*?)\\s*(?:#.*)?$`, "m"))?.[1] } catch {} }
const out = (o) => { fs.writeSync(1, JSON.stringify({ hookSpecificOutput: o })); process.exit(0) }

if (ev === "start") {
	state.injected = ""
	// Sesi Claude Code aktif. Setelah /clear atau compact konteks sudah terpangkas, jadi gate /clear dilepas
	// (tidak bergantung pada apakah /clear membuat session_id baru).
	state.session = input.session_id ?? null
	if ((input.source === "compact" || input.source === "clear") && state.resume) state.resume.session = null
	fs.writeFileSync(sp, JSON.stringify(state))
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
	// Gate gambar: SVG di .alvar/visuals hanya atas permintaan pelajar (A gambar), kecuali LEARNER.md memilih figures: when_helpful.
	const cmd = String(ti.command ?? "")
	const svgWrite = (input.tool_name === "Write" || input.tool_name === "Edit") ? /\.alvar\/visuals\/[^"]*\.svg/.test(blob)
		: input.tool_name === "Bash" && /\.alvar[\\/]visuals[\\/][^\s"']*\.svg/.test(cmd) && /open\([^)]*\.svg["'],\s*["']w|>\s*\S*\.svg|\b(cp|mv|Copy-Item|Move-Item|Set-Content|Out-File)\b/.test(cmd)
	if (svgWrite && !state.figureOk && learnerSetting("figures") !== "when_helpful")
		deny("Gambar SVG hanya dibuat bila pelajar memintanya. Bila pelajar meminta gambar untuk node ini, jalankan A gambar <node> dulu (lesson-writer: tambahkan gambar=ya pada prompt); bila tidak, tulis materi tanpa gambar.")
	// Gate /clear: node baru ditolak di sesi yang sama dengan node yang baru tuntas (konteks lama ikut terbaca tiap giliran).
	// "next" tanpa id = CLI memilih node berikutnya, jadi diperlakukan sebagai node baru.
	// Cocokkan ke perintah asli, bukan blob: di blob tanda kutip menjadi /" sehingga `alvar.mjs" next` tidak terbaca.
	const m = input.tool_name === "Bash" && String(ti.command ?? "").match(/(?:alvar\.mjs['"]?|\bA)\s+next(?:\s+([A-Za-z0-9]+))?/)
	const nx = m && (m[1] ?? "(berikutnya)")
	const r = state.resume
	if (nx && r?.session && r.session === input.session_id && nx !== r.node && !blob.includes("--tanpa-clear"))
		deny(`Node ${r.node} sudah tuntas di sesi ini. Minta pelajar mengetik /clear lalu 'lanjut' (progres aman di .alvar; konteks lama tidak ikut terbaca). Bila pelajar menolak /clear, ulangi perintah dengan --tanpa-clear.`)
	if (input.tool_name === "AskUserQuestion" && state.phase === "teach" && !state.quizOpen)
		deny("Di fase teach, soal hanya lewat alvar quiz-next (jangan buat soal sendiri).")
}
process.exit(0)
