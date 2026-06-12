import React from 'react';
import { MapConfig, DrawMode, PathResult, RaceStep, Zone } from '../types';
import { ParsedTaskCode, COLOR_CODE } from '../utils/taskCode';

interface ControlPanelProps {
  config: MapConfig;
  drawMode: DrawMode;
  pathResult: PathResult | null;
  racePathResults: PathResult[];
  raceStepIndex: number;
  raceSteps: RaceStep[];
  isAnimating: boolean;
  startParking: 'parking1' | 'parking2';
  taskCode?: string;
  taskInfo?: ParsedTaskCode | null;
  qrBoardY?: number;
  stats?: {
    grabCount: number;
    placeCount: number;
    ringScore: number;
    total: number;
    timeStart: number;
    timeEnd: number;
    grabRecords: any[];
    placeRecords: any[];
  };
  onStartParkingChange: (parking: 'parking1' | 'parking2') => void;
  onDrawModeChange: (mode: DrawMode) => void;
  onRandomObstacles: (count: number) => void;
  onPlanPath: () => void;
  onPlanRacePath: () => void;
  onClearPath: () => void;
  onResetMap: () => void;
  onAnimatePath: () => void;
  onAnimateRacePath: () => void;
  onTaskCodeChange?: (code: string) => void;
  onRandomQrPosition?: () => void;
  onSetQrPosition?: (y: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  config, drawMode, pathResult, racePathResults, raceStepIndex, raceSteps,
  isAnimating, startParking, taskCode, taskInfo, qrBoardY, stats,
  onStartParkingChange,
  onDrawModeChange, onRandomObstacles, onPlanPath, onPlanRacePath,
  onClearPath, onResetMap, onAnimatePath, onAnimateRacePath,
  onTaskCodeChange, onRandomQrPosition, onSetQrPosition,
}) => {
  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <span>⚙️</span> 赛场控制
      </h3>

      {/* 分组1: 场地信息 + 出发位置 */}
      <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" open>
        <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-blue-50 dark:from-blue-900/30 to-blue-100 dark:to-blue-800/20 text-xs font-bold text-blue-800 dark:text-blue-300 select-none hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-900/40 dark:hover:to-blue-800/30 transition-all duration-300 flex items-center gap-2">
          <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
          🗺️ 场地信息
        </summary>
        <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex justify-between"><span>场地:</span><span className="font-mono">{config.fieldWidth}×{config.fieldHeight}mm</span></div>
            <div className="flex justify-between"><span>网格:</span><span className="font-mono">{config.cols}×{config.rows}格</span></div>
            <div className="flex justify-between"><span>每格:</span><span className="font-mono">{config.gridSizeMm}mm</span></div>
            <div className="flex justify-between"><span>车体:</span><span className="font-mono">{config.carWidth}×{config.carHeight}mm</span></div>
            <div className="flex justify-between"><span>障碍物:</span><span className="font-mono text-red-600">φ50mm</span></div>
            <div className="flex justify-between"><span>安全膨胀:</span><span className="font-mono text-orange-600">{Math.ceil(config.carSafeRadius / config.gridSizeMm)}格</span></div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">🚏️ 出发位置</label>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => onStartParkingChange('parking1')} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${startParking === 'parking1' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>启停区1</button>
              <button onClick={() => onStartParkingChange('parking2')} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${startParking === 'parking2' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>启停区2</button>
            </div>
          </div>
        </div>
      </details>

      {/* 分组2: 绘制模式 */}
      <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" open>
        <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-green-50 dark:from-green-900/30 to-green-100 dark:to-green-800/20 text-xs font-bold text-green-800 dark:text-green-300 select-none hover:from-green-100 hover:to-green-150 dark:hover:from-green-900/40 dark:hover:to-green-800/30 transition-all duration-300 flex items-center gap-2">
          <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
          ✏️ 绘制模式
        </summary>
        <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => onDrawModeChange('start')} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawMode === 'start' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>📍 起点</button>
            <button onClick={() => onDrawModeChange('end')} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawMode === 'end' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>🎯 终点</button>
            <button onClick={() => onDrawModeChange('obstacle')} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawMode === 'obstacle' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>🧱 障碍</button>
            <button onClick={() => onDrawModeChange('erase')} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${drawMode === 'erase' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>🧹 擦除</button>
          </div>
          <button onClick={() => onDrawModeChange('none')} className="w-full px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">取消选择</button>
        </div>
      </details>

      {/* 分组3: 障碍物操作 */}
      <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" open>
        <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-red-50 dark:from-red-900/30 to-red-100 dark:to-red-800/20 text-xs font-bold text-red-800 dark:text-red-300 select-none hover:from-red-100 hover:to-red-150 dark:hover:from-red-900/40 dark:hover:to-red-800/30 transition-all duration-300 flex items-center gap-2">
          <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
          🧱 障碍物
          <span className="ml-auto px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-[10px]">工创赛</span>
        </summary>
        <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
          <div className="text-[11px] text-gray-500 p-2 bg-yellow-50 rounded border border-yellow-200">
            φ50mm | 通道中央 | 自动验证路径
          </div>
          <button onClick={() => onRandomObstacles(2)} className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-colors bg-gradient-to-r from-red-50 dark:from-red-900/300 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-sm">
            🎲 随机两个障碍物
          </button>
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => onRandomObstacles(1)} className="btn-secondary text-xs py-1.5">1个</button>
            <button onClick={() => onRandomObstacles(3)} className="btn-secondary text-xs py-1.5">3个</button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button onClick={onResetMap} className="btn-danger text-xs py-1.5">🗑️ 清空</button>
            <button onClick={() => onRandomObstacles(config.obstacles.length || 2)} className="btn-secondary text-xs py-1.5">🔄 重生成</button>
          </div>
          {config.obstacles.length > 0 && (
            <div className="text-[11px] text-gray-500 p-2 bg-gray-50 dark:bg-gray-900 rounded">
              当前: <span className="font-semibold text-red-500">{config.obstacles.length}</span> 个
            </div>
          )}
        </div>
      </details>

      {/* 分组4: 任务码 */}
      <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-purple-50 dark:from-purple-900/30 to-purple-100 dark:to-purple-800/20 text-xs font-bold text-purple-800 dark:text-purple-300 select-none hover:from-purple-100 hover:to-purple-150 dark:hover:from-purple-900/40 dark:hover:to-purple-800/30 transition-all duration-300 flex items-center gap-2">
          <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
          📋 任务码
          <span className="ml-auto px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-[10px]">QR</span>
        </summary>
        <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
          <div className="text-[11px] text-gray-500 p-2 bg-purple-50 rounded border border-purple-200">
            格式: 156+123+516+231
          </div>
          <input
            type="text"
            value={taskCode || ''}
            onChange={(e) => onTaskCodeChange?.(e.target.value)}
            placeholder="任务码"
            className="w-full px-2 py-1.5 rounded text-xs border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
          />
          {taskInfo && taskInfo.valid && (
            <div className="text-[11px] p-2 bg-purple-50 rounded border border-purple-100 space-y-1">
              <div className="font-semibold text-purple-800">解析结果:</div>
              <div className="p-1 bg-white dark:bg-gray-800 rounded text-[10px]">
                <div className="text-purple-700 font-semibold">第一批</div>
                <div className="flex items-center gap-0.5 flex-wrap mt-0.5">
                  {taskInfo.batch1.colorIds.map((cid, i) => (
                    <span key={i} className="inline-block w-4 h-4 rounded-full text-white text-[9px] font-bold text-center leading-4" style={{ backgroundColor: COLOR_CODE[String(cid)] || '#888' }}>{i+1}</span>
                  ))}
                  {taskInfo.batch1.positions.map((pos, i) => (
                    <span key={i} className="inline-block w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold text-center leading-4 border border-purple-200">{pos}</span>
                  ))}
                </div>
              </div>
              <div className="p-1 bg-white dark:bg-gray-800 rounded text-[10px]">
                <div className="text-purple-700 font-semibold">第二批</div>
                <div className="flex items-center gap-0.5 flex-wrap mt-0.5">
                  {taskInfo.batch2.colorIds.map((cid, i) => (
                    <span key={i} className="inline-block w-4 h-4 rounded-full text-white text-[9px] font-bold text-center leading-4" style={{ backgroundColor: COLOR_CODE[String(cid)] || '#888' }}>{i+1}</span>
                  ))}
                  {taskInfo.batch2.positions.map((pos, i) => (
                    <span key={i} className="inline-block w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold text-center leading-4 border border-purple-200">{pos}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* 分组5: 二维码位置 */}
      <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-indigo-50 dark:from-indigo-900/30 to-indigo-100 dark:to-indigo-800/20 text-xs font-bold text-indigo-800 dark:text-indigo-300 select-none hover:from-indigo-100 hover:to-indigo-150 dark:hover:from-indigo-900/40 dark:hover:to-indigo-800/30 transition-all duration-300 flex items-center gap-2">
          <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
          📍 二维码位置
          <span className="ml-auto px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-[10px]">现场随机</span>
        </summary>
        <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
          <div className="text-[11px] text-gray-500">
            范围 Y=22~26格
            <br />当前: <span className="font-mono font-semibold text-indigo-600">Y={qrBoardY}</span>
          </div>
          <button onClick={onRandomQrPosition} className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-colors bg-gradient-to-r from-indigo-50 dark:from-indigo-900/300 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-sm">
            🎲 随机位置
          </button>
          <div className="flex gap-1">
            <input
              type="number"
              min={22}
              max={26}
              value={qrBoardY || 24}
              onChange={(e) => onSetQrPosition?.(parseInt(e.target.value))}
              className="flex-1 px-2 py-1.5 rounded text-xs border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="Y(22-26)"
            />
            <button onClick={() => onSetQrPosition?.(qrBoardY || 24)} className="btn-secondary text-xs py-1.5 px-2">应用</button>
          </div>
        </div>
      </details>

      {/* 分组6: 路径规划 */}
      <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" open>
        <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-amber-50 dark:from-amber-900/30 to-amber-100 dark:to-amber-800/20 text-xs font-bold text-amber-800 dark:text-amber-300 select-none hover:from-amber-100 hover:to-amber-150 dark:hover:from-amber-900/40 dark:hover:to-amber-800/30 transition-all duration-300 flex items-center gap-2">
          <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
          🧠 路径规划
        </summary>
        <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
          {/* 单段规划 */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">单段规划</label>
            <button onClick={onPlanPath} className="btn-primary text-xs w-full py-2">A* 路径规划</button>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={onAnimatePath} disabled={!pathResult || isAnimating} className="btn-secondary text-xs py-1.5 disabled:opacity-50">▶️ 动画</button>
              <button onClick={onClearPath} disabled={!pathResult && racePathResults.length === 0} className="btn-secondary text-xs py-1.5 disabled:opacity-50">✖️ 清除</button>
            </div>
          </div>
          {/* 比赛流程规划 */}
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">比赛流程 <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">8段</span></label>
            <button onClick={onPlanRacePath} className="btn-primary text-xs w-full py-2 bg-purple-600 hover:bg-purple-700">🏁 比赛流程规划</button>
            <button onClick={onAnimateRacePath} disabled={racePathResults.length === 0 || isAnimating} className="btn-secondary text-xs w-full py-1.5 disabled:opacity-50">▶️ 比赛动画</button>
          </div>
          {/* 规划结果 */}
          {pathResult && racePathResults.length === 0 && (
            <div className="p-2 bg-green-50 rounded border border-green-100 text-[11px] space-y-0.5">
              <div className="font-semibold text-green-800">规划结果</div>
              <div className="flex justify-between"><span>格数:</span><span className="font-mono">{pathResult.length}</span></div>
              <div className="flex justify-between"><span>长度:</span><span className="font-mono">{pathResult.realLength}mm</span></div>
              <div className="flex justify-between"><span>耗时:</span><span className="font-mono">{pathResult.timeCost}ms</span></div>
            </div>
          )}
          {/* 比赛流程各段结果 */}
          {racePathResults.length > 0 && (
            <div className="p-2 bg-purple-50 rounded border border-purple-100 text-[11px] space-y-1 max-h-40 overflow-y-auto">
              <div className="font-semibold text-purple-800">流程路径</div>
              {racePathResults.map((result, idx) => (
                <div key={idx} className={`p-1 rounded ${idx === raceStepIndex && isAnimating ? 'bg-purple-200 ring-1 ring-purple-400' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: raceSteps[idx]?.color || '#888' }}></span>
                    <span className="flex-1">{idx+1}. {raceSteps[idx]?.name}</span>
                    <span className="font-mono text-purple-600">{result.length}格</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      {/* 分组7: 比赛统计 */}
      {stats && (
        <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-blue-50 dark:from-blue-900/30 to-blue-100 dark:to-blue-800/20 text-xs font-bold text-blue-800 dark:text-blue-300 select-none hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-900/40 dark:hover:to-blue-800/30 transition-all duration-300 flex items-center gap-2">
            <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
            📊 比赛统计
            {stats.timeEnd > 0 && <span className="ml-auto text-[10px] text-blue-600 dark:text-blue-400">{((stats.timeEnd - stats.timeStart) / 1000).toFixed(1)}s</span>}
          </summary>
          <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded border border-green-200 text-center">
                <div className="text-green-700 font-bold">{stats.grabCount}</div>
                <div className="text-green-600">夹取</div>
              </div>
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded border border-blue-200 text-center">
                <div className="text-blue-700 font-bold">{stats.placeCount}</div>
                <div className="text-blue-600">放置</div>
              </div>
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded border border-amber-200 col-span-2 text-center">
                <div className="text-amber-700 font-bold">{stats.ringScore}</div>
                <div className="text-amber-600">环数分</div>
              </div>
            </div>
            <div className="text-center p-1.5 bg-gray-800 dark:bg-gray-900/80 rounded border border-blue-300">
              <span className="text-xs text-blue-700">总分：</span>
              <span className="text-xl font-black text-blue-600">{stats.total}</span>
            </div>
            {stats.timeEnd === 0 && (stats.grabCount > 0 || stats.placeCount > 0) && (
              <div className="text-[11px] text-blue-600 text-center animate-pulse">⏳ 比赛进行中...</div>
            )}
            {stats.timeEnd > 0 && (
              <div className="text-[11px] text-green-600 text-center font-medium">✅ 完成！{((stats.timeEnd - stats.timeStart) / 1000).toFixed(1)}s</div>
            )}
          </div>
        </details>
      )}

      {/* 分组8: 场地区域 */}
      <details className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <summary className="cursor-pointer px-3 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 text-xs font-bold text-gray-800 dark:text-gray-200 select-none hover:from-gray-100 hover:to-gray-150 dark:hover:from-gray-800/70 dark:hover:to-gray-700/50 transition-all duration-300 flex items-center gap-2">
          <span className="transition-transform duration-300 group-open:rotate-90">▶</span>
          🏭 场地区域
        </summary>
        <div className="p-3 space-y-1 text-[11px] text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          {config.zones.map((zone: Zone, idx: number) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: zone.color, borderColor: zone.isObstacle ? '#dc2626' : '#94a3b8' }}></span>
              <span className="flex-1 truncate">{zone.label}</span>
              <span className="font-mono text-[10px]">{zone.width}×{zone.height}格</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default ControlPanel;
