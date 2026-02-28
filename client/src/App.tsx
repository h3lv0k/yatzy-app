import React, { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useTelegram } from './hooks/useTelegram';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { ScoreCategory } from './types/game';
import './App.css';

function App() {
  const { state, createRoom, joinRoom, rollDice, toggleHold, scoreCategory, rematch, surrender, leaveRoom } = useSocket();
  const { defaultName, haptic } = useTelegram();

  const { gameState, playerId, roomCode, error, gameOver, connected, opponentDisconnected } = state;

  // Haptic on roll/score
  const handleRoll = () => {
    haptic?.impactOccurred('medium');
    rollDice();
  };

  const handleScore = (cat: ScoreCategory) => {
    haptic?.notificationOccurred('success');
    scoreCategory(cat);
  };

  const handleRematch = () => {
    haptic?.impactOccurred('light');
    rematch();
  };

  // Determine what to show
  const inGame = gameState && gameState.phase !== 'waiting' && gameState.players.length === 2;
  const isFinished = gameOver !== null;

  if (isFinished && gameState && playerId) {
    return (
      <GameOver
        winner={gameOver!.winner}
        players={gameOver!.players}
        myId={playerId}
        onRematch={handleRematch}
        onLeave={leaveRoom}
        error={error}
        surrendered={gameOver!.surrendered}
        opponentLeft={gameOver!.opponentLeft}
      />
    );
  }

  if (inGame && playerId) {
    return (
      <GameBoard
        gameState={gameState!}
        myId={playerId}
        onRoll={handleRoll}
        onToggleHold={toggleHold}
        onScore={handleScore}
        onSurrender={surrender}
        onLeave={leaveRoom}
        error={error}
        opponentDisconnected={opponentDisconnected}
      />
    );
  }

  return (
    <Lobby
      defaultName={defaultName}
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
      roomCode={roomCode}
      error={error}
      connected={connected}
    />
  );
}

export default App;
