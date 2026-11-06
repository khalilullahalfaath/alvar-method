#!/usr/bin/env node
// Ambil materi satu node Alvar dari file sesi, tanpa kuis, klarifikasi, dan catatan pribadi pelajar.
// Pakai:  node node-section.mjs <node> [--topic=<slug>] [--sub=<id>] [--label=<token>] [--list]
//   P2b                     seluruh materi node
//   P2b --sub=C.3           satu subkonsep
//   P2b --label=C.3-C2      satu blok berlabel (definisi, teorema, contoh)
//   P2b --list              daftar subkonsep dan label di node itu
// Baris "#" di awal keluaran memberi nama sesi dan path simpan klip. Kode keluar: 0 ok, 1 pemakaian, 2 tidak ditemukan.
import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3)
const node = args.find((a) => !a.startsWith("--"))
const fail = (code, msg) => { console.error(msg); process.exit(code) }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

if (!node) fail(1, "Pakai: node-section.mjs <node> [--topic=<slug>] [--sub=<id>] [--label=<token>] [--list]")

// Cari .alvar dari folder kerja ke atas, supaya tetap jalan dari subfolder.
let root = process.cwd()
while (!fs.existsSync(path.join(root, ".alvar", "sessions"))) {
	const up = path.dirname(root)
	if (up === root) fail(2, "Folder .alvar/sessions tidak ditemukan dari folder kerja ini. Jalankan dari folder belajar.")
	root = up
}
const dir = path.join(root, ".alvar", "sessions")
const slugOf = (f) => f.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "")

const heading = new RegExp(`^## Node ${esc(node)}(?![A-Za-z0-9])`, "im")
const topic = opt("topic")
const hits = fs.readdirSync(dir)
	.filter((f) => f.endsWith(".md") && (!topic || slugOf(f) === topic))
	.filter((f) => heading.test(fs.readFileSync(path.join(dir, f), "utf8")))

if (!hits.length) fail(2, `Node ${node} tidak ditemukan${topic ? ` di topik ${topic}` : ""}. Materinya mungkin belum ditulis.`)
if (hits.length > 1) fail(2, `Node ${node} ada di beberapa topik. Ulangi dengan --topic=<slug>, atau tanya pelajar:\n${hits.map((f) => `  ${slugOf(f)}`).join("\n")}`)

const file = hits[0]
const text = fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n")
const start = text.search(heading)
const rest = text.slice(start)
const next = rest.slice(1).search(/^## /m)
let section = next < 0 ? rest : rest.slice(0, next + 1)

// Buang yang bukan materi: blok kuis dan klarifikasi, callout pelajar, baris penunjuk klarifikasi.
section = section
	.split(/\n(?=(?:\*\*|#{3,4} )(?:Klarifikasi|Kuis|Remedial)\b)/)
	.filter((p) => !/^(?:\*\*|#{3,4} )(?:Klarifikasi|Kuis|Remedial)\b/.test(p))
	.join("\n")
	.replace(/\n*^> ?\[!catatan\][^\n]*(?:\n>[^\n]*)*/gim, "")
	.replace(/\n*^Lihat juga: \[\[#\^klar-[^\n]*$/gm, "")
	.trim()

const realNode = section.match(/^## Node ([A-Za-z0-9]+)/)?.[1] ?? node
const slug = slugOf(file)
const header = [
	`# sesi: .alvar/sessions/${file}`,
	`# simpan animasi: .alvar/visuals/${slug}-${realNode}-anim.html`,
	`# simpan video: .alvar/visuals/${slug}-${realNode}-video.mp4`,
].join("\n")

if (args.includes("--list")) {
	const items = [...section.matchAll(/^(### [^\n]+|\*\*(?:Definisi|Teorema|Lema|Contoh) [A-Z]{1,2}\.\d+-[DTC]\d+[^\n]*?\*\*)/gm)]
		.map((m) => (m[1].startsWith("###") ? m[1].slice(4) : `  ${m[1].replace(/\*\*/g, "")}`))
	console.log(`${header}\n${items.join("\n")}`)
	process.exit(0)
}

const sub = opt("sub"), label = opt("label")
let out = section
if (sub) {
	const m = section.match(new RegExp(`^### ${esc(sub)}(?![\\d.])[^\\n]*\\n[\\s\\S]*?(?=^### |(?![\\s\\S]))`, "im"))
	if (!m) fail(2, `Subkonsep ${sub} tidak ada di node ${realNode}. Lihat --list.`)
	out = m[0].trim()
}
if (label) {
	const stop = "^### |^\\*\\*(?:Definisi|Teorema|Lema|Contoh|Konsekuensi|Versi sederhana|Motivasi|Intuisi|Tugas|Latihan|Jelaskan)"
	const m = section.match(new RegExp(`^\\*\\*(?:Definisi|Teorema|Lema|Contoh) ${esc(label)}\\b[\\s\\S]*?(?=${stop}|(?![\\s\\S]))`, "im"))
	if (!m) fail(2, `Label ${label} tidak ada di node ${realNode}. Lihat --list.`)
	out = m[0].trim()
}
console.log(`${header}\n\n${out}`)
