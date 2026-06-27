import { notFound } from "next/navigation";
import MobilePointApp from "../../components/MobilePointApp";
import { getAllRouteSlugs, getPageIdFromSlug, getTitleForPage } from "../../lib/routes";

export function generateStaticParams() {
  return getAllRouteSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pageId = getPageIdFromSlug(slug);

  if (!pageId) {
    return {
      title: "Page Not Found | MobilePoint Inventory"
    };
  }

  return {
    title: `${getTitleForPage(pageId)} | MobilePoint Inventory`
  };
}

export default async function SectionPage({ params }) {
  const { slug } = await params;
  const pageId = getPageIdFromSlug(slug);

  if (!pageId) {
    notFound();
  }

  return <MobilePointApp pageId={pageId} />;
}
