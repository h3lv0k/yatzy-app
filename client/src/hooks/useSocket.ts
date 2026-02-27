import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, ScoreCategory } from '../types/game';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface SocketState {
  connected: boolean;
  gameState: GameState | null;
  roomCode: string | null;
  playerId: string | null;
  error: string | null;
  gameOver: { winner: string; players: GameState['players'] } | null;
  opponentDisconnected: boolean;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    gameState: null,
    roomCode: null,
    playerId: null,
    error: null,
    gameOver: null,
    opponentDisconnected: false,
  });

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState((s) => ({ ...s, connected: true, playerId: socket.id ?? null }));
    });

    socket.on('disconnect', () => {
      setState((s) => ({ ...s, connected: false }));
    });

    socket.on('room_created', ({ code }: { code: string }) => {
      setState((s) => ({ ...s, roomCode: code, error: null }));
    });

    socket.on('game_started', () => {
      setState((s) => ({ ...s, gameOver: null, opponentDisconnected: false }));
    });

    socket.on('game_state', (gameState: GameState) => {
      setState((s) => ({ ...s, gameState, error: null }));
    });

    socket.on('game_over', (data: { winner: string; players: GameState['players'] }) => {
      setState((s) => ({ ...s, gameOver: data }));
    });

    socket.on('player_disconnected', () => {
      setState((s) => ({ ...s, opponentDisconnected: true }));
    });

    socket.on('error', ({ message }: { message: string }) => {
      setState((s) => ({ ...s, error: message }));
      setTimeout(() => setState((s) => ({ ...s, error: null })), 3000);
    });

    return () => { socket.disconnect(); };
  }, []);

  const createRoom = useCallback((name: string) => {
    socketRef.current?.emit('create_room', { name });
  }, []);

  const joinRoom = useCallback((code: string, name: string) => {
    socketRef.current?.emit('join_room', { code, name });
  }, []);

  const rollDice = useCallback(() => {
    socketRef.current?.emit('roll_dice');
  }, []);

  const toggleHold = useCallback((index: number) => {
    socketRef.current?.emit('toggle_hold', { index });
  }, []);

  const scoreCategory = useCallback((category: ScoreCategory) => {
    socketRef.current?.emit('score_category', { category });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave_room');
    setState((s) => ({
      ...s,
      gameState: null,
      roomCode: null,
      gameOver: null,
      opponentDisconnected: false,
      error: null,
    }));
  }, []);

  const rematch = useCallback(() => {
    socketRef.current?.emit('rematch');
  }, []);

  const surrender = useCallback(() => {
    socketRef.current?.emit('surrender');
  }, []);

  return { state, createRoom, joinRoom, rollDice, toggleHold, scoreCategory, rematch, surrender, leaveRoom };
}
