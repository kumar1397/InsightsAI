import AppLayout from "@/components/AppLayout";
import { Toaster } from "react-hot-toast";

export default function RootGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <Toaster position="top-right" />
      {children}
    </AppLayout>
  );
}