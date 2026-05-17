import { useAppState } from "../../state/appState.jsx";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export function ActivityScreen() {
  const {
    state: { activity },
  } = useAppState();
  const { t } = useTranslation();

  if (!activity.length) {
    return (
      <StateMessage
        title={t("pwa.activity.empty_title")}
        message={t("pwa.activity.empty_message")}
      />
    );
  }

  return (
    <section className="space-y-3">
      {activity.map((entry) => (
        <article
          key={entry.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm font-semibold">{entry.message}</p>
          <p className="mt-1 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
        </article>
      ))}
    </section>
  );
}
