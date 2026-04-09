export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className="min-h-dvh transition-colors duration-200"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {children}
    </div>
  );
}
