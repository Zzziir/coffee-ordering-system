import type { BranchId } from "./types";
import { isBranchId } from "./branches";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Bazaars and pop-ups (see supabase/migrations/0013_sales_events.sql).
 *
 * An event is where a booth sale happened. A sale carries its event explicitly:
 * it is stamped when it is rung up from the admin till, and can be moved
 * afterwards from the transactions page. Nothing is attributed by date alone,
 * because on any bazaar day the two stores are also taking orders, and guessing
 * would hand a store's sales to the booth.
 *
 * Runs on the service role behind the admin gate, like the rest of the store.
 */

export type SalesEventStatus = "active" | "closed";

export type SalesEvent = {
  id: string;
  name: string;
  venue: string | null;
  city: string | null;
  organizer: string | null;
  /** The store that staffs and stocks the booth. */
  branchId: BranchId;
  /** Manila calendar days, "YYYY-MM-DD". Either may be missing. */
  startsOn: string | null;
  endsOn: string | null;
  openingCash: number | null;
  cashNote: string | null;
  closingCash: number | null;
  status: SalesEventStatus;
  closedAt: number | null;
  createdAt: number;
};

type EventRow = {
  id: string;
  name: string;
  venue: string | null;
  city: string | null;
  organizer: string | null;
  branch_id: string;
  starts_on: string | null;
  ends_on: string | null;
  opening_cash: number | null;
  cash_note: string | null;
  closing_cash: number | null;
  status: SalesEventStatus;
  closed_at: string | null;
  created_at: string;
};

const EVENT_SELECT =
  "id, name, venue, city, organizer, branch_id, starts_on, ends_on, opening_cash, cash_note, closing_cash, status, closed_at, created_at";

function toEvent(row: EventRow): SalesEvent {
  if (!isBranchId(row.branch_id)) {
    throw new Error(`Event ${row.id} has an unknown branch: ${row.branch_id}`);
  }
  return {
    id: row.id,
    name: row.name,
    venue: row.venue,
    city: row.city,
    organizer: row.organizer,
    branchId: row.branch_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    openingCash: row.opening_cash,
    cashNote: row.cash_note,
    closingCash: row.closing_cash,
    status: row.status,
    closedAt: row.closed_at ? new Date(row.closed_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
  };
}

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/** Every event, newest first by start date; undated ones last. */
export async function listEvents(): Promise<SalesEvent[]> {
  const { data, error } = await supabaseAdmin()
    .from("sales_events")
    .select(EVENT_SELECT)
    .order("starts_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<EventRow[]>();

  if (error) throw new Error(`Could not read events: ${error.message}`);
  return (data ?? []).map(toEvent);
}

export async function getEvent(id: string): Promise<SalesEvent | undefined> {
  if (!isUuid(id)) return undefined;

  const { data, error } = await supabaseAdmin()
    .from("sales_events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle<EventRow>();

  if (error) throw new Error(`Could not read event ${id}: ${error.message}`);
  return data ? toEvent(data) : undefined;
}

/** The editable details. Cash fields are whole pesos. */
export type SalesEventInput = {
  name: string;
  venue: string | null;
  city: string | null;
  organizer: string | null;
  branchId: BranchId;
  startsOn: string | null;
  endsOn: string | null;
  openingCash: number | null;
  cashNote: string | null;
};

function toColumns(input: SalesEventInput) {
  return {
    name: input.name,
    venue: input.venue,
    city: input.city,
    organizer: input.organizer,
    branch_id: input.branchId,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    opening_cash: input.openingCash,
    cash_note: input.cashNote,
  };
}

export async function createEvent(input: SalesEventInput): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .from("sales_events")
    .insert(toColumns(input))
    .select("id")
    .single<{ id: string }>();

  if (error) throw new Error(`Could not save the event: ${error.message}`);
  return data.id;
}

export async function updateEvent(id: string, input: SalesEventInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("sales_events")
    .update(toColumns(input))
    .eq("id", id);

  if (error) throw new Error(`Could not save the event: ${error.message}`);
}

/** Count the till and stop taking sales against the event. */
export async function closeEvent(id: string, closingCash: number | null): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("sales_events")
    .update({
      status: "closed",
      closing_cash: closingCash,
      closed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`Could not close the event: ${error.message}`);
}

/** Undo a close, for a count entered early or a bazaar that ran an extra day. */
export async function reopenEvent(id: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("sales_events")
    .update({ status: "active", closed_at: null })
    .eq("id", id);

  if (error) throw new Error(`Could not reopen the event: ${error.message}`);
}

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Does this event cover the given Manila day ("YYYY-MM-DD")? A closed event
 * and an event with no dates never match; a single date is that one day.
 * ISO dates compare correctly as strings.
 */
export function coversDay(event: SalesEvent, day: string): boolean {
  if (event.status === "closed") return false;
  const first = event.startsOn ?? event.endsOn;
  const last = event.endsOn ?? event.startsOn;
  if (!first || !last) return false;
  return first <= day && day <= last;
}

export type CashReconciliation = {
  opening: number;
  cashSales: number;
  /** What the till should hold: the float plus every cash sale. */
  expected: number;
  /** null until the till has been counted. */
  counted: number | null;
  /** counted minus expected. Negative means the till is short. */
  variance: number | null;
};

export function reconcileCash(event: SalesEvent, cashSales: number): CashReconciliation {
  const opening = event.openingCash ?? 0;
  const expected = opening + cashSales;
  const counted = event.closingCash;
  return {
    opening,
    cashSales,
    expected,
    counted,
    variance: counted === null ? null : counted - expected,
  };
}
