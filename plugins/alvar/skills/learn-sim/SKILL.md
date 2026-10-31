---
name: learn-sim
description: >
  Buat simulasi interaktif satu berkas HTML untuk satu ide yang sedang diajarkan,
  agar pelajar bisa mengubah angka dan melihat akibatnya (misalnya entri matriks
  menggerakkan determinan). Pakai saat pengguna menjalankan /learn-sim, atau
  meminta simulasi, interaktif, "aku mau coba ubah angkanya", slider, atau
  eksperimen untuk sebuah konsep.
license: MIT
---

# Learn sim

Satu ide, satu simulasi. Gambar statis (`alvar:learn-visual`) menunjukkan satu kasus; simulasi dipakai bila pemahaman datang dari **mengubah input dan melihat output berubah**. Simulasi bukan pengganti materi dan bukan bukti `known`: status tetap hanya dari kuis.

## Kapan dibuat
- Hanya bila pelajar memintanya, atau setelah kamu menawarkan satu kalimat dan dia setuju. Jangan membuatnya otomatis untuk tiap node.
- Cocok: hubungan input ke output yang kontinu (entri matriks ke determinan, parameter ke bentuk kurva, learning rate ke lintasan). Tidak cocok: definisi, bukti, atau kasus tunggal (pakai `learn-visual`).

## Keluaran
`.alvar/visuals/<slug>-<node>-sim.html`, satu berkas mandiri:
- HTML, CSS, dan JS vanila di satu file. **Tanpa CDN, tanpa jaringan, tanpa build.** Harus jalan dari `file://`.
- Gambar dengan SVG inline atau `<canvas>`. Latar putih, label besar, kontras tinggi.
- Tautkan dari sesi dengan satu baris di bawah bagian node terkait: `[Simulasi: <judul>](visuals/<berkas>.html)`. Obsidian tidak menjalankan HTML; pelajar membukanya di browser dari file manager.

## Loop (jangan dilewati)
1. Tulis klaim yang harus terasa setelah bermain, satu kalimat. Contoh: "Mengubah satu entri menggeser jajar genjang, dan $\det$ sama dengan luas bertanda."
2. Pilih kontrol seminimal mungkin (satu sampai empat input) dan satu atau dua keluaran yang diamati. Semua yang lain dibuang.
3. Tulis berkas dengan pemisahan tegas: **fungsi hitung murni** (tanpa DOM) terpisah dari fungsi gambar.
4. Selaraskan dengan materi: notasi, nama variabel, dan warna yang sama dengan node (kolom 1 biru, kolom 2 oranye bila mengikuti `learn-visual`). Beri tombol *preset* yang memuat contoh angka dari node, sehingga angka di layar sama dengan angka di teks.
5. **Uji logika**: berkas memuat blok `selfTest()` yang membandingkan fungsi hitung dengan nilai yang diketahui dari materi (contoh angka, kasus khusus, kasus degenerat) dan menulis `SELFTEST: PASS` atau `SELFTEST: FAIL <rincian>` ke `<pre id="selftest" hidden>`. Jalankan:
   ```bash
   F=.alvar/visuals/<berkas>.html
   E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
   [ -x "$E" ] || E="/c/Program Files/Google/Chrome/Application/chrome.exe"
   "$E" --headless --disable-gpu --virtual-time-budget=2000 --dump-dom "file:///$(cygpath -m "$PWD/$F")" 2>/dev/null | grep -o 'SELFTEST: [A-Z].*'
   ```
   `FAIL` atau tidak ada keluaran = perbaiki, ulangi.
6. **Lihat tampilannya**: render ke PNG seperti di `learn-visual` (`--window-size=<W>,<H> --screenshot=...`), buka PNG dengan Read, cek tata letak pada keadaan awal dan pada satu preset kasus tepi. Hapus PNG setelah lolos.
7. Berhenti setelah satu putaran bersih, bukan setelah draf pertama.

## Desain
- Keadaan awal = contoh pertama dari materi, jadi layar pertama sudah cocok dengan teks.
- Tampilkan keluaran sebagai angka **dan** gambar, dan angka itu rumus yang sama dengan materi (bukan hasil pustaka yang disembunyikan).
- Kasus degenerat harus terlihat, bukan error: misalnya `det = 0` diberi tanda dan penjelasan satu baris ("kolom sejajar, luas runtuh").
- Input numerik dibatasi rentang yang masuk akal; nilai tak sah ditolak dengan pesan, tidak membuat halaman kosong.
- Tanpa animasi dekoratif, tanpa gradien, tanpa ikon.
- Jangan menampilkan soal, kunci, atau petunjuk kuis. Simulasi bukan bagian kuis dan tidak mengubah Ledger atau map.

## Kesalahan yang dicek saat melihat
- Angka di layar tidak sama dengan contoh di materi
- Arah panah atau tanda orientasi berlawanan dengan teks
- Dua simbol untuk objek yang sama
- Skala sumbu berubah diam-diam sehingga luas tampak sama padahal beda
- Teks terpotong pada lebar jendela sempit
- Fungsi hitung bergantung pada DOM sehingga tidak bisa diuji

## Sesudah
Beri tahu pelajar apa yang dicoba dulu ("pencet preset pertama, lalu ubah entri kiri-atas pelan-pelan, perhatikan angka det dan arah busur"). Jangan mengajar ulang node. Setelah materi atau simulasi berubah, ingat bahwa materi sesi yang berubah membuat audit basi; simulasi di luar teks node tidak mengubah audit, tetapi baris tautannya iya, jadi audit ulang bila kamu menambah baris itu sebelum kuis.
