import { useRef, useCallback, useEffect } from 'react';
import { type PostureFeedback } from '../types';

/**
 * Voice coaching via Web Speech API.
 * Throttled so it doesn't spam — speaks at most once every interval.
 * Announces: rep counts, form issues, encouragement.
 */
export function useVoiceCoach() {
  const lastSpokeAt = useRef(0);
  const lastRepAnnounced = useRef(0);
  const lastIssue = useRef('');
  const enabled = useRef(true);

  // Min interval between any speech (ms)
  const MIN_INTERVAL = 4000;
  // Rep announcements can be more frequent
  const REP_INTERVAL = 2000;

  const speak = useCallback((text: string, priority: 'normal' | 'high' = 'normal') => {
    if (!enabled.current) return;
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    const interval = priority === 'high' ? REP_INTERVAL : MIN_INTERVAL;
    if (now - lastSpokeAt.current < interval) return;

    // Cancel any queued speech to keep it snappy
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.15;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;

    // Prefer a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
    lastSpokeAt.current = now;
  }, []);

  const announceRep = useCallback((count: number) => {
    if (count <= 0 || count === lastRepAnnounced.current) return;
    lastRepAnnounced.current = count;

    // Milestone reps get extra hype
    if (count % 10 === 0) {
      speak(`${count} reps! You're on fire!`, 'high');
    } else if (count % 5 === 0) {
      speak(`${count} reps, keep pushing!`, 'high');
    } else {
      speak(`${count}`, 'high');
    }
  }, [speak]);

  const announceIssue = useCallback((feedback: PostureFeedback) => {
    if (feedback.status === 'idle' || feedback.issues.length === 0) return;

    const topIssue = feedback.issues[0];
    // Don't repeat the exact same issue
    if (topIssue === lastIssue.current) return;
    lastIssue.current = topIssue;

    // Strip the dash separator for speech
    const cleaned = topIssue.replace(/—/g, ',').replace(/\s+/g, ' ');
    speak(cleaned);
  }, [speak]);

  const announceGoodForm = useCallback((feedback: PostureFeedback) => {
    if (feedback.status !== 'good' || feedback.formScore < 85) return;
    // Only say it if last issue was something bad
    if (lastIssue.current) {
      speak('Good form, keep it up!');
      lastIssue.current = '';
    }
  }, [speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load voices (some browsers need this)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    if (!enabled.current && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return enabled.current;
  }, []);

  return { announceRep, announceIssue, announceGoodForm, toggle, speak };
}
