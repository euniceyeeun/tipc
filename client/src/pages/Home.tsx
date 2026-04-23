import "./Home.css";
import { useEffect, useState } from "react";
import HomeShapes from "../components/HomeShapes";
import type { Item } from "../types/Item";
import { apiUrl } from "../lib/api";

function Home() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
      fetch(apiUrl("/api/items"))
        .then((res) => res.json())
        .then((data: Item[]) => {
          console.log("Fetched data:", data);
          setItems(data);
        })
        .catch((err) => console.error(err));
    }, []);

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
