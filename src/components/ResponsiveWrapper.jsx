export default function ResponsiveWrapper({ children }) {
  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-8">{children}</div>
  );
}
