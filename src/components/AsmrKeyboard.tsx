'use client';

import React, { useState, useEffect } from 'react';

import { fingerMap } from './keyboardConstants';

interface Props {
  activeKeys: Set<string>; // Bộ các phím hiện đang được gõ xuống thật
  keyboardType: 'mechanical' | 'membrane';
  switchType: 'blue' | 'red' | 'brown';
  is3d: boolean;
  ledMode: 'rgb' | 'warm' | 'cool' | 'off';
  highlightKey: string | null;
}

const keyboardLayout = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Win', 'Alt', ' ', 'Alt', 'Win', 'Menu', 'Ctrl']
];

// Định nghĩa màu ngón tay theo phong cách LED Neon cho ASMR
const ledColors: Record<string, { shadow: string; border: string; bg: string; text: string; idleBg: string; textIdle: string }> = {
  'pinky-left': { shadow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]', border: 'border-red-500', bg: 'bg-red-600', text: 'text-white', idleBg: 'bg-red-500', textIdle: 'text-white' },
  'ring-left': { shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]', border: 'border-orange-500', bg: 'bg-orange-600', text: 'text-white', idleBg: 'bg-orange-500', textIdle: 'text-white' },
  'middle-left': { shadow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]', border: 'border-yellow-500', bg: 'bg-yellow-500', text: 'text-white', idleBg: 'bg-yellow-400', textIdle: 'text-white' },
  'index-left': { shadow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]', border: 'border-green-500', bg: 'bg-green-600', text: 'text-white', idleBg: 'bg-green-500', textIdle: 'text-white' },
  'thumb': { shadow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]', border: 'border-blue-500', bg: 'bg-blue-600', text: 'text-white', idleBg: 'bg-blue-500', textIdle: 'text-white' }, // Spacebar màu xanh dương tươi
  'index-right': { shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]', border: 'border-emerald-500', bg: 'bg-emerald-600', text: 'text-white', idleBg: 'bg-emerald-500', textIdle: 'text-white' },
  'middle-right': { shadow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]', border: 'border-blue-500', bg: 'bg-blue-600', text: 'text-white', idleBg: 'bg-blue-500', textIdle: 'text-white' },
  'ring-right': { shadow: 'shadow-[0_0_12px_rgba(99,102,241,0.4)]', border: 'border-indigo-500', bg: 'bg-indigo-600', text: 'text-white', idleBg: 'bg-indigo-500', textIdle: 'text-white' },
  'pinky-right': { shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]', border: 'border-purple-500', bg: 'bg-purple-600', text: 'text-white', idleBg: 'bg-purple-500', textIdle: 'text-white' },
};

const shiftKeyMap: Record<string, string> = {
  '+': '=', '_': '-', ')': '0', '(': '9', '*': '8', '&': '7', '^': '6',
  '%': '5', '$': '4', '#': '3', '@': '2', '!': '1', '~': '`', '{': '[',
  '}': ']', '|': '\\', ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/'
};

export default function AsmrKeyboard({
  activeKeys,
  keyboardType,
  switchType,
  is3d,
  ledMode,
  highlightKey
}: Props) {
  const [, setRipples] = useState<{ id: string; x: number; y: number; color: string }[]>([]);

  // Lắng nghe sự kiện để tạo hiệu ứng gợn sóng khi activeKeys thay đổi
  useEffect(() => {
    if (activeKeys.size === 0) return;

    const lastPressedKey = Array.from(activeKeys)[activeKeys.size - 1];
    const keyElement = document.getElementById(`asmr-key-${lastPressedKey}`);

    if (keyElement) {
      const rect = keyElement.getBoundingClientRect();
      const parentRect = keyElement.parentElement?.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const x = rect.left - parentRect.left + rect.width / 2;
        const y = rect.top - parentRect.top + rect.height / 2;

        let color = 'rgba(99, 102, 241, 0.4)';
        if (ledMode === 'rgb') {
          const finger = fingerMap[lastPressedKey.toLowerCase()] || 'thumb';
          color = finger === 'pinky-left' ? 'rgba(239, 68, 68, 0.5)' :
            finger === 'ring-left' ? 'rgba(249, 115, 22, 0.5)' :
              finger === 'middle-left' ? 'rgba(234, 179, 8, 0.5)' :
                finger === 'index-left' ? 'rgba(34, 197, 94, 0.5)' :
                  finger === 'index-right' ? 'rgba(16, 185, 129, 0.5)' :
                    finger === 'middle-right' ? 'rgba(59, 130, 246, 0.5)' :
                      finger === 'ring-right' ? 'rgba(99, 102, 241, 0.5)' :
                        finger === 'pinky-right' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(148, 163, 184, 0.5)';
        } else if (ledMode === 'warm') {
          color = 'rgba(245, 158, 11, 0.4)';
        } else if (ledMode === 'cool') {
          color = 'rgba(6, 182, 212, 0.4)';
        }

        const newRipple = {
          id: `${Date.now()}-${Math.random()}`,
          x,
          y,
          color
        };
        setRipples((prev) => [...prev.slice(-15), newRipple]);
      }
    }
  }, [activeKeys, ledMode]);

  const getKeyDisplay = (key: string) => {
    switch (key) {
      case ' ': return 'Space';
      case '⌫': return 'Delete';
      default: return key.toUpperCase();
    }
  };

  // Hàm trả về Class cho LED nền phím (kể cả lúc rảnh và lúc nhấn)
  const getFingerStyle = (key: string, isPressed: boolean, highlight: boolean) => {
    let finger = fingerMap[key.toLowerCase()] || fingerMap[key] || 'thumb';

    // Alt, Win, Menu bên cạnh Spacebar đổi sang màu vàng tươi như DESIGN
    if (key === 'Alt' || key === 'Win' || key === 'Menu') {
      finger = 'middle-left';
    }

    const styles = ledColors[finger];

    // Nếu tắt LED
    if (ledMode === 'off') {
      if (isPressed) return 'bg-slate-600 text-white border-[var(--color-foreground)] shadow-none';
      if (highlight) return 'bg-indigo-300 text-indigo-900 border-[var(--color-foreground)] animate-pulse-fast';
      return 'bg-white border-[var(--color-foreground)] text-slate-700 hover:brightness-105';
    }

    if (isPressed) {
      return `${styles.bg} ${styles.text} border-[var(--color-foreground)] ${styles.shadow}`;
    }
    if (highlight) {
      return `${styles.bg} ${styles.text} border-[var(--color-foreground)] ${styles.shadow} animate-pulse-fast`;
    }
    return `${styles.idleBg} ${styles.textIdle} border-[var(--color-foreground)] hover:brightness-105 transition-all`;
  };

  const isHighlighted = (key: string) => {
    if (!highlightKey) return false;

    const highlightLower = highlightKey.toLowerCase();
    const keyLower = key.toLowerCase();

    if (key === ' ') {
      return highlightLower === ' ' || highlightLower === 'space';
    }

    const isShiftRequired = /[A-ZÀ-ỸĐ]/.test(highlightKey) || highlightKey in shiftKeyMap;
    if (isShiftRequired && key === 'Shift') {
      const baseChar = /[A-ZÀ-ỸĐ]/.test(highlightKey) ? highlightKey.toLowerCase() : shiftKeyMap[highlightKey];
      const finger = fingerMap[baseChar];
      const isLeftHand = finger && finger.includes('left');
      return !!isLeftHand;
    }

    const baseChar = shiftKeyMap[highlightKey] || highlightLower;
    return keyLower === baseChar.toLowerCase();
  };

  // Xác định LED gầm (Underglow) của vỏ bàn phím cơ
  let underglowClass = "";
  let underglowStyle = {};

  if (ledMode === 'rgb') {
    underglowClass = "rgb-keyboard-underglow";
  } else if (ledMode === 'warm') {
    underglowStyle = {
      boxShadow: '0 15px 50px -10px rgba(245, 158, 11, 0.25), 0 0 25px -5px rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.25)'
    };
  } else if (ledMode === 'cool') {
    underglowStyle = {
      boxShadow: '0 15px 50px -10px rgba(6, 182, 212, 0.25), 0 0 25px -5px rgba(6, 182, 212, 0.15)',
      borderColor: 'rgba(6, 182, 212, 0.25)'
    };
  } else {
    underglowStyle = {
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
      borderColor: 'rgba(51, 65, 85, 0.2)'
    };
  }

  return (
    <div
      className={`w-full max-w-5xl mx-auto p-5 rounded-[24px] bg-[var(--color-surface)] border-3 border-[var(--color-foreground)] shadow-[6px_6px_0px_0px_var(--color-foreground)] transition-all duration-700 relative overflow-hidden ${underglowClass}`}
      style={{
        ...underglowStyle,
        ...(is3d ? {
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        } : {})
      }}
    >
      {/* Thẻ Style nhúng CSS Animations chạy LED gầm và nhấp nháy phím */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.4); }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.8s infinite ease-in-out;
        }
        @keyframes rgb-underglow {
          0% { box-shadow: 0 15px 50px -10px rgba(239, 68, 68, 0.3), 0 0 25px -5px rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.25); }
          20% { box-shadow: 0 15px 50px -10px rgba(249, 115, 22, 0.3), 0 0 25px -5px rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.25); }
          40% { box-shadow: 0 15px 50px -10px rgba(16, 185, 129, 0.3), 0 0 25px -5px rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.25); }
          60% { box-shadow: 0 15px 50px -10px rgba(59, 130, 246, 0.3), 0 0 25px -5px rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.25); }
          80% { box-shadow: 0 15px 50px -10px rgba(168, 85, 247, 0.3), 0 0 25px -5px rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.25); }
          100% { box-shadow: 0 15px 50px -10px rgba(239, 68, 68, 0.3), 0 0 25px -5px rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.25); }
        }
        .rgb-keyboard-underglow {
          animation: rgb-underglow 12s infinite ease-in-out;
        }
      `}} />

      {/* Grid Bàn phím ảo */}
      <div
        className="relative z-10 flex flex-col gap-1.5 p-3 rounded-2xl bg-[var(--color-surface-container)] border-2 border-[var(--color-foreground)] shadow-inner"
        style={is3d ? {
          transform: 'rotateX(20deg) scale(0.96)',
          transformOrigin: 'top center',
        } : undefined}
      >
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5 w-full">
            {row.map((key, keyIndex) => {
              const displayKey = getKeyDisplay(key);

              let isPressed = false;
              if (key === ' ') {
                isPressed = activeKeys.has(' ') || activeKeys.has('space');
              } else if (key === '⌫') {
                isPressed = activeKeys.has('backspace');
              } else if (key === 'Shift') {
                isPressed = activeKeys.has('shift') ||
                  (keyIndex === 0 && activeKeys.has('shiftleft')) ||
                  (keyIndex === 11 && activeKeys.has('shiftright'));
              } else {
                isPressed = activeKeys.has(key.toLowerCase());
              }

              const highlight = isHighlighted(key);
              const fingerColorClass = getFingerStyle(key, isPressed, highlight);

              const widthClass =
                key === ' ' ? 'w-[420px]' :
                  key === '⌫' ? 'w-[75px]' :
                    key === 'Tab' ? 'w-[68px]' :
                      key === 'Caps' ? 'w-[78px]' :
                        key === 'Enter' ? 'w-[88px]' :
                          key === 'Shift' ? (keyIndex === 0 ? 'w-[98px]' : 'w-[108px]') :
                            key === 'Ctrl' ? 'w-[55px]' :
                              key === 'Win' ? 'w-[50px]' :
                                key === 'Alt' ? 'w-[50px]' :
                                  'w-[48px] h-[48px]';

              const depthOffset = keyboardType === 'mechanical' ? 'translate-y-[4px]' : 'translate-y-[2px]';
              const shadowHeight = keyboardType === 'mechanical' ? 'shadow-[0_4px_0_0_var(--color-foreground)]' : 'shadow-[0_2px_0_0_var(--color-foreground)]';
              const activeShadow = 'shadow-none';

              return (
                <div
                  key={keyIndex}
                  id={`asmr-key-${key === ' ' ? 'space' : key === '⌫' ? 'backspace' : key === 'Shift' ? (keyIndex === 0 ? 'shiftleft' : 'shiftright') : key.toLowerCase()}`}
                  className={`${widthClass} h-[48px] rounded-xl flex items-center justify-center font-black text-xs select-none transition-all duration-75 border-2 border-[var(--color-foreground)]
                    ${fingerColorClass} 
                    ${is3d ? (isPressed ? `${depthOffset} ${activeShadow}` : `${shadowHeight}`) : (isPressed ? 'translate-y-[2px]' : '')}
                    relative`}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <span className="relative z-10">{displayKey}</span>

                  {is3d && keyboardType === 'mechanical' && !isPressed && (
                    <div
                      className={`absolute bottom-[-5px] left-[10%] right-[10%] h-[5px] rounded-b-md z-0 opacity-80`}
                      style={{
                        backgroundColor: switchType === 'blue' ? '#3b82f6' : switchType === 'red' ? '#ef4444' : '#a16207'
                      }}
                    />
                  )}

                  {is3d && keyboardType === 'membrane' && !isPressed && (
                    <div className="absolute bottom-[-2px] left-[15%] right-[15%] h-[2px] bg-slate-700/40 rounded-b-md z-0" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end gap-3 text-[10px] text-[var(--color-foreground)]/50 font-mono pr-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${activeKeys.has('capslock') ? 'bg-indigo-500 shadow-[0_0_6px_#6366f1]' : 'bg-slate-800'}`} />
          <span>CAPS LOCK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${keyboardType === 'mechanical' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-800'}`} />
          <span>MECHANICAL</span>
        </div>
      </div>
    </div>
  );
}
