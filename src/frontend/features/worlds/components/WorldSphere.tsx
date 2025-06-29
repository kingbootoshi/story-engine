import { useEffect, useRef } from 'react';
import './WorldSphere.styles.css';

/**
 * Props for the WorldSphere component
 */
interface WorldSphereProps {
  seed: string;
  size?: number;
  className?: string;
}

/**
 * A visually appealing 3D sphere representation of a world
 * Uses canvas and procedural generation based on the world's seed
 */
export function WorldSphere({ seed, size = 150, className = '' }: WorldSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  /**
   * Generate a deterministic hash from a string
   */
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  
  /**
   * Generate a color based on the seed
   */
  const generateColor = (seed: string, index: number): string => {
    const hash = hashString(seed + index);
    
    // Create a palette based on the seed
    const hue = (hash % 360);
    const saturation = 70 + (hash % 30);
    const lightness = 40 + (hash % 20);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  /**
   * Initialize and render the sphere
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate a hash from the seed
    const seedHash = hashString(seed);
    
    // Base color for the sphere
    const baseColor = generateColor(seed, 0);
    const accentColor = generateColor(seed, 1);
    const highlightColor = generateColor(seed, 2);
    
    // Center of the sphere
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Radius of the sphere
    const radius = (canvas.width / 2) * 0.85;
    
    // Create gradient for the base sphere
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, 
      centerY - radius * 0.3, 
      0,
      centerX, 
      centerY, 
      radius
    );
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.7, accentColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    
    // Draw the base sphere
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add highlight
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    // Number of patterns to draw (based on seed)
    const patternCount = (seedHash % 5) + 3;
    
    // Draw patterns
    for (let i = 0; i < patternCount; i++) {
      const patternType = (seedHash + i) % 4;
      
      switch (patternType) {
        case 0: // Swirls
          drawSwirls(ctx, centerX, centerY, radius, seedHash + i, highlightColor);
          break;
        case 1: // Rings
          drawRings(ctx, centerX, centerY, radius, seedHash + i, highlightColor);
          break;
        case 2: // Continents
          drawContinents(ctx, centerX, centerY, radius, seedHash + i, highlightColor);
          break;
        case 3: // Dots
          drawDots(ctx, centerX, centerY, radius, seedHash + i, highlightColor);
          break;
      }
    }
    
    // Add outer glow
    const outerGlow = ctx.createRadialGradient(
      centerX, 
      centerY, 
      radius * 0.9,
      centerX, 
      centerY, 
      radius * 1.2
    );
    outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();
    
  }, [seed, size]);
  
  /**
   * Draw swirl patterns on the sphere
   */
  const drawSwirls = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    radius: number, 
    seed: number,
    color: string
  ) => {
    const swirlCount = (seed % 3) + 2;
    const swirlWidth = radius * 0.05;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = swirlWidth;
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < swirlCount; i++) {
      const startAngle = (seed + i * 100) % 360 * Math.PI / 180;
      const endAngle = startAngle + ((seed % 4) + 1) * Math.PI;
      
      ctx.beginPath();
      ctx.arc(
        centerX, 
        centerY, 
        radius * (0.4 + (i * 0.2)),
        startAngle,
        endAngle
      );
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  };
  
  /**
   * Draw ring patterns on the sphere
   */
  const drawRings = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    radius: number, 
    seed: number,
    color: string
  ) => {
    const ringCount = (seed % 3) + 2;
    
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = radius * (0.3 + (i * 0.25));
      const lineWidth = radius * 0.03;
      
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  };
  
  /**
   * Draw continent-like patterns on the sphere
   */
  const drawContinents = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    radius: number, 
    seed: number,
    color: string
  ) => {
    const continentCount = (seed % 4) + 2;
    
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    
    for (let i = 0; i < continentCount; i++) {
      const angle = (seed + i * 137) % 360 * Math.PI / 180;
      const distance = radius * 0.6;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = radius * (0.2 + (seed % 20) / 100);
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Create irregular shape
      for (let j = 0; j < 8; j++) {
        const pointAngle = j * Math.PI / 4 + (seed % 30) / 10;
        const pointDistance = size * (0.7 + Math.sin(j * seed) * 0.3);
        const pointX = x + Math.cos(pointAngle) * pointDistance;
        const pointY = y + Math.sin(pointAngle) * pointDistance;
        
        if (j === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          ctx.lineTo(pointX, pointY);
        }
      }
      
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  };
  
  /**
   * Draw dot patterns on the sphere
   */
  const drawDots = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    radius: number, 
    seed: number,
    color: string
  ) => {
    const dotCount = (seed % 20) + 10;
    
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    
    for (let i = 0; i < dotCount; i++) {
      const angle = (seed + i * 50) % 360 * Math.PI / 180;
      const distance = radius * (0.2 + (seed % 60) / 100 + (i % 5) * 0.1);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const dotSize = radius * (0.02 + (i % 5) * 0.01);
      
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  };

  return (
    <div className={`world-sphere ${className}`} style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} />
    </div>
  );
}