"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, ImageIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { saveItem, type ItemFormState } from "./actions";
import type { Category, DietTag, MenuItem } from "@/lib/menu";
import { Select } from "@/components/select";
import { clsx } from "@/lib/clsx";

const inputClass =
  "h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee";

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
    <form
      action={formAction}
      encType="multipart/form-data"
      className="mt-8 flex flex-col gap-4"
    >
      {editing && <input type="hidden" name="id" value={item.id} />}

      <Label label="Name" htmlFor="name">
        <input id="name" name="name" required defaultValue={item?.name} className={inputClass} />
      </Label>

      <div className="grid grid-cols-2 gap-3">
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
        <Label label="Price (₱)" htmlFor="price">
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            required
            inputMode="numeric"
            defaultValue={item?.price}
            className={inputClass}
          />
        </Label>
      </div>

      <Label label="Description" htmlFor="description" optional>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={item?.description ?? ""}
          className={inputClass.replace("h-12", "min-h-12 py-3")}
        />
      </Label>

      <PhotoField current={item?.image} />

      <DietTags initial={item?.tags ?? []} />

      <div className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium text-ink">On the menu</span>
        <div className="divide-y divide-line rounded-[var(--radius-sm)] border border-line bg-paper-raised">
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
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn"
        >
          {state.error}
        </p>
      )}

      <SubmitButton editing={editing} />
    </form>
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
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
        Photo
        <span className="text-[12px] font-normal text-ink-faint">Optional</span>
      </span>

      {/* Carries the existing photo through, and whether to clear it. */}
      <input type="hidden" name="currentImage" value={current ?? ""} />
      <input type="hidden" name="removePhoto" value={removed ? "on" : ""} />

      <div className="flex items-center gap-4">
        <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-sunk">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- object-URL / preview, not an optimized asset
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon size={24} className="text-ink-faint" />
          )}
        </div>

        <div className="flex flex-col items-start gap-2">
          <label className="pressable inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-paper-raised px-4 text-[13.5px] font-medium text-ink">
            <UploadSimpleIcon size={16} weight="bold" />
            {shown ? "Change photo" : "Upload photo"}
            <input
              ref={inputRef}
              type="file"
              name="imageFile"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={onPick}
              className="hidden"
            />
          </label>
          {shown && (
            <button
              type="button"
              onClick={onRemove}
              className="pressable text-[13px] font-medium text-warn"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      <p className="text-[12px] text-ink-faint">PNG, JPG or WebP, up to 5 MB.</p>
    </div>
  );
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable mt-2 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-paper disabled:opacity-70"
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
    <fieldset className="flex flex-col gap-1.5">
      <legend className="flex items-center gap-2 text-[14px] font-medium text-ink">
        Diet notes
        <span className="text-[12px] font-normal text-ink-faint">Optional</span>
      </legend>
      <p className="-mt-0.5 text-[12.5px] text-ink-faint">The chat assistant uses these to answer diet questions.</p>
      {[...chosen].map((id) => (
        <input key={id} type="hidden" name="tags" value={id} />
      ))}
      <div className="mt-1 divide-y divide-line rounded-[var(--radius-sm)] border border-line bg-paper-raised">
        {TAG_GROUPS.map((group) => (
          <div key={group.label} className="flex items-start gap-4 px-4 py-3">
            <span className="w-20 shrink-0 pt-2 text-[13px] text-ink-soft">{group.label}</span>
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
    </fieldset>
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
    <label className="flex cursor-pointer items-center gap-4 px-4 py-3">
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
