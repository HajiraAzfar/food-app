/* Deterministic placeholder art: the same name always gets the same
   gradient, so the grid looks designed rather than random. */
const PALETTES = [
  ['#D2DAA8', '#AEBF7E'],
  ['#E9DCC0', '#D4BC8E'],
  ['#C9D9C4', '#9BB795'],
  ['#E3D3C8', '#C8AB99'],
  ['#D8DCC4', '#B4BC96'],
];

function pick(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return PALETTES[sum % PALETTES.length];
}

export default function Tile({ name, className = '', rounded = 'rounded-t-2xl' }) {
  const [from, to] = pick(name || '?');
  return (
    <div
      className={`flex items-center justify-center ${rounded} ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <span className="font-display text-2xl font-bold text-white/85">
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}