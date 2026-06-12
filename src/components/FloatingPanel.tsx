import React, { useState, useEffect, ReactNode } from 'react';

interface FloatingPanelProps {
  title: string;
  icon: string;
  children: ReactNode;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  headerExtra?: ReactNode; // 标题栏右侧额外内容
  className?: string; // 额外类名
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({
  title,
  icon,
  children,
  onClose,
  initialPosition,
  initialSize = { width: 500, height: 400 },
  headerExtra,
  className = '',
}) => {
  const [position, setPosition] = useState({
    x: initialPosition?.x ?? window.innerWidth - initialSize.width - 20,
    y: initialPosition?.y ?? 60,
  });
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 拖动功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('select')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 调整大小功能
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.x),
          y: Math.max(0, e.clientY - dragOffset.y),
        });
      }
      if (isResizing) {
        setSize({
          width: Math.max(300, e.clientX - position.x),
          height: Math.max(200, e.clientY - position.y),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position]);

  return (
    <div
      className={`fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      {/* 标题栏 - 可拖动 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 rounded-t-xl cursor-move select-none flex-shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </span>
          {headerExtra}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0"
          title="关闭"
        >
          ✕
        </button>
      </div>

      {/* 内容区域 - flex-1 + flex flex-col 确保子内容能正确填充 */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {children}
      </div>

      {/* 调整大小手柄 */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={handleResizeMouseDown}
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #94a3b8 50%)',
        }}
      />
    </div>
  );
};

export default FloatingPanel;
