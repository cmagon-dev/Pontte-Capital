import DetalhesObraComAbas from './DetalhesObraComAbas';

export default function Page({ params }: { params: { id: string } }) {
  return <DetalhesObraComAbas params={params} />;
}
