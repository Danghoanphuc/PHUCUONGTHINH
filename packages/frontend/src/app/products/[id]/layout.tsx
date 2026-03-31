// Allow Next.js to cache normally - cache busting is handled at API level
// when needed (after edits), not globally for all page loads
export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
