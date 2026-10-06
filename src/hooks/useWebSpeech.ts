import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseWebSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export function useWebSpeech(options: UseWebSpeechOptions = {}) {
  const { lang = 'vi-VN', rate = 0.8, pitch = 1.15 } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Khởi tạo SpeechRecognition
  useEffect(() => {
    if (typeof window === 'undefined' || !isSpeechSupported) return;

    const speechWindow = window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setError(null);
    };

    recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSpeechSupported]);

  // Hàm phát âm thanh (Text-To-Speech hoặc audioUrl)
  const speak = useCallback((text: string, customLang?: string, audioUrl?: string) => {
    if (typeof window === 'undefined') return;

    // Dừng tất cả âm thanh đang phát trước đó
    stopSpeaking();

    // Nếu có audioUrl tĩnh, ưu tiên phát file tĩnh đó
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().catch((err) => {
          console.warn('Failed to play static audio, falling back to TTS:', err);
          // Fallback sang TTS nếu play file tĩnh lỗi
          playTts(text, customLang);
        });
        return;
      } catch (err) {
        console.warn('Failed to create Audio object, falling back to TTS:', err);
      }
    }

    // Phát bằng TTS
    playTts(text, customLang);
  }, [lang, rate, pitch]);

  // Hàm thực sự chạy TTS
  const playTts = (text: string, customLang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Lọc bỏ các dấu gạch dưới hoặc ký tự đặc biệt không mong muốn trước khi đọc
    const cleanText = text.replace(/[_]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = customLang || lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    window.speechSynthesis.speak(utterance);
  };

  // Dừng phát âm thanh
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }
  }, []);

  // Bắt đầu nhận diện giọng nói
  const startListening = useCallback((customLang?: string) => {
    if (!isSpeechSupported || !recognitionRef.current) {
      setError('Browser does not support Speech Recognition.');
      return;
    }

    try {
      stopSpeaking(); // Dừng đọc trước khi bắt đầu nghe
      recognitionRef.current.lang = customLang || lang;
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Gặp lỗi khi kích hoạt Micro.');
    }
  }, [isSpeechSupported, lang, stopSpeaking]);

  // Dừng nhận diện giọng nói
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    isSpeechSupported,
    isListening,
    transcript,
    error,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
