const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// Konfigurasi CORS agar mengizinkan semua akses dari frontend Vercel Anda
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Menghubungkan ke MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Berhasil terhubung ke MongoDB! 🍃"))
  .catch((error) => console.error("Gagal terhubung ke MongoDB ❌:", error));

// Cetak Biru Database (Schema)
const sesiSchema = new mongoose.Schema({
  namaKlien: { type: String, required: true },
  pin: { type: String, required: true },
  fotoList: [
    {
      url: String,
      terpilih: { type: Boolean, default: false },
    },
  ],
});
const Sesi = mongoose.model("Sesi", sesiSchema);

// Konfigurasi Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rute Dasar
app.get("/", (req, res) =>
  res.send("Halo! Server Aplikasi Pilih Foto sudah berjalan 🚀"),
);

// Rute Upload Foto ke Cloudinary
app.post("/api/upload", upload.single("foto"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Tidak ada foto" });
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "aplikasi-pilih-foto" },
    (error, result) => {
      if (error) return res.status(500).json({ error: "Gagal upload" });
      res.json({ url: result.secure_url });
    },
  );
  uploadStream.end(req.file.buffer);
});

// Rute Simpan Sesi Fotografer
app.post("/api/sesi", async (req, res) => {
  try {
    const { namaKlien, pin, fotoUrls } = req.body;
    const formatFoto = fotoUrls.map((url) => ({ url: url, terpilih: false }));
    const sesiBaru = new Sesi({ namaKlien, pin, fotoList: formatFoto });
    await sesiBaru.save();
    res.json({
      pesan: "Sesi galeri berhasil dibuat! 🎉",
      idSesi: sesiBaru._id,
    });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan saat menyimpan data" });
  }
});

// --- 4. RUTE BARU: KLIEN MEMINTA DATA GALERI ---
// Klien mengirimkan ID (dari link web), lalu server membalas dengan data foto-fotonya
app.get("/api/sesi/:id", async (req, res) => {
  try {
    const sesi = await Sesi.findById(req.params.id);
    if (!sesi)
      return res.status(404).json({ error: "Sesi galeri tidak ditemukan" });
    res.json(sesi);
  } catch (error) {
    res.status(500).json({ error: "ID tidak valid atau server bermasalah" });
  }
});

// --- 5. RUTE BARU: KLIEN MENYIMPAN FOTO YANG DIPILIH ---
// Saat klien menekan tombol "Simpan Pilihan", server akan memperbarui status centang di database
app.put("/api/sesi/:id", async (req, res) => {
  try {
    const { fotoList } = req.body;
    const sesiUpdate = await Sesi.findByIdAndUpdate(
      req.params.id,
      { fotoList: fotoList },
      { returnDocument: "after" }, // <--- KODE YANG BARU
    );
    res.json({ pesan: "Pilihan foto berhasil disimpan! ✅", sesi: sesiUpdate });
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan pilihan klien" });
  }
});

// 6. RUTE MENGAMBIL SEMUA SESI (Untuk Daftar Sesi Aktif)
app.get("/api/sesi", async (req, res) => {
  try {
    const semuaSesi = await Sesi.find().sort({ _id: -1 }); // Urutkan dari yang terbaru
    res.json(semuaSesi);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil daftar sesi" });
  }
});

// 7. RUTE MENGHAPUS SESI
app.delete("/api/sesi/:id", async (req, res) => {
  try {
    await Sesi.findByIdAndDelete(req.params.id);
    res.json({ pesan: "Sesi galeri berhasil dihapus! 🗑️" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus sesi" });
  }
});

module.exports = app;
