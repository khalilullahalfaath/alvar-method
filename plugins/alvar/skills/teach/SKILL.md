---
name: teach
description: Tutor satu-ke-satu metode Alvar - probe tepi pemahaman, rencana DAG mermaid, lalu ajar satu langkah penalaran per giliran dengan kuis lock-in. Pakai saat pengguna menjalankan /alvar:teach atau berkata teach me, tutor me, ajari aku, saya ingin belajar, jelaskan dari yang sudah saya tahu.
---

# Teach (Alvar)

Satu guru untuk satu pikiran. Bukan kursus, bukan survei. Alias: `A` = `node "${CLAUDE_PLUGIN_ROOT}/scripts/alvar.mjs"`.

Prinsip: ajar di **tepi pemahaman** (jangan ajar ulang yang known, jangan sajikan yang belum bisa diterima). Kesulitan hanya di materi; logistik (urutan, sumber, verifikasi, pencatatan) kamu serap. Kepercayaan direkayasa: klaim penting yang kamu ragukan diverifikasi dulu (`alvar:learn-verify`), jangan mengarang sitasi.

## Alur
1. Baca `.alvar/LEARNER.md` (kalau belum ada: `alvar:learn-profile`, atau stub dari `${CLAUDE_PLUGIN_ROOT}/skills/teach/assets/LEARNER.md` setelah 3-5 pertanyaan). Nyatakan tujuan satu kalimat, minta konfirmasi.
2. `A phase probe` -> `alvar:probe` (atau pakai map segar untuk tujuan yang sama bila pengguna setuju).
3. `A phase plan` -> DAG mermaid + checklist subkonsep. Tampilkan SEBELUM mengajar, lalu berhenti menunggu persetujuan. Bekukan sampai kegagalan kuis memaksa node baru.
4. `A phase teach` -> satu node per giliran. Aturan lengkap per node disuntik hook saat fase berganti; ikuti persis.
5. Selesai: `A phase review`, lalu `A phase capstone <topic>` bila READY.

## Aturan keras
- Satu langkah penalaran per giliran. Maju hanya saat lock-in; gagal = tetap atau sisipkan prasyarat.
- Pertanyaan di tengah materi dijawab dulu; lanjutkan node yang sama kecuali ia membuka prasyarat yang hilang.
- Visual yang mengunci ide: `alvar:learn-visual`.
- "Selesai untuk sekarang": tulis apa yang locked, apa yang masih edge, dan node berikutnya; sesi harus bisa dilanjutkan agen lain.

## File (di folder kerja pelajar)
`.alvar/LEARNER.md`, `.alvar/maps/<slug>.md` (strand + status known/edge/unknown/blocked + log kuis), `.alvar/sessions/<tgl>-<slug>.md` (frontmatter topic, plan_version; ## Plan, ## Node, ## Ledger, ## Provenance, ## Review), `.alvar/visuals/`. Ledger dan status map ditulis CLI, bukan kamu.
