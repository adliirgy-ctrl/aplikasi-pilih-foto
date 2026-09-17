import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

// URL Backend Vercel Anda
const API_URL = "https://aplikasi-pilih-foto.vercel.app";

// --- 1. HALAMAN UTAMA / BERANDA PENGHUBUNG ---
function Beranda() {
  return (
    <div style={styles.heroContainer}>
      <div style={styles.heroCard}>
        <span style={styles.badge}>Sistem Galeri Profesional 📸</span>
        <h1 style={styles.heroTitle}>Platform Pemilihan Foto Klien</h1>
        <p style={styles.heroSubtitle}>
          Kelola portofolio, unggah hasil jepretan, dan biarkan klien memilih
          foto favorit mereka dengan aman dan terlindungi watermark.
        </p>

        <div style={styles.heroActions}>
          <Link to="/fotografer/login" style={styles.primaryButton}>
            Login Fotografer &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- 2. HALAMAN LOGIN FOTOGRAFER ---
function LoginFotografer() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Kredensial login fotografer (bisa Anda ubah sesuai keinginan)
    if (username === "fotografer" && password === "admin123") {
      localStorage.setItem("isFotograferLoggedIn", "true");
      navigate("/fotografer/dashboard");
    } else {
      setError("Username atau Password salah! ❌");
    }
  };

  return (
    <div style={styles.centerScreen}>
      <div style={styles.loginCard}>
        <span style={styles.badge}>Portal Eksklusif</span>
        <h2 style={{ margin: "10px 0 5px 0", color: "#0f172a" }}>
          Login Fotografer
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "25px" }}>
          Masuk untuk mengelola dan mengunggah sesi foto klien.
        </p>
        <form onSubmit={handleLogin}>
          <div style={{ textAlign: "left", marginBottom: "15px" }}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="fotografer"
              style={styles.input}
              required
            />
          </div>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.loginButton}>
            Masuk ke Dasbor
          </button>
        </form>
        {error && <p style={styles.errorText}>{error}</p>}
        <div style={{ marginTop: "20px" }}>
          <Link
            to="/"
            style={{
              fontSize: "13px",
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- 3. DASHBOARD FOTOGRAFER (Hanya bisa diakses jika sudah login) ---
function DashboardFotografer() {
  const [files, setFiles] = useState([]);
  const [namaKlien, setNamaKlien] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  const [linkGaleri, setLinkGaleri] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  // Cek autentikasi saat halaman dibuka
  useEffect(() => {
    const isAuth = localStorage.getItem("isFotograferLoggedIn");
    if (!isAuth) {
      navigate("/fotografer/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isFotograferLoggedIn");
    navigate("/fotografer/login");
  };

  const handlePilihFile = (e) => setFiles(Array.from(e.target.files));

  const handleBuatSesi = async (e) => {
    e.preventDefault();
    if (!namaKlien || !pin || files.length === 0) {
      setStatus("⚠️ Harap isi Nama Klien, PIN, dan pilih minimal 1 foto!");
      return;
    }
    setIsUploading(true);
    setStatus(`Memproses ${files.length} foto ke Cloudinary... ⏳`);

    try {
      const fotoUrls = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("foto", files[i]);
        setStatus(`Mengunggah foto ${i + 1} dari ${files.length}... ⏳`);
        const uploadRes = await axios.post(`${API_URL}/api/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fotoUrls.push(uploadRes.data.url);
      }
      setStatus("Menyimpan data sesi ke Database... ⏳");
      const sesiRes = await axios.post(`${API_URL}/api/sesi`, {
        namaKlien,
        pin,
        fotoUrls,
      });
      setStatus("Sesi galeri berhasil dibuat! 🎉");
      setLinkGaleri(`${window.location.origin}/galeri/${sesiRes.data.idSesi}`);
    } catch (error) {
      console.error(error);
      const pesanError =
        error.response?.data?.error || error.message || "Gagal";
      setStatus(`❌ Gagal: ${pesanError}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerBar}>
        <div>
          <h2 style={styles.pageTitle}>Dashboard Fotografer 📷</h2>
          <p style={styles.pageDesc}>
            Panel unggah khusus fotografer profesional.
          </p>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout 🚪
        </button>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleBuatSesi}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nama Klien / Acara</label>
            <input
              type="text"
              placeholder="Contoh: Pernikahan Sarah & Reza"
              value={namaKlien}
              onChange={(e) => setNamaKlien(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>PIN Akses Rahasia Klien</label>
            <input
              type="text"
              placeholder="Contoh: 2026"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.input}
            />
            <small style={styles.hint}>
              PIN ini digunakan klien untuk masuk ke galeri mereka.
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Pilih Foto Preview (Bisa Banyak)</label>
            <div style={styles.fileDropZone}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePilihFile}
                style={styles.fileInput}
              />
              <p style={{ margin: 0, color: "#64748b" }}>
                {files.length > 0
                  ? `📁 ${files.length} foto terpilih`
                  : "Klik atau seret file foto ke sini"}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            style={{
              ...styles.submitButton,
              backgroundColor: isUploading ? "#94a3b8" : "#0f172a",
            }}
          >
            {isUploading
              ? "Sedang Mengunggah..."
              : "✨ Buat & Terbitkan Sesi Galeri"}
          </button>
        </form>

        {status && (
          <div
            style={{
              ...styles.alertBox,
              backgroundColor: status.includes("❌")
                ? "#fee2e2"
                : status.includes("🎉")
                  ? "#dcfce7"
                  : "#e0f2fe",
              color: status.includes("❌")
                ? "#991b1b"
                : status.includes("🎉")
                  ? "#166534"
                  : "#0369a1",
            }}
          >
            {status}
          </div>
        )}
      </div>

      {linkGaleri && (
        <div style={styles.successCard}>
          <h3 style={{ margin: "0 0 10px 0", color: "#166534" }}>
            Sesi Berhasil Diluncurkan! 🚀
          </h3>
          <p
            style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#15803d" }}
          >
            Bagikan tautan dan PIN rahasia <strong>{pin}</strong> ini kepada
            klien:
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              readOnly
              value={linkGaleri}
              style={styles.inputLink}
            />
            <button
              onClick={() => navigator.clipboard.writeText(linkGaleri)}
              style={styles.copyButton}
            >
              Salin Link
            </button>
          </div>
          <div style={{ marginTop: "12px" }}>
            <a
              href={linkGaleri}
              target="_blank"
              rel="noreferrer"
              style={styles.previewLink}
            >
              Buka Halaman Klien di Tab Baru &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 4. HALAMAN KLIEN (Murni Akses Pilih Foto, TANPA FITUR UPLOAD) ---
function GaleriKlien() {
  const { id } = useParams();
  const [sesi, setSesi] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState("Memuat galeri...");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/sesi/${id}`)
      .then((res) => {
        setSesi(res.data);
        setStatus("");
      })
      .catch((err) => {
        setStatus(
          "Maaf, sesi galeri tidak ditemukan atau tautan kedaluwarsa ❌",
        );
        console.error(err);
      });
  }, [id]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === sesi.pin) {
      setIsLoggedIn(true);
      setStatus("");
    } else {
      setStatus(
        "PIN Akses Salah! Silakan periksa kembali pesan dari fotografer. 🔒",
      );
    }
  };

  const handlePilihFoto = (index) => {
    const sesiBaru = { ...sesi };
    sesiBaru.fotoList[index].terpilih = !sesiBaru.fotoList[index].terpilih;
    setSesi(sesiBaru);
  };

  const handleSimpanPilihan = async () => {
    setIsSaving(true);
    setStatus("Menyimpan daftar foto pilihan Anda... ⏳");
    try {
      const res = await axios.put(`${API_URL}/api/sesi/${id}`, {
        fotoList: sesi.fotoList,
      });
      setStatus(
        "Pilihan foto berhasil disimpan! Fotografer akan segera memprosesnya. ✅",
      );
    } catch (error) {
      setStatus("Gagal menyimpan pilihan ke server ❌");
    } finally {
      setIsSaving(false);
    }
  };

  if (!sesi) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.cardLoading}>
          <h2>{status}</h2>
        </div>
      </div>
    );
  }

  // Tampilan Login Klien
  if (!isLoggedIn) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.loginCard}>
          <span style={styles.badgeClient}>Galeri Klien Eksklusif</span>
          <h2 style={{ margin: "10px 0 5px 0", color: "#0f172a" }}>
            {sesi.namaKlien}
          </h2>
          <p
            style={{ color: "#64748b", fontSize: "14px", marginBottom: "25px" }}
          >
            Masukkan PIN rahasia yang diberikan oleh fotografer Anda untuk
            melihat galeri foto.
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN Rahasia"
              style={styles.pinInput}
              autoFocus
            />
            <button type="submit" style={styles.loginButton}>
              Buka Galeri Saya
            </button>
          </form>
          {status && <p style={styles.errorText}>{status}</p>}
        </div>
      </div>
    );
  }

  const jumlahDipilih = sesi.fotoList.filter((foto) => foto.terpilih).length;

  // Tampilan Galeri Interaktif Klien (Tanpa Tombol/Menu Upload Sama Sekali)
  return (
    <div style={styles.container}>
      <div style={styles.clientHeader}>
        <div>
          <span style={styles.badgeClient}>Sesi Aktif Klien</span>
          <h2 style={{ margin: "5px 0 0 0", color: "#0f172a" }}>
            {sesi.namaKlien}
          </h2>
        </div>
        <div style={styles.clientActionBox}>
          <div style={styles.counterBadge}>
            Terpilih: <strong>{jumlahDipilih}</strong> / {sesi.fotoList.length}{" "}
            Foto
          </div>
          <button
            onClick={handleSimpanPilihan}
            disabled={isSaving}
            style={styles.saveButton}
          >
            {isSaving ? "Menyimpan..." : "💾 Simpan Pilihan"}
          </button>
        </div>
      </div>

      {status && <div style={styles.statusToast}>{status}</div>}

      <p style={styles.instructionText}>
        💡{" "}
        <em>
          Klik pada foto untuk memilih atau membatalkan pilihan. Foto dilindungi
          dengan watermark proof.
        </em>
      </p>

      <div style={styles.photoGrid}>
        {sesi.fotoList.map((foto, index) => (
          <div
            key={index}
            onClick={() => handlePilihFoto(index)}
            style={{
              ...styles.photoCard,
              borderColor: foto.terpilih ? "#10b981" : "transparent",
              boxShadow: foto.terpilih
                ? "0 0 0 4px rgba(16, 185, 129, 0.2)"
                : "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          >
            <img
              src={foto.url.replace(
                "/upload/",
                "/upload/c_scale,w_800/l_text:Arial_60_bold:PROOF,co_white,o_50,a_-45/",
              )}
              alt={`Foto ${index + 1}`}
              style={styles.photoImg}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            {foto.terpilih && <div style={styles.checkOverlay}>✓ Dipilih</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 5. TATA LETAK UTAMA ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Beranda />} />
        <Route path="/fotografer/login" element={<LoginFotografer />} />
        <Route path="/fotografer/dashboard" element={<DashboardFotografer />} />
        <Route path="/galeri/:id" element={<GaleriKlien />} />
      </Routes>
    </Router>
  );
}

// --- STYLING PROFESIONAL MODERN ---
const styles = {
  heroContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: "20px",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    padding: "50px 40px",
    borderRadius: "16px",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    maxWidth: "550px",
    width: "100%",
  },
  badge: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  heroTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "20px 0 10px 0",
  },
  heroSubtitle: {
    color: "#64748b",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "30px",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "14px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
    display: "inline-block",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "30px 20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "15px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
  },
  pageDesc: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  logoutButton: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    marginBottom: "20px",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  hint: {
    display: "block",
    marginTop: "5px",
    fontSize: "12px",
    color: "#94a3b8",
  },
  fileDropZone: {
    border: "2px dashed #cbd5e1",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    position: "relative",
    cursor: "pointer",
  },
  fileInput: {
    opacity: 0,
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  },
  submitButton: {
    width: "100%",
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
  },
  alertBox: {
    marginTop: "20px",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  successCard: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "20px",
    borderRadius: "12px",
  },
  inputLink: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #86efac",
    backgroundColor: "#ffffff",
    fontSize: "13px",
  },
  copyButton: {
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    padding: "0 16px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  previewLink: {
    color: "#15803d",
    fontSize: "14px",
    fontWeight: "500",
    textDecoration: "none",
  },
  centerScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    padding: "20px",
  },
  cardLoading: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    textAlign: "center",
  },
  loginCard: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  badgeClient: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  pinInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    textAlign: "center",
    letterSpacing: "2px",
    marginBottom: "15px",
    boxSizing: "border-box",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  errorText: {
    color: "#dc2626",
    fontSize: "13px",
    marginTop: "15px",
  },
  clientHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
    marginBottom: "15px",
    flexWrap: "wrap",
    gap: "10px",
  },
  clientActionBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  counterBadge: {
    fontSize: "14px",
    color: "#334155",
    backgroundColor: "#f1f5f9",
    padding: "8px 12px",
    borderRadius: "6px",
  },
  saveButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "9px 16px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  statusToast: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "15px",
    textAlign: "center",
  },
  instructionText: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "20px",
    textAlign: "center",
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },
  photoCard: {
    borderRadius: "10px",
    overflow: "hidden",
    cursor: "pointer",
    position: "relative",
    border: "4px solid transparent",
    backgroundColor: "white",
    transition: "all 0.2s ease",
  },
  photoImg: {
    width: "100%",
    height: "210px",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
    userSelect: "none",
  },
  checkOverlay: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    backgroundColor: "#10b981",
    color: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
};

export default App;
