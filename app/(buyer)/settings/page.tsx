import { redirect } from "next/navigation";

export default async function SettingsPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const targetTab = searchParams?.tab || "preferences";
  redirect(`/profile?tab=${encodeURIComponent(targetTab)}`);
}
