import { useState, useEffect } from "react";
import { ChevronRight, Pencil, LogOut, LogIn } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { logout } from "../../services/authService.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";

import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";
import { AvatarPickerSheet, naviiUrl, defaultSeedFor } from "../../components/ui/AvatarPickerSheet.jsx";

// All profile menu items (PROFILE_MENU_ITEMS + MORE_MENU_ITEMS from mobile)
const ALL_MENU_ITEMS = [
  { id: "settings",  labelKey: "screen.profile.link_settings",       target: { type: "navigate", name: "settings" } },
  { id: "saved",     labelKey: "screen.profile.link_saved_locations", target: { type: "navigate", name: "savedLocations" } },
  { id: "activity",  labelKey: "screen.profile.link_activity_feed",  target: { type: "navigate", name: "activity" } },
  { id: "ai",        labelKey: "screen.profile.link_ai_insights",    target: { type: "navigate", name: "aiInsights" } },
  { id: "prediction",labelKey: "screen.profile.link_prediction",     target: { type: "navigate", name: "predictionDashboard" } },
  { id: "country",   labelKey: "screen.profile.link_country",        target: { type: "navigate", name: "countryExplorer" } },
  { id: "compare",   labelKey: "screen.profile.link_compare",        target: { type: "navigate", name: "compareCities" } },
  { id: "trust",     labelKey: "screen.profile.link_trust",          target: { type: "navigate", name: "trustTransparency" } },
  { id: "export",    labelKey: "screen.profile.link_export",         target: { type: "navigate", name: "exportCentre" } },
  { id: "about",     labelKey: "screen.profile.link_about",          target: { type: "navigate", name: "aboutLegal" } },
  { id: "feedback",  labelKey: "screen.profile.link_feedback",       target: { type: "navigate", name: "feedbackForm" } },
];

function getTierStyle(tier) {
  if (tier === "institutional") return { bg: "#F59E0B26", text: "#F59E0B", label: "Institutional" };
  return { bg: "#64718226", text: "#9AA7B5", label: "Free" };
}

function getInitials(fullName) {
  if (!fullName) return "YA";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileScreen({ isOnline, isDark }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const colors = getColors(isDark ?? true);

  const profile = state.profile ?? {};
  const tier = state.session?.tier ?? "free";

  const [pickerOpen, setPickerOpen] = useState(false);
  const avatarSeed = profile.avatarSeed ?? null;

  // give every user an avatar up front instead of bare initials; deterministic so
  // it stays the same on every visit. they can still change it from the picker.
  useEffect(() => {
    if (profile.avatarSeed) return;
    const key = profile.email || state.session?.user?.email || profile.fullName || "guest";
    dispatch({ type: "UPDATE_PROFILE", payload: { avatarSeed: defaultSeedFor(key) } });
  }, [profile.avatarSeed, profile.email, profile.fullName, state.session, dispatch]);

  function handleMenuItem(item) {
    if (item.target.type === "tab") {
      dispatch({ type: "SET_ACTIVE_SCREEN", payload: item.target.name });
    } else {
      navigate(item.target.name);
    }
  }

  const authenticated = Boolean(state.session?.authenticated);
  const displayName = profile.fullName || state.session?.user?.fullName || "";
  const displayEmail = profile.email || state.session?.user?.email || "";

  const tierStyle = getTierStyle(tier);
  const initials = getInitials(profile.fullName ?? state.session?.user?.fullName);

  function handleAvatarSelect(seed) {
    dispatch({ type: "UPDATE_PROFILE", payload: { avatarSeed: seed } });
  }
  return (
    <div
      className="min-h-[100dvh] overflow-y-auto mf-tab-gap px-4"
      style={{ backgroundColor: colors.bg }}
    >
      <div style={{ paddingTop: 12 }}>

        {/* Header: Logo */}
        <div className="flex justify-center mb-2">
          <MframapaLogo size="sm" isDark={isDark ?? true} markOnly />
        </div>

        {/* Page title */}
        <p className="text-[1.375rem] font-bold text-center mb-5" style={{ color: colors.text }}>
          {t("screen.profile.title")}
        </p>

        {/* Avatar — Navi if seed selected, initials fallback */}
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative active:opacity-70"
            aria-label="Change avatar"
          >
            <div
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center select-none overflow-hidden"
              style={{
                backgroundColor: Colors.brandGreen + "26",
                border: `3px solid ${Colors.brandGreen}`,
              }}
            >
              {avatarSeed ? (
                <img
                  src={naviiUrl(avatarSeed, 160)}
                  alt={avatarSeed}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span className="text-[1.875rem] font-bold" style={{ color: Colors.brandGreen }}>
                  {initials}
                </span>
              )}
            </div>
            {/* Edit badge */}
            <div
              className="absolute bottom-0 -right-1 w-[26px] h-[26px] rounded-full border flex items-center justify-center"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Pencil size={13} color={colors.subtext} />
            </div>
          </button>
        </div>

        <AvatarPickerSheet
          visible={pickerOpen}
          selected={avatarSeed ?? ""}
          onSelect={handleAvatarSelect}
          onClose={() => setPickerOpen(false)}
          isDark={isDark ?? true}
        />
        {/* Tier badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-[0.875rem]" style={{ color: colors.subtext }}>
            {t("screen.profile.account_tier")}
          </span>
          <span
            className="px-3 py-0.5 rounded-full text-[0.8125rem] font-semibold"
            style={{ backgroundColor: tierStyle.bg, color: tierStyle.text }}
          >
            {tierStyle.label}
          </span>
        </div>

        {/* Account details.

            anonymous visitors used to get an editable name, email and
            organisation form with nothing behind it: there was no account to
            save to, so the fields were theatre. signed-in details come from
            the auth provider, so they are shown read only rather than pretending
            they can be edited here. organisation is gone; it asked for something
            the product never uses. */}
        {authenticated ? (
          <div className="mb-6">
            <p
              className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest"
              style={{ color: colors.subtext }}
            >
              {t("screen.profile.account_details")}
            </p>
            <div
              className="rounded-2xl border px-4 py-1"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              {[
                { label: t("screen.profile.full_name"), value: displayName },
                { label: t("screen.profile.email"), value: displayEmail },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${colors.border}` }}
                >
                  <span className="text-[0.8125rem]" style={{ color: colors.subtext }}>{row.label}</span>
                  <span className="text-[0.875rem] font-medium" style={{ color: colors.text }}>
                    {row.value || t("screen.profile.not_set")}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[0.75rem]" style={{ color: colors.muted }}>
              {t("screen.profile.managed_note")}
            </p>
          </div>
        ) : (
          <div
            className="mb-6 rounded-2xl border p-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <p className="mb-1 text-[0.9375rem] font-semibold m-0" style={{ color: colors.text }}>
              {t("screen.profile.anon_title")}
            </p>
            <p className="mb-3 text-[0.8125rem] leading-[19px] m-0" style={{ color: colors.subtext }}>
              {t("screen.profile.anon_body")}
            </p>
            <PrimaryButton
              label={t("screen.profile.sign_in")}
              onClick={() => navigate("auth")}
            />
          </div>
        )}

        {/* Menu links */}
        <div className="mt-6" style={{ borderTop: `1px solid ${colors.border}` }}>
          {ALL_MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMenuItem(item)}
              className="flex w-full items-center justify-between py-3.5 text-left active:opacity-60"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <span className="text-[0.9375rem]" style={{ color: colors.text }}>
                {t(item.labelKey)}
              </span>
              <ChevronRight size={18} color={colors.subtext} />
            </button>
          ))}
        </div>

        {/* Sign in / sign out. air quality works without an account, so signing in
            is an upgrade (saved places, alerts, sync) rather than a requirement. */}
        <div className="mt-8 mb-2 flex justify-center">
          {state.session?.authenticated ? (
            <button
              type="button"
              onClick={async () => { await logout().catch(() => undefined); dispatch({ type: "LOGOUT" }); }}
              className="flex items-center gap-2 text-[1rem] font-medium active:opacity-60"
              style={{ color: Colors.danger }}
            >
              <LogOut size={18} color={Colors.danger} />
              {t("settings.sign_out")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("auth")}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.9375rem] font-semibold active:opacity-70"
              style={{ backgroundColor: Colors.brandGreen, color: "#00110B" }}
            >
              <LogIn size={18} color="#00110B" />
              Sign in to save places and get alerts
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
