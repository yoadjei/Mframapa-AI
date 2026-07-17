import { useState } from "react";
import { ShieldCheck, CreditCard, Lock } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { ScreenHeader } from "../../components/ui/ScreenHeader.jsx";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";

const PLAN_LABELS = {
  researcher_monthly: { label: "Researcher — Monthly", price: "$15", perUnit: "/ mo" },
  researcher_annual:  { label: "Researcher — Annual",  price: "$144", perUnit: "/ yr" },
};

function FormField({ label, value, onChange, type = "text", placeholder, colors }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.subtext }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3.5 py-3 text-[15px] outline-none transition-colors focus:ring-2"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text,
          ringColor: Colors.brandGreen,
        }}
        // Inline focus ring using onFocus/onBlur since we can't use Tailwind ring-color with CSS vars cleanly
        onFocus={(e) => { e.target.style.borderColor = Colors.brandGreen; }}
        onBlur={(e) => { e.target.style.borderColor = colors.border; }}
      />
    </div>
  );
}

export function PaystackCheckoutScreen({ params, isOnline, isDark }) {
  const { state, dispatch } = useAppState();
  const { goBack } = useNavigation();
  const colors = getColors(isDark ?? true);

  const planId = params?.planId ?? "researcher_monthly";
  const plan = PLAN_LABELS[planId] ?? PLAN_LABELS["researcher_monthly"];

  const [fullName, setFullName] = useState(state.profile.fullName ?? "");
  const [email, setEmail]       = useState(state.profile.email ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry]     = useState("");
  const [cvv, setCvv]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  // Format card number with spaces
  function handleCardNumber(val) {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const groups = digits.match(/.{1,4}/g) ?? [];
    setCardNumber(groups.join(" "));
  }

  // Format expiry MM/YY
  function handleExpiry(val) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(digits.slice(0, 2) + "/" + digits.slice(2));
    } else {
      setExpiry(digits);
    }
  }

  function handlePay() {
    if (!fullName.trim() || !email.trim() || cardNumber.replace(/\s/g, "").length < 16 || expiry.length < 5 || cvv.length < 3) {
      window.alert("Please fill in all payment details.");
      return;
    }

    setLoading(true);

    // Simulate Paystack payment processing
    setTimeout(() => {
      setLoading(false);
      setDone(true);

      // Activate subscription
      dispatch({ type: "UPDATE_TIER", payload: "researcher" });

      // Show success, then go back twice (through paywall back to origin)
      window.alert(`Welcome to Researcher! Your ${plan.label} subscription is now active.`);
      // Go back twice: once from checkout, once from paywall
      goBack();
      setTimeout(() => goBack(), 50);
    }, 2000);
  }

  if (done) {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6"
        style={{
          backgroundColor: colors.bg,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.brandGreen + "22" }}
        >
          <ShieldCheck size={36} color={Colors.brandGreen} />
        </div>
        <p className="text-center text-[22px] font-extrabold" style={{ color: colors.text }}>
          Welcome to Researcher!
        </p>
        <p className="text-center text-[14px]" style={{ color: colors.subtext }}>
          Your {plan.label} subscription is active.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[100dvh] flex-col overflow-y-auto"
      style={{
        backgroundColor: colors.bg,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ScreenHeader
        title={`Subscribe — ${plan.label}`}
        onBack={goBack}
        colors={colors}
      />

      <div className="flex flex-col gap-4 px-4 pb-10 pt-2">
        {/* Plan summary */}
        <div
          className="flex items-center justify-between rounded-2xl p-4"
          style={{ backgroundColor: colors.card, border: `1.5px solid ${Colors.brandGreen}` }}
        >
          <div>
            <p className="text-[15px] font-bold" style={{ color: Colors.brandGreen }}>
              {plan.label}
            </p>
            <p className="text-[13px]" style={{ color: colors.subtext }}>
              Billed today
            </p>
          </div>
          <p className="text-[20px] font-extrabold" style={{ color: colors.text }}>
            {plan.price}
            <span className="text-[12px] font-normal" style={{ color: colors.subtext }}>
              {" "}{plan.perUnit}
            </span>
          </p>
        </div>

        {/* Secure payment badge */}
        <div
          className="flex items-center justify-center gap-2 rounded-xl py-2.5"
          style={{ backgroundColor: Colors.brandGreen + "12" }}
        >
          <Lock size={14} color={Colors.brandGreen} />
          <span className="text-[12px] font-semibold" style={{ color: Colors.brandGreen }}>
            Secure payment via Paystack
          </span>
        </div>

        {/* Personal info */}
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-bold uppercase tracking-wider" style={{ color: colors.subtext }}>
            Personal Details
          </p>
          <FormField
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Kofi Antwi"
            colors={colors}
          />
          <FormField
            label="Email Address"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="kofi@example.com"
            colors={colors}
          />
        </div>

        {/* Card info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold uppercase tracking-wider" style={{ color: colors.subtext }}>
              Card Details
            </p>
            <CreditCard size={15} color={colors.muted} />
          </div>

          <FormField
            label="Card Number"
            value={cardNumber}
            onChange={handleCardNumber}
            placeholder="1234 5678 9012 3456"
            colors={colors}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Expiry"
              value={expiry}
              onChange={handleExpiry}
              placeholder="MM/YY"
              colors={colors}
            />
            <FormField
              label="CVV"
              value={cvv}
              onChange={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
              type="password"
              placeholder="•••"
              colors={colors}
            />
          </div>
        </div>

        {/* Supported cards */}
        <div className="flex items-center gap-2">
          {["Visa", "Mastercard", "Verve"].map((brand) => (
            <span
              key={brand}
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: colors.surface, color: colors.subtext }}
            >
              {brand}
            </span>
          ))}
          <span className="text-[11px]" style={{ color: colors.muted }}>
            · Mobile money · USSD
          </span>
        </div>

        {/* Pay button */}
        <PrimaryButton
          label={loading ? "Processing…" : `Pay ${plan.price} ${plan.perUnit}`}
          onClick={handlePay}
          loading={loading}
          disabled={loading}
        />

        {/* Fine print */}
        <p className="text-center text-[11px] leading-4" style={{ color: colors.muted }}>
          Subscription renews automatically. Cancel anytime from your Subscription settings.
          By subscribing you agree to our Terms of Service and Privacy Policy.
        </p>

        {/* Note about simulation */}
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: colors.surface, border: `1px dashed ${colors.border}` }}
        >
          <p className="text-[11px] leading-4" style={{ color: colors.muted }}>
            <strong style={{ color: colors.subtext }}>Dev mode:</strong> This simulates a Paystack payment. In production, the real Paystack SDK handles card tokenization and 3DS authentication. No real charge will be made.
          </p>
        </div>
      </div>
    </div>
  );
}
