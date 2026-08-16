/** Shared label + field wrapper for the account sign-in, sign-up and edit forms. */

export function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-[14px] font-medium text-ink"
      >
        {label}
        {optional && (
          <span className="text-[12px] font-normal text-ink-faint">Optional</span>
        )}
      </label>
      {children}
    </div>
  );
}
