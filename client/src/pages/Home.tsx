import "./Home.css";
import { useEffect, useState } from "react";
import HomeShapes from "../components/HomeShapes.tsx";
import type { Item } from "../types/Item";
import { apiUrl } from "../lib/api";
import LoadingScreen from "../components/LoadingScreen";

function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetch(apiUrl("/api/items"))
        .then((res) => res.json())
        .then((data: Item[]) => {
          setItems(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err)
          setLoading(false);
        });
    }, []);

  if (loading) {return <LoadingScreen/>;}

  return (
    <>
      <div id="home-container" className="content-container">
        <HomeShapes
          items={items}
        />
      </div>
    </>
  );
}

export default Home;
