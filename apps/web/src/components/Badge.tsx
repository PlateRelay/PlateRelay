import { cx } from "../lib/cx";

/** MD3 badge: a red count pill, or a small red dot when there is no number. Every badge in the app uses this. */
export function Badge({ count, className }: { count?: number; className?: string }) {
  if (count == null) return <span className={cx("inline-block size-1.5 flex-none rounded-full bg-error", className)} />;
  return <span className={cx("inline-block h-4 min-w-4 flex-none rounded-lg bg-error px-1 text-center font-num text-label-s leading-4 text-on-error", className)}>{count > 999 ? "999+" : count}</span>;
}
