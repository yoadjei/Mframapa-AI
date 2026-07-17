/**
 * Auth screens — mirrors mobile/src/screens/onboarding/
 *   LoginScreen.tsx  → <LoginView>
 *   SignUpScreen.tsx → <SignUpView>
 *   ForgotPasswordScreen.tsx → <ForgotView>
 *
 * All views have transparent backgrounds so CloudRainBackground shows through,
 * matching the mobile behaviour exactly.
 */
import { useState } from "react";
import { ChevronLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";

const GREEN  = "#00C896";
const TEXT   = "#FFFFFF";
const SUBTEXT = "#9AA7B5";
const MUTED  = "#647182";
const BORDER = "#25303C";
const SURFACE = "#1E2733";

// ── Shared field ──────────────────────────────────────────────────────────────
function Field({ label, placeholder, value, onChange, type = "text", icon: Icon, secure, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500, color: SUBTEXT }}>{label}</span>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        borderRadius: 12, border: `1px solid ${BORDER}`,
        backgroundColor: SURFACE,
        paddingLeft: 14, paddingRight: 14, paddingTop: 14, paddingBottom: 14,
      }}>
        {Icon && <Icon size={18} color={MUTED} />}
        <input
          type={secure ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: TEXT }}
          className="placeholder:opacity-40"
        />
        {secure && (
          <button type="button" tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.6, lineHeight: 1 }}>
            {show ? <EyeOff size={18} color={MUTED} /> : <Eye size={18} color={MUTED} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Transparent full-height scroll wrapper (matches mobile KeyboardAvoidingView + ScrollView) ──
function AuthScroll({ children }) {
  return (
    <div style={{
      minHeight: "100dvh", overflowY: "auto",
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 32 }}>
        {children}
      </div>
    </div>
  );
}

// ── Back button row (matches mobile backBtn) ──────────────────────────────────
function BackBtn({ onPress, label = "Back" }) {
  return (
    <button type="button" onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        background: "none", border: "none", cursor: "pointer",
        color: TEXT, fontSize: 16, padding: 0,
      }}>
      <ChevronLeft size={22} color={TEXT} />
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────── LoginView ── */
// Mirrors mobile/src/screens/onboarding/LoginScreen.tsx
function LoginView({ onAuth, onSignUp, onForgot }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please fill in all required fields."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onAuth({ user: { fullName: email.split("@")[0], email }, token: "mock-token-" + Date.now(), tier: "free" });
  }

  return (
    <AuthScroll>
      {/* logoWrap — alignItems center, marginBottom 36 */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
        <MframapaLogo size="lg" isDark={true} />
      </div>

      {/* heading */}
      <p style={{ fontSize: 28, fontWeight: 800, color: TEXT, marginBottom: 6, marginTop: 0 }}>
        Welcome back
      </p>
      {/* sub */}
      <p style={{ fontSize: 15, color: SUBTEXT, marginBottom: 28, marginTop: 0 }}>
        Sign in to your Mframapa account.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Email — marginBottom 16 */}
        <div style={{ marginBottom: 16 }}>
          <Field label="Email" placeholder="Email Address" value={email} onChange={setEmail}
            type="email" icon={Mail} autoComplete="email" />
        </div>

        {/* Password — marginBottom 0 (forgot sits below) */}
        <div style={{ marginBottom: 4 }}>
          <Field label="Password" placeholder="Password" value={password} onChange={setPassword}
            secure icon={Lock} autoComplete="current-password" />
        </div>

        {/* Forgot password — alignSelf flex-end, marginBottom 24 */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <button type="button" onClick={onForgot}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: GREEN }}>
            Forgot password?
          </button>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#E53935", backgroundColor: "rgba(229,57,53,0.08)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 12, marginTop: 0 }}>
            {error}
          </p>
        )}

        {/* cta — marginTop 4 */}
        <div style={{ marginTop: 4 }}>
          <PrimaryButton label="Sign in" type="submit" loading={loading} />
        </div>
      </form>

      {/* signupRow — justifyContent center, marginTop 24, gap 6 */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 24, gap: 6 }}>
        <span style={{ fontSize: 14, color: SUBTEXT }}>Don&apos;t have an account?</span>
        <button type="button" onClick={onSignUp}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: GREEN }}>
          Sign up now
        </button>
      </div>
    </AuthScroll>
  );
}

/* ────────────────────────────────────────────────────── SignUpView ── */
// Mirrors mobile/src/screens/onboarding/SignUpScreen.tsx
function SignUpView({ onAuth, onBack }) {
  const [fullName, setFullName]             = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !email.trim() || !password) { setError("Please fill in all required fields."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onAuth({ user: { fullName: fullName.trim(), email }, token: "mock-token-" + Date.now(), tier: "free" });
  }

  return (
    <AuthScroll>
      {/* backBtn — marginBottom 16 */}
      <div style={{ marginBottom: 16 }}>
        <BackBtn onPress={onBack} />
      </div>

      {/* logoWrap — center, marginBottom 28 */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <MframapaLogo size="lg" isDark={true} />
      </div>

      <p style={{ fontSize: 28, fontWeight: 800, color: TEXT, marginBottom: 6, marginTop: 0 }}>
        Create account
      </p>
      <p style={{ fontSize: 15, color: SUBTEXT, marginBottom: 24, marginTop: 0 }}>
        Start monitoring air quality across Africa.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <Field label="Full Name" placeholder="Kofi Antwi" value={fullName} onChange={setFullName}
            icon={User} autoComplete="name" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Field label="Email" placeholder="Email Address" value={email} onChange={setEmail}
            type="email" icon={Mail} autoComplete="email" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Field label="Password" placeholder="Password" value={password} onChange={setPassword}
            secure icon={Lock} autoComplete="new-password" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Field label="Confirm Password" placeholder="Confirm Password" value={confirmPassword}
            onChange={setConfirmPassword} secure icon={Lock} autoComplete="new-password" />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#E53935", backgroundColor: "rgba(229,57,53,0.08)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 12, marginTop: 0 }}>
            {error}
          </p>
        )}

        {/* cta — marginTop 8 */}
        <div style={{ marginTop: 8 }}>
          <PrimaryButton label="Create account" type="submit" loading={loading} />
        </div>
      </form>

      {/* loginRow — justifyContent center, marginTop 24, gap 6 */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 24, gap: 6 }}>
        <span style={{ fontSize: 14, color: SUBTEXT }}>Already have an account?</span>
        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: GREEN }}>
          Sign in
        </button>
      </div>
    </AuthScroll>
  );
}

/* ────────────────────────────────────────────────── ForgotView ── */
// Mirrors mobile/src/screens/onboarding/ForgotPasswordScreen.tsx
function ForgotView({ onBack }) {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthScroll>
      {/* backBtn — marginBottom 24 */}
      <div style={{ marginBottom: 24 }}>
        <BackBtn onPress={onBack} />
      </div>

      {/* iconWrap — 72×72, borderRadius 22, green bg dim, centered, marginBottom 24 */}
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        backgroundColor: GREEN + "22",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <Lock size={40} color={GREEN} />
      </div>

      <p style={{ fontSize: 28, fontWeight: 800, color: TEXT, marginBottom: 6, marginTop: 0 }}>
        Reset password
      </p>
      <p style={{ fontSize: 15, color: SUBTEXT, marginBottom: 28, marginTop: 0 }}>
        Enter your email and we&apos;ll send a reset link.
      </p>

      {sent ? (
        /* sentBox — green border + bg, flex row, gap 10, borderRadius 12, padding 16 */
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          borderRadius: 12, border: `1px solid ${GREEN}44`,
          backgroundColor: GREEN + "18",
          padding: 16, marginBottom: 16,
        }}>
          {/* checkmark-circle */}
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            backgroundColor: GREEN, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#0A0D12" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: GREEN, margin: 0, flex: 1 }}>
            Check your inbox — a reset link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <Field label="Email" placeholder="Email Address" value={email} onChange={setEmail}
              type="email" icon={Mail} autoComplete="email" />
          </div>
          {/* cta — marginTop 8 */}
          <div style={{ marginTop: 8 }}>
            <PrimaryButton label="Send reset link" type="submit" loading={loading} />
          </div>
        </form>
      )}

      {/* backLinkWrap — alignSelf center, marginTop 24 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: SUBTEXT }}>
          Back to login
        </button>
      </div>
    </AuthScroll>
  );
}

/* ── Root ── */
export function AuthScreen() {
  const { dispatch } = useAppState();
  // "login" | "signup" | "forgot"
  const [screen, setScreen] = useState("login");

  function handleAuth(payload) {
    dispatch({ type: "LOGIN_SUCCESS", payload });
  }

  if (screen === "signup") {
    return <SignUpView onAuth={handleAuth} onBack={() => setScreen("login")} />;
  }
  if (screen === "forgot") {
    return <ForgotView onBack={() => setScreen("login")} />;
  }
  return (
    <LoginView
      onAuth={handleAuth}
      onSignUp={() => setScreen("signup")}
      onForgot={() => setScreen("forgot")}
    />
  );
}
