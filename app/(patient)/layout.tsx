import BottomNav from "@/components/layout/BottomNav";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-dvh pb-24 transition-colors duration-200" style={{ backgroundColor: "var(--color-bg)" }}>
      {children}
      <BottomNav />
    </div>
  );
}
