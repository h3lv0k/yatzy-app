import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
      };
    };
  }
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  const user = tg?.initDataUnsafe?.user;
  const defaultName = user
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    : '';

  return {
    tg,
    user,
    defaultName,
    haptic: tg?.HapticFeedback,
  };
}

export function useTelegramMainButton(
  text: string,
  onClick: () => void,
  visible: boolean,
) {
  const tg = window.Telegram?.WebApp;
  const cbRef = useRef(onClick);
  cbRef.current = onClick;

  useEffect(() => {
    if (!tg) return;
    const handler = () => cbRef.current();
    if (visible) {
      tg.MainButton.setText(text);
      tg.MainButton.onClick(handler);
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
      tg.MainButton.offClick(handler);
    }
    return () => {
      tg.MainButton.offClick(handler);
      tg.MainButton.hide();
    };
  }, [tg, text, visible]);
}
