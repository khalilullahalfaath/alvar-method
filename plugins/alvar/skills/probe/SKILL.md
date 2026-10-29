---
name: probe
description: Petakan tepi pemahaman pelajar dengan kuis bertingkat singkat. Mulai luas, lalu binary-search tiap strand yang dibutuhkan pelajaran. Pakai saat pengguna menjalankan /alvar:probe atau berkata quiz me, pretest, apa yang sudah saya tahu, probe saya.
---

# Probe

Ukur dulu; jangan mengajar (kecuali koreksi satu baris setelah jawaban). `A phase probe` bila belum (A = `node "${CLAUDE_PLUGIN_ROOT}/scripts/alvar.mjs"`); aturan format soal disuntik hook.

Tujuan: `.alvar/maps/<slug>.md` dengan tiap strand berlabel `known` | `edge` | `unknown` | `blocked` (blocked = "tidak tahu" atau perlu alat yang tidak ada).

- Mulai luas, belah strand yang masih ambigu. Lewati strand yang sudah dinyatakan solid. Undang penjelasan: huruf benar + alasan salah = `edge`.
- Skor: benar + alasan kuat = known; benar alasan tipis = edge; salah dekat = edge; salah pondasi hilang = unknown; tidak tahu = blocked/unknown.
- Perbarui map setelah tiap batch. Berhenti saat dependensi pelajaran berlabel semua, bukan saat "cukup banyak soal".

Map:
```
# Map - <tujuan>
Updated: <ISO>
Goal: <satu kalimat>
## Strands
| strand | status | evidence |
## Quiz log
- Q1 [strand] <pilihan> - benar|salah|idk - <lima kata>
```
Akhir: tampilkan tabel, sebut strand awal bagi guru. Jangan mulai pelajaran kecuali diminta.
