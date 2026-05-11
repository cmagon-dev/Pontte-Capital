import EditarObraPage from './EditarObraPage';

export default function Page({ params }: { params: { id: string } }) {
  return <EditarObraPage params={params} />;
}
