import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import ItemShape from "./ItemShape";
import { apiUrl } from "../lib/api";
import type { Item } from "../types/Item";
import "./ItemDetailEdit.css";

type Props = {
  item: Item;
  token: string;
  onBack: () => void;
  onSaved: (item: Item) => void;
};

function ItemDetailEdit({ item, token, onBack, onSaved }: Props) {
  const [note, setNote] = useState(item.note || "");
  const [available, setAvailable] = useState(item.available);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(apiUrl(`/api/items/${item._id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note,
          available,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      onSaved(data);
      setIsEditingNote(false);
      setMessage("Changes saved.");
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "Failed to save changes";
      setMessage(nextMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="item-detail-edit">
      <div className="item-detail-edit-shape">
        <ItemShape shape={item.shape} size={240} />
      </div>

      <div className="item-detail-edit-info">
        <div className="item-detail-edit-title">{item.title}</div>
        <div className="item-detail-edit-author">
          {item.author_first} {item.author_last}
        </div>

        <div
          className="item-detail-edit-note"
          onClick={() => setIsEditingNote(true)}
        >
          <strong>Click To Edit Note</strong>{<br/>}
          {isEditingNote ? (
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              autoFocus
            />
          ) : (
            <span>{note}</span>
          )}
        </div>

        <div className="item-detail-edit-availability">
          <span>{available ? "Available" : "Unavailable"}</span>
          <button
            type="button"
            className={`item-detail-edit-toggle ${available ? "is-available" : "is-unavailable"}`}
            onClick={() => setAvailable((current) => !current)}
            aria-label="Toggle availability"
            aria-pressed={!available}
          >
            <span />
          </button>
        </div>

        <button
          type="button"
          className="item-detail-edit-save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
{message ? <div className="item-detail-edit-message">{message}</div> : null}
        <button
          type="button"
          className="item-detail-edit-back"
          onClick={onBack}
          aria-label="Return to overview"
        >
          <FontAwesomeIcon icon={faArrowLeftLong} />
        </button>

      </div>
    </div>
  );
}

export default ItemDetailEdit;
