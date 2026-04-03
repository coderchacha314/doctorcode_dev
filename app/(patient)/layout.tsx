import BottomNav from "@/components/layout/BottomNav";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-dvh bg-[#0b1628] pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
