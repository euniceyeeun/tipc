import logo from "../assets/logo.png";

export default function LoadingScreen() {
  return (
    <>
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: "28px",
      background: "#fff",
    }}>
      <img
        src={logo}
        alt="Logo"
        style={{
            width:`15%`,
            height:`15%`,
            objectFit: "contain",
            animation: "pulse 2s ease-in-out infinite",
        }}
        />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <p style={{ fontSize: 13, color: "#000" }}>&nbsp;Connecting To Library...</p>
      </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}