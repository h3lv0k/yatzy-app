import React from 'react';
import {
  Player, ScoreCategory,
  UPPER_CATEGORIES, LOWER_CATEGORIES, CATEGORY_LABELS,
} from '../types/game';
import { calculateScore, computeUpperTotal } from '../utils/yatzy';
import { categoryIcons } from '../assets/icons/categoryIcons';
import './ScoreCard.css';

interface Props {
  players: Player[];
  myId: string;
  currentPlayerId: string;
  dice: number[];
  rollsLeft: number;
  phase: string;
  onScore: (cat: ScoreCategory) => void;
}

export const ScoreCard: React.FC<Props> = ({
  players, myId, currentPlayerId, dice, rollsLeft, phase, onScore,
}) => {
  const isMyTurn = myId === currentPlayerId;
  const canScore  = isMyTurn && rollsLeft < 3 && phase !== 'finished';

  const renderCell = (player: Player, cat: ScoreCategory) => {
    const scored = player.scores[cat];
    const isMe = player.id === myId;
    const isCurrent = player.id === currentPlayerId;

    if (scored !== undefined) {
      return (
        <td key={cat} className={`cell cell--scored ${scored === 0 ? 'cell--zero' : ''}`}>
          {scored}
        </td>
      );
    }

    if (isMe && canScore) {
      const preview = calculateScore(cat, dice);
      return (
        <td
          key={cat}
          className="cell cell--preview"
          onClick={() => onScore(cat)}
          title={`Записать: ${preview}`}
        >
          <span className="preview-score">{preview}</span>
        </td>
      );
    }

    return <td key={cat} className={`cell cell--empty ${isCurrent ? 'cell--current-turn' : ''}`}>—</td>;
  };

  const renderBonusRow = (player: Player) => {
    const upper = computeUpperTotal(player.scores);
    const remaining = Math.max(0, 63 - upper);
    const hasBonus = player.upperBonus;
    return (
      <tr className="bonus-row">
        <td className="cat-label">Бонус (≥63 → +35)</td>
        {players.map((p) =>
          p.id === player.id ? (
            <td key={p.id} className={`cell ${hasBonus ? 'cell--bonus' : ''}`}>
              {hasBonus ? '+35' : `-${remaining}`}
            </td>
          ) : null
        )}
      </tr>
    );
  };

  return (
    <div className="scorecard">
      <table>
        <thead>
          <tr>
            <th className="cat-header">Категория</th>
            {players.map((p) => (
              <th
                key={p.id}
                className={`player-header ${p.id === currentPlayerId ? 'player-header--active' : ''} ${p.id === myId ? 'player-header--me' : ''}`}
              >
                {p.id === myId ? '👤 ' : '🤖 '}{p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="section-header">
            <td colSpan={players.length + 1}>Верхняя секция</td>
          </tr>
          {UPPER_CATEGORIES.map((cat) => (
            <tr key={cat}>
              <td className="cat-label">
                {categoryIcons[cat] && <img src={categoryIcons[cat]} className="cat-icon" alt="" />}
                {CATEGORY_LABELS[cat]}
              </td>
              {players.map((p) => renderCell(p, cat))}
            </tr>
          ))}
          <tr className="bonus-row">
            <td className="cat-label">Сумма верхней</td>
            {players.map((p) => (
              <td key={p.id} className="cell">
                {computeUpperTotal(p.scores)}
              </td>
            ))}
          </tr>
          <tr className="bonus-row">
            <td className="cat-label">Бонус (+35 если ≥63)</td>
            {players.map((p) => (
              <td key={p.id} className={`cell ${p.upperBonus ? 'cell--bonus' : ''}`}>
                {p.upperBonus ? '+35' : `−${Math.max(0, 63 - computeUpperTotal(p.scores))} до`}
              </td>
            ))}
          </tr>

          <tr className="section-header">
            <td colSpan={players.length + 1}>Нижняя секция</td>
          </tr>
          {LOWER_CATEGORIES.map((cat) => (
            <tr key={cat}>
              <td className="cat-label">
                {categoryIcons[cat] && <img src={categoryIcons[cat]} className="cat-icon" alt="" />}
                {CATEGORY_LABELS[cat]}
              </td>
              {players.map((p) => renderCell(p, cat))}
            </tr>
          ))}

          <tr className="total-row">
            <td className="cat-label">Итого</td>
            {players.map((p) => (
              <td key={p.id} className="cell cell--total">{p.totalScore}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
