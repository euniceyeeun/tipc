import "./Join.css";
import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../lib/api";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState<AuthState | null>(null);
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
    } catch (error) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

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
  }, [shapePoints]);

  const validateAuthForm = () => {
    const nextErrors: AuthErrors = {};

    if (mode === "register" && !name.trim()) {
      nextErrors.name = "Please enter your name.";
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
          ...(mode === "register" ? { name } : {}),
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
      setName("");
      setEmail("");
      setPassword("");
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
      setItemForm({
        title: "",
        author_first: "",
        author_last: "",
        note: "",
        available: true,
      });
      setShapePoints([]);
      setUploadErrors({});
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
    setUploadMessage("");
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <>
      <div id="join-container" className="content-container">
        <div className="join-panel">
          {!auth ? (
            <div className="join-column">
              <div className="join-heading">
                {mode === "login" ? "Log In" : "Create an account"}
              </div>
              <form className="join-form" onSubmit={handleAuthSubmit} noValidate>
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
                <button type="submit" disabled={isAuthSubmitting}>
                  {isAuthSubmitting
                    ? "Submitting..."
                    : mode === "login"
                      ? "Log In"
                      : "Create Account"}
                </button>
              </form>
              <button
                type="button"
                className="join-toggle"
                onClick={() =>
                  setMode((current) => (current === "login" ? "register" : "login"))
                }
              >
                {mode === "login"
                  ? "Create An Account"
                  : "Already Registered? Log In."}
              </button>
              {authMessage ? (
                <div className={authMessageType === "error" ? "join-error" : "join-message"}>
                  {authMessage}
                </div>
              ) : null}
            </div>
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
                    <button type="button" className="join-secondary" onClick={handleLogout}>
                      Log Out
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
                <div className="join-actions">
                  <button
                    type="button"
                    className="join-secondary"
                    onClick={handleShapeReset}
                    disabled={shapePoints.length === 0}
                  >
                    Reset Shape
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
