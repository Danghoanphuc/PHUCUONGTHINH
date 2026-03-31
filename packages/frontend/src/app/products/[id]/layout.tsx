// Force dynamic rendering for product detail pages
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
