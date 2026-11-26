export default function LoadState({
  error,
  label,
  onRetry,
}: {
  error?: string;
  label: string;
  onRetry: () => void;
}) {
  return error ? (
    <button className="secondary-button" onClick={onRetry}>
      Try again
    </button>
  ) : (
    <p role="status">{label}</p>
  );
}
