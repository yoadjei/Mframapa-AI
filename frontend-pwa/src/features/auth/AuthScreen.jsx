import { useState } from "react";
import { useAppState } from "../../state/appState.jsx";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";
import { login, signup } from "../../services/authService.js";

export function AuthScreen({ isOnline }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const {
    state: { preferences },
    dispatch,
  } = useAppState();

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "reset") {
      setSuccess("If the account exists, a reset link has been sent.");
      return;
    }

    setSubmitting(true);
    try {
      const result =
        mode === "login"
          ? await login({ email: form.email, password: form.password })
          : await signup({
              fullName: form.fullName,
              email: form.email,
              password: form.password,
            });

      dispatch({ type: "LOGIN_SUCCESS", payload: result });
      dispatch({ type: "SET_ACTIVE_SCREEN", payload: "home" });
      dispatch({
        type: "ADD_ACTIVITY",
        payload: {
          id: crypto.randomUUID(),
          type: "auth",
          message: mode === "login" ? "Signed in successfully" : "Account created",
          createdAt: new Date().toISOString(),
        },
      });
      if (preferences.notificationsEnabled) {
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id: crypto.randomUUID(),
            title: mode === "login" ? "Signed in" : "Account created",
            message:
              mode === "login"
                ? "Your session is active on this device."
                : "Welcome to Mframapa. You can start checking city conditions.",
            read: false,
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sign in to sync your city tracking and alerts.
        </p>

        {!isOnline ? (
          <div className="mt-4">
            <StateMessage
              tone="warning"
              title="Internet required for authentication"
              message="Reconnect to continue with sign in."
            />
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {["login", "signup", "reset"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                mode === value
                  ? "bg-white text-slate-900 shadow dark:bg-slate-950 dark:text-slate-100"
                  : "text-slate-500"
              }`}
            >
              {value === "reset" ? "reset" : value}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Full name
              </span>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring dark:border-slate-700 dark:bg-slate-950"
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </span>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring dark:border-slate-700 dark:bg-slate-950"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          {mode !== "reset" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Password
              </span>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring dark:border-slate-700 dark:bg-slate-950"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={8}
              />
            </label>
          ) : null}

          {error ? <StateMessage tone="error" title="Authentication failed" message={error} /> : null}
          {success ? <StateMessage title="Request received" message={success} /> : null}

          <button
            type="submit"
            disabled={!isOnline || submitting}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
              ? "Sign in"
              : mode === "signup"
              ? "Create account"
              : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
