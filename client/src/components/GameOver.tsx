import React from 'react';
import { Player } from '../types/game';
import './GameOver.css';

interface Props {
  winner: string;
  players: Player[];
  myId: string;
  onRematch: () => void;
}

export const GameOver: React.FC<Props> = ({ winner, players, myId, onRematch }) => {
  const iWon = winner === myId;
  const winnerPlayer = players.find((p) => p.id === winner);
  const [p1, p2] = players;

  return (
    <div className="gameover">
      <div className="gameover-card">
        <div className="result-icon">{iWon ? '🏆' : '😔'}</div>
        <h2 className="result-title">{iWon ? 'Вы победили!' : 'Вы проиграли'}</h2>
        <p className="winner-name">{winnerPlayer?.name}</p>

        <div className="scores-final">
          {players.map((p) => (
            <div key={p.id} className={`score-row ${p.id === winner ? 'score-row--winner' : ''}`}>
              <span className="pname">{p.id === myId ? '👤 ' : '🤖 '}{p.name}</span>
              <span className="pscore">{p.totalScore}</span>
            </div>
          ))}
        </div>

        <button className="rematch-btn" onClick={onRematch}>
          🎲 Реванш
        </button>
      </div>
    </div>
  );
};
