/** Site footer. */
export function Footer() {
  return (
    <footer className="w-full border-t py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1 px-4 text-center text-sm text-muted-foreground">
        <p>
          MetaLens — analisador de metadados e SEO para sites.
        </p>
        <p className="text-xs">
          A pontuação é estimada e transparente, não é a nota oficial do Google.
        </p>
      </div>
    </footer>
  );
}