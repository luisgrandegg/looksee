import { useEffect, useState, type CSSProperties } from 'react';

/**
 * Demo: a component whose output changes every render.
 * Used to show how to opt a story out of looksee with `parameters.lostPixel.disable`.
 */
export function VolatileCounter(): JSX.Element {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const style: CSSProperties = {
    fontFamily: 'monospace',
    fontSize: 24,
    padding: 16,
    background: '#f3f4f6',
    border: '1px dashed #9ca3af',
    borderRadius: 6,
  };
  return <div style={style}>tick: {n}</div>;
}
