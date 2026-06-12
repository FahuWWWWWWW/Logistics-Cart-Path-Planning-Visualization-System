import React, { useState, useCallback, useRef, useEffect } from 'react';
import GridMap from './components/GridMap';
import ControlPanel from './components/ControlPanel';
import SerialPanel from './components/SerialPanel';
import ProtocolPanel from './components/ProtocolPanel';
import VideoPanel from './components/VideoPanel';
import FloatingLogPanel from './components/FloatingLogPanel';
import FPSMonitor from './components/FPSMonitor';
import { SerialManager } from './utils/serial';
import { aStar, createGridWithDilation, planPathRobust } from './utils/astar';
import {
  parseTaskCode, calcRingScore, compareWithTask,
  PlaceRecord, GrabRecord
} from './utils/taskCode';
import { MapConfig, GridCoord, PathResult, DrawMode, SerialFrame, LogEntry, Zone, RaceStep } from './types';
import './index.css';

// ==================== 场地常量 ====================
const GRID_SIZE_MM = 50; // 每格 50mm
const COLS = 48; // 2400mm / 50mm = 48格
const ROWS = 48;
const CAR_WIDTH = 300;   // 小车宽度 300mm
const CAR_HEIGHT = 300;  // 小车长度 300mm
const CAR_SAFE_RADIUS = 150; // 安全半径 150mm（半宽）
const DILATION_RADIUS = Math.ceil(CAR_SAFE_RADIUS / GRID_SIZE_MM); // 3格

// ==================== 比赛流程关键点坐标 ====================
// 所有坐标单位：格 (每格50mm)
// 关键点为车体中心坐标，需在所有膨胀区域外（车体300×300mm边框不得进入禁区）
// 膨胀半径3格 = 150mm = 车体半宽
//
// 区域边界与推荐停靠点：
// 原料区/粗加工区/暂存区不参与膨胀（noDilationZoneLabels），车体可紧贴但不可进入
// - 原料区：y:0~1，停靠 y=5（车头顶到y=2，距原料区边缘1格≈50mm）
// - 粗加工区：y:45~47，停靠 y=42（车位底沿到y=45，距粗加工区边缘0格）
// - 暂存区：x:0~2，停靠 x=6（车体左沿到x=3，距暂存区边缘1格≈50mm）
const WAYPOINTS = {
  parking1: { x: 44, y: 3 },       // 启停区1中心
  parking2: { x: 44, y: 44 },      // 启停区2中心
  qrcode: { x: 43, y: 24 },        // 二维码板附近（会根据qrBoardY动态调整）
  material: { x: 24, y: 5 },       // 原料区下方（y=5，车头顶到y=2，紧贴原料区）
  roughProcess: { x: 24, y: 41 },  // 粗加工区上方（y=41，车位底沿到y=44，紧贴粗加工区）
  tempStorage: { x: 6, y: 24 },    // 暂存区右侧（x=6，紧贴暂存区）
};

// ==================== 比赛流程定义 ====================
// 根据工创赛规则：启停区→二维码板→原料区→粗加工区→暂存区→原料区→粗加工区→暂存区→启停区
const RACE_STEPS: RaceStep[] = [
  { name: '启停区→二维码区', action: '读取任务码', from: 'parking1', to: 'qrcode', color: '#6366f1' },
  { name: '二维码区→原料区', action: '前往抓取第一批物料', from: 'qrcode', to: 'material', color: '#ec4899' },
  { name: '原料区→粗加工区', action: '运送第一批物料', from: 'material', to: 'roughProcess', color: '#f59e0b' },
  { name: '粗加工区→暂存区', action: '转运第一批物料', from: 'roughProcess', to: 'tempStorage', color: '#10b981' },
  { name: '暂存区→原料区', action: '返回抓取第二批物料', from: 'tempStorage', to: 'material', color: '#ec4899' },
  { name: '原料区→粗加工区', action: '运送第二批物料', from: 'material', to: 'roughProcess', color: '#f59e0b' },
  { name: '粗加工区→暂存区', action: '码垛第二批物料', from: 'roughProcess', to: 'tempStorage', color: '#8b5cf6' },
  { name: '暂存区→启停区', action: '完成任务返回', from: 'tempStorage', to: 'parking1', color: '#3b82f6' },
];

// ==================== 候选障碍物位置（通道正中央）====================
// 障碍物为 φ50mm 圆柱体（占1格），放在通道正中间起到"拦路"作用
// 注意：原料区/粗加工区/暂存区/加工台均参与3格膨胀，部分位置在膨胀区内不可用
// 原料区：x:21~26,y:0~1，膨胀后禁区x:18~29,y:0~4
// 暂存区：x:0~2,y:18~29，膨胀后禁区x:0~5,y:15~32
// 粗加工区：x:18~29,y:45~47，膨胀后禁区x:15~32,y:42~50
// 加工台1：x:11~19,y:11~19，膨胀后禁区x:8~22,y:8~22
// 加工台2：x:28~36,y:11~19，膨胀后禁区x:25~39,y:8~22
// 加工台3：x:11~19,y:28~36，膨胀后禁区x:8~22,y:25~39
// 加工台4：x:28~36,y:28~36，膨胀后禁区x:25~39,y:25~39
const OBSTACLE_CANDIDATES: GridCoord[] = [
  // ===== 左侧竖直通道（暂存区膨胀后仅x=6可通行）=====
  { x: 6, y: 5 },     // 左上通道段，暂存区膨胀上方(y<15)
  { x: 6, y: 10 },    // 左上区域，原料区与暂存区之间
  // 注意：y:15~32被暂存区膨胀覆盖，左侧无可用候选位
  { x: 6, y: 34 },    // 左侧通道下段，暂存区膨胀下方(y>32)
  { x: 6, y: 40 },    // 左侧通道下段，粗加工区膨胀上方(y<42)

  // ===== 中间竖直通道（x≈24，加工台之间）=====
  { x: 24, y: 10 },   // 中间通道上段（原料区膨胀y≤4上方）
  { x: 24, y: 24 },   // 中间通道中心（加工台1/2膨胀y≤22和加工台3/4膨胀y≥25之间的间隙！仅y=23~24可通行）
  { x: 24, y: 40 },   // 中间通道下段（粗加工区膨胀y≥42上方）

  // ===== 右侧竖直通道（x≈42）=====
  { x: 42, y: 10 },   // 右侧通道上段
  { x: 42, y: 24 },   // 右侧通道中段（二维码区旁）
  { x: 42, y: 40 },   // 右侧通道下段

  // ===== 上方水平通道（y≈5）=====
  { x: 15, y: 5 },    // 上方通道左段（原料区膨胀x≤29左侧安全）
  { x: 35, y: 5 },    // 上方通道右段（原料区膨胀x≥18右侧安全）

  // ===== 中间水平通道（y≈24，唯一安全的横向通道！）=====
  { x: 12, y: 24 },   // 中间通道左段（暂存区膨胀x≤5右侧，加工台1/3膨胀x≤22左侧，x:6~22可通行）
  { x: 38, y: 24 },   // 中间通道右段（加工台2/4膨胀x≥25右侧）

  // ===== 下方水平通道（y≈43）=====
  { x: 10, y: 43 },   // 下方通道左段（粗加工区膨胀x≥15左侧）
  { x: 35, y: 43 },   // 下方通道右段（粗加工区膨胀x≤32右侧）
];

// ==================== 创建标准工创赛场地配置 ====================
const createStandardConfig = (startParking: 'parking1' | 'parking2' = 'parking1'): MapConfig => {
  const zones: Zone[] = [
    // ===== 四个加工台（中央作业区，不可触碰障碍物）=====
    // 根据用户提供的精确尺寸：
    // - 单块尺寸：450 × 450（9格 × 9格）
    // - 水平/垂直间距：400（8格）
    // - 距离边缘：550mm（11格）
    { x: 11, y: 11, width: 9, height: 9, label: '加工台1', color: '#fef3c7', isObstacle: true },
    { x: 28, y: 11, width: 9, height: 9, label: '加工台2', color: '#fef3c7', isObstacle: true },
    { x: 11, y: 28, width: 9, height: 9, label: '加工台3', color: '#fef3c7', isObstacle: true },
    { x: 28, y: 28, width: 9, height: 9, label: '加工台4', color: '#fef3c7', isObstacle: true },

    // ===== 启停区（车体可进入）=====
    // 注意：启停区视觉绘制已移至 GridMap 组件（根据 start/end 动态绘制），此处不再重复添加
    // 保留 parkingZones 供其他逻辑使用（如需要）

    // ===== 二维码区（车体需进入读取任务码！不可设为障碍物）=====
    // 右侧整个纵向区域都可进入，二维码板在该区域内随机摆放
    // 二维码板：约200mm长（4格），沿右侧纵向随机摆放，中心Y坐标1100-1300mm（22-26格）
    { x: COLS - 8, y: 0, width: 8, height: 48, label: '二维码区', color: '#e0e7ff', isObstacle: false },

    // ===== 功能区域（车体行驶时边框不得进入！仅到达边界执行操作）=====
    // 原料区：φ300mm转盘，仅80mm伸入场地内（顶部中央偏右）
    // 转盘中心在场外约70mm处，场内可见为弓形：宽约265mm(5.3格)，深约80mm(1.6格)
    { x: 21, y: 0, width: 6, height: 2, label: '原料区', color: '#fecaca', isObstacle: true },
    // 暂存区：150×580mm（图中标注），左侧边垂直居中
    // 深150mm(3格)，长580mm(~12格)，中心y=24与场地中心对齐
    { x: 0, y: 18, width: 3, height: 12, label: '暂存区', color: '#a7f3d0', isObstacle: true },
    // 粗加工区：底部中央，150mm深（3格）
    // 宽600mm(12格)，高150mm(3格)，横向居中
    { x: 18, y: ROWS - 3, width: 12, height: 3, label: '粗加工区', color: '#c4b5fd', isObstacle: true },
  ];

  // 启停区（供逻辑使用，视觉绘制已移至 GridMap）
  const parkingZones: Zone[] = [];

  return {
    rows: ROWS,
    cols: COLS,
    cellSize: 16,
    gridSizeMm: GRID_SIZE_MM,
    fieldWidth: 2400,
    fieldHeight: 2400,
    carWidth: CAR_WIDTH,
    carHeight: CAR_HEIGHT,
    carSafeRadius: CAR_SAFE_RADIUS,
    zones,
    obstacles: [],
    start: WAYPOINTS[startParking],
    end: WAYPOINTS[startParking],
    parkingZones,
    startParking,
  };
};

// ==================== 组件 ====================
const App: React.FC = () => {
  const [config, setConfig] = useState<MapConfig>(createStandardConfig());
  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [carPosition, setCarPosition] = useState<GridCoord | null>(null);
  const [carAngle, setCarAngle] = useState<number | undefined>(undefined); // 车体角度（度）
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [racePathResults, setRacePathResults] = useState<PathResult[]>([]);
  const [raceStepIndex, setRaceStepIndex] = useState(0);
  const [startParking, setStartParking] = useState<'parking1' | 'parking2'>('parking1');
  const [rightPanelTab, setRightPanelTab] = useState<'serial' | 'protocol'>('serial');
  const [showLogs, setShowLogs] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [canContinue, setCanContinue] = useState(false); // 是否可以继续动画（停止后）
  // 主题切换（light → dark → system → light）
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'dark'
  );
  const [taskCode, setTaskCode] = useState<string>(''); // 任务码
  const [taskInfo, setTaskInfo] = useState<any>(null); // 解析后的任务信息
  const [qrBoardY, setQrBoardY] = useState<number>(24); // 二维码板Y坐标（22-26格范围内）
  const [wheelSpeeds, setWheelSpeeds] = useState<number[]>([]); // 四个轮子转速（RPM）
  // 比赛统计（不模拟评分，由上位机根据实际结果计算）
  const [stats, setStats] = useState<{
    grabCount: number;       // 夹取成功次数
    placeCount: number;      // 放置成功次数
    ringScore: number;       // 环数分（由PLACED指令中的ring_level查表计算）
    total: number;          // 总分 = grabCount*10 + placeCount*10 + ringScore
    timeStart: number;
    timeEnd: number;
    grabRecords: GrabRecord[];  // 抓取记录明细
    placeRecords: PlaceRecord[]; // 放置记录明细
  }>({
    grabCount: 0,
    placeCount: 0,
    ringScore: 0,
    total: 0,
    timeStart: 0,
    timeEnd: 0,
    grabRecords: [],
    placeRecords: [],
  });

  const serialManagerRef = useRef(new SerialManager());
  const serialManager = serialManagerRef.current;
  const stopAnimationRef = useRef(false);

  // 主题切换效果
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 系统主题变化监听
  useEffect(() => {
    if (theme !== 'system') return;
    
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  // 注册串口日志回调
  React.useEffect(() => {
    serialManager.onLog((entry) => {
      setLogs(prev => [...prev, entry].slice(-500));
    });
  }, [serialManager]);

  // 处理任务码变化
  const handleTaskCodeChange = useCallback((code: string) => {
    setTaskCode(code);
    const info = parseTaskCode(code);
    setTaskInfo(info);
    if (info && info.valid) {
      console.log('任务码解析成功：', info);
    } else if (info) {
      console.warn('任务码解析失败：', info.error);
    }
  }, []);

  // 随机生成二维码板位置（Y坐标在22-26格范围内）
  const handleRandomQrPosition = useCallback(() => {
    const minY = 22;
    const maxY = 26;
    const randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
    setQrBoardY(randomY);
    console.log(`二维码板位置已随机生成：Y=${randomY}格（${randomY * 50}mm）`);
  }, []);

  // 设置二维码板位置（用于串口指令）
  const handleSetQrPosition = useCallback((y: number) => {
    if (y < 22 || y > 26) {
      console.warn(`二维码板Y坐标${y}超出合法范围（22-26格），已自动修正`);
      y = Math.max(22, Math.min(26, y));
    }
    setQrBoardY(y);
    console.log(`二维码板位置已设置：Y=${y}格（${y * 50}mm）`);
  }, []);

  // 动态更新二维码路径点
  React.useEffect(() => {
    WAYPOINTS.qrcode = { x: 43, y: qrBoardY };
    console.log(`二维码路径点已更新：(${WAYPOINTS.qrcode.x}, ${WAYPOINTS.qrcode.y})`);
  }, [qrBoardY]);

  // 动态更新二维码板显示位置
  React.useEffect(() => {
    setConfig(prev => {
      const newZones = [...prev.zones];
      const qrIndex = newZones.findIndex(z => z.label === '二维码区');
      if (qrIndex !== -1) {
        // 更新二维码区的Y坐标，使区域覆盖板子位置
        newZones[qrIndex] = {
          ...newZones[qrIndex],
          y: Math.max(0, qrBoardY - 4), // 板子上方留一些空间
          height: 8, // 高度8格，覆盖板子周围区域
        };
      }
      return { ...prev, zones: newZones };
    });
  }, [qrBoardY]);

  // 处理串口数据帧
  const handleReceiveFrame = useCallback((frame: SerialFrame) => {
    const d = frame.data;
    const ftype = frame.type as string;
    
    // STATUS - 更新小车位置
    if (ftype === 'STATUS' && d.x !== undefined) {
      setCarPosition({ x: d.x, y: d.y });
      // 解析角度（下位机上报，单位：度）
      if (d.angle !== undefined) {
        setCarAngle(Number(d.angle));
      }
    }
    
    // OBSTACLE - 更新障碍物
    if (ftype === 'OBSTACLE' && (d.obs || d.obstacles)) {
      const obsList = d.obs || d.obstacles;
      const obstacles = obsList.map((obs: any) => ({ x: obs.x, y: obs.y }));
      setConfig(prev => ({ ...prev, obstacles }));
    }
    
    // PATH_RESULT - 更新路径
    if (ftype === 'PATH_RESULT' && d.path) {
      const path = d.path.map((node: any) => ({ x: node.x, y: node.y }));
      setPathResult({
        path,
        length: path.length,
        realLength: (d.length_mm || d.length || path.length) * (d.length_mm ? 1 : config.gridSizeMm),
        nodeCount: d.node_count || d.nodeCount || path.length,
        timeCost: d.time_cost || d.timeCost || 0,
        algorithm: d.algorithm || 'A*',
      });
    }
    
    // ARRIVED - 到达通知（只记录到达，评分由上位机根据实际结果比对计算）
    if (ftype === 'ARRIVED' && d.step !== undefined) {
      setRaceStepIndex(d.step + 1);
      // 原料区到达：等待小车上报实际抓取结果（GRABBED指令）
      if (d.step === 1 || d.step === 4) {
        console.log(`[统计] 到达原料区（步骤${d.step}），等待抓取结果...`);
      }
      // 暂存区到达：等待小车上报实际放置结果（PLACED指令）
      if (d.step === 3 || d.step === 6) {
        console.log(`[统计] 到达暂存区（步骤${d.step}），等待放置结果...`);
      }
    }

    // TASK_CODE - 下位机上报任务码原始内容（从二维码读取）
    if (ftype === 'TASK_CODE' && d.raw) {
      const rawCode = String(d.raw).trim();
      console.log(`[串口] 收到任务码：${rawCode}`);
      handleTaskCodeChange(rawCode);
    }

    // GRABBED - 小车上报抓取结果（新版扩展协议）
    if (ftype === 'GRABBED') {
      const success = d.success === 1 || d.success === undefined || d.success === true;
      const batch = d.batch || 1;
      const materialIdx = d.material_idx !== undefined ? d.material_idx : d.materialIdx !== undefined ? d.materialIdx : 0;
      const colorId = d.color_id || d.colorId || 0;

      if (success) {
        const grabRecord: GrabRecord = {
          batch,
          materialIdx,
          actualColorId: colorId,
          expectedColorId: taskInfo && taskInfo.valid
            ? (batch === 1 ? taskInfo.batch1.colorIds : taskInfo.batch2.colorIds)[materialIdx] || 0
            : 0,
          timestamp: Date.now(),
        };

        setStats(prev => {
          const nextGrabRecords = [...prev.grabRecords, grabRecord];
          const next = {
            ...prev,
            grabCount: prev.grabCount + 1,
            grabRecords: nextGrabRecords,
          };
          next.total = next.grabCount * 10 + next.placeCount * 10 + next.ringScore;
          return next;
        });

        // 颜色比对
        const expectedColorId = grabRecord.expectedColorId;
        const colorMatch = expectedColorId > 0 ? colorId === expectedColorId : true;
        console.log(`[统计] 夹取成功！批次=${batch} 序号=${materialIdx + 1} 颜色=${colorId} ${colorMatch ? '✅' : '❌颜色不符(期望' + expectedColorId + ')'}`);
      } else {
        console.log(`[统计] 夹取失败 批次=${batch} 序号=${materialIdx + 1}`);
      }
    }

    // PLACED - 小车上报放置结果（新版扩展协议，含靶环级别用于计算环数分）
    if (ftype === 'PLACED') {
      const success = d.success === 1 || d.success === undefined || d.success === true;
      const batch = d.batch || 1;
      const materialIdx = d.material_idx !== undefined ? d.material_idx : d.materialIdx !== undefined ? d.materialIdx : 0;
      const zone = d.zone === 'temp' || d.zone === '暂存区' ? 'temp' : 'rough';
      const ringId = d.ring_id || d.ringId || d.position || 1;
      const ringLevel = d.ring_level || d.ringLevel || 0;
      const colorId = d.color_id || d.colorId || 0;

      // 上位机独立计算环数分（与下位机上报的ring_score互相比对）
      const computedRingScore = calcRingScore(ringLevel);
      const reportedRingScore = d.ring_score || d.ringScore || 0;

      // 获取任务码要求的信息
      const expectedColorId = taskInfo && taskInfo.valid
        ? (batch === 1 ? taskInfo.batch1.colorIds : taskInfo.batch2.colorIds)[materialIdx] || 0
        : 0;
      const expectedRingId = taskInfo && taskInfo.valid
        ? (batch === 1 ? taskInfo.batch1.positions : taskInfo.batch2.positions)[materialIdx] || 0
        : 0;

      if (success) {
        const placeRecord: PlaceRecord = {
          batch,
          materialIdx,
          zone,
          ringId,
          ringLevel,
          ringScore: computedRingScore,
          actualColorId: colorId,
          expectedColorId,
          expectedZone: zone, // 任务码不区分rough/temp，两者编号一致
          expectedRingId,
          timestamp: Date.now(),
        };

        // 与任务码比对
        const comparison = taskInfo && taskInfo.valid
          ? compareWithTask(placeRecord, taskInfo)
          : { colorMatch: true, ringIdMatch: true, allMatch: true };

        setStats(prev => {
          const nextPlaceRecords = [...prev.placeRecords, placeRecord];
          const next = {
            ...prev,
            placeCount: prev.placeCount + 1,
            ringScore: prev.ringScore + computedRingScore,
            placeRecords: nextPlaceRecords,
          };
          next.total = next.placeCount * 10 + next.grabCount * 10 + next.ringScore;
          return next;
        });

        console.log(
          `[统计] 放置成功！批次=${batch} 序号=${materialIdx + 1} 区域=${zone === 'rough' ? '粗加工区' : '暂存区'} 圆环=${ringId} 靶环=${ringLevel}环 环数分=${computedRingScore} ` +
          `上位机计算=${computedRingScore} 下位机上报=${reportedRingScore} ${computedRingScore === reportedRingScore ? '✅一致' : '⚠️不一致'} ` +
          `颜色${comparison.colorMatch ? '✅' : '❌'} 位置${comparison.ringIdMatch ? '✅' : '❌'}`
        );
      } else {
        console.log(`[统计] 放置失败 批次=${batch} 序号=${materialIdx + 1} 区域=${zone === 'rough' ? '粗加工区' : '暂存区'}`);
      }
    }

    // SET_QR_POSITION - 设置二维码位置（比赛现场指令）
    if (ftype === 'SET_QR_POSITION' && d.y !== undefined) {
      handleSetQrPosition(d.y);
    }
  }, [config.gridSizeMm, handleSetQrPosition, handleTaskCodeChange, taskInfo]);
  const handleStartParkingChange = useCallback((parking: 'parking1' | 'parking2') => {
    setStartParking(parking);
    setConfig(prev => ({
      ...prev,
      start: WAYPOINTS[parking],
      end: WAYPOINTS[parking],
      startParking: parking,
    }));
    // 更新比赛流程的起点/终点
    RACE_STEPS[0].from = parking;
    RACE_STEPS[7].to = parking;
    setPathResult(null);
    setRacePathResults([]);
    setCarPosition(null);
    setCarAngle(undefined);
  }, []);

  // 处理单元格点击
  const handleCellClick = useCallback(
    (coord: GridCoord) => {
      if (drawMode === 'none') return;
      if (drawMode === 'start') {
        setConfig(prev => ({ ...prev, start: coord }));
        setDrawMode('none');
      } else if (drawMode === 'end') {
        setConfig(prev => ({ ...prev, end: coord }));
        setDrawMode('none');
      } else if (drawMode === 'obstacle') {
        setConfig(prev => {
          const exists = prev.obstacles.some((obs) => obs.x === coord.x && obs.y === coord.y);
          if (exists) return prev;
          return { ...prev, obstacles: [...prev.obstacles, coord] };
        });
      } else if (drawMode === 'erase') {
        setConfig(prev => ({
          ...prev,
          obstacles: prev.obstacles.filter((obs) => !(obs.x === coord.x && obs.y === coord.y)),
        }));
      }
    },
    [drawMode]
  );

  // ==================== 随机生成障碍物（只在候选位置生成）====================
  // 障碍物 φ50mm 圆柱体，放在通道正中间起到"拦路"作用
  const handleRandomObstacles = useCallback((count: number = 2) => {
    // 过滤候选位置：排除已经在障碍物列表中的位置
    let availableCandidates = OBSTACLE_CANDIDATES.filter(
      c => !config.obstacles.some(o => o.x === c.x && o.y === c.y)
    );

    if (availableCandidates.length < count) {
      alert(`可用候选位置不足！只剩 ${availableCandidates.length} 个位置。请先清空地图。`);
      return;
    }

    // 按照阻断常用路径的优先级排序
    // 常用路径（按使用频率）：中间竖直通道 > 中间水平通道 > 左侧通道 > 右侧通道 > 上下通道
    const priorityMap: Record<string, number> = {
      '24,10': 10, '24,24': 10, '24,40': 10,                   // 中间竖直通道（最常用，y=24是唯一安全横向通道）
      '12,24': 8, '38,24': 8,                                   // 中间水平通道（y=24唯一安全！）
      '6,34': 7, '6,40': 7,                                     // 左侧通道下段
      '42,10': 6, '42,24': 6, '42,40': 6,                        // 右侧通道
      '6,5': 5, '6,10': 5,                                      // 左侧通道上段
      '15,5': 4, '35,5': 4,                                     // 上方通道
      '10,43': 4, '35,43': 4,                                   // 下方通道
    };

    // 对候选位置按优先级排序（高优先级在前，加随机扰动避免每次结果相同）
    const sorted = [...availableCandidates].sort((a, b) => {
      const pa = (priorityMap[`${a.x},${a.y}`] || 0) + Math.random() * 3;
      const pb = (priorityMap[`${b.x},${b.y}`] || 0) + Math.random() * 3;
      return pb - pa; // 降序：优先级高的排前面
    });

    const newObstacles: GridCoord[] = [];
    const usedSet = new Set<string>();

    for (let i = 0; i < count && i < sorted.length; i++) {
      let found = false;

      // 从排序后的列表中依次尝试
      for (let j = 0; j < sorted.length; j++) {
        const pos = sorted[j];
        const key = `${pos.x},${pos.y}`;

        if (usedSet.has(key)) continue;

        // 检查放置后所有关键路径是否仍然可达
        const testObstacles = [...newObstacles, pos];
        const testGrid = createGridWithDilation(
          config.rows, config.cols, config.zones, testObstacles, DILATION_RADIUS, ['二维码区'], ['原料区', '粗加工区', '暂存区']
        );

        // 验证所有关键路径点之间的可达性
        const keyWaypoints = [
          WAYPOINTS[startParking], WAYPOINTS.qrcode, WAYPOINTS.material,
          WAYPOINTS.roughProcess, WAYPOINTS.tempStorage
        ];
        let allPathsOk = true;
        for (let w = 0; w < keyWaypoints.length - 1; w++) {
          const result = aStar(testGrid, keyWaypoints[w], keyWaypoints[w + 1]);
          if (result.path.length === 0) {
            allPathsOk = false;
            break;
          }
        }

        if (allPathsOk) {
          newObstacles.push(pos);
          usedSet.add(key);
          found = true;
          break;
        }
      }

      if (!found) {
        // 如果高优先级位置都不可用，从剩余候选中随机选一个
        const remaining = availableCandidates.filter(c => !usedSet.has(`${c.x},${c.y}`));
        if (remaining.length > 0) {
          const idx = Math.floor(Math.random() * remaining.length);
          newObstacles.push(remaining[idx]);
          usedSet.add(`${remaining[idx].x},${remaining[idx].y}`);
        }
      }
    }

    setConfig(prev => ({ ...prev, obstacles: newObstacles }));
  }, [config.zones, config.rows, config.cols, config.obstacles, startParking]);

  // A* 路径规划（单段）
  const handlePlanPath = useCallback(() => {
    const grid = createGridWithDilation(config.rows, config.cols, config.zones, config.obstacles, DILATION_RADIUS, ['二维码区'], ['原料区', '粗加工区', '暂存区']);
    const { result } = planPathRobust(grid, config.start, config.end, '单段规划');
    const realLength = result.path.length * config.gridSizeMm;

    setPathResult({ ...result, realLength });
    setRacePathResults([]);

    if (result.path.length > 0) {
      setCarPosition(config.start);
    } else {
      alert('未找到可行路径！请调整障碍物位置或起终点。');
    }
  }, [config]);

  // ==================== 比赛流程路径规划 ====================
  const handlePlanRacePath = useCallback(() => {
    const grid = createGridWithDilation(config.rows, config.cols, config.zones, config.obstacles, DILATION_RADIUS, ['二维码区'], ['原料区', '粗加工区', '暂存区']);

    const results: PathResult[] = [];
    let totalLength = 0;
    let totalTime = 0;
    let failedStep = '';

    for (let i = 0; i < RACE_STEPS.length; i++) {
      const step = RACE_STEPS[i];
      const from = WAYPOINTS[step.from as keyof typeof WAYPOINTS];
      const to = WAYPOINTS[step.to as keyof typeof WAYPOINTS];

      const { result } = planPathRobust(grid, from, to, step.name);

      if (result.path.length === 0) {
        failedStep = step.name;
        break;
      }

      results.push({
        ...result,
        realLength: result.path.length * config.gridSizeMm,
      });
      totalLength += result.length;
      totalTime += result.timeCost;
    }

    if (failedStep) {
      alert(`路径规划失败：${failedStep}\n请调整障碍物位置或检查场地配置。`);
      return;
    }

    setRacePathResults(results);
    setPathResult(null);
    setRaceStepIndex(0);
    shouldContinueRef.current = false;
    setCanContinue(false);

    // 合并所有路径用于显示
    const fullPath: GridCoord[] = [];
    for (const r of results) {
      if (fullPath.length > 0 && r.path.length > 0) {
        fullPath.push(...r.path.slice(1));
      } else {
        fullPath.push(...r.path);
      }
    }

    setPathResult({
      path: fullPath,
      length: totalLength,
      realLength: totalLength * config.gridSizeMm,
      nodeCount: fullPath.length,
      timeCost: totalTime,
      algorithm: 'A*',
    });

    setCarPosition(WAYPOINTS[startParking]);
  }, [config, startParking]);

  // 比赛流程动画（不模拟评分，评分由上位机根据实际结果计算）
  const animationFrameRef = useRef<number>(0);
  const animationStartTimeRef = useRef<number>(0);
  const animationStepRef = useRef<number>(0);
  const animationPathIndexRef = useRef<number>(0);
  const animationPrevPosRef = useRef<GridCoord | null>(null);
  const shouldContinueRef = useRef(false); // 是否应该继续动画（停止后）
  
  const handleStopAnimation = useCallback(() => {
    stopAnimationRef.current = true;
    shouldContinueRef.current = true; // 标记可以继续
    setCanContinue(true); // 显示继续按钮
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    setIsAnimating(false);
  }, []);

  // 比赛流程动画（使用 requestAnimationFrame 优化性能）
  const handleAnimateRacePath = useCallback(() => {
    if (racePathResults.length === 0) return;

    stopAnimationRef.current = false;
    setIsAnimating(true);

    // 如果可以继续，不重置引用
    if (!shouldContinueRef.current) {
      animationStepRef.current = 0;
      animationPathIndexRef.current = 0;
      animationPrevPosRef.current = null;
      animationStartTimeRef.current = performance.now();

      // 重置统计（新一轮开始时）
      setStats(prev => ({
        ...prev,
        grabCount: 0,
        placeCount: 0,
        ringScore: 0,
        total: 0,
        timeStart: Date.now(),
        timeEnd: 0,
        grabRecords: [],
        placeRecords: [],
      }));
    } else {
      // 继续模式：不重置统计，只标记不再继续
      shouldContinueRef.current = false;
    }

    const STEP_DURATION = 150; // 每步150ms
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (stopAnimationRef.current) {
        setIsAnimating(false);
        return;
      }

      const elapsed = currentTime - lastTime;

      if (elapsed >= STEP_DURATION) {
        // 调整到精确的150ms间隔
        lastTime = currentTime - (elapsed % STEP_DURATION);

        if (animationStepRef.current < racePathResults.length) {
          const currentPath = racePathResults[animationStepRef.current].path;

          if (animationPathIndexRef.current < currentPath.length) {
            const currentPos = currentPath[animationPathIndexRef.current];
            setCarPosition(currentPos);

            // 计算角度（根据前后两个点）
            if (animationPrevPosRef.current) {
              const dx = currentPos.x - animationPrevPosRef.current.x;
              const dy = currentPos.y - animationPrevPosRef.current.y;
              if (dx !== 0 || dy !== 0) {
                const angleRad = Math.atan2(dy, dx);
                const angleDeg = ((angleRad * 180 / Math.PI) + 360) % 360;
                setCarAngle(Math.round(angleDeg));
              }
            }
            animationPrevPosRef.current = currentPos;

            setRaceStepIndex(animationStepRef.current);
            animationPathIndexRef.current++;
          } else {
            animationStepRef.current++;
            animationPathIndexRef.current = 0;
            animationPrevPosRef.current = null;
          }
        } else {
          // 动画完成
          shouldContinueRef.current = false; // 重置继续标志
          const endTime = Date.now();
          setStats(prev => ({ ...prev, timeEnd: endTime }));
          setIsAnimating(false);
          setRaceStepIndex(0);
          console.log('[统计] 比赛动画播放完成');
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [racePathResults]);

  // 清除路径
  const handleClearPath = useCallback(() => {
    shouldContinueRef.current = false;
    setCanContinue(false);
    setPathResult(null);
    setRacePathResults([]);
    setCarPosition(null);
    setCarAngle(undefined);
    setRaceStepIndex(0);
  }, []);

  // 重置地图
  const handleResetMap = useCallback(() => {
    shouldContinueRef.current = false;
    setCanContinue(false);
    setConfig(prev => ({ ...prev, obstacles: [] }));
    setPathResult(null);
    setRacePathResults([]);
    setCarPosition(null);
    setCarAngle(undefined);
    setRaceStepIndex(0);
  }, []);

  // ==================== 麦轮运动学：速度 → 四轮转速 ====================
  // X型安装逆运动学 (IK)
  // 输入：vx(前后), vy(左右), wz(旋转)
  // 输出：[v_fl, v_fr, v_rl, v_rr] (轮子线速度，符号表示方向)
  const mecanumIK = useCallback((vx: number, vy: number, wz: number): [number, number, number, number] => {
    const v_fl = vx - vy - wz;
    const v_fr = vx + vy + wz;
    const v_rl = vx + vy - wz;
    const v_rr = vx - vy + wz;
    return [v_fl, v_fr, v_rl, v_rr];
  }, []);

  // 计算当前路径段的期望速度（用于动画演示）
  const calcWheelSpeedsForPath = useCallback((path: GridCoord[], currentIdx: number): [number, number, number, number] => {
    if (path.length < 2 || currentIdx >= path.length - 1) {
      return [0, 0, 0, 0]; // 停止或路径结束
    }
    const curr = path[currentIdx];
    const next = path[currentIdx + 1];
    // 简化：每个格子移动速度为 1 格/帧，实际应该根据定时器频率计算
    const vx = next.x - curr.x;
    const vy = next.y - curr.y;
    // wz 根据角度变化计算（如果有）
    const wz = 0; // 简化：暂不考虑旋转，实际应根据 carAngle 变化计算
    // 将格子速度转换为轮子转速（简化：直接使用权重）
    return mecanumIK(vx, vy, wz);
  }, [mecanumIK]);

  // 路径动画演示（使用 requestAnimationFrame 优化性能）
  const handleAnimatePath = useCallback(() => {
    if (!pathResult || pathResult.path.length === 0) return;

    stopAnimationRef.current = false;
    setIsAnimating(true);
    let index = 0;
    let prevPos: GridCoord | null = null;
    const STEP_DURATION = 150; // 每步150ms
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (stopAnimationRef.current) {
        setIsAnimating(false);
        setWheelSpeeds([0, 0, 0, 0]);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      const elapsed = currentTime - lastTime;

      if (elapsed >= STEP_DURATION) {
        lastTime = currentTime - (elapsed % STEP_DURATION);

        if (index < pathResult.path.length) {
          const currentPos = pathResult.path[index];
          setCarPosition(currentPos);

          // 计算角度（根据前后两个点）
          if (prevPos) {
            const dx = currentPos.x - prevPos.x;
            const dy = currentPos.y - prevPos.y;
            if (dx !== 0 || dy !== 0) {
              const angleRad = Math.atan2(dy, dx);
              const angleDeg = ((angleRad * 180 / Math.PI) + 360) % 360;
              setCarAngle(Math.round(angleDeg));
            }
          }
          prevPos = currentPos;

          // 计算轮子转速（麦轮 IK）
          const wheelSpeeds = calcWheelSpeedsForPath(pathResult.path, index);
          setWheelSpeeds(Array.from(wheelSpeeds));

          index++;
        } else {
          setIsAnimating(false);
          setWheelSpeeds([0, 0, 0, 0]); // 停止时清零
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [pathResult, calcWheelSpeedsForPath]);

  // 清除日志
  const handleClearLogs = useCallback(() => { setLogs([]); }, []);

  // 导出日志
  const handleExportLogs = useCallback(() => {
    const content = logs.map((log) => `[${log.timestamp}] ${log.direction}: ${log.raw}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* 顶部标题栏（紧凑版，现代设计） */}
      <header className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 dark:from-blue-900/300 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">
              🚗
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">物流小车路径规划可视化系统</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                2027工创赛 | {config.fieldWidth}×{config.fieldHeight}mm | 车体{config.carWidth}×{config.carHeight}mm | 每格{config.gridSizeMm}mm
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">二维码区可进入</span>
            <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium">原料/粗加工/暂存区边框禁入</span>
            <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded font-medium">障碍物膨胀{DILATION_RADIUS}格</span>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
              className="ml-2 px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`当前主题: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '系统'}`}
            >
              {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 三列独立滚动 */}
      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* 左侧控制面板（可折叠分组）- 独立滚动 */}
        <div className="col-span-3 overflow-y-auto pr-1 scrollbar-thin">
          <div className="panel p-3 hover:shadow-md transition-shadow duration-300">
            <ControlPanel
              config={config}
              drawMode={drawMode}
              pathResult={pathResult}
              racePathResults={racePathResults}
              raceStepIndex={raceStepIndex}
              raceSteps={RACE_STEPS}
              isAnimating={isAnimating}
              startParking={startParking}
              taskCode={taskCode}
              taskInfo={taskInfo}
              qrBoardY={qrBoardY}
              stats={stats}
              onStartParkingChange={handleStartParkingChange}
              onDrawModeChange={setDrawMode}
              onRandomObstacles={(count) => handleRandomObstacles(count)}
              onPlanPath={handlePlanPath}
              onPlanRacePath={handlePlanRacePath}
              onClearPath={handleClearPath}
              onResetMap={handleResetMap}
              onAnimatePath={handleAnimatePath}
              onAnimateRacePath={handleAnimateRacePath}
              onTaskCodeChange={handleTaskCodeChange}
              onRandomQrPosition={handleRandomQrPosition}
              onSetQrPosition={handleSetQrPosition}
            />
          </div>
        </div>

        {/* 中间地图显示区域（调整宽度）- 独立滚动 */}
        <div className="col-span-6 overflow-y-auto scrollbar-thin">
          <div className="panel flex flex-col items-center hover:shadow-md transition-shadow duration-300">
            <div className="w-full flex justify-between items-center mb-3 px-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-xl">🗺️</span> 赛场地图
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                {config.cols}×{config.rows}格
              </div>
            </div>
            <div className="w-full flex justify-center relative">
              <GridMap
                rows={config.rows}
                cols={config.cols}
                zones={config.zones}
                obstacles={config.obstacles}
                start={config.start}
                end={config.end}
                pathResult={pathResult}
                carPosition={carPosition}
                carAngle={carAngle}
                carWidth={config.carWidth}
                carHeight={config.carHeight}
                gridSizeMm={config.gridSizeMm}
                drawMode={drawMode}
                waypoints={WAYPOINTS}
                raceStepIndex={raceStepIndex}
                racePathResults={racePathResults}
                obstacleCandidates={OBSTACLE_CANDIDATES}
                qrBoardY={qrBoardY}
                onCellClick={handleCellClick}
                wheelSpeeds={wheelSpeeds}
                theme={theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}
                activeParking={startParking}
              />
            </div>
            
            {/* 地图下方操作按钮区域 */}
            <div className="w-full mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap gap-3 justify-center">
                {/* 快速路径规划 */}
                <button
                  onClick={handlePlanRacePath}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 dark:from-blue-900/300 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 btn-press btn-hover-lift"
                  title="一键规划比赛全流程路径"
                >
                  <span className="text-lg group-hover:rotate-12 transition-transform duration-300">🚀</span>
                  <span>快速规划</span>
                </button>
                
                {/* 开始动画 */}
                <button
                  onClick={racePathResults.length > 0 ? handleAnimateRacePath : handleAnimatePath}
                  disabled={isAnimating || ((pathResult?.path?.length || 0) === 0 && racePathResults.length === 0)}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isAnimating || ((pathResult?.path?.length || 0) === 0 && racePathResults.length === 0)
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-50 dark:from-green-900/300 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-lg'
                  }`}
                  title={racePathResults.length > 0 ? "开始比赛流程动画" : "开始路径动画"}
                >
                  <span className="text-lg group-hover:scale-125 transition-transform duration-300">▶️</span>
                  <span>开始动画</span>
                </button>
                
                {/* 继续动画 */}
                {canContinue && !isAnimating && (
                  <button
                    onClick={handleAnimateRacePath}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 btn-press btn-hover-lift"
                    title="从当前位置继续动画"
                  >
                    <span className="text-lg group-hover:scale-125 transition-transform duration-300">⏯</span>
                    <span>继续动画</span>
                  </button>
                )}
                
                {/* 停止动画 */}
                <button
                  onClick={handleStopAnimation}
                  disabled={!isAnimating}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                    !isAnimating
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-50 dark:from-red-900/300 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg'
                  }`}
                  title="停止路径动画"
                >
                  <span className="text-lg">⏹️</span>
                  <span>停止</span>
                </button>
                
                {/* 清除路径 */}
                <button
                  onClick={handleClearPath}
                  disabled={(pathResult?.path?.length || 0) === 0 && racePathResults.length === 0}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                    (pathResult?.path?.length || 0) === 0 && racePathResults.length === 0
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white hover:shadow-lg'
                  }`}
                  title="清除已规划的路径"
                >
                  <span className="text-lg group-hover:rotate-12 transition-transform duration-300">🗑️</span>
                  <span>清除路径</span>
                </button>
                
                {/* 随机障碍物 */}
                <button
                  onClick={() => handleRandomObstacles(2)}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-50 dark:from-purple-900/300 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 btn-press btn-hover-lift"
                  title="随机生成2个障碍物"
                >
                  <span className="text-lg group-hover:animate-bounce transition-transform duration-300">🎲</span>
                  <span>随机障碍</span>
                </button>
                
                {/* 重置地图 */}
                <button
                  onClick={handleResetMap}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 btn-press btn-hover-lift"
                  title="重置整个地图（清除障碍物、路径、任务码）"
                >
                  <span className="text-lg group-hover:rotate-180 transition-transform duration-500">🔄</span>
                  <span>重置地图</span>
                </button>
                
                {/* 视频显示 */}
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                    showVideo
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white hover:shadow-lg'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-800 hover:from-gray-500 hover:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white hover:shadow-lg'
                  }`}
                  title="打开视频显示界面"
                >
                  <span className="text-lg group-hover:scale-125 transition-transform duration-300">📹</span>
                  <span>{showVideo ? '关闭视频' : '视频显示'}</span>
                </button>
              </div>
              
              {/* 状态提示 */}
              <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                {isAnimating ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    动画演示中...
                  </span>
                ) : (pathResult?.path?.length || 0) > 0 || racePathResults.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    路径已规划，点击"开始动画"演示
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧面板（串口+协议合并，Tab切换）- 独立滚动 */}
        <div className="col-span-3 overflow-y-auto pl-1 scrollbar-thin">
          <div className="panel p-3 hover:shadow-md transition-shadow duration-300">
            {/* 右侧面板 Tab 切换 */}
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setRightPanelTab('serial')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  rightPanelTab === 'serial' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                🔌 串口
              </button>
              <button
                onClick={() => setRightPanelTab('protocol')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  rightPanelTab === 'protocol' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                📄 协议
              </button>
            </div>
            {rightPanelTab === 'serial' ? (
              <SerialPanel
                serialManager={serialManager}
                onReceiveFrame={handleReceiveFrame}
                parkingZone={startParking === 'parking1' ? 1 : 2}
                obstacles={config.obstacles}
                racePathResults={racePathResults.map((r, idx) => ({
                  path: r.path,
                  stepIndex: idx,
                  stepName: RACE_STEPS[idx]?.name || `步骤${idx + 1}`,
                }))}
                onShowProtocol={() => setRightPanelTab('protocol')}
              />
            ) : (
              <ProtocolPanel onClose={() => setRightPanelTab('serial')} />
            )}
          </div>
        </div>
      </div>

      {/* 底部日志按钮（点击打开浮动面板） */}
      <div className="mt-4">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors duration-200 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">📋</span> 运行日志 
            {logs.length > 0 && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">{logs.length}</span>}
          </span>
          <span className={`transition-transform duration-300 ${showLogs ? 'rotate-180' : ''}`}>
            {showLogs ? '▼' : '▲'}
          </span>
        </button>
      </div>

      {/* 浮动日志面板 */}
      {showLogs && (
        <FloatingLogPanel
          logs={logs}
          onClearLogs={handleClearLogs}
          onExportLogs={handleExportLogs}
          onClose={() => setShowLogs(false)}
        />
      )}

      {/* 视频显示面板（浮动窗口） */}
      <VideoPanel
        isVisible={showVideo}
        onClose={() => setShowVideo(false)}
      />
      
      {/* 性能监控（开发模式显示） */}
      {import.meta.env.DEV && (
        <FPSMonitor isAnimating={isAnimating} />
      )}
    </div>
  );
};

export default App;
