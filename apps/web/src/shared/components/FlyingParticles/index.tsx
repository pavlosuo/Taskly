import React, { FC, useEffect, useRef } from "react";
import clsx from "clsx";

interface IFlyingParticles {
  element?: React.RefObject<HTMLElement>;
  isActive?: boolean;
  color?: string;
  stop?: boolean;
  className?: string;
}

type TypeFakes = {
  x: number;
  y: number;
  speed: number;
};

export const FlyingParticles: FC<IFlyingParticles> = ({
  element,
  isActive = true,
  color = "rgba(142, 201, 255, 1)",
  stop = false,
  className,
}) => {
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopSpawningFlakes = () => {
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (stop) {
      stopSpawningFlakes();
    }
  }, [stop]);

  useEffect(() => {
    if (refCanvas.current) {
      let target: HTMLElement;
      if (element?.current) target = element.current;
      else target = refCanvas.current.parentElement as HTMLDivElement;
      const canvas = refCanvas.current;
      const h = target.clientHeight;
      const w = target.clientWidth;
      canvas.height = h;
      canvas.width = w;
    }
  }, [element]);

  useEffect(() => {
    if (refCanvas.current) {
      let target: HTMLElement;

      if (element?.current) target = element.current;
      else target = refCanvas.current.parentElement as HTMLDivElement;

      const canvas = refCanvas.current;
      const h = target.clientHeight;
      const w = target.clientWidth;
      canvas.height = h;
      canvas.width = w;
      const context = canvas.getContext("2d");

      if (context) {
        const flakes: TypeFakes[] = [];
        const addFlakes = () => {
          const x = Math.ceil(Math.random() * w);
          const speed = Math.ceil(Math.random() / 2);
          flakes.push({
            x: x,
            y: canvas.height,
            speed: speed,
          });
        };

        const snowFall = () => {
          context.clearRect(0, 0, canvas.width, canvas.height * 1.05);
          updateSnow();
        };

        const updateSnow = () => {
          for (let i = flakes.length - 1; i >= 0; i--) {
            const oneFlake: TypeFakes = flakes[i];

            context.beginPath();
            context.fillStyle = color;
            context.shadowColor = color;
            context.shadowBlur = 5;

            context.arc(
              oneFlake.x,
              (oneFlake.y -= oneFlake.speed / 5),
              oneFlake.speed,
              1,
              Math.PI * 2,
            );
            context.fill();
            context.closePath();

            if (oneFlake.y < -oneFlake.speed) {
              flakes.splice(i, 1);
            }
          }
        };

        const animate = () => {
          if (isActive) {
            snowFall();
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        const startSpawningFlakes = () => {
          if (!spawnIntervalRef.current) {
            spawnIntervalRef.current = setInterval(() => addFlakes(), 1000);
          }
        };

        const handleVisibilityChange = () => {
          if (document.hidden) {
            stopSpawningFlakes();
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
            }
          } else {
            startSpawningFlakes();
            animate();
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        animate();
        startSpawningFlakes();

        return () => {
          stopSpawningFlakes();
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          );
        };
      }
    }
  }, [isActive, color, stop, element]);
  return (
    <canvas
      className={clsx(className, "pointer-events-none z-1")}
      ref={refCanvas}
    />
  );
};
