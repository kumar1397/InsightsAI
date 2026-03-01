import AppLayout from "@/components/AppLayout";

export default function RootGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}   