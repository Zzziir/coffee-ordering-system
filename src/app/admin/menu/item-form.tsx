"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImageIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { saveItem, type ItemFormState } from "./actions";
import type { Category, DietTag, MenuItem } from "@/lib/menu";

const inputClass =
  "h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee";

const TAGS: { id: DietTag; label: string }[] = [
  { id: "coffee", label: "Has coffee" },
  { id: "caffeine-free", label: "Caffeine-free" },
  { id: "dairy", label: "Contains dairy" },
  { id: "oat-available", label: "Oat milk available" },
  { id: "contains-nuts", label: "Contains nuts" },
  { id: "vegan-friendly", label: "Dairy-free" },
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
          <select
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
          </select>
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

      <fieldset>
        <legend className="text-[14px] font-medium text-ink">Tags</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGS.map((t) => {
            const checked = item?.tags?.includes(t.id);
            return (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper-raised px-3.5 py-2 text-[13px] text-ink-soft has-[:checked]:border-coffee has-[:checked]:bg-coffee-tint/60 has-[:checked]:text-ink"
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={t.id}
                  defaultChecked={checked}
                  className="accent-coffee"
                />
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Toggle name="signature" label="Signature (bestseller)" defaultChecked={item?.signature} />
        <Toggle
          name="available"
          label="Listed at all branches"
          defaultChecked={item ? item.available : true}
        />
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

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 py-3 text-[15px] text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-coffee" />
      {label}
    </label>
  );
}
