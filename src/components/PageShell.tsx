import Container from "./layout/Container";

export default function PageShell({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Container>
      <div className="py-24">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {description ?? "Content coming soon."}
        </p>
      </div>
    </Container>
  );
}
