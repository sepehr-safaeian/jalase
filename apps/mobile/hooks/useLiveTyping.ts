import { useEffect, useRef, useState } from 'react';

interface UseLiveTypingOptions {
  /** کاراکتر در ثانیه */
  speed?: number;
  enabled?: boolean;
}

function splitStableTail(text: string): { stable: string; tail: string } {
  const lastBreak = text.lastIndexOf('\n');
  if (lastBreak < 0) {
    return { stable: '', tail: text };
  }
  return {
    stable: text.slice(0, lastBreak + 1),
    tail: text.slice(lastBreak + 1),
  };
}

export function useLiveTyping(
  targetText: string,
  { speed = 120, enabled = true }: UseLiveTypingOptions = {},
) {
  const [displayText, setDisplayText] = useState(targetText);
  const tailLenRef = useRef(0);
  const stableRef = useRef('');
  const targetRef = useRef(targetText);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  targetRef.current = targetText;

  useEffect(() => {
    if (!enabled) {
      setDisplayText(targetText);
      tailLenRef.current = targetText.length;
      stableRef.current = splitStableTail(targetText).stable;
      return;
    }

    const { stable, tail } = splitStableTail(targetText);

    if (stable !== stableRef.current) {
      stableRef.current = stable;
      tailLenRef.current = 0;
    }

    if (!tail) {
      setDisplayText(stable);
      tailLenRef.current = 0;
      return;
    }

    if (tail.length <= tailLenRef.current) {
      setDisplayText(stable + tail);
      tailLenRef.current = tail.length;
      return;
    }

    const animate = (now: number) => {
      const currentTarget = targetRef.current;
      const { stable: currentStable, tail: currentTail } =
        splitStableTail(currentTarget);

      if (currentStable !== stableRef.current) {
        stableRef.current = currentStable;
        tailLenRef.current = 0;
      }

      if (tailLenRef.current >= currentTail.length) {
        setDisplayText(currentStable + currentTail);
        return;
      }

      if (!lastTickRef.current) {
        lastTickRef.current = now;
      }

      const elapsed = now - lastTickRef.current;
      const chars = Math.max(2, Math.floor((elapsed / 1000) * speed));
      lastTickRef.current = now;

      tailLenRef.current = Math.min(
        tailLenRef.current + chars,
        currentTail.length,
      );
      setDisplayText(
        currentStable + currentTail.slice(0, tailLenRef.current),
      );

      if (tailLenRef.current < currentTail.length) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = 0;
    };
  }, [targetText, speed, enabled]);

  const { tail } = splitStableTail(targetText);
  const isTyping = enabled && tailLenRef.current < tail.length;

  return { displayText, isTyping };
}
