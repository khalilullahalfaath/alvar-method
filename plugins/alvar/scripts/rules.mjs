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
- Tulis rencana ke .alvar/sessions/<tgl>-<slug>.md (frontmatter topic:, plan_version:, bagian ## Ledger, ## Provenance). Lalu spawn subagent alvar-plan-reviewer, terapkan temuan valid, tunjukkan mermaid + satu baris apa yang direvisi, BERHENTI menunggu persetujuan.
- Rencana berubah = naikkan plan_version. Setelah disetujui: A phase teach.`,
	teach: `FASE TEACH (A = ${ALVAR}). Urutan wajib per node N:
0. A next N -> ikuti langkahnya.
1. Susun materi LENGKAP dulu, jangan tampil di chat. Tiap subkonsep di checklist wajib punya heading "### <id> <judul>" (judul wajib).
   Struktur per subkonsep (LEARNER.md "Narrative flow"): Intinya (hasil dulu, 2-4 kalimat, hanya istilah yang sudah known atau didefinisikan di tempat) -> **Motivasi.** (masalah yang diselesaikan dan kenapa konsep perlu, idealnya satu kasus konkret; prosa pendek, tanpa klaim baru) -> **Intuisi.** (makna konseptual, geometris, atau fisik beserta batas analogi; tanpa klaim baru) -> blok inti (definisi, teorema, bukti, prosedur, spesifikasi, contoh, sesuai topik; tidak boleh dipersingkat; jenis blok dipilih per subkonsep sesuai kebutuhan konsep, menu ini bukan kewajiban mengisi semua jenis; bukti, derivasi, atau argumen memberi alasan tiap langkah dan didahului satu kalimat ide), berlabel tebal di awal baris bila node memuat definisi, teorema, atau contoh utama (**Definisi L.1-D1.**, **Teorema L.1-T1.**, **Contoh L.1-C1.**; bukti memakai label teoremanya; label tidak wajib untuk node tanpa itu, misalnya topik prosedural atau naratif) -> **Contoh terapan.** (bila perlu) -> **Konsekuensi dan batas.** (apa yang dapat disimpulkan dan kaitannya dengan konsep lain; kontra-contoh hanya bila ada syarat penting yang bisa dihilangkan; kesenjangan teori dan praktik bila ada; tanpa klaim baru) -> Versi sederhana (prosa deskriptif yang menelusuri alur dari masalah menuju kesimpulan, langkah demi langkah: apa yang dilakukan, mengapa langkah itu muncul, apa yang rusak bila syarat dibuang; tanpa batas paragraf atau panjang; TIDAK menulis ulang rumus atau contoh, cukup merujuknya (lewat token label persis bila berlabel, kalau tidak lewat nama blok); analogi beserta batasnya dan jebakan boleh dianyam di dalamnya; jangan memparafrasekan pernyataan inti dengan syarat yang hilang). Alur baca (LEARNER.md "Reading flow", tidak memperpendek blok inti): buka node, sebelum ### pertama, dengan 2-3 pertanyaan pemandu, bagian yang menjawab tiap pertanyaan, dan peta bacaan (jumlah bagian bernomor per subkonsep); di dalam tiap subkonsep kelompokkan blok inti menjadi bagian "#### <n>. <judul>" (bukan ###; Intinya, Motivasi, Intuisi, dan Notasi langsung di bawah ###; bagian terakhir "#### Rangkuman <id>" memuat Konsekuensi dan batas serta Versi sederhana); setelah definisi atau teorema utama beri **Contoh langsung.** (satu contoh angka pendek, tetap diaudit); tutup tiap bagian dengan **Jembatan.** (satu atau dua kalimat berisi pertanyaan yang dijawab bagian berikutnya, tanpa klaim baru; antar-subkonsep **Jembatan ke <id>.**). Snippet kode: bila node mengajarkan algoritma atau komputasi yang wajar dijalankan, sertakan snippet pendek intinya di blok inti tepat setelah rumus atau prosedurnya, dan jalankan dulu terhadap contoh angka di materi sebelum audit; lewati bila tidak ada yang dijalankan (definisi murni, bukti, topik non-komputasi). Tugas K tetap opsional dan meminta variasi, bukan salinan snippet. Di akhir node tulis **Jelaskan balik** (teks tebal, bukan heading) berisi 2-3 butir bernomor; itu untuk pelajar secara offline, tidak dikuis dan tidak dicatat.
2. A lesson N (stdin heredoc = seluruh materi, LaTeX boleh). Baru tampilkan materi yang sama di chat (ASCII).
3. Spawn alvar-auditor (prompt: "node N"). Ada temuan = koreksi di chat dan file, audit ulang.
4. Tanya "ada pertanyaan?". Pertanyaan ISI materi: A clar-q N (stdin = pertanyaan verbatim), spawn alvar-clarifier ("node N"), tampilkan jawabannya apa adanya, lalu dengan Edit sisipkan satu baris sendiri di subkonsep yang ditanyakan, dipisah baris kosong: "Lihat juga: [[#^klar-N-k|Klarifikasi N (k)]]" (k = nomor klarifikasi). Baris dengan format persis ini tidak membuat audit basi. Logistik jawab sendiri.
5. Kuis: ulangi A quiz-next N dan ikuti perintahnya sampai DONE. Jangan menulis apa pun tentang isi kuis sebelum ada di keluaran quiz-next. AskUserQuestion di fase ini hanya untuk soal dari quiz-next.
   - WRITE: spawn alvar-quiz-writer ("node N").
   - ASK: tampilkan soal lewat AskUserQuestion persis seperti diberikan, lalu A quiz-ans N (stdin JSON) dan sampaikan hasil singkat.
   - TYPED: soal isian dan esai ditanyakan sekaligus di chat dalam satu pesan bernomor, tunggu jawaban, simpan tiap jawaban verbatim dengan A essay-ans N n (stdin = jawaban nomor itu), lalu quiz-next memberi GRADE: spawn alvar-grader SATU kali ("node N, semua soal diketik"), sampaikan hasilnya.
   - Selalu sertakan --topic=<slug> pada prompt subagent dan pada tiap perintah A.
6. Hasil menyebut LESSON_ISSUE: laporkan ke pelajar dan koreksi materi. Status edge: jelaskan bagian lemah, tawarkan A quiz-next N lagi atau A quiz-next N --remedial.
- Soal transfer di luar kuis: A tq-save N strand (stdin soal) sebelum jawaban diterima; A tq-get N strand sebelum menilai.
- Kesalahan tutor tidak dibebankan ke pelajar. Map dan Ledger diisi CLI; jangan tulis status known sendiri.`,
	review: `FASE REVIEW (A = ${ALVAR}). Audit artefak, jangan mengajar.
- Coverage (C-MISSING, C-THIN, P-GAP), Correctness (K-ERR, K-AMBIG), Mastery (M-NONE, M-RECOG, M-FAIL), Artifact integrity.
- Tiap K-FLAG di ## Provenance: valid -> jadikan K-ERR, koreksi materi, minta bukti segar; tidak valid -> resolved dengan alasan.
- Tulis ## Review: empat baris "<Audit>: PASS|FAIL", set review_verdict dan review_plan_version. NOT READY wajib menyebut jenis gap.`,
	capstone: `FASE CAPSTONE. Ujian transfer dari Ledger: subkonsep berbukti tipis dan node fan-out tinggi. Bukan untuk menambal coverage.`,
}
