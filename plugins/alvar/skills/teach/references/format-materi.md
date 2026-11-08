# Format materi node Alvar

Satu-satunya sumber format materi. Alasan dan preferensi di baliknya ada di `.alvar/LEARNER.md` ("What I want in the material"); file ini hanya mengatur bentuknya. Sebagian aturan ditegakkan CLI (`A lesson` menolak) dan auditor; aturan itu ditandai **[CLI]**. Node lama tidak diubah kecuali diminta.

## 1. Kerangka node

1. Heading `## Node <id> — <judul>` (judul dari checklist rencana).
2. Pembuka node (sebelum `###` pertama): satu paragraf berisi apa yang dibangun node ini, pertanyaannya, dan urutan subkonsep; lalu 2-3 pertanyaan pemandu beserta bagian yang menjawab tiap pertanyaan, dan peta bacaan (jumlah bagian bernomor per subkonsep). Tanpa klaim baru; istilah didefinisikan informal di tempat, sekali.
3. Tiap subkonsep di checklist: `### <id> <judul>`, id persis seperti di checklist, judul wajib. **[CLI]**
4. Akhir node, berurutan: **Latihan manual (M, opsional).** dan **Tugas K (opsional).** bila checklist menyebutnya (deskripsi tugas saja, tanpa berkas kode atau kunci), lalu **Jelaskan balik** (bagian 6).

## 2. Isi satu subkonsep

Bagian yang tidak menambah apa pun untuk subkonsep itu dilewati, tanpa heading kosong atau pengisi.

1. **Intinya**: hasil dulu dalam 2-4 kalimat, sebagai pratinjau: APA hasilnya dan kenapa perlu, tanpa bukti. Hanya memakai istilah yang sudah `known` atau didefinisikan informal di tempat.
2. **Motivasi.**: masalah yang diselesaikan konsep ini, idealnya satu kasus konkret. Prosa pendek, tanpa klaim baru.
3. **Intuisi.**: makna konseptual, geometris, atau fisis, beserta batas analoginya ("analogi ini gagal kalau ..."). Prosa pendek, tanpa klaim baru.
4. **Blok inti**: isi presisi bidangnya, lengkap dan tidak dipersingkat. Jenis blok dipilih per subkonsep menurut kebutuhannya, bukan kewajiban mengisi semua: definisi, teorema atau proposisi, hukum empiris, bukti atau justifikasi, prosedur atau aturan, spesifikasi, contoh, gambar. Bukti, derivasi, atau argumen diawali satu kalimat ide dan setiap langkahnya diberi alasan (bersandar pada apa), bukan sekadar manipulasi simbol. Heuristik dan konvensi ditandai sebagai heuristik atau konvensi, bukan aturan.
5. **Contoh langsung**: tepat setelah definisi, hukum, atau teorema utama, satu contoh angka atau kasus pendek. Contoh berlabel yang lebih besar boleh menyusul. Contoh pendek tetap klaim dan diaudit.
6. **Contoh terapan.** (bila perlu): hasil inti diterapkan pada kasus konkret, terpisah dari kasus di Motivasi.
7. **Konsekuensi dan batas.**: apa yang mengikuti dan kaitannya dengan konsep lain. Kontra-contoh pendek hanya bila syarat penting bisa dibuang untuk menunjukkan kesimpulan gagal. Kesenjangan asumsi teori dan praktik bila ada. Tanpa klaim baru.
8. **Versi sederhana**: **pendek, 3-5 kalimat** (diputuskan 2026-11-08): alur inti dari masalah ke kesimpulan, dan satu jebakan. Tidak menulis ulang rumus atau contoh; merujuk lewat token label persis (atau nama blok bila tak berlabel). Tidak pernah melonggarkan syarat atau memparafrasekan pernyataan inti dengan syarat yang hilang.

Motivasi dan Intuisi boleh mendahului pernyataan presisi, tetapi tetap ringkas dan di subkonsep yang sama. Pernyataan presisi tidak pernah ditunda ke subkonsep lain.

## 3. Alur baca

Tidak memperpendek blok inti; hanya memecah dan mengurutkan bacaan.

* Di dalam `###`, kelompokkan blok inti menjadi bagian `#### <n>. <judul>` (bukan `###`). Intinya, Motivasi, Intuisi, dan Notasi langsung di bawah `###`. Satu bagian memuat satu ide beserta contohnya, sehingga tiap batas bagian adalah titik berhenti yang wajar.
* Bagian terakhir: `#### Rangkuman <id>`, berisi Konsekuensi dan batas serta Versi sederhana.
* Tutup tiap bagian dengan Jembatan: satu atau dua kalimat berisi pertanyaan yang dijawab bagian berikutnya (sebuah kebutuhan, bukan klaim baru). Antar-subkonsep: Jembatan ke <id>.

## 4. Label

Label hanya dipakai bila node memuat definisi, teorema, atau contoh utama; node prosedural atau naratif tanpa itu tidak perlu label, dan Versi sederhana merujuk blok lewat namanya.

* Bentuk: tebal di awal blok dengan nama pendek, `**Definisi L.1-D1 (proyeksi ortogonal).**`. Awalan = id subkonsep, jadi unik dalam file sesi.
* Jenis yang dicek CLI **[CLI]**: `Definisi` (D), `Teorema` atau `Lema` (T), `Contoh` (C). Huruf jenis harus cocok, id harus subkonsep di checklist node itu, tidak boleh dua kali, dan setiap token yang dirujuk harus ada di node yang sama.
* Jenis lain yang dipakai di praktik (tidak dicek CLI, jaga konsistensinya sendiri): `Proposisi` (P), `Hukum` (L), `Heuristik` (H), `Aturan` atau `Prosedur` (R).
* Bukti langsung mengikuti teoremanya dan memakai label teorema itu, tanpa label sendiri.
* Rujukan memakai token persis (mis. `L.1-D1`), bukan parafrase. Rujukan ke node lain: sebut id node dan deskripsi biasa, jangan token label atau id subkonsep node lain. **[CLI]**

## 5. Callout Obsidian

Callout menggantikan label tebal run-in untuk blok yang sama. Semua terbuka (tanpa `-` lipat). Isinya diaudit seperti prosa.

* Semua topik:
  * `> [!abstract] Intinya`
  * `> [!example] Contoh langsung` (contoh berlabel `**Contoh L.1-C1 (nama).**` tetap prosa)
  * `> [!warning] Jebakan`: salah kaprah umum, pasangan yang mudah tertukar, dan tes cepat membedakannya. Paling banyak satu per subkonsep, hanya bila jebakannya nyata.
  * `> [!question] Jembatan` (antar-subkonsep: `Jembatan ke <id>`)
  * `> [!note] Versi sederhana`
* Bersyarat:
  * `> [!tip] Kapan pakai apa`: tabel "kebutuhan -> pilihan", hanya untuk topik yang memilih antar-opsi (layanan, metode, algoritma).
  * `> [!quote] Acuan`: satu baris penunjuk ke sumber luar subkonsep (butir silabus, capaian pembelajaran, bab buku, task statement ujian), hanya bila ada.
  * `> [!success] Kata kunci`: 3-5 istilah wajib di akhir subkonsep, hanya untuk topik berbasis istilah atau hafalan, bukan matematika.
* Tetap prosa: Motivasi, Intuisi, definisi, teorema, bukti, blok berlabel, Konsekuensi dan batas, Jelaskan balik. Heading (`###`, `####`) selalu di luar callout.
* Sintaks: tiap baris diawali `> `; baris kosong di dalam callout ditulis `>`; tabel dan LaTeX di dalam callout tetap berawalan `> `. Jangan pakai `[!catatan]`: itu catatan pribadi pelajar dan tidak diaudit.
* Bila CLI menolak materi ber-callout, laporkan; jangan mengubah gaya diam-diam.

## 6. Jelaskan balik **[CLI]**

Teks tebal `**Jelaskan balik**` (bukan heading) di akhir node, diikuti 2-3 butir bernomor. Tiap butir meminta pelajar menjelaskan dengan kata-kata sendiri mengapa suatu klaim kunci berlaku, atau apa yang rusak bila syarat dibuang; bukan menghitung ulang angka. Tidak menduplikasi atau membocorkan soal kuis. Ditulis sebelum audit (edit setelah audit membuat audit basi). Tidak ditampilkan di chat.

## 7. Gambar, diagram, kode

* Diagram Mermaid (otomatis, tanpa perlu diminta): buat bila **pokok bahasan subkonsep adalah struktur hubungan antarbagian** (urutan, percabangan, keadaan dan transisi, ketergantungan, hierarki dengan kriteria, sebab-akibat) dan struktur itu sulit dipegang lewat prosa saja. Satu blok kode `mermaid` tepat setelah prosa yang menjelaskannya, satu diagram per struktur.
  * Contoh, bukan daftar lengkap: alur proses atau pipeline, pohon keputusan memilih opsi, klasifikasi dengan kriteria di tiap cabang, siklus hidup atau mesin keadaan, struktur bukti panjang, rantai sebab-akibat, struktur argumen tulisan, relasi data atau kelas.
  * Jangan dipaksakan: daftar fakta, definisi tunggal, dan perbandingan sejajar lebih jelas sebagai prosa atau tabel; peta prasyarat antar-node sudah ada di DAG rencana.
  * Diagram melengkapi prosa, tidak menggantikannya. Label simpul pendek dalam tanda kutip, tanpa LaTeX; kriteria percabangan ditulis di label panah. Isinya diaudit: urutan, arah panah, dan kriteria harus benar.
  * Pakai tipe yang lama didukung Obsidian: `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram`, `erDiagram`. Hindari tipe baru (mis. `mindmap`) yang mungkin tidak tampil.
* Gambar SVG: **hanya bila pelajar memintanya** (lewat `alvar:learn-visual`, atau tanda G di checklist yang ditambahkan atas permintaannya). Jangan menambah gambar atas inisiatif sendiri. Proses render-cek ada di agen `alvar-lesson-writer`.
* Snippet kode: bila node mengajarkan algoritma atau komputasi yang wajar dijalankan, blok ```python pendek berisi intinya di blok inti, tepat setelah rumus atau prosedurnya. Jalankan dulu terhadap contoh angka di materi dan pastikan cocok. Lewati bila tidak ada yang dijalankan. Snippet melengkapi pernyataan presisi, tidak menggantikannya.

## 8. Bahasa dan notasi

* Bahasa Indonesia; istilah teknis diikuti padanan Inggris dalam kurung saat pertama muncul.
* Semua simbol matematika dalam `$...$` dengan LaTeX penuh (`\mathbf`, `\operatorname`, `\begin{bmatrix}` dengan `\\`); tanpa Unicode matematika.
* Panjang bukan batasan untuk blok inti: node boleh panjang. Jangan pernah memendekkan blok inti untuk memberi ruang.
