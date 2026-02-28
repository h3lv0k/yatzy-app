import React, { useState, useEffect } from 'react';
import { GameState, ScoreCategory } from '../types/game';
import { Die } from './Die';
import { ScoreCard } from './ScoreCard';
import './GameBoard.css';

interface Props {
  gameState: GameState;
  myId: string;
  onRoll: () => void;
  onToggleHold: (i: number) => void;
  onScore: (cat: ScoreCategory) => void;
  onSurrender: () => void;
  onLeave: () => void;
  error: string | null;
  opponentDisconnected: boolean;
}

export const GameBoard: React.FC<Props> = ({
  gameState, myId, onRoll, onToggleHold, onScore, onSurrender, onLeave, error, opponentDisconnected,
}) => {
  const [confirmSurrender, setConfirmSurrender] = useState(false);

  const handleSurrenderClick = () => setConfirmSurrender(true);
  const handleSurrenderConfirm = () => { setConfirmSurrender(false); onSurrender(); };
  const handleSurrenderCancel = () => setConfirmSurrender(false);
  const { players, currentPlayerIndex, dice, heldDice, rollsLeft, phase } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myId;
  const [rolling, setRolling] = useState(false);
  const [waitingForRoll, setWaitingForRoll] = useState(false);
  const [prevDice, setPrevDice] = useState<number[]>(dice);

  // Detect roll — also clears the pending-roll lock
  useEffect(() => {
    if (JSON.stringify(dice) !== JSON.stringify(prevDice)) {
      setRolling(true);
      setWaitingForRoll(false);
      setPrevDice(dice);
      const t = setTimeout(() => setRolling(false), 400);
      return () => clearTimeout(t);
    }
  }, [dice]);

  // Clear waiting flag whenever it's no longer our turn (e.g. after scoring)
  useEffect(() => {
    if (!isMyTurn) setWaitingForRoll(false);
  }, [isMyTurn]);

  const me = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);

  const canRoll = isMyTurn && rollsLeft > 0 && phase === 'rolling' && !waitingForRoll;

  const handleRoll = () => {
    if (!canRoll) return;
    setWaitingForRoll(true);
    onRoll();
  };

  const rollsLabel = rollsLeft === 3
    ? 'Ваш ход — бросьте кубики!'
    : rollsLeft === 0
    ? 'Выберите категорию ↓'
    : `Брошено · Осталось бросков: ${rollsLeft}`;

  return (
    <div className="board">
      {/* Header */}
      <div className="board-header">
        <div className={`turn-indicator ${isMyTurn ? 'turn-indicator--mine' : 'turn-indicator--theirs'}`}>
          {isMyTurn ? '⚡ Ваш ход' : `⏳ Ход: ${currentPlayer?.name}`}
        </div>
        <div className="score-summary">
          <span className="my-score">{me?.avatar ?? '👤'} {me?.totalScore ?? 0}</span>
          <span className="vs">vs</span>
          <span className="opp-score">{opponent?.totalScore ?? 0} {opponent?.avatar ?? '🤖'}</span>
        </div>
        <button className="surrender-btn" onClick={handleSurrenderClick}>🏳️ Сдаться</button>
      </div>

      {confirmSurrender && (
        <div className="surrender-confirm">
          <span>Сдаться и завершить игру?</span>
          <button className="surrender-confirm__yes" onClick={handleSurrenderConfirm}>Да</button>
          <button className="surrender-confirm__no" onClick={handleSurrenderCancel}>Нет</button>
        </div>
      )}

      {opponentDisconnected && (
        <div className="alert alert--warn">
          Противник отключился
          <button className="leave-btn leave-btn--inline" onClick={onLeave}>Выйти в лобби</button>
        </div>
      )}
      {error && <div className="alert alert--error">{error}</div>}

      {/* Dice area */}
      <div className="dice-section">
        {isMyTurn && <p className="rolls-label">{rollsLabel}</p>}
        <div className="dice-row">
          {dice.map((val, i) => (
            <Die
              key={i}
              value={val}
              held={heldDice[i]}
              rolling={rolling && !heldDice[i]}
              canHold={isMyTurn && rollsLeft < 3 && rollsLeft > 0}
              onToggle={() => onToggleHold(i)}
            />
          ))}
        </div>
        {isMyTurn && (
          <button
            className={`roll-btn ${!canRoll ? 'roll-btn--disabled' : ''}`}
            onClick={handleRoll}
            disabled={!canRoll}
          >
            {rollsLeft === 0 ? '🎯 Выберите категорию' : `🎲 Бросить (${rollsLeft} осталось)`}
          </button>
        )}
        {!isMyTurn && (
          <p className="wait-text">⏳ Ждём хода противника…</p>
        )}
      </div>

      {/* Score table */}
      <div className="scorecard-section">
        <ScoreCard
          players={players}
          myId={myId}
          currentPlayerId={currentPlayer?.id ?? ''}
          dice={dice}
          rollsLeft={rollsLeft}
          phase={phase}
          onScore={onScore}
        />
      </div>
    </div>
  );
};
