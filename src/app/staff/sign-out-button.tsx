import { SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { signOut } from "./actions";

/** Who's on shift, and the way off it. Shown in every staff header. */
export function SignOutButton({ name }: { name: string }) {
  return (
    <form action={signOut} className="flex items-center gap-3">
      <span className="hidden text-[13px] text-ink-soft sm:inline">{name}</span>
      <button
        type="submit"
        className="pressable grid size-10 place-items-center rounded-full border border-line text-[13px] font-medium text-ink-soft sm:block sm:size-auto sm:h-9 sm:px-3.5"
      >
        <SignOutIcon size={17} weight="bold" className="sm:hidden" aria-hidden />
        <span className="sr-only sm:not-sr-only">Sign out</span>
      </button>
    </form>
  );
}
