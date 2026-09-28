/** Play/pause toggle button used by the clip-based tutorials. */
export function PlayButton({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className="btn-brand" disabled={disabled} onClick={onClick}>
      <i className={`fa-solid ${active ? 'fa-pause' : 'fa-play'}`} />
    </button>
  );
}
