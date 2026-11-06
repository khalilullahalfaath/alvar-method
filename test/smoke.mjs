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
	: { type: s.type, concept: s.concept ?? (i % 2 ? "A.2" : "A.1"), angle: s.angle, question: "Soal " + s.type, options: ["a", "b", "c", "d"].map((v) => ({ label: `Pernyataan lengkap tentang konsep nomor ${v} dalam materi`, value: v, ...((s.type === "multi" ? ["a", "b"] : ["a"]).includes(v) ? {} : { misconception: "salah paham " + v }) })), correct: s.type === "multi" ? ["a", "b"] : ["a"], explanation: "pen" }) })
const slotsOf = () => JSON.parse(fs.readFileSync(qf, "utf8")).pending.slots
assert.match(run(JSON.stringify({ items: [] }), "quiz-save", "A"), /REJECT/)
assert.match(run(JSON.stringify(mk(slotsOf())), "quiz-save", "A"), /^ok/)

let nxt = run("", "quiz-next", "A")
assert.match(nxt, /^ASK/)
const items = JSON.parse(nxt.trim().split("\n").pop())
const wrongAns = Object.fromEntries(items.map((i) => [i.n, ["tidak tahu"]]))
assert.match(run(JSON.stringify(wrongAns), "quiz-ans", "A"), /TIDAK TAHU/)
// soal diketik (isian dan esai) ditanyakan sekaligus; jawab semuanya, minta penilaian, simpan hasil gagal
const doTyped = (r) => {
	const ns = [...r.matchAll(/^(\d+)\) /gm)].map((m) => m[1])
	for (const n of ns) run("jawaban saya", "essay-ans", "A", n)
	assert.match(run("", "quiz-next", "A"), /^GRADE/)
	const results = ns.map((n) => ({ n: +n, pass: false, criteria: [{ criterion: "a", core: true, met: false, evidence: "-" }], feedback: "kurang" }))
	return run(JSON.stringify({ results }), "typed-save", "A")
}
for (let g = 0; g < 4 && !/^TYPED/.test(nxt); g++) {          // soal pilihan bisa 5 -> dua batch AskUserQuestion
	nxt = run("", "quiz-next", "A")
	if (/^ASK/.test(nxt)) run(JSON.stringify(Object.fromEntries(JSON.parse(nxt.trim().split("\n").pop()).map((i) => [i.n, ["tidak tahu"]]))), "quiz-ans", "A")
}
assert.match(nxt, /^TYPED/)
assert.match(doTyped(nxt), /BELUM LULUS/)
assert.match(run("", "quiz-next", "A"), /pengganti/)                         // putaran 2
assert.match(run(JSON.stringify(mk(slotsOf())), "quiz-save", "A"), /^ok/)
let r
for (let g = 0; g < 6; g++) {
	r = run("", "quiz-next", "A")
	if (/^ASK/.test(r)) { const it = JSON.parse(r.trim().split("\n").pop()); run(JSON.stringify(Object.fromEntries(it.map((i) => [i.n, ["tidak tahu"]]))), "quiz-ans", "A") }
	else if (/^TYPED/.test(r)) doTyped(r)
	else break
}
assert.match(r, /^DONE/)
assert.match(fs.readFileSync(path.join(S, "2026-01-01-demo.md"), "utf8"), /### Kuis formatif A/)
assert.match(fs.readFileSync(path.join(M, "demo.md"), "utf8"), /\| A \|/)
assert.match(run("", "phase", "capstone", "demo"), /Capstone ditolak/)
// --- hook ---
const hook = (ev, o = {}) => execFileSync("node", [path.join(path.dirname(cli), "hook.mjs"), ev], { input: JSON.stringify({ cwd, ...o }), encoding: "utf8" })
assert.match(hook("pre", { tool_name: "Read", tool_input: { file_path: path.join(cwd, ".alvar", "quiz", "A.json") } }), /deny/)
assert.match(hook("pre", { tool_name: "Edit", tool_input: { file_path: path.join(cwd, ".alvar", "sessions", "x.md"), new_string: "review_verdict: READY" } }), /deny/)
assert.match(hook("pre", { tool_name: "AskUserQuestion", tool_input: {} }), /deny/)
assert.equal(hook("pre", { tool_name: "Bash", tool_input: { command: "node alvar.mjs next A" } }), "")
assert.equal(hook("prompt"), "")                       // aturan fase sudah disuntik oleh 'phase teach'
assert.match(hook("start"), /Alvar aktif/)
assert.match(hook("prompt"), /FASE TEACH/)             // setelah compact/resume, disuntik lagi sekali
assert.equal(hook("prompt"), "")
console.log("smoke ok")
