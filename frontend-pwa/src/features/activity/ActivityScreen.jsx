import { useAppState } from "../../state/appState.jsx";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";

export function ActivityScreen() {
  const {
    state: { activity },
  } = useAppState();

  if (!activity.length) {
    return (
      <StateMessage
        title="No activity yet"
        message="Your recent checks and account actions will appear here."
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
