import ViewImportProduct from "./ViewImportProduct";

type ImportViewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ImportViewPage({ params }: ImportViewPageProps) {
  const { id } = await params;
  return <ViewImportProduct importId={id} />;
}
