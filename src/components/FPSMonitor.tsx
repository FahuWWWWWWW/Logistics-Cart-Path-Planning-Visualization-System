import React, { useState, useEffect, useRef } from 'react';

interface FPSMonitorProps {
  isAnimating: boolean;
}

const FPSMonitor: React.FC<FPSMonitorProps> = ({ isAnimating }) => {
  const [fps, setFps] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const [minFps, setMinFps] = useState(Infinity);
  const [frameCount, setFrameCount] = useState(0);
  
  const fpsHistory = useRef<number[]>([]);
  const lastTime = useRef(performance.now());
  const frameId = useRef(0);

  useEffect(() => {
    const measureFPS = (currentTime: number) => {
      const delta = currentTime - lastTime.current;
      
      if (delta >= 1000) { // 每秒计算一次
        const currentFps = Math.round((frameCount * 1000) / delta);
        
        setFps(currentFps);
        setAvgFps(_prev => {
          const newAvg = fpsHistory.current.length === 0 
            ? currentFps 
            : Math.round(fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length);
          return newAvg;
        });
        setMinFps(prev => Math.min(prev, currentFps));
        
        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 60) { // 保留最近60秒
          fpsHistory.current.shift();
        }
        
        setFrameCount(0);
        lastTime.current = currentTime;
      }
      
      setFrameCount(prev => prev + 1);
      frameId.current = requestAnimationFrame(measureFPS);
    };

    frameId.current = requestAnimationFrame(measureFPS);

    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [frameCount]);

  // 重置统计数据
  const handleReset = () => {
    setFps(0);
    setAvgFps(0);
    setMinFps(Infinity);
    setFrameCount(0);
    fpsHistory.current = [];
    lastTime.current = performance.now();
  };

  // FPS颜色指示
  const getFpsColor = () => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };


  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 
                 bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg 
                 border border-gray-700 font-mono text-xs flex items-center gap-3">
      {/* 实时FPS */}
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${getFpsColor()}`}>
          {fps}
        </span>
        <span className="text-gray-400 text-xs">FPS</span>
      </div>
      
      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-700" />
      
      {/* 平均/最低 */}
      <div className="flex gap-2 text-xs">
        <span className="text-gray-400">均:<span className="text-white font-bold ml-1">{avgFps}</span></span>
        <span className="text-gray-400">低:<span className="text-red-400 font-bold ml-1">{minFps === Infinity ? '-' : minFps}</span></span>
      </div>

      {/* 状态指示灯 */}
      <div className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`} 
           title={isAnimating ? '动画中' : '空闲'} />
      
      {/* 重置按钮 */}
      <button
        onClick={handleReset}
        className="text-gray-500 hover:text-white transition-colors ml-1"
        title="重置统计"
      >
        ↻
      </button>
    </div>
  );
};

export default FPSMonitor;
