import React, { useEffect } from 'react';
import { usePollinationsText } from '@pollinations/react';
import { LoadingSpinner } from './LoadingSpinner';

const PROMPT = "Write a haiku about artificial intelligence. The haiku must have 3 lines, with a 5, 7, 5 syllable structure.";

interface HaikuResultProps {
  onHaikuLoaded: () => void;
}

export const HaikuResult: React.FC<HaikuResultProps> = ({ onHaikuLoaded }) => {
  const text = usePollinationsText(PROMPT);

  useEffect(() => {
    if (text) {
      onHaikuLoaded();
    }
  }, [text, onHaikuLoaded]);

  if (!text) {
    return <LoadingSpinner />;
  }

  return (
    <p className="text-lg md:text-xl whitespace-pre-wrap leading-relaxed font-serif text-gray-200">
      {text}
    </p>
  );
};
