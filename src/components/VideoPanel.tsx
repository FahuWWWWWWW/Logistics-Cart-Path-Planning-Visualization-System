import React, { useState, useRef, useEffect } from 'react';
import FloatingPanel from './FloatingPanel';

interface VideoPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ isVisible, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string>('');
  const [fps, setFps] = useState(0);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const fpsRef = useRef({ frames: 0, lastTime: 0 });

  // FPS计数器 - 使用useEffect监听isCameraOn状态
  useEffect(() => {
    if (!isCameraOn) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      return;
    }

    // 开始FPS计数
    const countFps = () => {
      const now = performance.now();
      fpsRef.current.frames++;

      if (now - fpsRef.current.lastTime >= 1000) {
        setFps(fpsRef.current.frames);
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }

      animationRef.current = requestAnimationFrame(countFps);
    };

    fpsRef.current = { frames: 0, lastTime: performance.now() };
    animationRef.current = requestAnimationFrame(countFps);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [isCameraOn]);

  // 打开摄像头
  const startCamera = async () => {
    try {
      setError('');
      
      const constraints: MediaStreamConstraints = {
        video: selectedCamera 
          ? { 
              deviceId: { exact: selectedCamera },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            }
          : {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        streamRef.current = stream;

        // 等待视频元数据加载完成后播放
        video.onloadedmetadata = () => {
          video.play().then(() => {
            setIsCameraOn(true);
          }).catch((err: any) => {
            console.error('视频播放失败:', err);
            setError(`视频播放失败: ${err.message}`);
          });
        };
      }
    } catch (err: any) {
      console.error('摄像头访问失败:', err);
      setError(`无法访问摄像头: ${err.message}`);
      setIsCameraOn(false);
    }
  };

  // 关闭摄像头
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // 截图功能
  const captureScreenshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `screenshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取摄像头列表
  const getCameras = async () => {
    try {
      // 先请求一次摄像头权限，这样才能获取设备列表
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tempStream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `摄像头 ${devices.filter(d => d.kind === 'videoinput').indexOf(device) + 1}`,
        }));
      
      setCameras(videoDevices);
      
      // 默认选择第一个摄像头
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error('获取摄像头列表失败:', err);
      setError(`获取摄像头列表失败: ${err.message}`);
    }
  };

  // 组件显示时获取摄像头列表
  useEffect(() => {
    if (isVisible && cameras.length === 0) {
      getCameras();
    }
  }, [isVisible]);

  // 面板关闭时自动停止摄像头（断开数据流）
  useEffect(() => {
    if (!isVisible) {
      stopCamera();
    }
  }, [isVisible]);

  // 关闭面板处理函数：先停止摄像头，再关闭面板
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isVisible) return null;

  const headerExtra = isCameraOn ? (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full text-xs">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      直播中 {fps}fps
    </span>
  ) : undefined;

  return (
    <FloatingPanel
      title="视频显示"
      icon="📹"
      onClose={handleClose}
      initialSize={{ width: 500, height: 420 }}
      headerExtra={headerExtra}
      className="flex flex-col"
    >
      {/* 整体内容用 flex col 排列，让视频区域自适应 */}
      <div className="flex flex-col h-full">

      {/* 摄像头选择 */}
      {cameras.length > 1 && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            disabled={isCameraOn}
            className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 视频区域 - flex-1 自适应填充剩余高度 */}
      <div className="relative bg-gray-200 dark:bg-gray-900 flex-1 min-h-0">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm p-4 text-center z-20">
            {error}
          </div>
        )}

        {!isCameraOn && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-3 z-10">
            <span className="text-6xl opacity-20">📹</span>
            <p className="text-sm">点击"打开摄像头"开始视频流</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain relative z-0"
          style={{
            opacity: isCameraOn ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* 隐藏的canvas用于截图 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-2 p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {!isCameraOn ? (
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium text-sm transition-all duration-300 hover:shadow-lg"
          >
            <span>📹</span>
            <span>打开摄像头</span>
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium text-sm transition-all duration-300"
            >
              <span>⏹️</span>
              <span>关闭</span>
            </button>
            <button
              onClick={captureScreenshot}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium text-sm transition-all duration-300"
            >
              <span>📸</span>
              <span>截图</span>
            </button>
          </>
        )}
      </div>
      </div>  {/* end flex flex-col h-full */}
    </FloatingPanel>
  );
};

export default VideoPanel;
