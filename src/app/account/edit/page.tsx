import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCustomer } from "@/lib/customer";
import { EditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/sign-in?next=/account/edit");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader back="/account" showBag={false} title="Edit profile" />

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-8">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">
          Your details
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Update your name, contact and the fun stuff. Your email is your login,
          so it stays put.
        </p>

        <EditForm customer={customer} />
      </main>
    </div>
  );
}
