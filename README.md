# use-mouse-delta

**A React Hook that allows you to measure the distance from last mouse (or touch) press point. After mouse (or touch) is up, both deltaX and deltaY are reset to 0.**

_Can be used for swiping and dragging objects._

## Basic usage

```js
const { deltaY, deltaX, isMouseDown, goingDown, goingRight } = useMouseDelta(
  'touch'
);
```

Hook accepts one parameter, which is mode. Mode is either `'mouse'`, or `'touch'`, or `'both'`.
If mode is `'mouse'`, then this hook won't work with mobile touch events, and vice versa.
Default value for mode is `'both'`

## Return API

> **Note**
> When mouse is being mentioned, it automatically means that the same applies to touch events as well

- `deltaY: number`: Current mouse delta on Y axis. Zero in press position. Positive when mouse is going down relative to press position, negative when mouse is going up relative to press position
- `deltaX: number`: Current mouse delta on X axis. Zero in press position. Positive when mouse is going right relative to press position, negative when mouse is going left relative to press position
- `isMouseDown: boolean`: `true` when mouse is pressed, `false` when is unpressed
- `touchedElement: string | null`: Classname of element you're currently touching
- `goingDown: boolean`: `true` when mouse is going down, `false` when going up
- `goingRight:boolean`: `true` when mouse is going right, `false` when going left

> **Note**
> You may wonder, why would you need both `deltaY` and `goingDown` (`deltaX` and `goingRight` as well) variables, when you could just check if `deltaY > 0`, since it's positive when going down? The answer is that it's **not always** positive, when mouse is going down. Imagine, you pressed at point A and travelled down 100px. If you decide to move mouse up, that leads to the fact that `deltaY` decreases not from 0, but from 100px, since it's calculating its value relative to press coordinates. And that's why it may be confusing, when you move upwards, but `deltaY` remains positive for some time. `goingDown` solves that problem, if you need to know for sure, whether you're going down or not.

### Example (draggable sheet)

You can take a look at source code [here](https://codesandbox.io/s/suspicious-aryabhata-y9u34t), `draggable-sheet` folder

#### `use-draggable-sheet.ts`

Custom hook that uses calculations made in `useMouseDelta`

```js
import { useRef, useState } from 'react';
import useMouseDelta from '../../../../hooks/use-mouse-delta';

const useDraggableSheet = (
  open: number,
  setOpen: React.Dispatch<React.SetStateAction<number>>
) => {
  const { deltaY, isMouseDown, touchedElement } = useMouseDelta();
  const [showAnimation, setShowAnimation] = useState(false);
  const sheetRef = (useRef < HTMLDivElement) | (null > null);
  const childrenRef = (useRef < HTMLDivElement) | (null > null);
  const scrollHeight = childrenRef.current?.scrollHeight;
  const scrollTop =
    (childrenRef.current?.scrollTop ?? 0) +
    (childrenRef.current?.offsetHeight ?? 0);
  const scrollOnTop =
    (touchedElement !== 'children' ||
      scrollTop === childrenRef.current?.offsetHeight) ??
    0;
  const scrollOnBottom =
    touchedElement !== 'children' || scrollHeight === scrollTop;

  const eventEndHandle = () => {
    setShowAnimation(true);

    if (open === 1 && deltaY < -150 && scrollOnBottom) {
      setOpen(2);
    }

    if (deltaY > 150 && open !== 0 && scrollOnTop) {
      setOpen(prev => prev - 1);
    }
  };

  return {
    deltaY,
    eventEndHandle,
    isMouseDown,
    showAnimation,
    sheetRef,
    childrenRef,
    scrollOnTop,
    scrollOnBottom,
    setShowAnimation,
  };
};

export default useDraggableSheet;
```

#### `index.tsx`

UI component that uses logic decribed in `use-draggable-sheet`

```ts
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import useMouseDelta from '../../hooks/use-mouse-delta';
import getHeight from './lib/get-height';
import getTransform from './lib/get-transform';
import useDraggableSheet from './lib/hooks/use-draggable-sheet';

const DraggableSheetWrapper = styled.div<{
  open: number;
  isMouseDown: boolean;
  position: number;
}>`
  position: absolute;
  width: 100%;
  height: ${({ open }) => (open <= 1 ? '70%' : '100%')};
  border-radius: ${({ open }) => (open === 1 ? '20px 20px 0 0' : '0')};
  background: #fff;
  box-shadow: 0 -10px 120px #546e7a;
  left: 0;
  bottom: 0;
  opacity: ${({ open }) => open === 0 && '0'};
  transition: ${({ isMouseDown }) => (isMouseDown ? '0s' : '0.2s')};
  z-index: 10;
  box-sizing: border-box;
  user-select: none;
  display: flex;
  flex-direction: column;

  .header {
    padding: 20px 20px 0 20px;
  }

  .children {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }
`;

interface Props {
  children: React.ReactNode;
  header?: React.ReactNode;
  open: number;
  setOpen: React.Dispatch<React.SetStateAction<number>>;
}

const DraggableSheet = ({ children, open, setOpen, header }: Props) => {
  const {
    deltaY,
    eventEndHandle,
    isMouseDown,
    showAnimation,
    sheetRef,
    childrenRef,
    scrollOnBottom,
    scrollOnTop,
    setShowAnimation,
  } = useDraggableSheet(open, setOpen);

  return (
    <DraggableSheetWrapper
      open={open}
      isMouseDown={isMouseDown && !showAnimation}
      position={deltaY}
      ref={sheetRef}
      style={{
        transform: `translateY(${getTransform(open, deltaY, scrollOnTop)})`,
        height: getHeight(open, deltaY, scrollOnTop, scrollOnBottom),
      }}
      onMouseDown={() => {
        setShowAnimation(false);
      }}
      onTouchStart={() => {
        setShowAnimation(false);
      }}
      onMouseUp={eventEndHandle}
      onTouchEnd={eventEndHandle}
    >
      {header && <div className="header">{header}</div>}
      <div className="children" ref={childrenRef}>
        {children}
      </div>
    </DraggableSheetWrapper>
  );
};

export default DraggableSheet;
```

#### `getHeight.ts`

```js
const getHeight = (
  open: number,
  deltaY: number,
  scrollOnTop: boolean,
  scrollOnBottom: boolean
) => {
  const isOpen = open === 1 || open === 2;

  if (!isOpen) return '70%';

  if (open === 1) {
    if (deltaY < 0 && scrollOnBottom) return `calc(70% - ${deltaY}px)`;
  } else {
    if (deltaY > 0 && scrollOnTop) return `calc(100% - ${deltaY / 3}px)`;
  }
};

export default getHeight;
```

#### `getTransform.ts`

```js
const getTransform = (open: number, deltaY: number, scrollOnTop: boolean) => {
  const isOpen = open === 1 || open === 2;
  if (!isOpen) return '100%';
  if (deltaY > 0 && scrollOnTop) {
    return deltaY + 'px';
  }
  return '0px';
};
export default getTransform;
```
