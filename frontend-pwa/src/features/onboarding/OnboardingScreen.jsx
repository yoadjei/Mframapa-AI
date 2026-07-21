import { useState, useEffect, useRef } from "react";
import { Globe2, BarChart3, ShieldCheck, MapPin } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";
import { OutlineButton } from "../../components/ui/OutlineButton.jsx";

const BRAND_GREEN = "#00C896";
const MUTED = "#647182";

const SLIDES = [
  {
    icon: Globe2,
    titleKey: "screen.onboarding.slide1_title",
    titleFallback: "Check air quality instantly",
    subKey: "screen.onboarding.slide1_sub",
    subFallback: "Monitor pollution levels in your area and stay healthy everywhere in Africa.",
  },
  {
    icon: BarChart3,
    titleKey: "screen.onboarding.slide2_title",
    titleFallback: "AI-Powered Predictions",
    subKey: "screen.onboarding.slide2_sub",
    subFallback: "Satellite data and 12 ML models give you accurate 7-day air quality forecasts.",
  },
  {
    icon: ShieldCheck,
    titleKey: "screen.onboarding.slide3_title",
    titleFallback: "Stay Protected Anywhere",
    subKey: "screen.onboarding.slide3_sub",
    subFallback: "Get instant alerts when air quality changes. Works offline with cached city data.",
  },
];

function useT() {
  // Minimal translation helper — reads from window.__mframapa_strings if populated by i18n system,
  // otherwise returns the fallback value passed at call site.
  return (key, fallback) => {
    try {
      const strings = window.__mframapa_strings;
      if (strings && strings[key]) return strings[key];
    } catch {
      // window.__mframapa_strings not available — fall through to fallback
    }
    return fallback ?? key;
  };
}

/* ─────────────────────────────────────────────────────────── Splash phase ── */
function SplashPhase({ onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const fadeIn = setTimeout(() => setVisible(true), 60);
    // Auto-advance after 1.4 s
    const advance = setTimeout(() => onDone(), 1460);
    return () => {
      clearTimeout(fadeIn);
      clearTimeout(advance);
    };
  }, [onDone]);

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center"
      style={{
        backgroundColor: "#0A0D12",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        <MframapaLogo size="lg" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── Slides phase ── */
function SlidesPhase({ onDone }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);
  const t = useT();

  function goNext() {
    if (index < SLIDES.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onDone();
    }
  }

  // Animate the slide track via CSS translate
  const translateX = `-${index * 100}%`;

  return (
    <div
      className="flex min-h-[100dvh] flex-col overflow-hidden"
      style={{
        backgroundColor: "#0A0D12",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header — logo */}
      <div className="flex shrink-0 items-center px-6 pt-4 pb-2">
        <MframapaLogo size="sm" markOnly />
      </div>

      {/* Slide track */}
      <div className="flex flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="flex w-full"
          style={{
            transform: `translateX(${translateX})`,
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {SLIDES.map((slide, i) => {
            const IconComp = slide.icon;
            return (
              <div
                key={i}
                className="flex w-full shrink-0 flex-col items-center justify-center px-6"
                style={{ minWidth: "100%" }}
              >
                {/* Icon in gradient circle */}
                <div
                  style={{
                    width: "min(75vw, 280px)",
                    height: "min(75vw, 280px)",
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 40% 40%, #0D3325, #071810)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "40px",
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={120} color={BRAND_GREEN} style={{ opacity: 0.9 }} />
                </div>

                {/* Text block */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <h1 className="text-2xl font-bold leading-8" style={{ color: "#FFFFFF" }}>
                    {t(slide.titleKey, slide.titleFallback)}
                  </h1>
                  <p className="text-sm leading-5" style={{ color: "#9AA7B5" }}>
                    {t(slide.subKey, slide.subFallback)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom — dots + button */}
      <div
        className="flex shrink-0 flex-col items-center gap-5 px-6 pb-6"
      >
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? BRAND_GREEN : MUTED,
                transition: "background-color 0.25s",
              }}
            />
          ))}
        </div>

        <PrimaryButton
          label={
            index === SLIDES.length - 1
              ? t("screen.onboarding.get_started", "Get Started")
              : t("screen.onboarding.next", "Next")
          }
          onClick={goNext}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── Permissions phase ── */
function PermissionsPhase({ onDone }) {
  const [requesting, setRequesting] = useState(false);
  const t = useT();

  async function handleAllow() {
    if (requesting) return;
    setRequesting(true);
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
        });
      });
    } catch {
      // Denied or unavailable — still proceed
    } finally {
      setRequesting(false);
      onDone();
    }
  }

  function handleSkip() {
    onDone();
  }

  return (
    <div
      className="flex min-h-[100dvh] flex-col px-6"
      style={{
        backgroundColor: "#0A0D12",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Logo */}
      <div className="flex shrink-0 items-center justify-center pt-4 pb-2">
        <MframapaLogo size="md" />
      </div>

      {/* Center content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        {/* Icon circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            border: `2px solid ${BRAND_GREEN}`,
            backgroundColor: "rgba(0, 200, 150, 0.08)",
            boxShadow: `0 0 20px rgba(0, 200, 150, 0.25)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <MapPin size={52} color={BRAND_GREEN} />
        </div>

        <h1
          className="text-center text-[26px] font-bold"
          style={{ color: "#FFFFFF" }}
        >
          {t("screen.permissions.title", "Location Access")}
        </h1>

        <p
          className="text-center text-[15px] leading-[22px]"
          style={{ color: "#9AA7B5" }}
        >
          {t(
            "screen.permissions.body",
            "We use your location to find the nearest city and show local air quality. Location data is never stored on our servers."
          )}
        </p>
      </div>

      {/* Bottom buttons */}
      <div className="flex shrink-0 flex-col items-center gap-3 pb-4">
        <PrimaryButton
          label={t("screen.permissions.allow", "Allow")}
          onClick={handleAllow}
          loading={requesting}
        />
        <OutlineButton
          label={t("screen.permissions.not_now", "Not now")}
          onClick={handleSkip}
          color={MUTED}
        />

        {/* Progress dots (two dots — permissions is step 2 of 2 post-slides) */}
        <div className="flex gap-2 mt-1">
          <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND_GREEN }} />
          <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: MUTED }} />
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="text-[13px]"
          style={{ color: BRAND_GREEN }}
        >
          {t("screen.permissions.setup_later", "Set up later in Settings")}
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────── OnboardingScreen root ── */
export function OnboardingScreen() {
  const { dispatch } = useAppState();
  const [phase, setPhase] = useState("splash"); // "splash" | "slides" | "permissions"

  function completeOnboarding() {
    dispatch({ type: "COMPLETE_ONBOARDING" });
  }

  if (phase === "splash") {
    return <SplashPhase onDone={() => setPhase("slides")} />;
  }

  if (phase === "slides") {
    return <SlidesPhase onDone={() => setPhase("permissions")} />;
  }

  return <PermissionsPhase onDone={completeOnboarding} />;
}
