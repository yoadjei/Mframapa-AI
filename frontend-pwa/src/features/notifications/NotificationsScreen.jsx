import { Bell } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export function NotificationsScreen() {
  const {
    state: { notifications },
    dispatch,
  } = useAppState();
  const { t } = useTranslation();

  if (!notifications.length) {
    return (
      <StateMessage
        title={t("pwa.notifications.empty_title")}
        message={t("pwa.notifications.empty_message")}
      />
    );
  }

  return (
    <section className="space-y-3">
      {notifications.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => dispatch({ type: "MARK_NOTIFICATION_READ", payload: item.id })}
          className={`w-full rounded-2xl border p-4 text-left shadow-sm ${
            item.read
              ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              : "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-emerald-500/15 p-2">
              <Bell size={16} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
              <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </button>
      ))}
    </section>
  );
}
