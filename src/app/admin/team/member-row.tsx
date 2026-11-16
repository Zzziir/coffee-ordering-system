"use client";

import { useOptimistic } from "react";
import { getBranch } from "@/lib/branches";
import { clsx } from "@/lib/clsx";
import { ROLE_LABEL, type Teammate } from "@/lib/team-rules";
import { MemberActions, MoveBranch } from "./member-controls";

/**
 * One teammate on the roster. It's a client component so that deactivating or
 * reactivating restyles the whole row (avatar, name, branch, status) as soon
 * as it's confirmed, not after the round trip. The server's value takes over
 * when the save lands, or puts the row back if it fails.
 */
export function MemberRow({
  member,
  initials,
  isYou,
  manageable,
  movable,
}: {
  member: Teammate;
  initials: string;
  isYou: boolean;
  /** whether the viewer may change this person at all */
  manageable: boolean;
  /** whether the viewer may move people between branches */
  movable: boolean;
}) {
  const [active, setOptimisticActive] = useOptimistic(member.active);

  return (
    <tr className={clsx("quiet-hover bg-paper-raised align-middle", !active && "text-ink-faint")}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={clsx(
              "grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
              active ? "bg-coffee-tint text-coffee" : "bg-paper-sunk text-ink-faint",
            )}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className={clsx("truncate font-semibold", active ? "text-ink" : "text-ink-soft")}>
              {member.name}
              {isYou && (
                <span className="ml-2 rounded-full bg-paper-sunk px-2 py-0.5 text-[11.5px] font-medium text-ink-soft">
                  You
                </span>
              )}
            </p>
            <p className="truncate text-[13px] text-ink-faint">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-ink-soft">{ROLE_LABEL[member.role]}</td>
      <td className="px-4 py-3 text-ink-soft">
        {member.branchId === null ? (
          "All branches"
        ) : movable && manageable && active ? (
          <MoveBranch id={member.id} name={member.name} branchId={member.branchId} />
        ) : (
          getBranch(member.branchId).name
        )}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[13.5px]">
          <span aria-hidden className={clsx("size-2 rounded-full", active ? "bg-ready" : "bg-ink-faint/60")} />
          <span className={active ? "text-ink" : "text-ink-faint"}>{active ? "Active" : "Deactivated"}</span>
        </span>
      </td>
      <td className="px-4 py-2.5">
        {manageable && (
          <MemberActions
            id={member.id}
            name={member.name}
            active={active}
            onActiveChange={setOptimisticActive}
          />
        )}
      </td>
    </tr>
  );
}
