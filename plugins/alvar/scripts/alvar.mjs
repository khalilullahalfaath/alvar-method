#!/usr/bin/env node
// alvar CLI: pengganti tool pi (alvar-tools.ts) untuk Claude Code. Logika murni tetap di alvar-core.js (dibagi dengan pi).
// Subagent mengerjakan bagian "model kuat berkonteks bersih"; CLI ini mengerjakan semua yang harus deterministik (gate, catat, nilai).
// ponytail: core diimpor dari ~/.pi-learn-tools (satu sumber kebenaran). Kalau pi dibuang, salin alvar-core.js ke folder ini dan ubah CORE.
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { pathToFileURL } from "node:url"
import { RULES } from "./rules.mjs"

const CORE = process.env.ALVAR_CORE || path.join(os.homedir(), ".pi-learn-tools", "alvar-core.js")
const C = await import(pathToFileURL(CORE).href)
const {
	composeSlots, scoreEssay, scoreMulti, conceptStatus, extractJson, insertAfterNode, isAscii, lessonOnly, nodeSection, nodeStatus,
	upsertRow, validateItems, transferEntry, transferFor, ledgerStatus, remedialStatus, resolvedFor, nodeStatusFromFile, consistencyIssues,
	topicOf, checklistOf, flag, QUIZ_SYSTEM, GRADE_SYSTEM, CLARIFY_SYSTEM, AUDIT_SYSTEM, itemBlock, capstoneGate, shuffle,
	ensureNodeHeading, nextLessonStep, equivalentNote, stripNodeHeading, missingSubconcepts, checklistIds, lessonStructureIssues,
} = C

const CWD = process.env.ALVAR_CWD || process.cwd()
const A = path.join(CWD, ".alvar")
const args = process.argv.slice(2)
const TOPIC = args.find((a) => a.startsWith("--topic="))?.slice(8)
const REMEDIAL = args.includes("--remedial")
const [cmd, ...pos] = args.filter((a) => !a.startsWith("--"))
const say = (s) => console.log(s)
const die = (s) => { fs.writeSync(1, s + "\n"); process.exit(1) } // writeSync: console.log ke pipe Windows asinkron, exit membuang keluaran
const stdin = () => fs.readFileSync(0, "utf8")
const today = () => new Date().toISOString().slice(0, 10)

const state = (() => { try { return JSON.parse(fs.readFileSync(path.join(A, "state.json"), "utf8")) } catch { return {} } })()
const saveState = () => { fs.mkdirSync(A, { recursive: true }); fs.writeFileSync(path.join(A, "state.json"), JSON.stringify(state)) }

function sessionFile(topic = TOPIC) {
	const dir = path.join(A, "sessions")
	try {
		const fl = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && (!topic || f.endsWith("-" + topic + ".md")))
		fl.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs)
		return fl.length ? path.join(dir, fl[0]) : null
	} catch { return null }
}
const needFile = () => sessionFile() ?? die("File sesi tidak ditemukan di .alvar/sessions.")
const read = (f) => fs.readFileSync(f, "utf8")
const akey = (file, node) => `${path.basename(file)}:${node}`
const audited = (file, node) => state.audit?.[akey(file, node)]

function consistencyGate() {
	const file = sessionFile()
	const tp = TOPIC ?? (file ? topicOf(read(file)) : "")
	const mapFile = path.join(A, "maps", tp + ".md")
	if (!file || !fs.existsSync(mapFile)) return
	const issues = consistencyIssues(read(file), read(mapFile))
	if (issues.length) die(`Ditolak: Ledger, sesi, dan map tidak sinkron. Perbaiki dulu:\n- ${issues.join("\n- ")}`)
}

// Instruksi CLI untuk tutor: nama tool pi diganti perintah Claude Code.
const toCC = (s) => s.replace(/write_lesson/g, "A lesson").replace(/audit_lesson\("([^"]+)"\)/g, "alvar-auditor (node $1)").replace(/write_quiz/g, "A quiz-next")

const REVIEW_SYSTEM = `Kamu reviewer rencana belajar yang independen dan skeptis. Kamu TIDAK menulis ulang rencana dan TIDAK mengajar. Nilai rencana (DAG mermaid + checklist subkonsep) terhadap tujuan dan profil pelajar.
Periksa: (1) akar DAG benar: prasyarat nyata tidak hilang, tidak ada node yang bergantung pada sesuatu yang belum diajarkan; (2) arah panah masuk akal, tidak ada siklus; (3) cakupan: apa yang standar untuk tujuan ini tapi tidak ada di rencana, dan node yang tidak perlu; (4) granularitas: satu node = satu langkah penalaran; (5) kecocokan dengan profil pelajar; (6) klaim faktual yang meragukan.
Format: baris pertama "VERDICT: APPROVE" atau "VERDICT: REVISE", lalu temuan berkode (P-GAP, P-ORDER, P-SCOPE, P-GRAIN, P-FIT, P-FACT), satu-dua kalimat dengan saran konkret. Ringkas, Bahasa Indonesia, ASCII saja. Jangan memuji.`
const QUIZ_CC = QUIZ_SYSTEM + `\nBatas alat: maksimal 4 opsi per soal (single: 3-4 opsi; multi: 4 opsi dengan 2-3 kunci). Label opsi singkat dan unik.`

// ---------- kuis ----------
const qpath = (node) => path.join(A, "quiz", `${node}.json`)
const qload = (node) => { try { return JSON.parse(read(qpath(node))) } catch { return die(`Kuis ${node} belum dimulai. Jalankan: quiz-next ${node}`) } }
const qsave = (q) => { fs.mkdirSync(path.dirname(qpath(q.node)), { recursive: true }); fs.writeFileSync(qpath(q.node), JSON.stringify(q)) }
const result = (i) => ({ it: i.it, n: i.n, round: i.round, ...i.ans })
const conceptLabel = (text, node, c) => {
	const m = nodeSection(text, node)?.match(new RegExp("^### " + c.replace(".", "\\.") + "\\s+(.+?)\\s*$", "m"))
	return m ? `${c} ${m[1].replace(/\|/g, "/")}` : c
}
const checkIds = (text, node) => checklistIds(text, node)
// Subkonsep di checklist yang belum punya baris Ledger dihitung terbuka (belum diuji), bukan dianggap locked.
const OPEN_LOCKED = (text, node) => {
	const l = ledgerStatus(text, node)
	const unseen = checkIds(text, node).filter((c) => !l.has(c))
	return { size: l.size + unseen.length, map: l, open: [...[...l.entries()].filter(([, st]) => st !== "locked").map(([c]) => c), ...unseen] }
}

function quizGate(node, remedial) {
	consistencyGate()
	const file = needFile()
	const t = read(file)
	const lesson = nodeSection(t, node)
	if (!lesson) die(`Ditolak: bagian "## Node ${node}" belum ada. Tulis materinya dulu (A lesson).`)
	if (audited(file, node) !== lessonOnly(lesson)) die(`Ditolak: materi ${node} belum lolos audit tanpa temuan (atau berubah sejak audit). Spawn alvar-auditor (node ${node}).`)
	return { file, t, lesson }
}

const TRANSFER_ANGLES = ["membedakan", "hitungan", "contoh tandingan", "penerapan kasus baru"]
function targetedSlots(k) {
	const angles = shuffle(TRANSFER_ANGLES)
	return [...Array(k).fill("single"), "essay"].map((type, i) => ({ type, angle: angles[i % angles.length] }))
}

function startQuiz(node) {
	const { file, t } = quizGate(node, REMEDIAL)
	const l = OPEN_LOCKED(t, node)
	if (REMEDIAL) {
		if (!l.open.length) die(`Semua subkonsep ${node} sudah locked; tidak ada remedial.`)
		if (l.open.length * 2 > l.size) die(`Remedial ditolak: ${l.open.length} dari ${l.size} subkonsep belum locked (>50%). Pakai quiz-next ${node} tanpa --remedial.`)
		const slots = l.open.slice(0, 2).map((c) => ({ type: "single", angle: "penerapan kasus baru", concept: c }))
		return { node, kind: "remedial", file: path.basename(file), items: [], pending: { round: 3, slots, extra: `## Fokus: remedial untuk subkonsep yang belum locked. Field "concept" harus sama dengan slot.` } }
	}
	if (l.size && !l.open.length) die(`Semua subkonsep ${node} sudah locked di Ledger; tidak ada yang perlu diuji ulang.`)
	const concepts = l.open.length ? l.open : checkIds(t, node)
	// Ulang terarah (sebagian subkonsep sudah locked): satu butir transfer per subkonsep yang tersisa + satu esai, bukan kuis penuh.
	// Terarah hanya bila SEBAGIAN subkonsep sudah locked. Node baru (belum ada baris Ledger) semua subkonsepnya "terbuka", tetapi itu kuis penuh (composeSlots).
	const partial = l.open.length > 0 && l.open.length < l.size
	const slots = partial ? targetedSlots(l.open.length) : composeSlots(Math.random, concepts.length)
	const focus = partial ? `## Fokus: hanya subkonsep yang belum locked (${l.open.join("; ")}). Field "concept" harus salah satu dari daftar itu.
` : ""
	const cover = concepts.length ? `## Cakupan wajib
Subkonsep: ${concepts.join(", ")}. Setiap subkonsep diuji minimal satu butir, dan minimal satu butirnya bersudut selain "definisi" (syarat locked). Field "angle" tiap butir harus sama dengan slotnya. Penugasan slot ke subkonsep terserah kamu, tapi pastikan tiap subkonsep dapat satu slot non-definisi. Set yang melanggar ditolak.` : ""
	return { node, kind: "quiz", file: path.basename(file), composition: slots.map((s) => s.type), items: [], pending: { round: 1, slots, concepts, extra: focus + cover } }
}

function finalize(q) {
	const { node } = q
	const file = path.join(A, "sessions", q.file)
	const results = q.items.map(result)
	let t = read(file)
	const mapRel = () => { const tp = topicOf(t); return tp && path.join(A, "maps", tp + ".md") }
	const stamp = (m) => m.replace(/^updated:.*$/m, `updated: ${today()}`)
	const NODE_HDR = ["node", "status", "bukti", "sesi"]
	const LEDGER_HDR = ["subkonsep", "diajarkan di (anchor)", "item kuis", "tipe bukti (recognition/transfer)", "status"]
	let line
	if (q.kind === "remedial") {
		const prev = ledgerStatus(t, node)
		t = insertAfterNode(t, node, `### Remedial ${node}\n\n${results.map((r) => itemBlock(node, r.it, r.n, r.round, r, "R")).join("\n\n")}`)
		for (const c of new Set(results.map((r) => r.it.concept))) {
			const mine = results.filter((r) => r.it.concept === c)
			const kind = mine.some((r) => r.ok && r.it.angle !== "definisi") ? "transfer" : "recognition"
			const st = remedialStatus(prev.get(c) ?? "edge", mine.map((r) => ({ concept: c, angle: r.it.angle, ok: r.ok, round: 3 })))
			t = upsertRow(t, "Ledger", LEDGER_HDR, [conceptLabel(t, node, c), `Node ${node}`, mine.map((r) => `R${r.n}${r.ok ? "" : "x"}`).join(" "), kind, st], [0, 1])
		}
		fs.writeFileSync(file, t)
		const mf = mapRel()
		if (mf && fs.existsSync(mf)) fs.writeFileSync(mf, stamp(upsertRow(read(mf), "Node status (otomatis dari write_quiz)", NODE_HDR, [node, nodeStatusFromFile(t, node), `remedial ${results.filter((r) => r.ok).length}/${results.length} benar`, `[[${path.basename(file, ".md")}]]`], [0])))
		line = `Remedial ${node} selesai dan dicatat.\n${results.map((r) => `R${r.n} (${r.it.concept}): ${r.dontKnow ? "tidak tahu" : r.ok ? "benar" : "salah"}`).join("\n")}\nMasih edge: jelaskan bagian lemah, tawarkan remedial lagi.`
	} else {
		t = insertAfterNode(t, node, `### Kuis formatif ${node} (komposisi: ${q.composition.join(", ")})\n\n${results.map((r) => itemBlock(node, r.it, r.n, r.round, r)).join("\n\n")}`)
		const flat = results.map((r) => ({ concept: r.it.concept, type: r.it.type, angle: r.it.angle, ok: r.ok, round: r.round }))
		const cs = conceptStatus(flat)
		for (const [c, st] of Object.entries(cs)) {
			const kind = results.some((r) => r.it.concept === c && r.ok && r.it.angle !== "definisi") ? "transfer" : "recognition"
			t = upsertRow(t, "Ledger", LEDGER_HDR, [conceptLabel(t, node, c), `Node ${node}`, results.filter((r) => r.it.concept === c).map((r) => `Q${r.n}${r.ok ? "" : "x"}`).join(" "), kind, st], [0, 1])
		}
		if (q.issue) t = flag(t, node, "write_quiz", q.issue)[0]
		fs.writeFileSync(file, t)
		const untested = checkIds(t, node).filter((c) => !ledgerStatus(t, node).has(c))
		const ns = untested.length ? "edge" : nodeStatus(flat)
		const mf = mapRel()
		if (mf && fs.existsSync(mf)) fs.writeFileSync(mf, stamp(upsertRow(read(mf), "Node status (otomatis dari write_quiz)", NODE_HDR, [node, ns, `${results.filter((r) => r.ok).length}/${results.length} benar`, `[[${path.basename(file, ".md")}]]`], [0])))
		const gaps = Object.entries(cs).filter(([c, st]) => st === "edge" && results.filter((r) => r.it.concept === c).every((r) => r.ok) && !results.some((r) => r.it.concept === c && r.ok && r.it.angle !== "definisi")).map(([c]) => c)
		const gapNote = gaps.length ? `\nASSESSMENT_GAP: ${gaps.join(", ")} edge walau semua jawaban benar karena butir soalnya hanya bersudut "definisi". Ini celah soal, bukan celah pelajar. Jangan bebankan ke pelajar; jalankan quiz-next lagi hanya untuk subkonsep itu dan catat di ## Provenance (K-AMBIG).` : ""
		line = `Kuis ${node} selesai; dicatat ke sesi, Ledger, map.\n${results.map((r) => `Q${r.n} (${r.it.type}, ${r.it.concept}): ${r.dontKnow ? "tidak tahu" : r.ok ? "benar" : "salah"}${r.round === 2 ? " [pengganti]" : ""}`).join("\n")}\nStatus node: ${ns}. Subkonsep: ${JSON.stringify(cs)}.${q.issue ? `\nLESSON_ISSUE (dicatat K-FLAG): ${q.issue}. Sampaikan dan koreksi materi.` : ""}${gapNote}\nEdge: jelaskan bagian lemah, tawarkan quiz-next lagi atau --remedial.`
	}
	q.done = true
	qsave(q)
	return line
}

// Soal yang diketik pelajar (esai, isian) dinilai penilai; soal pilihan (single, multi) dinilai kode.
const isTyped = (it) => it.type === "essay" || it.type === "cloze"
const strip = (i) => ({ n: i.n, q: i.it.question, multi: i.it.type === "multi", opts: i.it.options.map((o) => o.label) })

const CMDS = {
	phase() {
		const [ph, topic] = pos
		if (!RULES[ph]) die("Fase: probe | plan | teach | review | capstone")
		if (ph === "teach" && state.phase === "plan" && !state.planReviewed) die("Teach ditolak: rencana belum direview. Spawn alvar-plan-reviewer dulu.")
		if (ph === "capstone") { const err = capstoneGate(CWD, topic) ?? (consistencyGate(), null); if (err) die(err) }
		if (ph === "plan") state.planReviewed = false
		state.phase = ph
		state.injected = ph
		saveState()
		say(RULES[ph])
	},
	"plan-ctx"() {
		const f = needFile()
		let learner = ""
		try { learner = read(path.join(A, "LEARNER.md")) } catch {}
		say(`${REVIEW_SYSTEM}\n\n## Profil pelajar\n${learner || "(tidak ada)"}\n\n## Sesi (rencana)\n${read(f).split(/^## Node /m)[0]}`)
	},
	"plan-done"() { state.planReviewed = true; saveState(); say("ok") },
	next() {
		const f = needFile()
		const t = read(f)
		const readTopic = (tp) => { const g = sessionFile(tp); return g ? read(g) : null }
		say(`Langkah berikutnya ${pos[0]}: ${toCC(nextLessonStep(t, pos[0], audited(f, pos[0])))}${equivalentNote(t, pos[0], readTopic)}`)
	},
	lesson() {
		const node = pos[0]
		consistencyGate()
		const f = needFile()
		const body = stdin()
		if (!body.trim()) die("Materi kosong; tidak ada yang ditulis.")
		const cur = read(f)
		if (nodeSection(cur, node).replace(/^## Node .*$/m, "").trim()) die(`Bagian "## Node ${node}" sudah berisi materi. Tulis sekali; tambahan tidak diizinkan.`)
		const missing = missingSubconcepts(cur, node, body)
		if (missing.length) die(`Materi ${node} belum lengkap: subkonsep ${missing.join(", ")} ada di checklist tapi belum ada heading "### <id>". Tulis ulang seluruh materi.`)
		const structure = lessonStructureIssues(cur, node, body)
		if (structure.length) die(`Materi ${node} ditolak (struktur): ${structure.join("; ")}. Perbaiki lalu tulis ulang seluruh materi.`)
		fs.writeFileSync(f, insertAfterNode(ensureNodeHeading(cur, node, body.match(new RegExp("^## Node " + node + "\\s*[—-]\\s*(.+?)\\s*$", "m"))?.[1] ?? ""), node, stripNodeHeading(body, node)))
		say(`ok ${node} (${body.length} karakter). Tampilkan materi yang sama di chat.`)
	},
	"audit-ctx"() {
		const f = needFile(), node = pos[0], t = read(f), lesson = nodeSection(t, node)
		if (!lesson) die(`Bagian "## Node ${node}" belum ada.`)
		const done = resolvedFor(t, node)
		say(`${AUDIT_SYSTEM}\n\n## Rencana node\n${checklistOf(t, node)}\n\n## Materi\n${lesson}${done.length ? `\n\n## Sudah diperbaiki (jangan diajukan ulang)\n${done.map((d) => `- ${d}`).join("\n")}` : ""}`)
	},
	"audit-save"() {
		const f = needFile(), node = pos[0]
		let t = read(f)
		const lesson = nodeSection(t, node)
		const out = extractJson(stdin())
		const all = Array.isArray(out.issues) ? out.issues : []
		state.rounds ??= {}
		const k = akey(f, node), rounds = state.rounds[k] ?? 0
		state.rounds[k] = rounds + 1
		const capped = rounds >= 2 // ponytail: maksimal 2 putaran audit; selanjutnya fact dicatat reassess untuk diputuskan tutor.
		const facts = all.filter((i) => i.severity !== "style")
		const styles = rounds === 0 ? all.filter((i) => i.severity === "style").slice(0, 3) : []
		const ids = []
		for (const i of facts) {
			let id
			;[t, id] = flag(t, node, "audit", `${i.claim}: ${i.problem}`)
			if (capped) t = t.split("\n").map((ln) => (ln.startsWith(`| ${id} |`) ? ln.split("|").map((c) => (c.trim() === "invalidated" ? " reassess " : c)).join("|") : ln)).join("\n")
			ids.push(id)
		}
		if (ids.length) fs.writeFileSync(f, t)
		if (!facts.length) { state.audit ??= {}; state.audit[k] = lessonOnly(lesson) }
		saveState()
		const sn = styles.length ? `\nSaran gaya (tidak memblokir): ${styles.map((s) => s.problem).join("; ")}` : ""
		say(facts.length ? `Audit: ${facts.length} masalah fakta (dicatat di ## Provenance):\n${facts.map((i, j) => `${ids[j]}: "${i.claim}" - ${i.problem} Saran: ${i.fix}`).join("\n")}\nKoreksi di chat dan file, lalu audit ulang.${sn}` : `Audit: tidak ada masalah fakta.${sn}`)
	},
	"clar-q"() { state.clarQ = stdin().trim(); saveState(); say("ok") },
	"clar-ctx"() {
		const f = needFile(), node = pos[0], lesson = nodeSection(read(f), node)
		if (!lesson) die(`Bagian "## Node ${node}" belum ada.`)
		say(`${CLARIFY_SYSTEM}\n\n## Materi node\n${lesson}\n\n## Pertanyaan pelajar\n${state.clarQ ?? die("Belum ada pertanyaan (clar-q).")}`)
	},
	"clar-save"() {
		const f = needFile(), node = pos[0], question = state.clarQ ?? die("Belum ada pertanyaan (clar-q).")
		let t = read(f)
		const answer = stdin().replace(/<think>[\s\S]*?<\/think>/g, "").trim()
		const issue = answer.match(/^LESSON_ISSUE:\s*(.+)$/m)?.[1]
		const prereq = answer.match(/^PREREQ:\s*(.+)$/m)?.[1]
		const shown = answer.replace(/^(LESSON_ISSUE|PREREQ):.*$/gm, "").trim()
		const n = (nodeSection(t, node).match(/\*\*Klarifikasi /g) ?? []).length + 1
		t = insertAfterNode(t, node, `**Klarifikasi ${node} (${n})**\n\n> Pelajar:\n${question.split(/\r?\n/).map((l) => `> ${l}`).join("\n")}\n\n${shown}`)
		if (issue) t = flag(t, node, "clarify", issue)[0]
		fs.writeFileSync(f, t)
		delete state.clarQ; saveState()
		say(shown + (issue ? `\n[LESSON_ISSUE dicatat: ${issue}. Koreksi materi.]` : "") + (prereq ? `\n[Prasyarat belum diajarkan: ${prereq}.]` : ""))
	},
	"tq-save"() { const f = needFile(); const q = stdin().trim(); fs.writeFileSync(f, transferEntry(read(f), pos[0], pos[1], q)); say(`Soal tersimpan (${pos[0]} / ${pos[1]})`) },
	"tq-get"() { const q = transferFor(read(needFile()), pos[0], pos[1]); q === null ? die(`Tolak: soal ${pos[0]} / ${pos[1]} belum tersimpan. Jalankan tq-save dulu.`) : say(`Teks soal yang dinilai:\n${q}`) },

	// --- kuis ---
	"quiz-ctx"() {
		const node = pos[0], q = qload(node), p = q.pending
		if (!p) die("Tidak ada soal yang perlu ditulis.")
		const { t, lesson } = quizGate(node, q.kind === "remedial")
		const used = q.items.map((i) => i.it.question)
		say(`${QUIZ_CC}\n\n## Checklist subkonsep\n${checklistOf(t, node)}\n\n## Materi node (termasuk klarifikasi)\n${lesson}\n\n## Slot\n${JSON.stringify(p.slots)}\n${p.extra}${used.length ? `\n## Soal yang sudah dipakai (jangan diulang)\n${used.join("\n")}` : ""}`)
	},
	"quiz-save"() {
		const q = qload(pos[0]), p = q.pending
		if (!p) die("Tidak ada soal yang menunggu.")
		let out
		try { out = extractJson(stdin()) } catch (e) { die("REJECT: JSON tidak terbaca. Kirim ulang hanya JSON.") }
		const errs = validateItems(out.items, p.slots, p.round === 1 && q.kind === "quiz" ? p.concepts ?? [] : [])
		for (const [i, it] of (out.items ?? []).entries()) if (it?.options?.length > 4) errs.push(`soal ${i + 1}: maksimal 4 opsi`)
		if (errs.length) die("REJECT:\n- " + errs.join("\n- ") + "\nPerbaiki semuanya lalu kirim ulang.")
		for (const it of out.items) {
			if (!isTyped(it)) it.options = shuffle(it.options)
			q.items.push({ n: q.items.length + 1, round: p.round, it, ans: null })
		}
		q.issue = q.issue || out.lesson_issue || ""
		q.pending = null
		qsave(q)
		say("ok")
	},
	"quiz-next"() {
		const node = pos[0]
		let q
		try { q = JSON.parse(read(qpath(node))) } catch {}
		if (!q || q.done) { q = startQuiz(node); qsave(q) }
		if (q.pending) return say(`WRITE: spawn alvar-quiz-writer (prompt: "node ${node}"). Setelah selesai jalankan lagi quiz-next ${node}.`)
		const round = q.items[q.items.length - 1].round
		const cur = q.items.filter((i) => i.round === round)
		const ch = cur.filter((i) => !isTyped(i.it) && !i.ans)
		if (ch.length) {
			state.quizOpen = true; saveState()
			return say(`ASK: tampilkan lewat AskUserQuestion (maks 4 soal per panggilan, header "Q<n>", multiSelect sesuai multi, opsi persis urutan ini, tanpa Recommended; pelajar mengetik "tidak tahu" di Other kalau tidak tahu). Lalu: A quiz-ans ${node} dengan stdin JSON {"<n>":["label terpilih",...]}.\n${JSON.stringify(ch.slice(0, 4).map(strip))}`)
		}
		// Soal diketik (isian lalu esai) ditanyakan sekaligus dalam satu pesan, jawabannya dinilai penilai dalam SATU panggilan.
		const typed = cur.filter((i) => isTyped(i.it) && !i.ans)
		if (typed.length) {
			const missing = typed.filter((i) => !i.answerText)
			if (missing.length) return say(`TYPED: ajukan soal berikut di chat dalam SATU pesan, bernomor persis seperti di bawah, lalu tunggu jawaban pelajar. Simpan tiap jawaban verbatim: A essay-ans ${node} <n> (stdin = jawaban nomor itu), satu per soal, lalu quiz-next lagi.\n${missing.map((i) => `${i.n}) ${i.it.question}`).join("\n")}`)
			return say(`GRADE: spawn alvar-grader SATU kali (prompt: "node ${node}, semua soal diketik"). Soal: ${typed.map((i) => i.n).join(", ")}.`)
		}
		const wrong = cur.filter((i) => !i.ans.ok)
		if (round === 1 && wrong.length) {
			const angles = ["penerapan kasus baru", "contoh tandingan", "membedakan"]
			q.pending = { round: 2, slots: wrong.map((w, i) => ({ type: w.it.type, angle: angles[i % angles.length], concept: w.it.concept })), extra: `\nIni soal PENGGANTI untuk konsep yang terjawab salah. Field "concept" tiap soal harus sama dengan slot. Sudut berbeda dari soal sebelumnya.` }
			qsave(q)
			return say(`WRITE: spawn alvar-quiz-writer (prompt: "node ${node}") untuk soal pengganti.`)
		}
		say("DONE\n" + finalize(q))
	},
	"quiz-ans"() {
		const node = pos[0], q = qload(node), given = JSON.parse(stdin()), out = []
		for (const [n, sel] of Object.entries(given)) {
			const i = q.items.find((x) => x.n === +n && !isTyped(x.it) && !x.ans)
			if (!i) { out.push(`Q${n}: diabaikan (tidak ada / sudah dijawab)`); continue }
			const it = i.it, L = (k) => String.fromCharCode(97 + k)
			const arr = [].concat(sel).map(String)
			const hit = it.options.filter((o) => arr.includes(o.label))
			const free = arr.filter((a) => !it.options.some((o) => o.label === a)).join("; ")
			const dontKnow = !hit.length
			const values = hit.map((o) => o.value)
			const part = it.type === "multi" && !dontKnow ? scoreMulti(values, it.correct) : null
			const ok = !dontKnow && (part ? part.pass : values.length === it.correct.length && values.every((v) => it.correct.includes(v)))
			i.ans = { ok, score: part?.score, dontKnow, note: dontKnow && /tidak tahu|don'?t know/i.test(free) ? "" : free, labels: hit.map((o) => o.label), values }
			const key = it.options.map((o, k) => (it.correct.includes(o.value) ? L(k) : null)).filter(Boolean).join(", ")
			out.push(`Q${n}: ${ok ? "BENAR" : dontKnow ? "TIDAK TAHU" : "SALAH"}${part ? ` (skor ${Math.round(part.score * 100)}%)` : ""}. Kunci (${key}). ${it.explanation}`)
		}
		state.quizOpen = false; saveState()
		qsave(q)
		say(out.join("\n") + `\nSampaikan hasil + penjelasan singkat, lalu quiz-next ${node}.`)
	},
	"essay-ans"() {
		const q = qload(pos[0]), i = q.items.find((x) => x.n === +pos[1] && isTyped(x.it))
		if (!i) die("Soal esai atau isian tidak ditemukan.")
		i.answerText = stdin().trim(); qsave(q); say("ok")
	},
	// Penilaian sekali jalan untuk semua soal diketik (isian dan esai) yang jawabannya sudah disimpan dan belum dinilai.
	"typed-ctx"() {
		const q = qload(pos[0]), todo = q.items.filter((x) => isTyped(x.it) && x.answerText && !x.ans)
		if (!todo.length) die("Tidak ada jawaban diketik yang menunggu dinilai (essay-ans dulu).")
		const body = todo.map((x) => `### Soal ${x.n} (${x.it.type === "cloze" ? "isian" : "esai"})\n${x.it.question}\nRubrik: ${JSON.stringify(x.it.rubric)}\nContoh jawaban: ${x.it.model_answer}\nJawaban pelajar: ${x.answerText}`).join("\n\n")
		say(`${GRADE_SYSTEM}\n\nBeberapa soal sekaligus. Untuk isian, nilai jawaban singkatnya terhadap rubrik (variasi penulisan yang sah dihitung benar). Keluaran HANYA JSON {"results": [ {"n": <nomor soal>, "pass": true|false, "criteria": [...], "feedback": "..."} ]} dengan satu entri per soal di bawah, nomor persis sama.\n\n## Materi\n${nodeSection(read(path.join(A, "sessions", q.file)), q.node)}\n\n## Soal yang dinilai\n${body}`)
	},
	"typed-save"() {
		const q = qload(pos[0]), g = extractJson(stdin()), rs = Array.isArray(g) ? g : g.results
		if (!Array.isArray(rs) || !rs.length) die("REJECT: JSON harus berisi results[] satu entri per soal.")
		const todo = q.items.filter((x) => isTyped(x.it) && x.answerText && !x.ans)
		const missing = todo.filter((x) => !rs.some((r) => +r.n === x.n)).map((x) => x.n)
		if (missing.length) die(`REJECT: soal ${missing.join(", ")} belum dinilai. Kirim ulang results[] lengkap.`)
		const out = []
		for (const r of rs) {
			const i = todo.find((x) => x.n === +r.n)
			if (!i) { out.push(`Soal ${r.n}: diabaikan (tidak menunggu penilaian)`); continue }
			const sc = scoreEssay(r.criteria)
			i.ans = { ok: sc.pass, score: sc.score, answer: i.answerText, criteria: r.criteria, feedback: r.feedback }
			out.push(`${i.it.type === "cloze" ? "Isian" : "Esai"} ${i.n}: ${sc.pass ? "LULUS" : "BELUM LULUS"} (skor ${Math.round(sc.score * 100)}%)\n${(r.criteria ?? []).map((c) => `${c.met ? "[v]" : "[ ]"} ${c.core ? "[inti] " : ""}${c.criterion}`).join("\n")}\n${r.feedback ?? ""}`)
		}
		qsave(q)
		const txt = out.join("\n\n")
		say(isAscii(txt) ? txt : txt.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?"))
	},
	"essay-ctx"() {
		const q = qload(pos[0]), i = q.items.find((x) => x.n === +pos[1] && isTyped(x.it))
		if (!i?.answerText) die("Jawaban esai belum disimpan (essay-ans).")
		say(`${GRADE_SYSTEM}\n\n## Materi\n${nodeSection(read(path.join(A, "sessions", q.file)), q.node)}\n\n## Soal\n${i.it.question}\n\n## Rubrik\n${JSON.stringify(i.it.rubric)}\n\n## Contoh jawaban\n${i.it.model_answer}\n\n## Jawaban pelajar\n${i.answerText}`)
	},
	"essay-save"() {
		const q = qload(pos[0]), i = q.items.find((x) => x.n === +pos[1] && isTyped(x.it))
		if (!i?.answerText) die("Jawaban esai belum disimpan (essay-ans).")
		const g = extractJson(stdin()), sc = scoreEssay(g.criteria)
		i.ans = { ok: sc.pass, score: sc.score, answer: i.answerText, criteria: g.criteria, feedback: g.feedback }
		qsave(q)
		const txt = `Esai ${i.n}: ${sc.pass ? "LULUS" : "BELUM LULUS"} (skor ${Math.round(sc.score * 100)}%)\n${(g.criteria ?? []).map((c) => `${c.met ? "[v]" : "[ ]"} ${c.core ? "[inti] " : ""}${c.criterion}`).join("\n")}\n${g.feedback ?? ""}`
		say(isAscii(txt) ? txt : txt.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?"))
	},
}

if (!CMDS[cmd]) die(`Perintah: ${Object.keys(CMDS).join(" | ")}`)
try { CMDS[cmd]() } catch (e) { die(`Gagal: ${e?.message ?? e}`) }
