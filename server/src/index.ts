import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState, Player, Room, ScoreSheet, SCORE_CATEGORIES, ScoreCategory,
} from './types';
import {
  rollDice, calculateScore, computeTotalScore, computeUpperTotal,
} from './game/yatzyLogic';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// In-memory rooms: code -> Room
const rooms = new Map<string, Room>();
// socketId -> roomCode
const socketRoom = new Map<string, string>();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function createPlayer(id: string, name: string): Player {
  return { id, name, scores: {}, totalScore: 0, upperBonus: false };
}

function initialGameState(roomId: string): GameState {
  return {
    roomId,
    players: [],
    currentPlayerIndex: 0,
    dice: [1, 1, 1, 1, 1],
    heldDice: [false, false, false, false, false],
    rollsLeft: 3,
    phase: 'waiting',
    turn: 0,
    maxTurns: SCORE_CATEGORIES.length, // 13 turns per player
  };
}

function isTurnComplete(player: Player): boolean {
  return SCORE_CATEGORIES.every((cat) => player.scores[cat] !== undefined);
}

function updateWinner(state: GameState): void {
  const [p0, p1] = state.players;
  if (!p0 || !p1) return;
  state.winner = p0.totalScore >= p1.totalScore ? p0.id : p1.id;
}

io.on('connection', (socket: Socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // Create a room
  socket.on('create_room', ({ name }: { name: string }) => {
    const code = generateCode();
    const roomId = uuidv4();
    const player = createPlayer(socket.id, name || 'Player 1');
    const gameState = initialGameState(roomId);
    gameState.players.push(player);

    const room: Room = { id: roomId, code, gameState };
    rooms.set(code, room);
    socketRoom.set(socket.id, code);
    socket.join(code);

    socket.emit('room_created', { code, roomId, playerId: socket.id });
    socket.emit('game_state', gameState);
    console.log(`Room created: ${code} by ${name}`);
  });

  // Join a room
  socket.on('join_room', ({ code, name }: { code: string; name: string }) => {
    const upperCode = code.toUpperCase();
    const room = rooms.get(upperCode);

    if (!room) {
      socket.emit('error', { message: 'Комната не найдена' });
      return;
    }
    if (room.gameState.players.length >= 2) {
      socket.emit('error', { message: 'Комната заполнена' });
      return;
    }
    if (room.gameState.phase !== 'waiting') {
      socket.emit('error', { message: 'Игра уже началась' });
      return;
    }

    const player = createPlayer(socket.id, name || 'Player 2');
    room.gameState.players.push(player);
    socketRoom.set(socket.id, upperCode);
    socket.join(upperCode);

    // Start the game
    room.gameState.phase = 'rolling';
    room.gameState.rollsLeft = 3;
    room.gameState.heldDice = [false, false, false, false, false];

    io.to(upperCode).emit('game_started', { roomId: room.id });
    io.to(upperCode).emit('game_state', room.gameState);
    console.log(`${name} joined room ${upperCode}`);
  });

  // Roll dice
  socket.on('roll_dice', () => {
    const code = socketRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const { gameState } = room;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Не ваш ход' });
      return;
    }
    if (gameState.rollsLeft <= 0) {
      socket.emit('error', { message: 'Нет бросков' });
      return;
    }
    if (gameState.phase !== 'rolling') {
      socket.emit('error', { message: 'Нельзя бросить сейчас' });
      return;
    }

    gameState.dice = rollDice(gameState.dice, gameState.heldDice);
    gameState.rollsLeft -= 1;
    if (gameState.rollsLeft === 0) gameState.phase = 'scoring';

    io.to(code).emit('game_state', gameState);
  });

  // Toggle hold
  socket.on('toggle_hold', ({ index }: { index: number }) => {
    const code = socketRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const { gameState } = room;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;
    if (gameState.rollsLeft === 3) return; // must roll first
    if (gameState.rollsLeft === 0) return; // must score

    gameState.heldDice[index] = !gameState.heldDice[index];
    io.to(code).emit('game_state', gameState);
  });

  // Score a category
  socket.on('score_category', ({ category }: { category: ScoreCategory }) => {
    const code = socketRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const { gameState } = room;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Не ваш ход' });
      return;
    }
    if (gameState.rollsLeft === 3) {
      socket.emit('error', { message: 'Сначала бросьте кубики' });
      return;
    }
    if (currentPlayer.scores[category] !== undefined) {
      socket.emit('error', { message: 'Категория уже заполнена' });
      return;
    }

    // Apply score (0 if using category as scratch)
    const score = calculateScore(category, gameState.dice);
    currentPlayer.scores[category] = score;
    currentPlayer.totalScore = computeTotalScore(currentPlayer.scores);
    currentPlayer.upperBonus = computeUpperTotal(currentPlayer.scores) >= 63;

    // Check if all players finished
    const allDone = gameState.players.every((p) => isTurnComplete(p));
    if (allDone) {
      gameState.phase = 'finished';
      updateWinner(gameState);
      io.to(code).emit('game_state', gameState);
      io.to(code).emit('game_over', {
        winner: gameState.winner,
        players: gameState.players,
      });
      return;
    }

    // Move to next player
    const nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.currentPlayerIndex = nextIndex;
    gameState.rollsLeft = 3;
    gameState.heldDice = [false, false, false, false, false];
    gameState.phase = 'rolling';
    gameState.turn += 1;

    io.to(code).emit('game_state', gameState);
  });

  // Rematch
  socket.on('rematch', () => {
    const code = socketRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const { gameState } = room;

    // Reset scores, keep players
    gameState.players.forEach((p) => {
      p.scores = {} as ScoreSheet;
      p.totalScore = 0;
      p.upperBonus = false;
    });
    gameState.currentPlayerIndex = 0;
    gameState.dice = [1, 1, 1, 1, 1];
    gameState.heldDice = [false, false, false, false, false];
    gameState.rollsLeft = 3;
    gameState.phase = 'rolling';
    gameState.turn = 0;
    gameState.winner = undefined;

    io.to(code).emit('game_state', gameState);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const code = socketRoom.get(socket.id);
    socketRoom.delete(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    io.to(code).emit('player_disconnected', { id: socket.id });
    // Clean up room if empty
    const remaining = room.gameState.players.filter((p) => p.id !== socket.id);
    if (remaining.length === 0) {
      rooms.delete(code);
    }
    console.log(`[-] Disconnected: ${socket.id} from room ${code}`);
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Yatzy server running on port ${PORT}`);
});
