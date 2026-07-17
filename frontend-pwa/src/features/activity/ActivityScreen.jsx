import { ChevronLeft, Clock, User, Shield, MapPin } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";

// Map activity icon names (from mobile store ActivityItem) → Lucide components
const ICON_MAP = {
  clock:    Clock,
  person:   User,
  lock:     Shield,
  location: MapPin,
};

// Resolve icon from item.icon or item.type fallback
function resolveIcon(item) {
  if (item.icon && ICON_MAP[item.icon]) return ICON_MAP[item.icon];
  if (item.type === "profile")  return User;
  if (item.type === "location") return MapPin;
  if (item.type === "auth")     return Shield;
  return Clock;
}

function resolveLabel(item, t) {
  if (item.actionKey) return t(item.actionKey, item.actionParams ?? {});
  if (item.action)    return item.action;
  if (item.message)   return item.message;
  if (item.city)      return `Checked ${item.city}`;
  return "Activity";
}

function resolveTime(item, t) {
  if (item.timestampKey) return t(item.timestampKey, item.timestampParams ?? {});
  if (item.timestamp)    return item.timestamp;
  if (item.createdAt)    return new Date(item.createdAt).toLocaleString();
  return "";
}

export function ActivityScreen({ isOnline, isDark }) {
  const { state } = useAppState();
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  // Support both `state.activityFeed` (mobile-aliased) and `state.activity` (PWA-native)
  const feed = state.activityFeed ?? state.activity ?? [];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Safe-area spacer — MobileShell won't provide it when rendered as a stack screen */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header — title centred, left slot reserved for global back button */}
      <div
        className="flex flex-row items-center justify-between px-4 pb-3"
        style={{ paddingTop: 8 }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center"
          style={{ width: 22, height: 22 }}
        >
          <ChevronLeft size={22} color={colors.text} />
        </button>

        <span
          className="text-[13px] font-bold tracking-widest"
          style={{ color: colors.text }}
        >
          {t("activity.title")}
        </span>

        {/* Spacer to balance the back button */}
        <div style={{ width: 22 }} />
      </div>

      {/* Scrollable content */}
      <div
        className="overflow-y-auto"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)",
        }}
      >
        {feed.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 py-12">
            <Clock size={40} color={colors.subtext} />
            <p
              className="text-[14px] text-center px-6"
              style={{ color: colors.subtext }}
            >
              {t("activity.no_activity_yet")}
            </p>
          </div>
        ) : (
          feed.map((item, index) => {
            const Icon = resolveIcon(item);
            const label = resolveLabel(item, t);
            const timeStr = resolveTime(item, t);
            const isLast = index === feed.length - 1;

            return (
              <div key={item.id ?? index} className="flex" style={{ gap: 16 }}>
                {/* Timeline column */}
                <div className="flex flex-col items-center" style={{ width: 40 }}>
                  {/* Icon circle */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full border"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }}
                  >
                    <Icon size={16} color={Colors.brandGreen} />
                  </div>
                  {/* Dashed connector line */}
                  {!isLast && (
                    <div
                      className="flex-1"
                      style={{
                        width: 1,
                        minHeight: 32,
                        marginTop: 4,
                        borderLeft: `1px dashed ${colors.border}`,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div
                  className="flex-1 flex flex-col"
                  style={{ paddingTop: 10, paddingBottom: 24 }}
                >
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: colors.text }}
                  >
                    {label}
                  </span>
                  {timeStr ? (
                    <span
                      className="text-[12px]"
                      style={{ color: colors.subtext, marginTop: 4 }}
                    >
                      {timeStr}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
