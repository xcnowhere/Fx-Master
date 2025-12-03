import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  color: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount; // Usually 1024
    const dataArray = new Uint8Array(bufferLength);
    const waveArray = new Uint8Array(bufferLength);

    // History for 3D waterfall effect
    const history: Uint8Array[] = [];
    const maxHistory = 40;

    const draw = () => {
      // analyser.getByteFrequencyData(dataArray); // Frequency
      analyser.getByteTimeDomainData(waveArray); // Waveform

      // Add current frame to history
      // We clone the array because waveArray is reused by WebAudio
      const currentFrame = new Uint8Array(waveArray);
      history.unshift(currentFrame);
      if (history.length > maxHistory) {
        history.pop();
      }

      // Determine base color
      let r = 100, g = 100, b = 100;
      if (color.includes('red')) { r = 239; g = 68; b = 68; }
      else if (color.includes('orange')) { r = 249; g = 115; b = 22; }
      else if (color.includes('yellow')) { r = 234; g = 179; b = 8; }
      else if (color.includes('green') || color.includes('emerald') || color.includes('lime')) { r = 34; g = 197; b = 94; }
      else if (color.includes('blue')) { r = 59; g = 130; b = 246; }
      else if (color.includes('indigo')) { r = 99; g = 102; b = 241; }
      else if (color.includes('purple')) { r = 168; g = 85; b = 247; }
      else if (color.includes('pink')) { r = 236; g = 72; b = 153; }
      else if (color.includes('teal')) { r = 20; g = 184; b = 166; }

      ctx.fillStyle = '#0f172a'; // Clear with dark bg
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const width = canvas.width;
      
      // Draw History Layers (Back to Front)
      // We iterate backwards so the furthest lines are drawn first
      for (let i = history.length - 1; i >= 0; i--) {
        const frame = history[i];
        const z = i * 15; // Depth spacing
        const scale = 500 / (500 + z); // Perspective projection
        const opacity = Math.max(0.1, 1 - (i / maxHistory));
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.lineWidth = 2 * scale;
        
        let started = false;
        
        // Draw the line for this frame
        // We subsample for performance and smoother lines
        const step = 4; 
        for (let j = 0; j < frame.length; j += step) {
            const v = frame[j] / 128.0; // 0..2, 1 is center
            const yOffset = (v - 1) * 100 * scale; // Amplitude height
            
            // X position: spread across width, centered
            const xPercent = (j / frame.length) - 0.5; // -0.5 to 0.5
            const x3d = xPercent * width * 1.5; 
            
            // Project
            const x2d = centerX + x3d * scale;
            const y2d = centerY + yOffset - (i * 5 * scale); // Tilt up slightly as we go back

            if (!started) {
                ctx.moveTo(x2d, y2d);
                started = true;
            } else {
                ctx.lineTo(x2d, y2d);
            }
        }
        ctx.stroke();
      }

      if (isPlaying) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isPlaying, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={300} 
      className="w-full h-64 rounded-xl border border-slate-700 bg-slate-900 shadow-inner"
    />
  );
};

export default Visualizer;