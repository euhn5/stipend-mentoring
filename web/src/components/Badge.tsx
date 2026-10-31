
type BadgeProps = {
  ok: boolean;
  diffs?: string[];
};

export default function Badge({ ok, diffs = [] }: BadgeProps) {
  if (ok) {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
        일치
      </span>
    );
  }

  return (
    <details className="inline-block">
      <summary className="inline-flex cursor-pointer rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
        불일치
      </summary>

      <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {diffs.length > 0 ? (
          <ul className="list-disc pl-5">
            {diffs.map((diff, index) => (
              <li key={index}>{diff}</li>
            ))}
          </ul>
        ) : (
          <p>차이 내역이 없습니다.</p>
        )}
      </div>
    </details>
  );
}
