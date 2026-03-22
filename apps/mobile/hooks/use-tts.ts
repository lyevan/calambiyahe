import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { useState, useCallback, useRef } from "react";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stop = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error("Error stopping TTS:", error);
    }
  }, []);

  const speak = useCallback(
    async (text: string, options?: { forceNative?: boolean }) => {
      try {
        // 1. Stop any current speech
        await stop();
        setIsSpeaking(true);

        // 2. If forcing native (or as fallback), use expo-speech
        if (options?.forceNative) {
          const voices = await Speech.getAvailableVoicesAsync();
          const tagalogVoice = voices.find(
            (v) => v.language.startsWith("tl-PH") || v.language === "tl",
          );

          Speech.speak(text, {
            language: "tl-PH",
            voice: tagalogVoice?.identifier,
            pitch: 1.0,
            rate: 1.0,
            onDone: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
          });
          return;
        }

        // 3. Otherwise, use Google Translate TTS for highly fluent Tagalog
        const encodedText = encodeURIComponent(text.slice(0, 200)); // Google TTS has a limit per request
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=tl&client=tw-ob`;

        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
        );

        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSpeaking(false);
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
      } catch (error) {
        console.error("TTS Playback Error:", error);
        setIsSpeaking(false);
        // Fallback to native speech on error
        speak(text, { forceNative: true });
      }
    },
    [stop],
  );

  return {
    speak,
    stop,
    isSpeaking,
  };
}
