import { useState } from "react";
import { useNavigate } from "react-router-dom";

const USERNAME_KEY = "offline_admin_username";
const SALT_KEY = "offline_admin_salt";
const HASH_KEY = "offline_admin_password_hash";
const SESSION_KEY = "offline_authenticated";

async function hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: encoder.encode(salt),
            iterations: 210000,
            hash: "SHA-256",
        },
        key,
        256
    );

    return Array.from(new Uint8Array(derivedBits))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const isFirstRun = !(
        localStorage.getItem(USERNAME_KEY) &&
        localStorage.getItem(SALT_KEY) &&
        localStorage.getItem(HASH_KEY)
    );

    const handleSubmit = async () => {
        setMessage("");

        const cleanUsername = username.trim();

        if (!cleanUsername || !password) {
            setMessage("Please enter both username and password.");
            return;
        }

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            if (isFirstRun) {
                if (password !== confirmPassword) {
                    setMessage("Passwords do not match.");
                    return;
                }

                const saltBytes = crypto.getRandomValues(new Uint8Array(16));
                const salt = Array.from(saltBytes)
                    .map((byte) => byte.toString(16).padStart(2, "0"))
                    .join("");

                const passwordHash = await hashPassword(password, salt);

                localStorage.setItem(USERNAME_KEY, cleanUsername);
                localStorage.setItem(SALT_KEY, salt);
                localStorage.setItem(HASH_KEY, passwordHash);
            } else {
                const savedUsername = localStorage.getItem(USERNAME_KEY);
                const salt = localStorage.getItem(SALT_KEY);
                const savedHash = localStorage.getItem(HASH_KEY);

                if (!salt || !savedHash || !savedUsername) {
                    setMessage("Local account setup is incomplete. Please contact your administrator.");
                    return;
                }

                const enteredHash = await hashPassword(password, salt);

                if (
                    cleanUsername !== savedUsername ||
                    enteredHash !== savedHash
                ) {
                    setMessage("Incorrect username or password.");
                    return;
                }
            }

            sessionStorage.setItem(SESSION_KEY, "true");
            navigate("/dashboard", { replace: true });
        } catch (error) {
            console.error("Local login error:", error);
            setMessage("Could not complete local login. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: "420px",
                margin: "80px auto",
                padding: "32px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <h1>Bank Customer Management</h1>
            <h2>{isFirstRun ? "Create Local Admin Account" : "Admin Login"}</h2>

            <p>
                {isFirstRun
                    ? "Create a username and password for this device."
                    : "Sign in to access your locally stored customer records."}
            </p>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                }}
            >
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    style={{
                        display: "block",
                        boxSizing: "border-box",
                        width: "100%",
                        padding: "12px",
                        margin: "8px 0 16px",
                    }}
                />

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    autoComplete={isFirstRun ? "new-password" : "current-password"}
                    placeholder="Enter password (minimum 8 characters)"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    style={{
                        display: "block",
                        boxSizing: "border-box",
                        width: "100%",
                        padding: "12px",
                        margin: "8px 0 16px",
                    }}
                />

                {isFirstRun && (
                    <>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                            style={{
                                display: "block",
                                boxSizing: "border-box",
                                width: "100%",
                                padding: "12px",
                                margin: "8px 0 16px",
                            }}
                        />
                    </>
                )}

                {message && (
                    <p role="alert" style={{ color: "red" }}>
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        cursor: isLoading ? "wait" : "pointer",
                    }}
                >
                    {isLoading
                        ? "Please wait..."
                        : isFirstRun
                            ? "Create Account"
                            : "Login"}
                </button>
            </form>
        </div>
    );
}

export default Login;