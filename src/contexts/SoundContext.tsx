"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setStoredValue } from '@/lib/client-storage';

type SoundType = 'correct' | 'wrong' | 'incorrect' | 'click' | 'complete' | 'tick' | 'tada' | 'keystroke' | 'keyrelease' | 'coin' | 'pop' | 'boing';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const savedMute = localStorage.getItem('sound_muted');
    if (savedMute) {
      setIsMuted(savedMute === 'true');
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      setAudioContext(new AudioContextClass());
    }
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newState = !prev;
      setStoredValue('sound_muted', String(newState));
      return newState;
    });
  };

  const playSound = useCallback((type: SoundType) => {
    if (isMuted || !audioContext) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    switch (type) {
      case 'correct': {
        // Tiếng ding nhẹ dịu dàng, đáng yêu cho bé
        const osc = audioContext.createOscillator();
        const gn = audioContext.createGain();
        osc.connect(gn);
        gn.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // nốt C5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // trượt lên A5 ngọt ngào

        gn.gain.setValueAtTime(0.2, now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'wrong':
      case 'incorrect':
      case 'boing': {
        // Tiếng lò xo "boing" vui nhộn thay thế cho tiếng buzz còi hú đáng sợ
        const osc = audioContext.createOscillator();
        const gn = audioContext.createGain();
        osc.connect(gn);
        gn.connect(audioContext.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        // Quét lên quét xuống nhanh tạo độ nẩy của lò xo
        osc.frequency.linearRampToValueAtTime(320, now + 0.06);
        osc.frequency.linearRampToValueAtTime(200, now + 0.12);
        osc.frequency.linearRampToValueAtTime(280, now + 0.18);
        osc.frequency.linearRampToValueAtTime(220, now + 0.24);

        gn.gain.setValueAtTime(0.25, now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'click':
      case 'pop': {
        // Tiếng bong bóng vỡ "pop" giòn giã đáng yêu cho bé bấm nút
        const osc = audioContext.createOscillator();
        const gn = audioContext.createGain();
        osc.connect(gn);
        gn.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

        gn.gain.setValueAtTime(0.15, now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'keystroke': {
        // Tiếng gõ bàn phím cơ clack giòn giã chân thực
        const pitchSkew = 0.95 + Math.random() * 0.1;
        
        // 1. Tiếng đập đáy nhựa (Bottom-out)
        const osc = audioContext.createOscillator();
        const gn = audioContext.createGain();
        osc.connect(gn);
        gn.connect(audioContext.destination);
        osc.type = 'triangle';
        const baseFreq = (180 + Math.random() * 30) * pitchSkew;
        const decay = 0.065;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + decay);
        gn.gain.setValueAtTime(0.12, now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + decay);
        osc.start(now);
        osc.stop(now + decay + 0.02);

        // 2. Tiếng ồn đục của vỏ phím (Lọc Lowpass Noise)
        const nBufferSize = audioContext.sampleRate * 0.06;
        const nBuffer = audioContext.createBuffer(1, nBufferSize, audioContext.sampleRate);
        const nData = nBuffer.getChannelData(0);
        for (let i = 0; i < nBufferSize; i++) {
          nData[i] = Math.random() * 2 - 1;
        }
        const noise = audioContext.createBufferSource();
        noise.buffer = nBuffer;
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(650 * pitchSkew, now);
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.8);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noise.start(now);
        noise.stop(now + decay + 0.03);

        // 3. Tiếng click đanh nhẹ của switch cơ
        const clickOsc = audioContext.createOscillator();
        const clickFilter = audioContext.createBiquadFilter();
        const clickGain = audioContext.createGain();
        clickOsc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(audioContext.destination);
        
        clickOsc.type = 'sawtooth';
        clickOsc.frequency.setValueAtTime(3200 * pitchSkew, now);
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(3600 * pitchSkew, now);
        clickFilter.Q.setValueAtTime(5, now);
        clickGain.gain.setValueAtTime(0.09, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);
        clickOsc.start(now);
        clickOsc.stop(now + 0.02);
        break;
      }

      case 'keyrelease': {
        // Tiếng phím nảy lên khẽ khàng (Upstroke)
        const pitchSkew = 0.95 + Math.random() * 0.1;
        const upOsc = audioContext.createOscillator();
        const upGain = audioContext.createGain();
        upOsc.connect(upGain);
        upGain.connect(audioContext.destination);
        
        upOsc.type = 'sine';
        const upFreq = (280 + Math.random() * 40) * pitchSkew;
        const upDecay = 0.025;
        upOsc.frequency.setValueAtTime(upFreq, now);
        upGain.gain.setValueAtTime(0.035, now);
        upGain.gain.exponentialRampToValueAtTime(0.001, now + upDecay);
        upOsc.start(now);
        upOsc.stop(now + upDecay + 0.01);
        break;
      }

      case 'coin': {
        // Tiếng nhặt đồng xu vàng leng keng vui tai của Mario
        const playNote = (freq: number, startTime: number, duration: number, vol: number) => {
          const osc = audioContext.createOscillator();
          const gn = audioContext.createGain();
          osc.connect(gn);
          gn.connect(audioContext.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gn.gain.setValueAtTime(vol, startTime);
          gn.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        playNote(987.77, now, 0.08, 0.15); // Nốt B5
        playNote(1318.51, now + 0.08, 0.25, 0.15); // Nốt E6
        break;
      }

      case 'complete':
      case 'tada': {
        // Fanfare chúc mừng rực rỡ và tiếng pháo hoa nổ lốp bốp
        const playN = (freq: number, startTime: number, duration: number, vol: number) => {
          const osc = audioContext.createOscillator();
          const gn = audioContext.createGain();
          osc.connect(gn);
          gn.connect(audioContext.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gn.gain.setValueAtTime(vol, startTime);
          gn.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        // C5 -> E5 -> G5 -> C6 -> E6 -> G6 (hợp âm C major arpeggio vút lên)
        playN(523.25, now, 0.12, 0.2); // C5
        playN(659.25, now + 0.08, 0.12, 0.2); // E5
        playN(783.99, now + 0.16, 0.12, 0.2); // G5
        playN(1046.50, now + 0.24, 0.15, 0.2); // C6
        playN(1318.51, now + 0.32, 0.15, 0.2); // E6
        playN(1567.98, now + 0.40, 0.6, 0.25); // G6 (giữ)
        playN(1046.50, now + 0.40, 0.6, 0.15); // C6 chord
        playN(783.99, now + 0.40, 0.6, 0.1);  // G5 chord

        // Hiệu ứng pháo hoa nổ nhẹ bằng noise burst lúc kết thúc arpeggio
        setTimeout(() => {
          if (!audioContext) return;
          const pNow = audioContext.currentTime;
          const pBufferSize = audioContext.sampleRate * 0.15;
          const pBuffer = audioContext.createBuffer(1, pBufferSize, audioContext.sampleRate);
          const pData = pBuffer.getChannelData(0);
          for (let i = 0; i < pBufferSize; i++) {
            pData[i] = Math.random() * 2 - 1;
          }
          const pNoise = audioContext.createBufferSource();
          pNoise.buffer = pBuffer;
          const pFilter = audioContext.createBiquadFilter();
          pFilter.type = 'bandpass';
          pFilter.frequency.setValueAtTime(1200, pNow);
          const pGain = audioContext.createGain();
          pGain.gain.setValueAtTime(0.04, pNow);
          pGain.gain.exponentialRampToValueAtTime(0.001, pNow + 0.12);
          
          pNoise.connect(pFilter);
          pFilter.connect(pGain);
          pGain.connect(audioContext.destination);
          pNoise.start(pNow);
          pNoise.stop(pNow + 0.15);
        }, 400);
        break;
      }

      case 'tick': {
        // Quick subtle tick for counter
        const osc = audioContext.createOscillator();
        const gn = audioContext.createGain();
        osc.connect(gn);
        gn.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);

        gn.gain.setValueAtTime(0.05, now);
        gn.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }
    }
  }, [isMuted, audioContext]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
