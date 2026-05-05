import "./Catalog.css";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import ItemShape from "../components/ItemShape";
import type { Item } from "../types/Item";
import { apiUrl } from "../lib/api";

function Catalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title-asc");

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
      <div className="content-container">
        <div id="catalog-container">
          <div id="search-sort-container">
            <div id="input-wrapper">
              <span id="input-icon">
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input
                type="text"
                placeholder=""
                id="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              id="sort-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="author-asc">Author (A-Z)</option>
              <option value="author-desc">Author (Z-A)</option>
              <option value="available">Available First</option>
            </select>
          </div>
          <div id="catalog-items-container">
            {items
              .filter((item) => {
                const term = searchTerm.toLowerCase();
                return (
                  item.title?.toLowerCase().includes(term) ||
                  item.author_first?.toLowerCase().includes(term) ||
                  item.author_last?.toLowerCase().includes(term)
                );
              })
              .sort((a, b) => {
                switch (sortBy) {
                  case "title-asc":
                    return a.title.localeCompare(b.title);

                  case "title-desc":
                    return b.title.localeCompare(a.title);

                  case "author-asc":
                    return a.author_last.localeCompare(b.author_last);

                  case "author-desc":
                    return b.author_last.localeCompare(a.author_last);

                  case "available":
                    return Number(b.available) - Number(a.available);

                  default:
                    return 0;
                }
              })
              .map((item) => {
                return (
                  <Link to={`/catalog/item/${item._id}`} key={item._id}>
                    <div className="catalog-item" key={item._id}>
                      <div className="catalog-item-title">{item.title}</div>
                      <div className="catalog-item-shape">
                        <ItemShape shape={item.shape} size={200} />
                      </div>
                      <div className="catalog-item-author">
                        {item.author_first}&nbsp;{item.author_last}
                      </div>
                      <div className="catalog-item-available">
                        {item.available ? "Available" : "Unavailable"}
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}

export default Catalog;
