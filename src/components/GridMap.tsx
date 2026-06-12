import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GridCoord, PathResult, DrawMode, Zone } from '../types';

interface GridMapProps {
  rows: number;
  cols: number;
  zones: Zone[];
  obstacles: GridCoord[];
  start: GridCoord;
  end: GridCoord;
  pathResult: PathResult | null;
  carPosition: GridCoord | null;
  carAngle?: number;
  carWidth: number;
  carHeight: number;
  gridSizeMm: number;
  drawMode: DrawMode;
  waypoints: Record<string, GridCoord>;
  raceStepIndex: number;
  racePathResults: PathResult[];
  obstacleCandidates: GridCoord[];
  qrBoardY: number;
  theme: 'light' | 'dark';
  onCellClick: (coord: GridCoord) => void;
  wheelSpeeds?: number[];
  activeParking: 'parking1' | 'parking2';
}

// ===== 浅色/深色 完整色板 =====
const LIGHT = {
  bg: '#f8fafc',
  gridLine: 'rgba(0,0,0,0.08)',
  gridMain: 'rgba(0,0,0,0.15)',
  coordText: 'rgba(0,0,0,0.45)',
  obstacleDot: 'rgba(239,68,68,0.2)',
  obstacleDotStroke: 'rgba(239,68,68,0.35)',
  obstacleFill: '#dc2626',
  obstacleStroke: '#991b1b',
  noGoTexture: 'rgba(220,38,38,0.15)',
  noGoBorder: 'rgba(220,38,38,0.6)',
  noGoSlash: 'rgba(220,38,38,0.2)',
  qrTexture: 'rgba(79,70,229,0.15)',
  qrBorder: '#4f46e5',
  qrLabel: 'rgba(79,70,229,0.7)',
  startFill: 'rgba(34,197,94,0.08)',
  startStroke: 'rgba(34,197,94,0.5)',
  endFill: 'rgba(59,130,246,0.08)',
  endStroke: 'rgba(59,130,246,0.5)',
  pathGlow: 'rgba(245,158,11,0.3)',
  pathStroke: '#f59e0b',
  carShadow: 'rgba(0,0,0,0.15)',
  carGrad1: '#a78bfa',
  carGrad2: '#7c3aed',
  carStroke: '#5b21b6',
  wheelFill: '#1f2937',
  wheelStroke: '#000000',
  roller: '#9ca3af',
  carLabel: '#ffffff',
  zoneLabel: 'rgba(0,0,0,0.65)',
};

const DARK = {
  bg: '#1a1a2e',
  gridLine: 'rgba(255,255,255,0.07)',
  gridMain: 'rgba(255,255,255,0.14)',
  coordText: 'rgba(255,255,255,0.3)',
  obstacleDot: 'rgba(239,68,68,0.25)',
  obstacleDotStroke: 'rgba(239,68,68,0.45)',
  obstacleFill: '#ef4444',
  obstacleStroke: '#fca5a5',
  noGoTexture: 'rgba(239,68,68,0.18)',
  noGoBorder: 'rgba(239,68,68,0.55)',
  noGoSlash: 'rgba(239,68,68,0.15)',
  qrTexture: 'rgba(129,140,248,0.15)',
  qrBorder: '#818cf8',
  qrLabel: 'rgba(129,140,248,0.7)',
  startFill: 'rgba(34,197,94,0.1)',
  startStroke: 'rgba(34,197,94,0.5)',
  endFill: 'rgba(59,130,246,0.1)',
  endStroke: 'rgba(59,130,246,0.5)',
  pathGlow: 'rgba(245,158,11,0.25)',
  pathStroke: '#fbbf24',
  carShadow: 'rgba(0,0,0,0.35)',
  carGrad1: '#7c3aed',
  carGrad2: '#6d28d9',
  carStroke: '#a78bfa',
  wheelFill: '#374151',
  wheelStroke: '#6b7280',
  roller: '#4b5563',
  carLabel: '#e5e7eb',
  zoneLabel: 'rgba(255,255,255,0.65)',
};

const WAYPOINT_COLORS: Record<string, { color: string; bgColor: string }> = {
  parking1:   { color: '#60a5fa', bgColor: 'rgba(96,165,250,0.18)' },
  parking2:   { color: '#60a5fa', bgColor: 'rgba(96,165,250,0.18)' },
  qrcode:     { color: '#818cf8', bgColor: 'rgba(129,140,248,0.18)' },
  material:   { color: '#f472b6', bgColor: 'rgba(244,114,182,0.18)' },
  roughProcess: { color: '#a78bfa', bgColor: 'rgba(167,139,250,0.18)' },
  tempStorage:  { color: '#34d399', bgColor: 'rgba(52,211,153,0.18)' },
};

const GridMap: React.FC<GridMapProps> = ({
  rows, cols, zones, obstacles, start, end,
  pathResult, carPosition, carAngle, carWidth, carHeight, gridSizeMm,
  drawMode, waypoints, raceStepIndex, racePathResults, obstacleCandidates, qrBoardY, theme, onCellClick,
  wheelSpeeds,
  activeParking,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(16);
  const [canvasSize, setCanvasSize] = useState({ width: cols * 16, height: rows * 16 });
  const [dpr, setDpr] = useState(1);
  const colors = theme === 'dark' ? DARK : LIGHT;
  
  // 计算自适应的 cellSize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const parent = container.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const availableWidth = parentRect.width - 32;
      const availableHeight = window.innerHeight - 300;
      const maxCellByWidth = Math.floor(availableWidth / cols);
      const maxCellByHeight = Math.floor(availableHeight / rows);
      const newCellSize = Math.max(8, Math.min(maxCellByWidth, maxCellByHeight));
      const newDpr = window.devicePixelRatio || 1;
      setCellSize(newCellSize);
      setCanvasSize({ width: cols * newCellSize, height: rows * newCellSize });
      setDpr(newDpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [cols, rows]);

  // 绘制网格地图
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dprVal = dpr || 1;
    const w = canvasSize.width;
    const h = canvasSize.height;

    ctx.setTransform(dprVal, 0, 0, dprVal, 0, 0);

    // ===== 字体大小（跟随 cellSize 等比缩放，带上下限）=====
    const fCoord = Math.max(8,  Math.min(15, Math.round(cellSize * 0.40))); // 坐标标签
    const fSmall = Math.max(7,  Math.min(14, Math.round(cellSize * 0.38))); // RPM、小车坐标
    const fBody  = Math.max(9,  Math.min(18, Math.round(cellSize * 0.55))); // 区域说明文字
    const fLabel = Math.max(11, Math.min(22, Math.round(cellSize * 0.70))); // 区域名称标签 ⬆
    const fWaypt = Math.max(9,  Math.min(17, Math.round(cellSize * 0.60))); // 路径点标签
    const fTitle = Math.max(12, Math.min(22, Math.round(cellSize * 0.90))); // QR等大标签 ⬆

    // 带描边的文本绘制（提升可读性）
    const drawLabel = (text: string, x: number, y: number, font: string, fill: string, stroke?: string) => {
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
      }
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y);
    };

    // 清空画布 + 绘制背景
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    // ===== 绘制所有固定区域 =====
    for (const zone of zones) {
      if (zone.label === '原料区') {
        const discCx = 24 * cellSize;
        const discCy = -1.4 * cellSize;
        const discR = 3 * cellSize;
        const zoneLeft = zone.x * cellSize;
        const zoneTop = zone.y * cellSize;
        const zoneW = zone.width * cellSize;
        const zoneH = zone.height * cellSize;

        ctx.save();
        ctx.beginPath();
        ctx.rect(zoneLeft, zoneTop, zoneW, zoneH);
        ctx.clip();

        ctx.beginPath();
        ctx.arc(discCx, discCy, discR, 0, Math.PI * 2);
        ctx.fillStyle = zone.color;
        ctx.fill();
        ctx.strokeStyle = colors.noGoBorder;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = colors.noGoTexture;
        ctx.lineWidth = 1;
        const step = cellSize;
        for (let i = -zoneH; i < zoneW + zoneH; i += step) {
          ctx.beginPath();
          ctx.moveTo(zoneLeft + i, zoneTop);
          ctx.lineTo(zoneLeft + i - zoneH, zoneTop + zoneH);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(220,38,38,0.35)';
        for (let i = 0; i < 3; i++) {
          const angle = (i * 120 - 90) * (Math.PI / 180);
          const slotR = discR * 0.5;
          const sx = discCx + Math.cos(angle) * slotR;
          const sy = discCy + Math.sin(angle) * slotR;
          if (sy >= 0) {
            ctx.beginPath();
            ctx.arc(sx, sy, cellSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(220,38,38,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        ctx.restore();

        ctx.fillStyle = colors.noGoBorder.replace('0.6', '0.85');
        ctx.font = `bold ${fBody}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('φ300转盘', discCx, zoneTop + cellSize * 0.1);
        ctx.font = `${fSmall}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
        ctx.fillText('仅80mm入场', discCx, zoneTop + cellSize * 1.2);

        // 原料区名称（与区域整体大小匹配）
        const matStroke = theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';
        drawLabel('原料区',
          zone.x * cellSize + (zone.width * cellSize) / 2,
          zone.y * cellSize + (zone.height * cellSize) / 2,
          `bold ${fLabel}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`,
          colors.zoneLabel, matStroke);
        continue;
      }

      // 其他区域
      ctx.fillStyle = zone.color;
      ctx.fillRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);
      ctx.strokeStyle = zone.isObstacle ? 'rgba(220,38,38,0.4)' : colors.gridLine;
      ctx.lineWidth = zone.isObstacle ? 2 : 1;
      ctx.strokeRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);

      // 行驶禁区特殊绘制
      if (zone.isObstacle && (zone.label === '粗加工区' || zone.label === '暂存区')) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);
        ctx.clip();
        ctx.strokeStyle = colors.noGoSlash;
        ctx.lineWidth = 1.5;
        const step = cellSize * 1.5;
        for (let i = -zone.height * cellSize; i < zone.width * cellSize + zone.height * cellSize; i += step) {
          ctx.beginPath();
          ctx.moveTo(zone.x * cellSize + i, zone.y * cellSize);
          ctx.lineTo(zone.x * cellSize + i - zone.height * cellSize, (zone.y + zone.height) * cellSize);
          ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = colors.noGoBorder;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);

        ctx.fillStyle = colors.noGoBorder.replace('0.6', '0.7');
        ctx.font = `bold ${fBody}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('⛔ 边框禁入', (zone.x + zone.width / 2) * cellSize, zone.y * cellSize + cellSize * 0.15);
      }

      // 二维码区
      if (zone.label === '二维码区') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(zone.x * cellSize, zone.y * cellSize, zone.width * cellSize, zone.height * cellSize);
        ctx.clip();
        ctx.strokeStyle = colors.qrTexture;
        ctx.lineWidth = 1;
        const step = cellSize * 2;
        for (let i = -zone.height * cellSize; i < zone.width * cellSize + zone.height * cellSize; i += step) {
          ctx.beginPath();
          ctx.moveTo(zone.x * cellSize + i, zone.y * cellSize);
          ctx.lineTo(zone.x * cellSize + i - zone.height * cellSize, (zone.y + zone.height) * cellSize);
          ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = colors.qrBorder;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo((zone.x + zone.width) * cellSize, zone.y * cellSize);
        ctx.lineTo((zone.x + zone.width) * cellSize, (zone.y + zone.height) * cellSize);
        ctx.stroke();

        ctx.fillStyle = colors.qrLabel;
        ctx.font = `bold ${fBody}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('⬅ 车体可进入', (zone.x + zone.width / 2) * cellSize, zone.y * cellSize + cellSize * 0.2);
      }

      // 二维码板
      if (zone.label === '二维码区' && qrBoardY !== undefined) {
        const boardX = zone.x + zone.width - 4;
        const boardY = qrBoardY - 2;
        const boardW = 4;
        const boardH = 4;

        ctx.fillStyle = 'rgba(79,70,229,0.25)';
        ctx.fillRect(boardX * cellSize, boardY * cellSize, boardW * cellSize, boardH * cellSize);
        ctx.strokeStyle = colors.qrBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(boardX * cellSize, boardY * cellSize, boardW * cellSize, boardH * cellSize);

        ctx.fillStyle = colors.qrBorder;
        ctx.font = `bold ${fTitle}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', (boardX + boardW / 2) * cellSize, (boardY + boardH / 2) * cellSize);

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = colors.qrBorder.replace(')', ',0.45)');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(zone.x * cellSize, qrBoardY * cellSize);
        ctx.lineTo((zone.x + zone.width) * cellSize, qrBoardY * cellSize);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 区域标签（只要有足够空间就显示）
      if (zone.width * cellSize > 24 && zone.height * cellSize > 16) {
        const labelFill = colors.zoneLabel;
        const labelStroke = theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
        drawLabel(zone.label,
          zone.x * cellSize + (zone.width * cellSize) / 2,
          zone.y * cellSize + (zone.height * cellSize) / 2,
          `bold ${fLabel}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`,
          labelFill, labelStroke);
      }
    }

    // ===== 绘制网格线 =====
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, h); ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(w, i * cellSize); ctx.stroke();
    }

    ctx.strokeStyle = colors.gridMain;
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i += 5) {
      ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, h); ctx.stroke();
    }
    for (let i = 0; i <= rows; i += 5) {
      ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(w, i * cellSize); ctx.stroke();
    }

    // 坐标标签
    ctx.fillStyle = colors.coordText;
    ctx.font = `${fCoord}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < cols; i += 5) {
      ctx.fillText(`${i * gridSizeMm}`, i * cellSize + cellSize / 2, cellSize * 0.08);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < rows; i += 5) {
      ctx.fillText(`${i * gridSizeMm}`, cellSize * 0.08, i * cellSize + cellSize / 2);
    }

    // ===== 绘制候选障碍物位置 =====
    const obstacleSet = new Set(obstacles.map(o => `${o.x},${o.y}`));
    for (const cand of obstacleCandidates) {
      if (obstacleSet.has(`${cand.x},${cand.y}`)) continue;
      const cx = cand.x * cellSize + cellSize / 2;
      const cy = cand.y * cellSize + cellSize / 2;
      const radius = cellSize / 5;
      ctx.fillStyle = colors.obstacleDot;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.obstacleDotStroke;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ===== 绘制动态障碍物 =====
    for (const obs of obstacles) {
      const cx = obs.x * cellSize + cellSize / 2;
      const cy = obs.y * cellSize + cellSize / 2;
      const radius = cellSize / 3;

      ctx.fillStyle = colors.obstacleFill;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.obstacleStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ===== 绘制关键路径点标记 =====
    for (const [key, coord] of Object.entries(waypoints)) {
      const marker = WAYPOINT_COLORS[key];
      if (!marker) continue;
      const cx = coord.x * cellSize + cellSize / 2;
      const cy = coord.y * cellSize + cellSize / 2;
      const r = cellSize * 0.8;

      ctx.fillStyle = marker.bgColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = marker.color;
      ctx.font = `bold ${fWaypt}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelMap: Record<string, string> = { parking1: 'P1', parking2: 'P2', qrcode: 'QR', material: 'M', roughProcess: 'RP', tempStorage: 'TS' };
      const wayptLabel = labelMap[key] || '';
      // 描边
      ctx.strokeStyle = theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeText(wayptLabel, cx, cy);
      ctx.fillStyle = marker.color;
      ctx.fillText(wayptLabel, cx, cy);
    }

    // ===== 绘制两个启停区（虚线框 + 半透明填充）=====
    // 使用 waypoints.parking1 / parking2 坐标，不受 start/end 切换影响
    const zoneSize = 6;
    const parkFill = theme === 'dark'
      ? 'rgba(96,165,250,0.10)'
      : 'rgba(96,165,250,0.08)';
    const parkStroke = theme === 'dark'
      ? 'rgba(96,165,250,0.55)'
      : 'rgba(59,130,246,0.45)';

    const drawParkingZone = (cx: number, cy: number, label: string, isActive: boolean) => {
      const px = (cx - 2.5) * cellSize;
      const py = (cy - 2.5) * cellSize;
      const sz = zoneSize * cellSize;
      // 选中态：更亮填充 + 实线边框；未选中态：半透明 + 虚线
      if (isActive) {
        ctx.fillStyle = theme === 'dark'
          ? 'rgba(96,165,250,0.20)'
          : 'rgba(59,130,246,0.12)';
        ctx.fillRect(px, py, sz, sz);
        ctx.strokeStyle = theme === 'dark'
          ? 'rgba(96,165,250,0.80)'
          : 'rgba(59,130,246,0.60)';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(px, py, sz, sz);
      } else {
        ctx.fillStyle = parkFill;
        ctx.fillRect(px, py, sz, sz);
        ctx.strokeStyle = parkStroke;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px, py, sz, sz);
        ctx.setLineDash([]);
      }
      // 标签（带描边）
      const labelFill = isActive
        ? (theme === 'dark' ? '#93c5fd' : '#2563eb')
        : (theme === 'dark' ? 'rgba(147,197,253,0.55)' : 'rgba(37,99,235,0.55)');
      const labelStroke = theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';
      const labelFont = isActive
        ? `bold ${fTitle}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`
        : `bold ${fLabel}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
      drawLabel(label, px + sz / 2, py + sz / 2, labelFont, labelFill, labelStroke);
    };

    if (waypoints.parking1) drawParkingZone(waypoints.parking1.x, waypoints.parking1.y, '启停区1', activeParking === 'parking1');
    if (waypoints.parking2) drawParkingZone(waypoints.parking2.x, waypoints.parking2.y, '启停区2', activeParking === 'parking2');

    // ===== 绘制路径 =====
    if (pathResult && pathResult.path.length > 0) {
      const simplifyToTurnPoints = (path: GridCoord[]): GridCoord[] => {
        if (path.length <= 2) return path;
        const simplified: GridCoord[] = [path[0]];
        for (let i = 1; i < path.length - 1; i++) {
          const prev = path[i - 1];
          const curr = path[i];
          const next = path[i + 1];
          const prevDir = { x: curr.x - prev.x, y: curr.y - prev.y };
          const nextDir = { x: next.x - curr.x, y: next.y - curr.y };
          if (prevDir.x !== nextDir.x || prevDir.y !== nextDir.y) {
            simplified.push(curr);
          }
        }
        simplified.push(path[path.length - 1]);
        return simplified;
      };

      const simplifiedPath = simplifyToTurnPoints(pathResult.path);

      if (racePathResults.length > 0) {
        const segColors = ['#818cf8', '#f472b6', '#fbbf24', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#60a5fa'];
        for (let s = 0; s < racePathResults.length; s++) {
          const segPath = racePathResults[s].path;
          const simplifiedSegPath = simplifyToTurnPoints(segPath);
          const stepColor = segColors[s] || '#fbbf24';
          const isActive = s === raceStepIndex;

          // 发光效果（外层）
          ctx.shadowColor = stepColor;
          ctx.shadowBlur = cellSize / 2;
          ctx.strokeStyle = isActive ? stepColor + '88' : stepColor + '44';
          ctx.lineWidth = cellSize / (isActive ? 1.5 : 2.5);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          if (simplifiedSegPath.length > 0) {
            ctx.moveTo(simplifiedSegPath[0].x * cellSize + cellSize / 2, simplifiedSegPath[0].y * cellSize + cellSize / 2);
            for (let i = 1; i < simplifiedSegPath.length; i++) {
              ctx.lineTo(simplifiedSegPath[i].x * cellSize + cellSize / 2, simplifiedSegPath[i].y * cellSize + cellSize / 2);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0; // 重置阴影

          // 主路径线条
          ctx.strokeStyle = isActive ? stepColor : stepColor + '66';
          ctx.lineWidth = cellSize / (isActive ? 2.5 : 4);
          ctx.beginPath();
          if (simplifiedSegPath.length > 0) {
            ctx.moveTo(simplifiedSegPath[0].x * cellSize + cellSize / 2, simplifiedSegPath[0].y * cellSize + cellSize / 2);
            for (let i = 1; i < simplifiedSegPath.length; i++) {
              ctx.lineTo(simplifiedSegPath[i].x * cellSize + cellSize / 2, simplifiedSegPath[i].y * cellSize + cellSize / 2);
            }
          }
          ctx.stroke();
        }
      } else {
        // 单段路径
        ctx.strokeStyle = colors.pathGlow;
        ctx.lineWidth = cellSize / 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (simplifiedPath.length > 0) {
          ctx.moveTo(simplifiedPath[0].x * cellSize + cellSize / 2, simplifiedPath[0].y * cellSize + cellSize / 2);
          for (let i = 1; i < simplifiedPath.length; i++) {
            ctx.lineTo(simplifiedPath[i].x * cellSize + cellSize / 2, simplifiedPath[i].y * cellSize + cellSize / 2);
          }
        }
        ctx.stroke();

        ctx.strokeStyle = colors.pathStroke;
        ctx.lineWidth = cellSize / 3;
        ctx.beginPath();
        if (simplifiedPath.length > 0) {
          ctx.moveTo(simplifiedPath[0].x * cellSize + cellSize / 2, simplifiedPath[0].y * cellSize + cellSize / 2);
          for (let i = 1; i < simplifiedPath.length; i++) {
            ctx.lineTo(simplifiedPath[i].x * cellSize + cellSize / 2, simplifiedPath[i].y * cellSize + cellSize / 2);
          }
        }
        ctx.stroke();
      }
    }

    // ===== 绘制小车 =====
    if (carPosition) {
      const carW = (carWidth / gridSizeMm) * cellSize;
      const carH = (carHeight / gridSizeMm) * cellSize;
      const cx = carPosition.x * cellSize + cellSize / 2;
      const cy = carPosition.y * cellSize + cellSize / 2;

      // 小车阴影
      ctx.fillStyle = colors.carShadow;
      ctx.fillRect(cx - carW / 2 + 2, cy - carH / 2 + 2, carW, carH);

      // 小车主体（渐变）
      const gradient = ctx.createLinearGradient(cx - carW / 2, cy - carH / 2, cx + carW / 2, cy + carH / 2);
      gradient.addColorStop(0, colors.carGrad1);
      gradient.addColorStop(1, colors.carGrad2);
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - carW / 2, cy - carH / 2, carW, carH);

      // 小车边框
      ctx.strokeStyle = colors.carStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - carW / 2, cy - carH / 2, carW, carH);

      // 绘制麦轮
      const wheelPositions = [
        { x: -0.4, y: -0.4, label: 'FL' },
        { x:  0.4, y: -0.4, label: 'FR' },
        { x: -0.4, y:  0.4, label: 'RL' },
        { x:  0.4, y:  0.4, label: 'RR' },
      ];
      const wheelRadius = cellSize * 0.2;

      wheelPositions.forEach((pos, idx) => {
        const wx = cx + pos.x * carW;
        const wy = cy + pos.y * carH;

        ctx.beginPath();
        ctx.arc(wx, wy, wheelRadius, 0, Math.PI * 2);
        ctx.fillStyle = colors.wheelFill;
        ctx.fill();
        ctx.strokeStyle = colors.wheelStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 辊子
        ctx.strokeStyle = colors.roller;
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(wx + i * wheelRadius * 0.4, wy - wheelRadius * 0.8);
          ctx.lineTo(wx + i * wheelRadius * 0.4, wy + wheelRadius * 0.8);
          ctx.stroke();
        }

        // 轮子标签
        ctx.fillStyle = colors.carLabel;
        ctx.font = `bold ${fSmall}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pos.label, wx, wy);

        // 轮子转速
        if (wheelSpeeds && wheelSpeeds[idx] !== undefined) {
          const rpm = wheelSpeeds[idx];
          const rpmColor = theme === 'dark'
            ? (rpm > 0 ? '#4ade80' : rpm < 0 ? '#f87171' : '#9ca3af')
            : (rpm > 0 ? '#16a34a' : rpm < 0 ? '#dc2626' : '#6b7280');
          ctx.fillStyle = rpmColor;
          ctx.font = `${fSmall}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
          ctx.fillText(`${Math.round(rpm)}`, wx, wy + wheelRadius + cellSize * 0.2);
        }
      });

      // 坐标标注
      const xMm = Math.round(carPosition.x * gridSizeMm);
      const yMm = Math.round(carPosition.y * gridSizeMm);
      ctx.font = `bold ${fSmall}px "Microsoft YaHei","PingFang SC",Arial,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const drawTextWithOutline = (text: string, x: number, y: number) => {
        ctx.strokeStyle = theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      };

      ctx.fillStyle = colors.carLabel;
      drawTextWithOutline(`X:${xMm}mm`, cx, cy - carH / 2 + cellSize * 0.15);
      drawTextWithOutline(`Y:${yMm}mm`, cx, cy - carH / 2 + cellSize * 0.15 + fSmall + 2);

      // 车头标志
      if (carAngle !== undefined) {
        const headDistance = carH / 2 + cellSize * 0.2;
        const headX = cx + headDistance * Math.cos(carAngle * Math.PI / 180);
        const headY = cy + headDistance * Math.sin(carAngle * Math.PI / 180);

        ctx.fillStyle = theme === 'dark' ? '#f87171' : '#ef4444';
        ctx.beginPath();
        ctx.arc(headX, headY, cellSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.carLabel;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const angleStr = `θ:${Math.round(carAngle)}°`;
        drawTextWithOutline(angleStr, cx, cy - carH / 2 + cellSize * 0.15 + (fSmall + 2) * 2);
      }
    }

    // ===== 绘制场地边框 =====
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.25)' : '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);

  }, [rows, cols, cellSize, zones, obstacles, start, end, pathResult, carPosition, carAngle, carWidth, carHeight, gridSizeMm, waypoints, raceStepIndex, racePathResults, obstacleCandidates, qrBoardY, dpr, canvasSize, theme, activeParking]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      onCellClick({ x, y });
    }
  }, [cellSize, cols, rows, onCellClick]);

  const getCursorStyle = () => {
    switch (drawMode) {
      case 'start': case 'end': case 'obstacle': case 'erase': return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div className="flex flex-col items-center w-full" ref={containerRef}>
      <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-200 dark:border-gray-700 map-container">
        <canvas
          ref={canvasRef}
          width={canvasSize.width * dpr}
          height={canvasSize.height * dpr}
          onClick={handleClick}
          style={{
            cursor: getCursorStyle(),
            backgroundColor: colors.bg,
            width: canvasSize.width,
            height: canvasSize.height,
            maxWidth: '100%',
            imageRendering: 'auto',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>
    </div>
  );};

export default GridMap;
