import { notFound } from "next/navigation";
import { BRANCH_LIST, getBranch, isBranchId } from "@/lib/branches";
import { QrCard } from "./qr-card";

/** One printable table tent per branch — the codes are what tie a scan to a store. */
export function generateStaticParams() {
  return BRANCH_LIST.map((branch) => ({ branch: branch.id }));
}

export default async function QrBranchPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch: branchParam } = await params;
  if (!isBranchId(branchParam)) notFound();

  return <QrCard branch={getBranch(branchParam)} />;
}
