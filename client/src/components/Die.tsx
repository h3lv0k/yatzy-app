import React from 'react';
import './Die.css';

interface Props {
  value: number;
  held: boolean;
  canHold: boolean;
  onToggle: () => void;
  rolling?: boolean;
}

const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

export const Die: React.FC<Props> = ({ value, held, canHold, onToggle, rolling }) => {
  const dots = DOTS[value] || [];

  return (
    <button
      className={`die ${held ? 'die--held' : ''} ${!canHold ? 'die--disabled' : ''} ${rolling ? 'die--rolling' : ''}`}
      onClick={canHold ? onToggle : undefined}
      aria-label={`Кубик ${value}${held ? ' (зафиксирован)' : ''}`}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect rx="12" ry="12" width="100" height="100" className="die-body" />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" className="die-dot" />
        ))}
      </svg>
      {held && <span className="die-label">Держу</span>}
    </button>
  );
};
