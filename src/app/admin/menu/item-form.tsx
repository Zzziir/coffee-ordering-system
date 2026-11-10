"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CaretLeftIcon, CheckIcon, ImageIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { saveItem, type ItemFormState } from "./actions";
import type { Category, DietTag, MenuItem } from "@/lib/menu";
import { Select } from "@/components/select";
import { clsx } from "@/lib/clsx";

const inputClass =
  "h-11 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee";

type TagOption = { id: DietTag; label: string };

/**
 * The diet tags, chunked by what they answer, so the eye takes three short
 * questions instead of six loose chips. Within a row, `oneOf` options rule
 * each other out (a drink can't have coffee and be caffeine-free), so picking
 * one clears the other; the rest stand on their own.
 */
const TAG_GROUPS: { label: string; oneOf: TagOption[]; also?: TagOption[] }[] = [
  {
    label: "Caffeine",
    oneOf: [
      { id: "coffee", label: "Has coffee" },
      { id: "caffeine-free", label: "Caffeine-free" },
    ],
  },
  {
    label: "Dairy",
    oneOf: [
      { id: "dairy", label: "Contains dairy" },
      { id: "vegan-friendly", label: "Dairy-free" },
    ],
    also: [{ id: "oat-available", label: "Oat milk available" }],
  },
  { label: "Allergens", oneOf: [], also: [{ id: "contains-nuts", label: "Contains nuts" }] },
];

export function ItemForm({
  categories,
  item,
}: {
  categories: Category[];
  item?: MenuItem;
}) {
  const [state, formAction] = useActionState<ItemFormState, FormData>(saveItem, null);
  const editing = !!item;

  return (
    // No encType: with a function action React sends multipart itself, and
    // warns if one is set.
    <form action={formAction} className="flex flex-col gap-6">
      {editing && <input type="hidden" name="id" value={item.id} />}

      {/* The item is the heading; the one thing to do with it, save, sits
          beside it, so it is never a scroll away. */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/menu"
            className="pressable -ml-1 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink"
          >
            <CaretLeftIcon size={16} weight="bold" />
            Menu
          </Link>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-ink">
            {editing ? item.name : "Add an item"}
          </h1>
          <p className="mt-1 max-w-[62ch] text-[14.5px] text-ink-soft">
            {editing
              ? "Changes reach every branch's menu as soon as you save."
              : "It joins the end of its category. Sizes and milk options come from the category."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/menu"
            className="pressable inline-flex h-11 items-center rounded-full px-4 text-[14px] font-medium text-ink-soft hover:text-ink"
          >
            Cancel
          </Link>
          <SubmitButton editing={editing} />
        </div>
      </header>

      {state?.error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn">
          {state.error}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Section title="Details">
            <div className="flex flex-col gap-4">
              <Label label="Name" htmlFor="name">
                <input id="name" name="name" required defaultValue={item?.name} className={inputClass} />
              </Label>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
                <Label label="Category" htmlFor="categoryId">
                  <Select
                    id="categoryId"
                    name="categoryId"
                    defaultValue={item?.categoryId ?? categories[0]?.id}
                    className={inputClass}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Label>
                <Label label="Price" htmlFor="price">
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-faint"
                    >
                      ₱
                    </span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min={0}
                      required
                      inputMode="numeric"
                      defaultValue={item?.price}
                      className={clsx(
                        inputClass,
                        "pl-9 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                      )}
                    />
                  </div>
                </Label>
              </div>
              <Label label="Description" htmlFor="description" optional>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={item?.description ?? ""}
                  placeholder="A line customers see under the name."
                  className={clsx(inputClass, "h-auto resize-none py-3 leading-relaxed")}
                />
              </Label>
            </div>
          </Section>

          <Section title="On the menu">
            <div className="-my-3 divide-y divide-line">
              <SwitchRow
                name="signature"
                label="Signature"
                hint="Marked as a bestseller wherever it's listed."
                defaultChecked={item?.signature}
              />
              <SwitchRow
                name="available"
                label="Listed"
                hint="Off takes it off the menu at every branch. For one store running out, use Sold out instead."
                defaultChecked={item ? item.available : true}
              />
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Photo" hint="Optional">
            <PhotoField current={item?.image} />
          </Section>
          <Section title="Diet notes" hint="Optional. The chat assistant uses these to answer diet questions.">
            <DietTags initial={item?.tags ?? []} />
          </Section>
        </div>
      </div>
    </form>
  );
}

/** A titled card that holds one group of fields. */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-md)] border border-line bg-paper-raised p-5">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-[12.5px] text-ink-faint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Upload, replace or remove the item's photo. Stores the file for the server
 *  action and shows a live preview of what will be saved. */
function PhotoField({ current }: { current?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // What the card shows: a freshly picked file wins, otherwise the saved photo
  // (unless it has been removed).
  const shown = preview ?? (removed ? null : current ?? null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoved(false);
  };

  const onRemove = () => {
    setPreview(null);
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Carries the existing photo through, and whether to clear it. */}
      <input type="hidden" name="currentImage" value={current ?? ""} />
      <input type="hidden" name="removePhoto" value={removed ? "on" : ""} />

      {/* The frame is the upload target: one obvious place to click. */}
      <label className="group relative grid h-52 w-full cursor-pointer place-items-center overflow-hidden rounded-[var(--radius-sm)] border border-dashed border-line-strong bg-paper transition-colors hover:border-coffee focus-within:border-coffee">
        <input
          ref={inputRef}
          type="file"
          name="imageFile"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={onPick}
          className="sr-only"
        />
        {shown ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- object-URL / preview, not an optimized asset */}
            <img src={shown} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute bottom-3 left-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink/80 px-3.5 text-[13px] font-medium text-paper opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <UploadSimpleIcon size={15} weight="bold" />
              Change photo
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-coffee-tint text-coffee transition-transform group-hover:scale-105">
              <ImageIcon size={20} weight="bold" />
            </span>
            <span className="text-[14px] font-medium text-ink">Upload a photo</span>
            <span className="text-[12.5px] text-ink-faint">PNG, JPG or WebP, up to 5 MB</span>
          </span>
        )}
      </label>

      {shown && (
        <button type="button" onClick={onRemove} className="pressable self-start text-[13px] font-medium text-warn">
          Remove photo
        </button>
      )}
    </div>
  );
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-[14.5px] font-semibold text-paper disabled:opacity-70"
    >
      {pending ? "Saving…" : editing ? "Save changes" : "Add to menu"}
    </button>
  );
}

function Label({
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
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-[14px] font-medium text-ink">
        {label}
        {optional && <span className="text-[12px] font-normal text-ink-faint">Optional</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * The diet tags as three short rows. Each chip is a toggle; the chosen ones
 * travel with the form as hidden `tags` fields, exactly as the checkboxes did.
 */
function DietTags({ initial }: { initial: DietTag[] }) {
  const [chosen, setChosen] = useState<Set<DietTag>>(() => new Set(initial));

  const toggle = (id: DietTag, rivals: TagOption[]) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        for (const rival of rivals) next.delete(rival.id);
        next.add(id);
      }
      return next;
    });

  return (
    <div role="group" aria-label="Diet notes">
      {[...chosen].map((id) => (
        <input key={id} type="hidden" name="tags" value={id} />
      ))}
      <div className="-my-3 divide-y divide-line">
        {TAG_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
            <span className="shrink-0 text-[13px] text-ink-soft sm:w-20 sm:pt-2">{group.label}</span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {[...group.oneOf, ...(group.also ?? [])].map((tag) => {
                const on = chosen.has(tag.id);
                const rivals = group.oneOf.some((t) => t.id === tag.id) ? group.oneOf : [];
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(tag.id, rivals)}
                    className={clsx(
                      "pressable inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                      on
                        ? "border-coffee bg-coffee-tint text-ink"
                        : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
                    )}
                  >
                    {on && <CheckIcon size={13} weight="bold" className="text-coffee" />}
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A labelled on/off switch that submits like a checkbox ("on" when set). */
function SwitchRow({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium text-ink">{label}</span>
        <span className="block text-[12.5px] text-ink-faint">{hint}</span>
      </span>
      <input type="checkbox" role="switch" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-line-strong px-0.5 transition-colors peer-checked:bg-coffee peer-focus-visible:ring-2 peer-focus-visible:ring-coffee/40 peer-checked:[&>span]:translate-x-5"
      >
        <span className="size-5 rounded-full bg-paper shadow-sm transition-transform duration-200 ease-[var(--ease-out)]" />
      </span>
    </label>
  );
}
