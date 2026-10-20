import { useCallback, useEffect, useRef, useState } from 'react';
import { getMedia } from '../store/media';

/* Accès au micro : dictée (reconnaissance vocale) ou, à défaut, simple enregistrement. */

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => Recognition;

const getRecognition = (): RecognitionCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const canDictate = () => typeof window !== 'undefined' && !!getRecognition();
export const canRecord = () => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export type MicState = 'idle' | 'listening' | 'done' | 'error';

export function useDictation(lang = 'fr-FR') {
  const [state, setState] = useState<MicState>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef('');

  const start = useCallback(() => {
    const Ctor = getRecognition();
    if (!Ctor) { setState('error'); setError('La dictée n’est pas disponible sur ce navigateur.'); return; }
    finalText.current = '';
    setText('');
    setError(null);
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText.current += res[0].transcript;
        else interim += res[0].transcript;
      }
      setText((finalText.current + interim).trim());
    };
    r.onerror = e => {
      setError(e.error === 'not-allowed' ? 'Autorisez le micro pour dicter.' : e.error === 'no-speech' ? 'Je n’ai rien entendu. Réessayez.' : 'La dictée s’est interrompue.');
      setState('error');
    };
    r.onend = () => setState(s => (s === 'listening' ? 'done' : s));
    rec.current = r;
    setState('listening');
    try { r.start(); } catch { setState('error'); setError('Impossible de démarrer le micro.'); }
  }, [lang]);

  const stop = useCallback(() => { rec.current?.stop(); }, []);
  useEffect(() => () => rec.current?.abort(), []);
  return { state, text, setText, error, start, stop };
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const media = useRef<MediaRecorder | null>(null);
  const timer = useRef<number>();

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setBlob(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
        setRecording(false);
        window.clearInterval(timer.current);
      };
      media.current = mr;
      mr.start();
      setBlob(null);
      setSeconds(0);
      setRecording(true);
      timer.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setError('Autorisez le micro pour enregistrer une note vocale.');
    }
  }, []);

  const stop = useCallback(() => media.current?.state === 'recording' && media.current.stop(), []);
  useEffect(() => () => { window.clearInterval(timer.current); if (media.current?.state === 'recording') media.current.stop(); }, []);
  return { recording, blob, seconds, error, start, stop, reset: () => setBlob(null) };
}

/** URL locale d'une photo ou d'une note vocale stockée sur l'appareil. */
export function useMediaUrl(id: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    if (!id) { setUrl(null); return; }
    getMedia(id).then(b => { if (alive && b) { made = URL.createObjectURL(b); setUrl(made); } });
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [id]);
  return url;
}

export const haptic = () => { try { navigator.vibrate?.(8); } catch { /* sans vibration */ } };
