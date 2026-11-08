// Aturan per fase untuk Claude Code. Disuntik hook hanya saat fase berganti (hemat token).
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ALVAR = `node "${path.join(path.dirname(fileURLToPath(import.meta.url)), "alvar.mjs").replace(/\\/g, "/")}"`

export const RULES = {
	probe: `FASE PROBE (alias A = ${ALVAR}).
- Mulai luas, persempit per strand yang dibutuhkan tujuan. 1-3 soal per panggilan AskUserQuestion, multiSelect false, tunggu hasil.
- Opsi 2-3 isi + "Saya tidak tahu". Jangan beri "(Recommended)", kunci jangan selalu di urutan pertama. Distraktor diagnostik; opsi tanpa alasan.
- Benar tanpa penalaran = edge, bukan known.
- Tulis map .alvar/maps/<slug>.md. Selesai bila tiap strand berlabel known/edge/unknown/blocked.`,
	plan: `FASE PLAN (A = ${ALVAR}).
- DAG mermaid: satu node = satu langkah penalaran, mulai dari known lewat edge. Checklist subkonsep per node (id A.1, A.2, ...).
- Tanya bentuk ujian dan sisa waktu bila belum diketahui.
- Rujukan: pilih buku yang relevan dari katalog "References I own" di LEARNER.md, plus sumber khusus sesi ini (silabus, slide, panduan ujian), lalu catat di rencana sesi beserta bab atau bagian per node. Jangan menyarankan sumber yang tidak ada di katalog tanpa menyebutnya sebagai saran.
- Tulis rencana ke .alvar/sessions/<tgl>-<slug>.md (frontmatter topic:, plan_version:, bagian ## Ledger, ## Provenance). Lalu spawn subagent alvar-plan-reviewer, terapkan temuan valid, tunjukkan mermaid + satu baris apa yang direvisi, BERHENTI menunggu persetujuan.
- Rencana berubah = naikkan plan_version. Setelah disetujui: A phase teach.`,
	teach: `FASE TEACH (A = ${ALVAR}). Urutan wajib per node N:
0. A next N -> ikuti langkahnya.
1. Materi ditulis subagent alvar-lesson-writer (prompt: "node N --topic=<slug> draf=<folder draf di scratchpad>"; dua node sekaligus boleh). Format materi hanya ada di keluaran A format (preferensi dan alasannya di LEARNER.md); jangan menyalin atau meringkasnya ke prompt, dan jangan menulis materi sendiri.
2. A lesson N < berkas draf (seluruh materi). Apa yang ditampilkan di chat ditentukan keluarannya (mengikuti "reader" di LEARNER.md); ikuti persis, jangan menambah ringkasan.
3. Spawn alvar-auditor (prompt: "node N"). Ada temuan = koreksi di file sesi, audit ulang.
4. Tanya "ada pertanyaan?". Pertanyaan ISI materi: A clar-q N (stdin = pertanyaan verbatim), spawn alvar-clarifier ("node N"). Jawabannya (LaTeX) tersimpan di file sesi; apa yang ditampilkan di chat ditentukan keluaran clar-save, plus catatan LESSON_ISSUE/PREREQ bila ada. Lalu dengan Edit sisipkan satu baris sendiri di subkonsep yang ditanyakan, dipisah baris kosong: "Lihat juga: [[#^klar-N-k|Klarifikasi N (k)]]" (k = nomor klarifikasi). Baris dengan format persis ini tidak membuat audit basi. Logistik jawab sendiri.
5. Kuis: ulangi A quiz-next N dan ikuti perintahnya sampai DONE. Jangan menulis apa pun tentang isi kuis sebelum ada di keluaran quiz-next. AskUserQuestion di fase ini hanya untuk soal dari quiz-next.
   - WRITE: spawn alvar-quiz-writer ("node N").
   - ASK: tampilkan soal lewat AskUserQuestion persis seperti diberikan, lalu A quiz-ans N (stdin JSON) dan sampaikan hasil singkat.
   - TYPED: soal isian dan esai ditanyakan sekaligus di chat dalam satu pesan bernomor, tunggu jawaban, simpan semua jawaban verbatim dalam SATU panggilan A essay-ans N (stdin JSON {"<n>": "jawaban"}), keluarannya memberi GRADE: spawn alvar-grader SATU kali ("node N, semua soal diketik"), simpan dengan A typed-save N, sampaikan hasilnya.
   - quiz-ans, essay-ans, typed-save, dan essay-save sudah menempelkan langkah berikutnya di keluarannya; ikuti itu langsung, jangan panggil quiz-next lagi.
   - Selalu sertakan --topic=<slug> pada prompt subagent dan pada tiap perintah A.
6. Hasil menyebut LESSON_ISSUE: laporkan ke pelajar dan koreksi materi. Status edge: jelaskan bagian lemah, tawarkan A quiz-next N lagi atau A quiz-next N --remedial.
- Soal transfer di luar kuis: A tq-save N strand (stdin soal) sebelum jawaban diterima; A tq-get N strand sebelum menilai.
- Kesalahan tutor tidak dibebankan ke pelajar. Map dan Ledger diisi CLI; jangan tulis status known sendiri.
- Hemat konteks: jangan Read file sesi utuh (hook menolak). Pakai A show plan (DAG, checklist, status node) dan A show N (materi satu node); untuk Edit, Grep -n lalu Read dengan offset/limit. Bila DONE memuat KONTEKS, sampaikan ajakan /clear itu ke pelajar.`,
	review: `FASE REVIEW (A = ${ALVAR}). Audit artefak, jangan mengajar.
- Coverage (C-MISSING, C-THIN, P-GAP), Correctness (K-ERR, K-AMBIG), Mastery (M-NONE, M-RECOG, M-FAIL), Artifact integrity.
- Tiap K-FLAG di ## Provenance: valid -> jadikan K-ERR, koreksi materi, minta bukti segar; tidak valid -> resolved dengan alasan.
- Tulis ## Review: empat baris "<Audit>: PASS|FAIL", set review_verdict dan review_plan_version. NOT READY wajib menyebut jenis gap.`,
	capstone: `FASE CAPSTONE. Ujian transfer dari Ledger: subkonsep berbukti tipis dan node fan-out tinggi. Bukan untuk menambal coverage.`,
}
