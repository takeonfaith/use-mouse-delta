import { useEffect, useState } from 'react';

const getY = (e: TouchEvent | MouseEvent) => {
  if (e.type.includes('touch')) {
    const event = e as TouchEvent;
    const touch = event.touches[0] || event.changedTouches[0];
    return touch.clientY;
  } else {
    const event = e as MouseEvent;
    return event.y;
  }
};

const getX = (e: TouchEvent | MouseEvent) => {
  if (e.type.includes('touch')) {
    const event = e as TouchEvent;
    const touch = event.touches[0] || event.changedTouches[0];
    return touch.clientX;
  } else {
    const event = e as MouseEvent;
    return event.x;
  }
};

const useMouseDelta = (mode: 'touch' | 'mouse' | 'both' = 'both') => {
  const [lastY, setLastY] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [deltaY, setDeltaY] = useState(0);
  const [deltaX, setDeltaX] = useState(0);
  const [goingDown, setGoingDown] = useState<boolean | null>(null);
  const [goingRight, setGoingRight] = useState<boolean | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [touchedElement, setTouchedElement] = useState<string | null>(null);
  const isMobile = mode === 'touch' || mode === 'both';
  const isDesktop = mode === 'mouse' || mode === 'both';

  useEffect(() => {
    const onMouseDown = (e: any) => {
      setIsMouseDown(true);
      setLastY(getY(e));
      setLastX(getX(e));
      setTouchedElement(e.target.className);
    };

    const onMouseMove = (e: TouchEvent | MouseEvent) => {
      if (isMouseDown) {
        const dY = getY(e) - lastY;
        const dX = getX(e) - lastX;
        setGoingDown(dY > deltaY);
        setGoingRight(dX > deltaX);
        setDeltaY(dY);
        setDeltaX(dX);
      }
    };

    const onMouseUp = () => {
      setIsMouseDown(false);
      setDeltaY(0);
      setDeltaX(0);
      setGoingDown(null);
      setGoingRight(null);
    };

    if (isDesktop) {
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
    }
    if (isMobile) {
      window.addEventListener('touchstart', onMouseDown);
      window.addEventListener('touchend', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
    }
    return () => {
      if (isDesktop) {
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
      }
      if (isMobile) {
        window.removeEventListener('touchstart', onMouseDown);
        window.removeEventListener('touchend', onMouseUp);
        window.removeEventListener('touchmove', onMouseMove);
      }
    };
  }, [isMouseDown, lastY, deltaY, deltaX]);

  return { deltaY, deltaX, isMouseDown, touchedElement, goingDown, goingRight };
};

export default useMouseDelta;
