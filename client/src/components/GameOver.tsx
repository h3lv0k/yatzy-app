import React from 'react';
import { Player } from '../types/game';
import './GameOver.css';

interface Props {
  winner: string;
  players: Player[];
  myId: string;
  onRematch: () => void;
  onLeave: () => void;
  error: string | null;
  surrendered?: string;
  opponentLeft?: boolean;
}

export const GameOver: React.FC<Props> = ({ winner, players, myId, onRematch, onLeave, error, surrendered, opponentLeft }) => {
  const iWon = winner === myId;
  const iSurrendered = surrendered === myId;
  const winnerPlayer = players.find((p) => p.id === winner);

  let resultTitle: string;
  let resultIcon: string;
  if (opponentLeft) {
    resultTitle = 'Противник покинул игру';
    resultIcon = '🏆';
  } else if (iSurrendered) {
    resultTitle = 'Вы сдались';
    resultIcon = '🏳️';
  } else if (iWon) {
    resultTitle = 'Вы победили!';
    resultIcon = '🏆';
  } else {
    resultTitle = 'Вы проиграли';
    resultIcon = '😔';
  }

  return (
    <div className="gameover">
      <div className="gameover-card">
        <div className="result-icon">{resultIcon}</div>
        <h2 className="result-title">{resultTitle}</h2>
        <p className="winner-name">{winnerPlayer?.name}</p>

        <div className="scores-final">
          {players.map((p) => (
            <div key={p.id} className={`score-row ${p.id === winner ? 'score-row--winner' : ''}`}>
              <span className="pname">{p.avatar} {p.name}</span>
              <span className="pscore">{p.totalScore}</span>
            </div>
          ))}
        </div>

        <button className="rematch-btn" onClick={onRematch}>
          🎲 Реванш
        </button>
        <button className="leave-btn" onClick={onLeave}>
          🚪 Выйти в лобби
        </button>
        {error && <p className="gameover-error">{error}</p>}
      </div>
    </div>
  );
};
