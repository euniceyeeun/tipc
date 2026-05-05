import "./Catalog.css";
import "./Join.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faSearch } from "@fortawesome/free-solid-svg-icons";
import ItemShape from "../components/ItemShape";
import ItemDetailEdit from "../components/ItemDetailEdit";
import { apiUrl } from "../lib/api";
import type { Item } from "../types/Item";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  token: string;
  user: AuthUser;
};

type ItemFormState = {
  title: string;
  author_first: string;
  author_last: string;
  note: string;
  available: boolean;
};

type Point = {
  x: number;
  y: number;
};

type Shape = {
  points: Point[];
  closed: boolean;
};

type AuthErrors = {
  name?: string;
  email?: string;
  password?: string;
  signupCode?: string;
};

type UploadErrors = {
  title?: string;
  author_first?: string;
  author_last?: string;
};

const AUTH_STORAGE_KEY = "tipc-auth";
const SHAPE_CANVAS_SIZE = 320;

function Join() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [accountView, setAccountView] = useState<"overview" | "add" | "edit">("overview");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myItemsSearchTerm, setMyItemsSearchTerm] = useState("");
  const [isMyItemsLoading, setIsMyItemsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authMessageType, setAuthMessageType] = useState<"default" | "error">("default");
  const [uploadMessage, setUploadMessage] = useState("");
  const [authErrors, setAuthErrors] = useState<AuthErrors>({});
  const [uploadErrors, setUploadErrors] = useState<UploadErrors>({});
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isUploadSubmitting, setIsUploadSubmitting] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>({
    title: "",
    author_first: "",
    author_last: "",
    note: "",
    available: true,
  });
  const [shapePoints, setShapePoints] = useState<Point[]>([]);

  const visibleMyItems = useMemo(() => {
    const term = myItemsSearchTerm.toLowerCase();

    return myItems
      .filter((item) => {
        return (
          item.title?.toLowerCase().includes(term) ||
          item.author_first?.toLowerCase().includes(term) ||
          item.author_last?.toLowerCase().includes(term)
        );
      })
      .sort((firstItem, secondItem) => firstItem.title.localeCompare(secondItem.title));
  }, [myItems, myItemsSearchTerm]);

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedAuth) {
      return;
    }

    try {
      const parsedAuth = JSON.parse(storedAuth) as AuthState;
      setAuth(parsedAuth);

      if (!parsedAuth?.token) {
        return;
      }

      fetch(apiUrl("/api/auth/me"), {
        headers: {
          Authorization: `Bearer ${parsedAuth.token}`,
        },
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to refresh session");
          }

          const refreshedAuth: AuthState = {
            token: parsedAuth.token,
            user: data.user,
          };

          setAuth(refreshedAuth);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshedAuth));
        })
        .catch(() => {
          setAuth(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        });
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setMyItems([]);
      setMyItemsSearchTerm("");
      setSelectedItem(null);
      setAccountView("overview");
      return;
    }

    let ignore = false;
    setIsMyItemsLoading(true);

    fetch(apiUrl("/api/items"))
      .then((response) => response.json())
      .then((items: Item[]) => {
        if (ignore) {
          return;
        }

        setMyItems(
          items.filter(
            (item) =>
              item.ownerUserId === auth.user.id || item.owner === auth.user.name
          )
        );
      })
      .catch((error) => {
        console.error(error);

        if (!ignore) {
          setMyItems([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsMyItemsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [auth]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (shapePoints.length === 0) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(shapePoints[0].x, shapePoints[0].y);

    for (let index = 1; index < shapePoints.length; index += 1) {
      ctx.lineTo(shapePoints[index].x, shapePoints[index].y);
    }

    if (shapePoints.length >= 3) {
      ctx.closePath();
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
      shapePoints.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
  });
  }, [shapePoints]);

  const validateAuthForm = () => {
    const nextErrors: AuthErrors = {};

    if (mode === "register" && !name.trim()) {
      nextErrors.name = "Please enter your name.";
    }

    if (mode === "register" && !signupCode.trim()) {
      nextErrors.signupCode = "Please enter the signup code.";
    }

    if (!email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Please enter your password.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    setAuthErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateUploadForm = () => {
    const nextErrors: UploadErrors = {};

    if (!itemForm.title.trim()) {
      nextErrors.title = "Please enter the title.";
    }

    if (!itemForm.author_first.trim()) {
      nextErrors.author_first = "Please enter the author's first name.";
    }

    if (!itemForm.author_last.trim()) {
      nextErrors.author_last = "Please enter the author's last name.";
    }

    setUploadErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage("");
    setAuthMessageType("default");
    setUploadMessage("");

    if (!validateAuthForm()) {
      return;
    }

    setIsAuthSubmitting(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";

      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(mode === "register" ? { name, signupCode: signupCode.trim() } : {}),
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (mode === "register") {
        setMode("login");
        setAuthMessage("Account created. You can log in now.");
        setAuthMessageType("default");
        setName("");
        setEmail("");
        setPassword("");
        setSignupCode("");
        setAuthErrors({});
        return;
      }

      const nextAuth: AuthState = {
        token: data.token,
        user: data.user,
      };

      setAuth(nextAuth);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      setAuthMessage("Logged in successfully.");
      setAuthMessageType("default");
      setAccountView("overview");
      setName("");
      setEmail("");
      setPassword("");
      setSignupCode("");
      setAuthErrors({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to complete request";
      setAuthMessage(message);
      setAuthMessageType("error");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleItemFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;

    setItemForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : value,
    }));
    setUploadErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setShapePoints((current) => [...current, { x, y }]);
  };

  const handleShapeReset = () => {
    setShapePoints([]);
  };

  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth) {
      setUploadMessage("Log in before uploading a catalog item.");
      return;
    }

    if (!validateUploadForm()) {
      return;
    }

    setUploadMessage("");
    setIsUploadSubmitting(true);

    try {
      const shape: Shape | undefined =
        shapePoints.length >= 3
          ? {
              points: shapePoints,
              closed: true,
            }
          : undefined;

      const response = await fetch(apiUrl("/api/items"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          ...itemForm,
          shape,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload item");
      }

      setUploadMessage(`Uploaded "${data.title}" to the catalog.`);
      setMyItems((currentItems) => [data, ...currentItems]);
      setItemForm({
        title: "",
        author_first: "",
        author_last: "",
        note: "",
        available: true,
      });
      setShapePoints([]);
      setUploadErrors({});
      setAccountView("overview");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload item";
      setUploadMessage(message);
    } finally {
      setIsUploadSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuth(null);
    // setAuthMessage("Logged out.");
    setAuthMessageType("default");
    setAccountView("overview");
    setSelectedItem(null);
    setMyItems([]);
    setMyItemsSearchTerm("");
    setUploadMessage("");
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <>
      <div
        id="join-container"
        className={
          auth && (accountView === "overview" || accountView === "edit")
            ? "content-container join-container-overview"
            : "content-container"
        }
      >
        <div
          className={
            auth && (accountView === "overview" || accountView === "edit")
              ? "join-panel join-panel-overview"
              : "join-panel"
          }
        >
          {!auth ? (
            <div id="login-column">
              <div className="join-heading">
                {mode === "login" ? "Log In" : "Create Account"}
              </div>
              <form className="join-form join-auth-form" onSubmit={handleAuthSubmit} noValidate>
                {mode === "register" ? (
                  <label className="join-field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setAuthErrors((current) => ({ ...current, name: undefined }));
                      }}
                    />
                    {authErrors.name ? (
                      <span className="join-error">{authErrors.name}</span>
                    ) : null}
                  </label>
                ) : null}
                <label className="join-field">
                  <span>Email</span>
                  <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setAuthErrors((current) => ({ ...current, email: undefined }));
                      }}
                    />
                  {authErrors.email ? (
                    <span className="join-error">{authErrors.email}</span>
                  ) : null}
                </label>
                <label className="join-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setAuthErrors((current) => ({ ...current, password: undefined }));
                    }}
                  />
                  {authErrors.password ? (
                    <span className="join-error">{authErrors.password}</span>
                  ) : null}
                </label>
                {mode === "register" ? (
                  <label className="join-field">
                    <span>Code</span>
                    <input
                      type="password"
                      value={signupCode}
                      onChange={(event) => {
                        setSignupCode(event.target.value);
                        setAuthErrors((current) => ({ ...current, signupCode: undefined }));
                      }}
                    />
                    {authErrors.signupCode ? (
                      <span className="join-error">{authErrors.signupCode}</span>
                    ) : null}
                  </label>
                ) : null}
                <button type="submit" className="join-submit" disabled={isAuthSubmitting}>
                  {isAuthSubmitting
                    ? "Submitting..."
                    : mode === "login"
                      ? "Log In"
                      : "Create Account"}
                </button>
              </form>
              <div className="join-toggle-copy">
                {mode === "login" ? "Don't Have An Account? " : "Already Registered? "}
                <button
                  type="button"
                  className="join-toggle"
                  onClick={() => {
                    setAuthErrors({});
                    setAuthMessage("");
                    setSignupCode("");
                    setMode((current) => (current === "login" ? "register" : "login"));
                  }}
                >
                  {mode === "login" ? "Create One" : "Log In"}
                </button>
              </div>
              {authMessage ? (
                <div className={authMessageType === "error" ? "join-error" : "join-message join-auth-message"}>
                  {authMessage}
                </div>
              ) : null}
            </div>
          ) : accountView === "overview" ? (
            <div className="join-overview">
              <div className="join-overview-header">
                <div className="join-welcome">
                  Welcome <strong>{auth.user.name}</strong>.
                </div>
                <div className="join-overview-actions">
                  {/* <button type="button" className="join-pill-button">
                    Account Details
                  </button> */}
                  <button
                    type="button"
                    className="join-pill-button"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              </div>

              <div className="join-my-texts-header">
                <div className="join-my-texts-title">My Texts</div>
                <div className="join-my-texts-tools">
                  <button
                    type="button"
                    className="join-add-text-button"
                    onClick={() => {
                      setUploadMessage("");
                      setAccountView("add");
                    }}
                  >
                    <span className="join-add-text-button-plus"><strong>+&nbsp;</strong></span>
                    <span>Add Text</span>
                  </button>
                  <div id="input-wrapper">
                    <span id="input-icon">
                      <FontAwesomeIcon icon={faSearch} />
                    </span>
                    <input
                      type="text"
                      placeholder=""
                      id="search-input"
                      value={myItemsSearchTerm}
                      onChange={(event) => setMyItemsSearchTerm(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              {isMyItemsLoading ? (
                <div className="join-message join-overview-message">Loading texts...</div>
              ) : null}

              {!isMyItemsLoading && visibleMyItems.length === 0 ? (
                <div className="join-message join-overview-message">No texts yet.</div>
              ) : null}

              <div id="catalog-items-container" className="join-my-texts-grid">
                {visibleMyItems.map((item) => {
                  return (
                    <button
                      type="button"
                      className="join-my-text-card"
                      key={item._id}
                      onClick={() => {
                        setSelectedItem(item);
                        setAccountView("edit");
                      }}
                    >
                      <div className="catalog-item">
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
                    </button>
                  );
                })}
              </div>
            </div>
          ) : accountView === "edit" && selectedItem ? (
            <ItemDetailEdit
              item={selectedItem}
              token={auth.token}
              onBack={() => {
                setSelectedItem(null);
                setAccountView("overview");
              }}
              onSaved={(updatedItem) => {
                setSelectedItem(updatedItem);
                setMyItems((currentItems) =>
                  currentItems.map((item) =>
                    item._id === updatedItem._id ? updatedItem : item
                  )
                );
              }}
            />
          ) : (
            <div className="join-upload-layout">
              <div className="join-column">
                <div className="join-heading">Add Book To Library</div>
                <div className="join-copy">
                  You are logged in as <strong>{auth.user.name}</strong>.
                </div>
                <form className="join-form" onSubmit={handleUploadSubmit} noValidate>
                  <label className="join-field">
                    <span>Title</span>
                    <input
                      type="text"
                      name="title"
                      value={itemForm.title}
                      onChange={handleItemFormChange}
                    />
                    {uploadErrors.title ? (
                      <span className="join-error">{uploadErrors.title}</span>
                    ) : null}
                  </label>
                  <label className="join-field">
                    <span>Author First Name</span>
                    <input
                      type="text"
                      name="author_first"
                      value={itemForm.author_first}
                      onChange={handleItemFormChange}
                    />
                    {uploadErrors.author_first ? (
                      <span className="join-error">{uploadErrors.author_first}</span>
                    ) : null}
                  </label>
                  <label className="join-field">
                    <span>Author Last Name</span>
                    <input
                      type="text"
                      name="author_last"
                      value={itemForm.author_last}
                      onChange={handleItemFormChange}
                    />
                    {uploadErrors.author_last ? (
                      <span className="join-error">{uploadErrors.author_last}</span>
                    ) : null}
                  </label>
                  <label className="join-field">
                    <span>Note</span>
                    <textarea
                      name="note"
                      value={itemForm.note}
                      onChange={handleItemFormChange}
                      rows={4}
                    />
                  </label>
                  <label className="join-checkbox">
                    <input
                      type="checkbox"
                      name="available"
                      checked={itemForm.available}
                      onChange={handleItemFormChange}
                    />
                    <span>Available to Borrow</span>
                  </label>
                  <div className="join-actions">
                    <button type="submit" disabled={isUploadSubmitting}>
                      {isUploadSubmitting ? "Uploading..." : "Upload Item"}
                    </button>
                  </div>
                </form>
                {uploadMessage ? <div className="join-message">{uploadMessage}</div> : null}
              </div>

              <div className="join-column join-shape-column">
                <canvas
                  ref={canvasRef}
                  width={SHAPE_CANVAS_SIZE}
                  height={SHAPE_CANVAS_SIZE}
                  className="join-shape-canvas"
                  onClick={handleCanvasClick}
                />
                <div className="join-actions join-shape-actions">
                  <button
                    type="button"
                    className="join-secondary"
                    onClick={handleShapeReset}
                    disabled={shapePoints.length === 0}
                  >
                    Reset Shape
                  </button>
                  <button
                    type="button"
                    className="join-back-overview-button"
                    onClick={() => {
                      setUploadMessage("");
                      setAccountView("overview");
                    }}
                    aria-label="Return to overview"
                  >
                    <FontAwesomeIcon icon={faArrowLeftLong} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Join;
