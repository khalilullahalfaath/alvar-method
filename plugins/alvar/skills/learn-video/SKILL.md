---
name: learn-video
description: >
  Buat video tutorial satu ide yang sedang diajarkan, sebagai animasi HTML atau
  video MP4 dengan efek suara sederhana tanpa narasi (manim dan ffmpeg). Selalu tanya dulu versi mana sebelum
  membuat. Pakai saat pengguna menjalankan /learn-video, atau meminta video,
  video tutorial, animasi, atau "tunjukkan langkahnya bergerak" untuk sebuah konsep.
license: MIT
---

# Learn video

Satu ide, satu klip. Gambar statis (`alvar:learn-visual`) menunjukkan satu keadaan, simulasi (`alvar:learn-sim`) membiarkan pelajar mengubah input, dan klip ini menunjukkan **proses yang berjalan langkah demi langkah**. Klip bukan pengganti materi dan bukan bukti `known`: status tetap hanya dari kuis.

## Langkah pertama: tanya dulu (wajib)
Setiap kali diminta, tanya versi mana **sebelum membuat apa pun**, walau jawaban sebelumnya sudah diketahui:
- **Animasi HTML**: berkas tunggal, ada tombol putar, jeda, dan geser langkah. Tanpa pemasangan.
- **Video tanpa narasi**: berkas MP4 dari manim dan ffmpeg, dengan efek suara sederhana (default menyala, lihat "Efek suara"). Sebut pilihannya ke pelajar sebagai "video tanpa narasi (ada efek suara)".

Di fase teach, tanyakan lewat pesan chat biasa, karena AskUserQuestion di fase itu hanya untuk soal kuis. Tidak ada jalur narasi suara (suara orang atau teks-ke-suara). Kalau pelajar memintanya, katakan belum tersedia. Efek suara beda dari narasi dan tersedia di Jalur B.

## Kapan cocok
Hanya atas permintaan pelajar, atau setelah kamu menawarkan satu kalimat dan dia setuju. Cocok untuk proses berurutan: lintasan GD, langkah Newton, iterasi Lloyd, EM. Tidak cocok untuk definisi atau bukti (pakai `learn-visual`), atau hubungan input ke output yang ingin dicoba bebas (pakai `learn-sim`).

## Kalau belum ada permintaan node
Kalau pelajar belum menyebut node atau konsepnya, tanyakan node dan format sekaligus dalam satu pesan. Jangan menelusuri folder untuk menebaknya. Dari folder Alvar, baca hanya keluaran skrip di bawah: berkas state CLI, folder kunci kuis, dan memori agen lain bukan bahan klip dan jangan dibuka.

## Merujuk node yang diminta
Kalau pelajar menyebut node, subkonsep, atau label, ambil materinya dengan skrip ini dari folder belajar. Jangan membuka seluruh file sesi karena bisa sangat besar:
```bash
NS="C:/Users/HP/alvar-marketplace/plugins/alvar/skills/learn-video/scripts/node-section.mjs"
node "$NS" P2b --list              # daftar subkonsep dan label
node "$NS" P2b                     # seluruh materi node
node "$NS" P2b --sub=C.3            # satu subkonsep
node "$NS" P2b --label=C.3-C2       # satu blok, mis. contoh angka
```
Tambahkan `--topic=<slug>` kalau skrip melaporkan node ada di beberapa topik; kalau pelajar tidak menyebut topiknya, tanyakan. Baris `#` di awal keluaran menyebut sesi dan path simpan klip, jadi pakai path itu; kalau berkasnya sudah ada, tambahkan `-2`, `-3`, dan seterusnya sebelum ekstensi, jangan menimpanya. Keluaran sudah tanpa soal kuis, klarifikasi, dan catatan pribadi pelajar. Node yang tidak ditemukan berarti materinya belum ditulis: laporkan ke pelajar, jangan mengarang isinya.

Setelah format dipilih, langsung tulis kode klip dari keluaran skrip ini. Pakai rumus, nama variabel, dan angka dari sana. Jangan menanyakan lagi hal yang sudah ada di materi.

## Sebelum membuat
1. Tulis klaim yang harus terasa setelah menonton, satu kalimat.
2. Tulis naskah langkah: tiap langkah satu kalimat, memakai contoh angka dari materi node. Angka di klip harus sama dengan angka di materi.
3. Untuk satu ide: maksimal sekitar 60 detik. Untuk satu node utuh: **satu video panjang tanpa batas durasi** (lihat "Satu node utuh"); jangan dipecah kecuali pelajar meminta.

## Gaya penjelasan
Terinspirasi cara 3Blue1Brown menjelaskan: gambar yang berubah membawa penalaran, dan teks hanya menemani. Ambil prinsipnya saja. Jangan meniru karakter, musik, logo, atau klip channel itu, dan jangan menyebut klip ini buatan channel itu.

1. **Mulai dari satu pertanyaan konkret dengan angka dari materi**, bukan dari definisi umum. Tampilkan rumus atau hasilnya sejak awal, lalu perlihatkan dari mana tiap bagiannya datang. Jangan memakai ajakan "tebak dulu" dan jangan menunda nama rumus sampai akhir (keduanya tidak dipakai menurut `LEARNER.md`).
2. **Satu objek tetap satu objek.** Ubah dengan transformasi yang berkesinambungan, bukan potongan adegan, supaya penonton melihat bahwa yang di akhir adalah yang di awal. Geser tampilan dengan `ValueTracker` dan `always_redraw`, dan pakai `TransformMatchingTex` untuk penurunan rumus.
3. **Warna punya arti.** Satu warna untuk satu objek, sama di rumus dan di gambar, sepanjang klip. Tandai dengan `set_color_by_tex`, yang hanya mengenai bagian `MathTex` yang cocok, jadi pecah rumus menjadi bagian-bagian yang ingin diwarnai.
4. **Hubungkan rumus dan gambar pada saat yang sama.** Saat satu suku rumus disorot dengan `Indicate`, objek yang diwakilinya bergerak atau menyala. Aljabar dan geometri tampil berdampingan.
5. **Satu perubahan pada satu waktu.** Redupkan yang tidak sedang dibahas, lalu beri jeda setelah tiap perubahan penting supaya sempat dicerna.
6. **Kata-kata pendek dan seperti mengobrol.** Tidak ada narasi, jadi kalimat di layar menggantikannya (efek suara hanya menandai kejadian, bukan menjelaskan): satu kalimat per langkah, tidak menutupi objek, dan hilang sebelum kalimat berikutnya.
7. **Tutup dengan pernyataan formal beserta syaratnya.** Klaim dan syarat di layar harus sama dengan materi. Kalau klip memakai analogi atau kasus khusus, sebutkan batasnya di layar, karena gambar yang meyakinkan pun tidak menggantikan bukti.

Tema: **video MP4 (Jalur B) memakai latar gelap** ala 3Blue1Brown (`#000000` atau `#1C1C1C`, teks dan sumbu putih atau abu terang) kecuali pelajar meminta latar putih. Animasi HTML (Jalur A) tetap latar putih kecuali diminta lain. Warna bermakna (merah, biru, hijau, kuning) dipilih agar kontras di latar yang dipakai.

## Satu node utuh
Kalau pelajar meminta video "untuk node ini" tanpa menyebut sub-bagian, artinya **seluruh node**, dan hasilnya **satu video panjang** (keputusan pelajar 2026-11-06: tidak dipecah, durasi panjang tidak masalah). Urutannya:
1. `node "$NS" <node> --list`, lalu periksa tiap subkonsep dan blok berlabel. Masukkan yang berupa proses berurutan atau yang terbantu gerakan (lintasan, iterasi, perubahan parameter) sebagai bab dalam video yang sama, mengikuti urutan materi. Definisi murni dan bukti tidak dijadikan bab.
2. Satu berkas: `<slug>-<node>-video.mp4` (kalau sudah ada, `-video-2`; jangan menimpa). Beri tiap bab judul singkat di layar dan jeda pendek antar-bab. Tidak ada batas 60 detik, tapi tiap bab tetap satu klaim dan satu perubahan pada satu waktu. Susun scene sebagai beberapa `Scene` terpisah di file sumber, render satu per satu, lalu gabungkan dengan ffmpeg (`concat`), supaya kesalahan satu bab tidak mengulang render semuanya.
3. Sebelum membuat, tulis daftar bab ke pelajar (label blok sumber, klaim satu kalimat, perkiraan durasi) dan tunggu persetujuan atau perubahan. Format (HTML atau MP4) ditanyakan sekali lewat chat.
4. Periksa tiap bab dengan pemeriksaan Jalur A/B, lalu periksa hasil gabungan (sambungan antar-bab: tidak ada bingkai kosong atau teks tertinggal). Pasang ke sesi dengan naskah bernomor yang dikelompokkan per bab, lalu **audit ulang sekali**.
5. Subkonsep tanpa bab disebut di akhir beserta alasannya.

## Jalur A: animasi HTML
Keluaran `.alvar/visuals/<slug>-<node>-anim.html`, satu berkas mandiri: HTML, CSS, dan JS vanila, **tanpa CDN dan tanpa jaringan**, harus jalan dari `file://`. Latar putih.

- Pisahkan **fungsi hitung murni** `computeSteps()` yang mengembalikan array keadaan, dari `render(k)` yang menggambar keadaan ke-`k`. Peralihan antar-langkah boleh dianimasikan halus sesuai gaya di atas, tetapi hanya untuk tampilan: `selfTest()` dan `?k=<n>` memeriksa keadaan di array itu.
- Kontrol: putar atau jeda, langkah maju dan mundur, penggeser langkah, dan tulisan "langkah k dari n" beserta kalimat naskahnya.
- Keadaan awal dibaca dari `?k=<n>` di URL, supaya tiap langkah bisa dipotret. Tanpa parameter, mulai dari langkah 0 dan tidak berputar otomatis.
- `selfTest()` membandingkan `computeSteps()` dengan angka dari materi dan menulis `SELFTEST: PASS` atau `SELFTEST: FAIL <rincian>` ke `<pre id="selftest" hidden>`.

Pemeriksaan (ulangi sampai bersih):
```bash
F=.alvar/visuals/<berkas>.html; T=$(mktemp -d); W=860; H=560
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -x "$E" ] || E="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$E" --headless --disable-gpu --virtual-time-budget=2000 --dump-dom "file:///$(cygpath -m "$PWD/$F")" 2>/dev/null | grep -o 'SELFTEST: [A-Z].*'
for k in 0 <tengah> <terakhir>; do
  "$E" --headless --disable-gpu --hide-scrollbars --window-size=$W,$H --screenshot="$(cygpath -w "$T/k$k.png")" "file:///$(cygpath -m "$PWD/$F")?k=$k" 2>/dev/null
done
```
Buka tiap PNG dengan Read. `FAIL` atau tidak ada keluaran berarti perbaiki dan ulangi. Hapus `$T` setelah lolos.

Tautkan dari sesi: `[Animasi: <judul>](visuals/<berkas>.html)`. Obsidian tidak menjalankan HTML; pelajar membukanya di browser dari file manager.

## Efek suara (Jalur B, default menyala)
Keputusan pelajar 2026-11-06: efek suara **menyala sebagai default** di video MP4. Dimatikan hanya bila pelajar memintanya. Animasi HTML tidak memakai suara.
- **Hanya nada sederhana buatan sendiri**: manim tidak menyertakan berkas suara, jadi bangkitkan `.wav` dengan NumPy di folder sementara `$T` (tidak ada urusan lisensi, tidak ada unduhan). Tanpa musik latar, tanpa suara orang, tanpa berkas dari luar kecuali pelajar menyetujui.
- **Satu bunyi untuk satu kejadian penting**, bukan tiap gerakan: langkah atau bab baru (klik pendek), hasil membaik atau konvergen (nada naik), hasil memburuk atau diverge (nada turun), batas kritis tercapai (dua ketukan). Makna bunyi dipakai konsisten sepanjang video. Volume rendah (amplitudo sekitar 0,25), durasi tiap bunyi di bawah 0,4 detik, dan jangan dua bunyi bersamaan.
- **Pasang dengan** `self.add_sound(path, time_offset=0, gain=...)` tepat saat kejadian dimulai (panggil sebelum `self.play(...)` yang menandainya). Tiap bab di-render sendiri lalu digabung; gabungkan dengan ffmpeg tanpa menghilangkan audio (`-c copy`, atau `-c:a aac` bila perlu).
- **Contoh pembangkit**:
```python
import numpy as np, wave
def tone(path, f0, f1, dur=0.18, sr=44100, vol=0.25):
    t = np.linspace(0, dur, int(sr*dur), endpoint=False)
    f = np.linspace(f0, f1, t.size)
    y = np.sin(2*np.pi*np.cumsum(f)/sr) * np.exp(-t*5/dur) * np.minimum(1, t/0.005) * vol
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((y*32767).astype("<i2").tobytes())
tone(f"{T}/klik.wav", 900, 900, 0.06)   # langkah baru
tone(f"{T}/naik.wav", 440, 880)         # membaik
tone(f"{T}/turun.wav", 440, 200, 0.3)   # memburuk
```
- **Pemeriksaan**: kamu tidak bisa mendengar, jadi periksa lewat `ffprobe -show_streams` bahwa ada aliran audio, `ffmpeg -af volumedetect -f null -` bahwa puncaknya tidak mendekati 0 dB (hindari lonjakan keras, target di bawah sekitar -6 dB), dan bahwa waktu tiap `add_sound` di kode cocok dengan bingkai kejadiannya. Katakan ke pelajar bahwa suara belum didengar langsung.

## Jalur B: video MP4 dengan efek suara
Keluaran `.alvar/visuals/<slug>-<node>-video.mp4`. Lingkungan sudah tersedia di mesin ini:
- manim di virtual environment `~/.alvar-video`. Pakai yang ini saja: **jangan membuat virtual environment baru, jangan memasang ulang manim, dan jangan memasangnya ke Python utama**. Kalau `$PY` di bawah tidak ada atau gagal, laporkan ke pelajar dan berhenti, jangan memasang apa pun tanpa persetujuannya;
- ffmpeg dari winget, mungkin belum ada di `PATH`, jadi cari lokasinya;
- LaTeX dari MiKTeX untuk `MathTex`.

Sumber scene ditulis di folder sementara, tidak disimpan ke vault.
```bash
PY="$HOME/.alvar-video/Scripts/python.exe"
FF=$(find "$(cygpath -u "$LOCALAPPDATA")/Microsoft/WinGet/Packages" -type f -name ffmpeg.exe 2>/dev/null | head -1)
T=$(mktemp -d); ROOT="$PWD"          # tulis $T/klip.py dengan tool Write
cd "$T" && PATH="$(dirname "$FF"):$PATH" "$PY" -m manim render -qm --disable_caching --media_dir "$T/media" klip.py Klip
M=$(find "$T/media" -name 'Klip.mp4' | head -1)
"$(dirname "$FF")/ffprobe.exe" -v error -show_entries format=duration,size -of csv=p=0 "$M"
for s in <awal> <tengah> <akhir>; do "$FF" -v error -y -ss $s -i "$M" -frames:v 1 "$T/f$s.png"; done
```
Isi scene:
- Latar gelap: `self.camera.background_color = "#1C1C1C"` (atau `BLACK`). Warna bawaan manim memang dirancang untuk latar gelap, jadi teks, sumbu, dan `MathTex` boleh memakai warna bawaan (putih). Kalau pelajar meminta latar putih: `WHITE` dengan teks dan sumbu `BLACK`, dan pilih ulang warna terang (kuning, hijau muda) yang tidak terbaca di putih.
- Rumus di layar mengikuti notasi materi persis: transpos `^\top` (bukan `^T` atau `^o`), vektor, indeks, dan label sama dengan di sesi. Kumpulkan **semua string `MathTex` dan `Text`** ke satu daftar dan cetak ke berkas teks di `$T`; bandingkan satu per satu dengan materi sebelum render akhir.
- Transisi teks: hapus teks lama sepenuhnya (`FadeOut` selesai) sebelum teks baru tampil di posisi yang sama, atau pakai `ReplacementTransform`/`TransformMatchingTex`. Jangan membiarkan dua teks bertumpuk di posisi yang sama, karena sisa bayangan terlihat saat memudar.
- Ukuran: panah sumbu kecil (`tip_length` sekitar 0.15), dan teks catatan kaki sekurangnya `font_size=24` supaya terbaca di 720p.
- Hitung semua angka dengan rumus yang sama dengan materi di dalam scene, dan `assert` terhadap contoh angka materi sebelum menganimasikan. Skrip harus berhenti kalau angkanya salah.
- Rumus dan setiap simbol memakai `MathTex`, karena `Text("x_3")` tampil mentah sebagai `x_3`. Kalimat biasa memakai `Text`. Teks harus bertahan cukup lama untuk dibaca, kira-kira 2 detik per kalimat pendek.
- Skala sumbu tetap selama klip. Batasi rentang kurva dengan `ax.plot(f, x_range=[a, b])` supaya tidak keluar dari sumbu dan menabrak rumus.

Pemeriksaan (ulangi sampai bersih):
1. Daftar string layar (lihat di atas) cocok dengan materi: notasi, angka, dan syarat.
2. Buka bingkai dengan Read. Kamu tidak bisa menonton gerakannya secara utuh, jadi ambil bingkai per 2 detik, dan **tambahan bingkai di tengah tiap transisi** (sekitar 0,3 detik setelah teks atau objek baru mulai muncul) untuk menangkap teks bertumpuk. Gabungkan dengan `tile` ffmpeg (mis. `fps=1/2,scale=640:-1,tile=3x3`) agar efisien, lalu perbesar bingkai yang mencurigakan. Minimal tiga bingkai tetap berlaku untuk klip yang sangat pendek.
3. Periksa kontras warna di latar yang dipakai, teks tidak terpotong di tepi, dan tidak ada notasi mentah (`^o`, `\top` tampil apa adanya, `x_3` tanpa `MathTex`).
Setelah lolos, salin `$M` ke `$ROOT/.alvar/visuals/`, lalu hapus `$T`. Render dan sumber sementara tidak ditaruh di `.alvar/visuals/`, dan berkas lain di sana jangan pernah dihapus karena bisa milik sesi lain.

Tautkan dari sesi: `![[<berkas>.mp4]]`. Untuk satu ide, ukuran di atas sekitar 10 MB berarti klip terlalu panjang; video satu node utuh boleh lebih besar, tapi tetap di bawah batas 16 MB per berkas Artifact bila akan dipublikasikan dan sebaiknya di bawah sekitar 50 MB untuk vault. Kalau melebihi, turunkan kualitas (`-qm` sudah cukup; jangan `-qh`).

## Memasang ke sesi
- Tempelkan tautan di subkonsep terkait beserta **naskah langkah** dan satu paragraf keterangan ("lihat dulu ..., lalu perhatikan ..."). Naskahnya wajib ada karena auditor hanya membaca teks: **daftar bernomor, satu butir per langkah**, memuat rumus dan angka yang tampil di layar pada langkah itu (bukan paragraf saja). Auditor tidak melihat isi video, jadi cek daftar string layar dari Jalur B menjadi tanggung jawabmu; lulusnya audit tidak membuktikan teks di dalam video benar.
- Menambah teks ke node membuat audit basi, jadi audit ulang sekali dengan `alvar-auditor`. Untuk node yang sudah dikuis, audit ulang juga.
- Jangan menampilkan soal, kunci, atau petunjuk kuis. Klip tidak mengubah Ledger atau map.

## Kesalahan yang dicek
- Angka di klip tidak sama dengan contoh di materi
- Langkah bergerak terlalu cepat untuk dibaca, atau teks menutupi objek
- Skala sumbu berubah diam-diam
- Teks atau warna tidak kontras dengan latar (putih di putih, biru tua di hitam), atau teks terpotong di tepi
- Notasi di layar berbeda dari materi (`^o` atau `^T` untuk transpos, label diganti)
- Teks lama dan baru bertumpuk saat transisi
- Permintaan "satu node" hanya mencakup satu sub-bagian, atau dipecah jadi banyak berkas padahal pelajar minta satu video
- Klaim klip berbeda dari kasus yang baru diajarkan

## Sesudah
Beri tahu pelajar apa yang diperhatikan dulu dan di mana berkasnya. Sampaikan bahwa kamu hanya memeriksa bingkai diam, jadi kalau gerakan terasa terlalu cepat atau janggal, minta dia mengabari.
