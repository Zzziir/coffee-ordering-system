import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { EventForm } from "../event-form";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/events"
        className="pressable -ml-1 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink"
      >
        <CaretLeftIcon size={16} weight="bold" />
        Events
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">New event</h1>
      <p className="mt-1 text-[14.5px] text-ink-soft">
        Set up a bazaar or pop-up. Sales rung up against it are reported on their own.
      </p>
      <div className="mt-6">
        <EventForm />
      </div>
    </div>
  );
}
