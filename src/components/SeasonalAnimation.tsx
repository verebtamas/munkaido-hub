import { useEffect, useRef } from 'react';

type Season = 'winter' | 'spring' | 'summer' | 'autumn';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

const getSeason = (): Season => {
  const month = new Date().getMonth();
  if (month >= 11 || month <= 1) return 'winter'; // Dec-Feb
  if (month >= 2 && month <= 4) return 'spring'; // Mar-May
  if (month >= 5 && month <= 7) return 'summer'; // Jun-Aug
  return 'autumn'; // Sep-Nov
};

export const SeasonalAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const season = getSeason();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = season === 'winter' ? 100 : 60;

    // Initialize particles based on season
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Reset particle if it goes off screen
        if (particle.y > canvas.height) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;

        // Draw particle based on season
        ctx.globalAlpha = particle.opacity;
        
        switch (season) {
          case 'winter':
            // Snowflakes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          
          case 'spring':
            // Cherry blossoms (pink petals)
            ctx.fillStyle = '#ffb3d9';
            ctx.beginPath();
            ctx.ellipse(particle.x, particle.y, particle.size * 1.5, particle.size, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          
          case 'summer':
            // Fireflies (glowing dots)
            const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);
            gradient.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          
          case 'autumn':
            // Falling leaves (orange/red)
            ctx.fillStyle = particle.size > 2 ? '#ff6b35' : '#ffa500';
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate((particle.x + particle.y) * 0.01);
            ctx.beginPath();
            ctx.ellipse(0, 0, particle.size * 1.5, particle.size * 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [season]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
