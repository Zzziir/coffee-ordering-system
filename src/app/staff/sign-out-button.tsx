import { signOut } from "./actions";

/** Who's on shift, and the way off it. Shown in every staff header. */
export function SignOutButton({ name }: { name: string }) {
  return (
    <form action={signOut} className="flex items-center gap-3">
      <span className="hidden text-[13px] text-ink-soft sm:inline">{name}</span>
      <button
        type="submit"
        className="pressable rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink-soft"
      >
        Sign out
      </button>
    </form>
  );
}
