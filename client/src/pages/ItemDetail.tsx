import "./ItemDetail.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ItemShape from "../components/ItemShape";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";

type Point = {
  x: number;
  y: number;
};

type Shape = {
  points: Point[];
  closed: boolean;
};

type Item = {
  _id: string;
  title: string;
  author_first: string;
  author_last: string;
  note: string;
  owner: string;
  owner_email: string;
  available: boolean;
  shape?: Shape;
};
function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(apiUrl(`/api/items/${id}`))
      .then((res) => res.json())
       .then((data) => setItem(data))
      .catch(console.error);
  }, [id]);

  if (!item) return <div>Loading...</div>;

  const sendEmail = () => {
    const subject = encodeURIComponent(`Request to borrow: ${item.title}`);
     const body = encodeURIComponent(
      `Hi` +
      `I would like to request to borrow your copy of ${item.title} by ${item.author_first} ${item.author_last}.\n\n`
    );

    const mailtoLink = `mailto:${item.owner_email}?subject=${subject}&body=${body}`;

    // Open the user's default email client
    window.location.href = mailtoLink;
  };

  return (
    <>
    <div className="item-detail-container content-container">
        <div className="item-details">
            <div className="item-details-column item-details-column-left">
                <div className="item-details-column-left-text">
                <span>{item.title}</span>
                <span>by {item.author_first} {item.author_last}</span>
                <div className="item-details-note">
                This book is owned by {item.owner}.<br/><br/>
                <i>{item.note}</i>
                </div>
                </div>
            </div>
            <div className="item-details-column item-details-column-center">
                <div className="catalog-item-shape">
                    <ItemShape shape={item.shape} size={200} />
                </div>
            </div>
            <div className="item-details-column item-details-column-right">
              <div className="item-details-available-borrow-mobile">
                <div className="item-details-availability">{item.available ? "Available" : "Unavailable"}</div>
                {item.available && <div className="item-details-buttons">
                    <button onClick={sendEmail}>Request To Borrow</button>
                    {/* <button>Save For Later</button> */}
                </div>}
                </div>
                <div className="item-details-terms">
                    Before requesting to borrow, remember to read the <Link to="/terms"><u>terms & conditions</u></Link>.
                </div>
                <button onClick={() => navigate(-1)} className="back-icon">
                    <FontAwesomeIcon className="back-icon" icon={faArrowLeftLong} />
              </button>
            </div>
      </div>
    </div>
  </>
  );
}

export default ItemDetail;
