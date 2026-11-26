import Button from './Button';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total } = meta;
  return (
    <nav className="mt-4 flex flex-col gap-2 text-[13px] text-ink-muted sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <span>
        Page <strong className="font-medium text-ink">{page}</strong> of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={!meta.hasNext} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
