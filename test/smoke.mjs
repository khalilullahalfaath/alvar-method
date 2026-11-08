// Smoke test alur lengkap CLI di folder sementara: node test/smoke.mjs
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import assert from "node:assert/strict"

const cli = path.join(import.meta.dirname, "..", "plugins", "alvar", "scripts", "alvar.mjs")
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "alvar-smoke-"))
const run = (input, ...a) => { try { return execFileSync("node", [cli, ...a], { cwd, input: input ?? "", encoding: "utf8" }) } catch (e) { return e.stdout + "[exit " + e.status + "]" } }
const S = path.join(cwd, ".alvar", "sessions"), M = path.join(cwd, ".alvar", "maps")
fs.mkdirSync(S, { recursive: true }); fs.mkdirSync(M, { recursive: true })
const tbl = (h) => `| ${h.join(" | ")} |\n|${h.map(() => "---").join("|")}|\n`
fs.writeFileSync(path.join(S, "2026-01-01-demo.md"), `---\ntopic: demo\nplan_version: 1\nnodes: [A, B]\n---\n# Sesi\n## Plan\nflowchart TD\n  A["A. satu"] --> B\n- **A**: A.1 satu; A.2 dua\n## Ledger\n${tbl(["subkonsep", "diajarkan di (anchor)", "item kuis", "tipe bukti (recognition/transfer)", "status"])}## Provenance\n${tbl(["id", "bagian materi", "evidence terdampak", "status"])}`)
fs.writeFileSync(path.join(M, "demo.md"), `---\nupdated: 2026-01-01\n---\n# Map\n## Node status (otomatis dari write_quiz)\n${tbl(["node", "status", "bukti", "sesi"])}`)

assert.match(run("", "phase", "teach"), /FASE TEACH/)
assert.match(run("", "format"), /^# Format materi node Alvar[\s\S]*Jelaskan balik/)   // sumber tunggal format terbaca lewat CLI
assert.match(run("", "next", "A"), /alvar lesson|A lesson/)
assert.match(run("", "next", "B"), /Ditolak oleh DAG.*A/)            // gate DAG: pendahulu A belum known
assert.match(run("", "next", "B", "--lewati"), /DAG dilewati/)       // dilewati eksplisit
const JB = "\n\n**Jelaskan balik**\n1. Mengapa?\n2. Apa yang rusak bila syaratnya dibuang?"
assert.match(run("### A.1 Satu\nisi" + JB, "lesson", "A"), /belum lengkap/)          // gate subkonsep
assert.match(run("### A.1\nisi\n### A.2\nisi", "lesson", "A"), /heading subkonsep tanpa judul/) // gate struktur: judul wajib
assert.match(run("### A.1 Satu\nisi\n### A.2 Dua\nisi", "lesson", "A"), /Jelaskan balik/)       // gate struktur: teach-back wajib
assert.match(run("### A.1 Satu\nisi\n#### 1. Bagian\nisi\n### A.2 Dua\nisi" + JB, "lesson", "A"), /^ok A/) // #### tidak dianggap heading subkonsep
assert.match(run("", "quiz-next", "A"), /belum lolos audit/)                 // gate audit
assert.match(run('{"issues":[]}', "audit-save", "A"), /tidak ada masalah fakta/)
assert.match(run("", "quiz-next", "A"), /WRITE/)

const qf = path.join(cwd, ".alvar", "quiz", "A.json")
const mk = (slots) => ({ lesson_issue: "", items: slots.map((s, i) => s.type === "essay"
	? { type: "essay", concept: s.concept ?? (i % 2 ? "A.2" : "A.1"), angle: s.angle, question: "Jelaskan A.1 dengan contoh.", rubric: ["a", "b"], model_answer: "x" }
	: s.type === "cloze"
	? { type: "cloze", concept: s.concept ?? (i % 2 ? "A.2" : "A.1"), angle: s.angle, question: "Nilai ____ adalah hasil dari konsep A.1.", rubric: ["a"], model_answer: "x" }
	: { type: s.type, concept: s.concept ?? (i % 2 ? "A.2" : "A.1"), angle: s.angle, question: "Soal " + s.type + " tentang $\\frac{x_{i}^{2}}{n}$", options: ["a", "b", "c", "d"].map((v) => ({ label: `Pernyataan lengkap tentang konsep $\\alpha_${v}$ dalam materi`, value: v, ...((s.type === "multi" ? ["a", "b"] : ["a"]).includes(v) ? {} : { misconception: "salah paham " + v }) })), correct: s.type === "multi" ? ["a", "b"] : ["a"], explanation: "pen" }) })
const slotsOf = () => JSON.parse(fs.readFileSync(qf, "utf8")).pending.slots
assert.match(run(JSON.stringify({ items: [] }), "quiz-save", "A"), /REJECT/)
const asciiSet = mk(slotsOf()); asciiSet.items[0].question = "Berapa x^2 bila x = 3?"
assert.match(run(JSON.stringify(asciiSet), "quiz-save", "A"), /REJECT[\s\S]*harus LaTeX/)       // log wajib LaTeX
assert.match(run(JSON.stringify(mk(slotsOf())), "quiz-save", "A"), /^ok/)

let nxt = run("", "quiz-next", "A")
assert.match(nxt, /^ASK/)
const items = JSON.parse(nxt.trim().split("\n").pop())
assert.match(items[0].q, /\(x_i\^2\)\/\(n\)/); assert.doesNotMatch(nxt, /\$/)  // terminal: ASCII
assert.match(items[0].opts[0], /konsep alpha_[a-d] dalam/)
// jawaban dengan label ASCII (yang tampil) tetap dikenali; sisanya "tidak tahu"
const wrongAns = Object.fromEntries(items.map((i, k) => [i.n, k ? ["tidak tahu"] : [i.opts[0]]]))
// Perintah simpan menempelkan langkah berikutnya; tutor mengikutinya tanpa quiz-next lagi.
const step = (out) => out.includes("\n---\nLangkah berikutnya") ? out.split("\n---\nLangkah berikutnya")[1].replace(/^[^\n]*\n/, "") : out
nxt = step(run(JSON.stringify(wrongAns), "quiz-ans", "A"))
assert.match(nxt, /^(ASK|TYPED)/)
// soal diketik (isian dan esai) ditanyakan sekaligus; semua jawaban disimpan dalam satu panggilan, penilaian sekali jalan
const doTyped = (r) => {
	const ns = [...r.matchAll(/^(\d+)\) /gm)].map((m) => m[1])
	assert.match(step(run(JSON.stringify(Object.fromEntries(ns.map((n) => [n, "jawaban saya"]))), "essay-ans", "A")), /^GRADE/)
	const results = ns.map((n) => ({ n: +n, pass: false, criteria: [{ criterion: "a", core: true, met: false, evidence: "-" }], feedback: "kurang" }))
	return run(JSON.stringify({ results }), "typed-save", "A")
}
const ask = (r) => run(JSON.stringify(Object.fromEntries(JSON.parse(r.trim().split("\n").pop()).map((i) => [i.n, ["tidak tahu"]]))), "quiz-ans", "A")
for (let g = 0; g < 4 && /^ASK/.test(nxt); g++) nxt = step(ask(nxt))   // soal pilihan bisa 5 -> dua batch AskUserQuestion
assert.match(nxt, /^TYPED/)
const typedOut = doTyped(nxt)
assert.match(typedOut, /BELUM LULUS/)
assert.match(step(typedOut), /pengganti/)                                    // putaran 2, langsung dari typed-save
assert.match(run(JSON.stringify(mk(slotsOf())), "quiz-save", "A"), /^ok/)
let r = run("", "quiz-next", "A")
for (let g = 0; g < 6; g++) {
	if (/^ASK/.test(r)) r = step(ask(r))
	else if (/^TYPED/.test(r)) r = step(doTyped(r))
	else break
}
assert.match(r, /^DONE/)
assert.doesNotMatch(r, /KONTEKS/)                                            // node belum tuntas: tidak diajak /clear
assert.match(run("", "show", "plan"), /flowchart TD[\s\S]*Node status \(map\)[\s\S]*\| A \|/)
const shown = run("", "show", "A")
assert.match(shown, /### A\.1 Satu/); assert.doesNotMatch(shown, /Kuis formatif/) // materi saja, tanpa kuis
const log = fs.readFileSync(path.join(S, "2026-01-01-demo.md"), "utf8")
assert.match(log, /### Kuis formatif A/)
assert.match(log, /\$\\frac\{x_\{i\}\^\{2\}\}\{n\}\$/)                       // file sesi: LaTeX asli
assert.match(log, /Dijawab: Pernyataan lengkap tentang konsep \$\\alpha_[a-d]\$/) // label ASCII dicocokkan ke label LaTeX
assert.match(fs.readFileSync(path.join(M, "demo.md"), "utf8"), /\| A \|/)
assert.match(run("", "phase", "capstone", "demo"), /Capstone ditolak/)
// --- hook ---
const hook = (ev, o = {}) => execFileSync("node", [path.join(path.dirname(cli), "hook.mjs"), ev], { input: JSON.stringify({ cwd, ...o }), encoding: "utf8" })
assert.match(hook("pre", { tool_name: "Read", tool_input: { file_path: path.join(cwd, ".alvar", "quiz", "A.json") } }), /deny/)
assert.match(hook("pre", { tool_name: "Edit", tool_input: { file_path: path.join(cwd, ".alvar", "sessions", "x.md"), new_string: "review_verdict: READY" } }), /deny/)
assert.match(hook("pre", { tool_name: "AskUserQuestion", tool_input: {} }), /deny/)
assert.equal(hook("pre", { tool_name: "Bash", tool_input: { command: "node alvar.mjs next A" } }), "")
const sessF = path.join(S, "2026-01-01-demo.md")
assert.match(hook("pre", { tool_name: "Read", tool_input: { file_path: sessF } }), /deny.*A show/)   // file sesi utuh ditolak
assert.equal(hook("pre", { tool_name: "Read", tool_input: { file_path: sessF, offset: 10, limit: 40 } }), "")
assert.match(hook("pre", { tool_name: "Bash", tool_input: { command: "cat .alvar/sessions/2026-01-01-demo.md" } }), /deny/)
assert.equal(hook("prompt"), "")                       // aturan fase sudah disuntik oleh 'phase teach'
assert.match(hook("start"), /Alvar aktif[\s\S]*node terakhir A[\s\S]*A next A --topic=demo/) // lanjutan setelah /clear
assert.match(hook("prompt"), /FASE TEACH/)             // setelah compact/resume, disuntik lagi sekali
assert.equal(hook("prompt"), "")
console.log("smoke ok")
