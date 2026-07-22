type ConfirmPageProps = {
  params: Promise<{ codigo: string }>;
};

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { codigo } = await params;

  return <h1>Confirmação: {codigo}</h1>;
}
