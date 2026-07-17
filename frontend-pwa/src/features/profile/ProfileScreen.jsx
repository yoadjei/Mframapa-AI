import { useState, useEffect } from "react";
import { ChevronRight, Pencil, LogOut } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";
import { InputField } from "../../components/ui/InputField.jsx";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";

// All profile menu items (PROFILE_MENU_ITEMS + MORE_MENU_ITEMS from mobile)
const ALL_MENU_ITEMS = [
  { id: "pricing",    labelKey: "screen.profile.link_pricing",        target: { type: "navigate", name: "pricing" } },
  { id: "settings",  labelKey: "screen.profile.link_settings",       target: { type: "tab", name: "settings" } },
  { id: "saved",     labelKey: "screen.profile.link_saved_locations", target: { type: "navigate", name: "savedLocations" } },
  { id: "activity",  labelKey: "screen.profile.link_activity_feed",  target: { type: "navigate", name: "activityFeed" } },
  { id: "ai",        labelKey: "screen.profile.link_ai_insights",    target: { type: "navigate", name: "aiInsights" } },
  { id: "prediction",labelKey: "screen.profile.link_prediction",     target: { type: "navigate", name: "predictionDashboard" } },
  { id: "country",   labelKey: "screen.profile.link_country",        target: { type: "navigate", name: "countryExplorer" } },
  { id: "heatmap",   labelKey: "screen.profile.link_heatmap",        target: { type: "navigate", name: "africaHeatmap" } },
  { id: "historical",labelKey: "screen.profile.link_historical",     target: { type: "navigate", name: "historicalPlayback" } },
  { id: "compare",   labelKey: "screen.profile.link_compare",        target: { type: "navigate", name: "compareCities" } },
  { id: "community", labelKey: "screen.profile.link_community",      target: { type: "navigate", name: "communityHub" } },
  { id: "trust",     labelKey: "screen.profile.link_trust",          target: { type: "navigate", name: "trustTransparency" } },
  { id: "export",    labelKey: "screen.profile.link_export",         target: { type: "navigate", name: "exportCentre" } },
  { id: "about",     labelKey: "screen.profile.link_about",          target: { type: "navigate", name: "aboutLegal" } },
  { id: "feedback",  labelKey: "screen.profile.link_feedback",       target: { type: "navigate", name: "feedbackForm" } },
];

function getTierStyle(tier) {
  if (tier === "researcher") return { bg: Colors.brandGreen + "26", text: Colors.brandGreen, label: "Researcher" };
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

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [organization, setOrg] = useState(profile.organization ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Keep local state in sync if profile is re-hydrated
  useEffect(() => {
    setFullName(profile.fullName ?? "");
    setOrg(profile.organization ?? "");
  }, [profile.fullName, profile.organization]);

  const isDirty =
    fullName.trim() !== (profile.fullName ?? "").trim() ||
    organization.trim() !== (profile.organization ?? "").trim();

  async function handleSave() {
    if (saving) return;
    if (!isDirty) { setEditing(false); return; }
    const cleanName = fullName.trim();
    if (!cleanName) { setSaveMsg(t("screen.profile.full_name_required")); return; }
    setSaving(true);
    dispatch({ type: "UPDATE_PROFILE", payload: { fullName: cleanName, organization: organization.trim() } });
    setSaving(false);
    setEditing(false);
    setSaveMsg(t("screen.profile.changes_saved"));
    setTimeout(() => setSaveMsg(""), 2500);
  }

  function handlePrimaryAction() {
    if (editing) { void handleSave(); } else { setEditing(true); }
  }

  function handleMenuItem(item) {
    if (item.target.type === "tab") {
      dispatch({ type: "SET_ACTIVE_SCREEN", payload: item.target.name });
    } else {
      navigate(item.target.name);
    }
  }

  const tierStyle = getTierStyle(tier);
  const initials = getInitials(profile.fullName ?? state.session?.user?.fullName);

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto pb-36 px-4"
      style={{ backgroundColor: colors.bg }}
    >
      <div style={{ paddingTop: 12 }}>

        {/* Header: Logo */}
        <div className="flex justify-center mb-2">
          <MframapaLogo size="sm" isDark={isDark ?? true} />
        </div>

        {/* Page title */}
        <p className="text-[22px] font-bold text-center mb-5" style={{ color: colors.text }}>
          {t("screen.profile.title")}
        </p>

        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center select-none"
              style={{ backgroundColor: Colors.brandGreen + "26" }}
            >
              <span className="text-[30px] font-bold" style={{ color: Colors.brandGreen }}>
                {initials}
              </span>
            </div>
            {/* Edit badge */}
            <div
              className="absolute bottom-0 -right-1 w-[26px] h-[26px] rounded-full border flex items-center justify-center"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Pencil size={13} color={colors.subtext} />
            </div>
          </div>
        </div>

        {/* Tier badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-[14px]" style={{ color: colors.subtext }}>
            {t("screen.profile.account_tier")}
          </span>
          <span
            className="px-3 py-0.5 rounded-full text-[13px] font-semibold"
            style={{ backgroundColor: tierStyle.bg, color: tierStyle.text }}
          >
            {tierStyle.label}
          </span>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3.5 mb-6">
          <InputField
            label={t("screen.profile.full_name")}
            value={fullName}
            onChange={editing ? setFullName : () => {}}
            placeholder="Kofi Antwi"
            colors={colors}
          />
          <div style={{ opacity: editing ? 0.5 : 1 }}>
            <InputField
              label={t("screen.profile.email")}
              value={profile.email ?? state.session?.user?.email ?? ""}
              onChange={() => {}}
              placeholder="email@example.com"
              type="email"
              colors={colors}
            />
          </div>
          <InputField
            label={t("screen.profile.organization")}
            value={organization}
            onChange={editing ? setOrg : () => {}}
            placeholder="Organization"
            colors={colors}
          />
        </div>

        {saveMsg ? (
          <p className="text-center text-[13px] mb-3" style={{ color: Colors.brandGreen }}>{saveMsg}</p>
        ) : null}

        <PrimaryButton
          label={editing ? t("screen.profile.save") : t("screen.profile.edit")}
          onClick={handlePrimaryAction}
          loading={saving}
        />

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
              <span className="text-[15px]" style={{ color: colors.text }}>
                {t(item.labelKey)}
              </span>
              <ChevronRight size={18} color={colors.subtext} />
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div className="mt-8 mb-2 flex justify-center">
          <button
            type="button"
            onClick={() => dispatch({ type: "LOGOUT" })}
            className="flex items-center gap-2 text-[16px] font-medium active:opacity-60"
            style={{ color: Colors.danger }}
          >
            <LogOut size={18} color={Colors.danger} />
            {t("settings.sign_out")}
          </button>
        </div>

      </div>
    </div>
  );
}
