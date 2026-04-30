import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home";
import About from "./pages/About";
import Catalog from "./pages/Catalog";
import Join from "./pages/Join";
import Nav from "./components/Nav";
import ItemDetail from "./pages/ItemDetail";
import TermsAndConditions from "./pages/TermsAndConditions";
import PageTitle from "./components/PageTitle";
import pageTitleStyles from "./components/PageTitle.module.css";
import { apiUrl } from "./lib/api";

function AnimatedRoutes() {

  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"fade-in" | "fade-out">("fade-in");

  const currentPath = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location]
  );
  const displayedPath = useMemo(
    () => `${displayLocation.pathname}${displayLocation.search}${displayLocation.hash}`,
    [displayLocation]
  );

  useEffect(() => {
    if (currentPath !== displayedPath) {
      setTransitionStage("fade-out");
    }
  }, [currentPath, displayedPath]);

  return (
    <>
    <head>
      <title>Texts In Perennial Circulation</title>
    </head>
    <div
      className={`route-transition ${transitionStage}`}
      onAnimationEnd={() => {
        if (transitionStage === "fade-out") {
          setDisplayLocation(location);
          setTransitionStage("fade-in");
        }
      }}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/join" element={<Join />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/item/:id" element={<ItemDetail />} />
      </Routes>
    </div>
    </>
  );
}

function AppShell() {
  const [loading, setLoading] = useState(true);
  
    useEffect(() => {
        fetch(apiUrl("/api/items"))
          .then((res) => res.json())
          .then(() => {
            setLoading(false);
          })
          .catch((err) => {
            console.error(err)
            setLoading(false);
          });
      }, []);

  const location = useLocation();
  const showPageTitle =
    location.pathname !== "/about";
  const pageTitleClassName =
    location.pathname === "/catalog" ? pageTitleStyles["site-name"] : undefined;

  return (
    <>
      {showPageTitle ? <PageTitle className={pageTitleClassName} /> : null}
      <AnimatedRoutes />
      {!loading && <Nav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
