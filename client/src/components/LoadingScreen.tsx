import "./LoadingScreen.css";
import logo from "../assets/logo.png";

export default function LoadingScreen() {
  return (
    <>
    <div id="loading-screen">
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
      <div id="loading-msg">
        <p>&nbsp;Connecting To Library...</p>
      </div>
    </div>
    </>
  );
}