import { useEffect, useState } from 'react';

export const HackerSignature = () => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fullText = 'dev by · verebtamas';

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      if (displayText.length === 0) {
        setIsDeleting(false);
        timeout = setTimeout(() => {}, 400);
      } else {
        timeout = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length - 1));
        }, 40);
      }
    } else {
      if (displayText.length === fullText.length) {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 1500);
      } else {
        timeout = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }, 60);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, fullText]);

  return (
    <p className="text-center font-mono text-base hacker-text whitespace-nowrap overflow-hidden border-r-[3px] border-hacker-glow w-fit mx-auto mb-7 min-h-[1.2em] animate-glow">
      <span dangerouslySetInnerHTML={{ __html: displayText || '&nbsp;' }} />
    </p>
  );
};
