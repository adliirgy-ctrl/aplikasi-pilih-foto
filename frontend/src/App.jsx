import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

// --- 1. KOMPONEN HALAMAN FOTOGRAFER ---
function DashboardFotografer() {
  const [files, setFiles] = useState([]);
  const [namaKlien, setNamaKlien] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  const [linkGaleri, setLinkGaleri] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handlePilihFile = (e) => setFiles(Array.from(e.target.files));

  const handleBuatSesi = async () => {
    if (!namaKlien || !pin || files.length === 0) {
      setStatus("Harap isi Nama, PIN, dan pilih minimal 1 foto! 😅");
      return;
    }
    setIsUploading(true);
    setStatus(`Mulai mengunggah ${files.length} foto... ⏳`);

    try {
      const fotoUrls = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("foto", files[i]);
        setStatus(`Mengunggah foto ${i + 1} dari ${files.length}... ⏳`);
        const uploadRes = await axios.post(
          "https://aplikasi-pilih-foto.vercel.app/api/upload",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        fotoUrls.push(uploadRes.data.url);
      }
      setStatus("Menyimpan sesi ke database... ⏳");
      const sesiRes = await axios.post(
        "https://aplikasi-pilih-foto.vercel.app/api/sesi",
        {
          namaKlien,
          pin,
          fotoUrls,
        },
      );
      setStatus(sesiRes.data.pesan);
      setLinkGaleri(`${window.location.origin}/galeri/${sesiRes.data.idSesi}`);
    } catch (error) {
      console.error(error);
      setStatus("Terjadi kesalahan saat memproses data ❌");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2>Dashboard Fotografer 📸</h2>
      <div
        style={{
          border: "2px solid #eee",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "500px",
        }}
      >
        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>Nama Klien:</strong>
          </label>
          <br />
          <input
            type="text"
            value={namaKlien}
            onChange={(e) => setNamaKlien(e.target.value)}
            style={{ width: "95%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>
            <strong>PIN Rahasia:</strong>
          </label>
          <br />
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ width: "95%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label>
            <strong>Pilih Foto (Bisa Banyak):</strong>
          </label>
          <br />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePilihFile}
          />
        </div>
        <button
          onClick={handleBuatSesi}
          disabled={isUploading}
          style={{
            padding: "10px 20px",
            width: "100%",
            cursor: "pointer",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {isUploading ? "Sedang Memproses..." : "Buat Sesi Galeri"}
        </button>
        {status && (
          <p>
            <strong>Status:</strong> {status}
          </p>
        )}
      </div>

      {linkGaleri && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            backgroundColor: "#d4edda",
            borderRadius: "8px",
            maxWidth: "500px",
          }}
        >
          <h3>Sesi Berhasil Dibuat! 🎉</h3>
          <p>
            Bagikan link ini beserta PIN <strong>{pin}</strong> kepada klien:
          </p>
          <input
            type="text"
            readOnly
            value={linkGaleri}
            style={{ width: "95%", padding: "10px" }}
          />
          <a
            href={linkGaleri}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-block", marginTop: "10px" }}
          >
            Buka Halaman Klien &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

// --- 2. KOMPONEN HALAMAN KLIEN ---
function GaleriKlien() {
  const { id } = useParams();
  const [sesi, setSesi] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState("Memuat data...");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`https://aplikasi-pilih-foto.vercel.app/api/sesi/${id}`)
      .then((res) => {
        setSesi(res.data);
        setStatus("");
      })
      .catch((err) => {
        setStatus("Sesi tidak ditemukan atau server bermasalah ❌");
        console.error(err);
      });
  }, [id]);

  const handleLogin = () => {
    if (pinInput === sesi.pin) {
      setIsLoggedIn(true);
      setStatus("");
    } else {
      setStatus("PIN salah! Silakan coba lagi. 🔒");
    }
  };

  const handlePilihFoto = (index) => {
    const sesiBaru = { ...sesi };
    sesiBaru.fotoList[index].terpilih = !sesiBaru.fotoList[index].terpilih;
    setSesi(sesiBaru);
  };

  const handleSimpanPilihan = async () => {
    setIsSaving(true);
    setStatus("Menyimpan pilihan Anda... ⏳");
    try {
      const res = await axios.put(
        `https://aplikasi-pilih-foto.vercel.app/api/sesi/${id}`,
        { fotoList: sesi.fotoList },
      );
      setStatus(res.data.pesan);
    } catch (error) {
      setStatus("Gagal menyimpan pilihan ❌");
    } finally {
      setIsSaving(false);
    }
  };

  if (!sesi)
    return <h3 style={{ textAlign: "center", marginTop: "50px" }}>{status}</h3>;

  if (!isLoggedIn) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          maxWidth: "400px",
          margin: "50px auto",
        }}
      >
        <h2>Halo, Klien {sesi.namaKlien}! 👋</h2>
        <p>
          Silakan masukkan PIN rahasia dari fotografer Anda untuk melihat
          galeri.
        </p>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          placeholder="Masukkan PIN"
          style={{
            padding: "10px",
            fontSize: "18px",
            textAlign: "center",
            width: "80%",
            marginBottom: "15px",
          }}
        />
        <br />
        <button
          onClick={handleLogin}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Buka Galeri
        </button>
        {status && <p style={{ color: "red", marginTop: "15px" }}>{status}</p>}
      </div>
    );
  }

  const jumlahDipilih = sesi.fotoList.filter((foto) => foto.terpilih).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Galeri: {sesi.namaKlien}</h2>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>
            Terpilih: {jumlahDipilih} / {sesi.fotoList.length}
          </p>
          <button
            onClick={handleSimpanPilihan}
            disabled={isSaving}
            style={{
              padding: "8px 15px",
              marginTop: "5px",
              cursor: "pointer",
              backgroundColor: "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            {isSaving ? "Menyimpan..." : "💾 Simpan Pilihan"}
          </button>
        </div>
      </div>

      {status && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#d4edda",
            color: "#155724",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          {status}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {sesi.fotoList.map((foto, index) => (
          <div
            key={index}
            onClick={() => handlePilihFoto(index)}
            style={{
              border: foto.terpilih
                ? "4px solid #28a745"
                : "4px solid transparent",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <img
              src={foto.url.replace(
                "/upload/",
                "/upload/c_scale,w_800/l_text:Arial_60_bold:PROOF,co_white,o_50,a_-45/",
              )}
              alt={`Foto ${index + 1}`}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                display: "block",
                pointerEvents: "none",
                userSelect: "none",
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />

            {foto.terpilih && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "#28a745",
                  color: "white",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 3. KOMPONEN UTAMA ---
function App() {
  return (
    <Router>
      <div
        style={{
          padding: "30px",
          fontFamily: "system-ui, sans-serif",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignions: "center",
          }}
        >
          <span>Platform Pilih Foto 📸</span>
          <Link
            to="/"
            style={{
              fontSize: "14px",
              textDecoration: "none",
              color: "#007BFF",
            }}
          >
            Ke Dashboard
          </Link>
        </h1>

        <Routes>
          <Route path="/" element={<DashboardFotografer />} />
          <Route path="/galeri/:id" element={<GaleriKlien />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
