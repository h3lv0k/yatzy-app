import React, { useState } from 'react';
import './Lobby.css';

interface Props {
  defaultName: string;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  roomCode: string | null;
  error: string | null;
  connected: boolean;
}

export const Lobby: React.FC<Props> = ({
  defaultName, onCreateRoom, onJoinRoom, roomCode, error, connected,
}) => {
  const [name, setName] = useState(defaultName);
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim(), name.trim());
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <div className="lobby-icon">🎲</div>
        <h1>Yatzy</h1>
        <p className="lobby-subtitle">Multiplayer · Telegram Mini App</p>
      </div>

      <div className="lobby-card">
        <div className="field">
          <label>Твоё имя</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введи имя..."
            maxLength={20}
          />
        </div>

        <div className="tabs">
          <button
            className={`tab ${tab === 'create' ? 'tab--active' : ''}`}
            onClick={() => setTab('create')}
          >
            Создать игру
          </button>
          <button
            className={`tab ${tab === 'join' ? 'tab--active' : ''}`}
            onClick={() => setTab('join')}
          >
            Подключиться
          </button>
        </div>

        {tab === 'create' ? (
          <div className="tab-content">
            {roomCode ? (
              <div className="room-code-box">
                <p>Поделись кодом с другом:</p>
                <div className="room-code">{roomCode}</div>
                <p className="waiting-text">⏳ Ожидаем второго игрока…</p>
              </div>
            ) : (
              <button
                className="btn btn--primary"
                onClick={handleCreate}
                disabled={!connected || !name.trim()}
              >
                Создать комнату
              </button>
            )}
          </div>
        ) : (
          <div className="tab-content">
            <div className="field">
              <label>Код комнаты</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXX"
                maxLength={5}
                style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '20px', textAlign: 'center' }}
              />
            </div>
            <button
              className="btn btn--primary"
              onClick={handleJoin}
              disabled={!connected || !name.trim() || joinCode.length < 5}
            >
              Войти в комнату
            </button>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}
        {!connected && <div className="error-msg">Подключение к серверу…</div>}
      </div>
    </div>
  );
};
