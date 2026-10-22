import { Suspense } from "react";
import MRFDetail from "../MRFDetail";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string; back?: string }>;
};

async function DetailRoute({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return (
    <MRFDetail
      searchParams={Promise.resolve({ ...query, request: id })}
    />
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<p className="p-8">Loading MRF details...</p>}>
      <DetailRoute {...props} />
    </Suspense>
  );
}
