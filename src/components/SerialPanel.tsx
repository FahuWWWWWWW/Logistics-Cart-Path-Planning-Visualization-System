import React, { useState, useEffect } from 'react';
import { SerialManager } from '../utils/serial';
import { SerialState, SerialFrame } from '../types';

interface SerialPanelProps {
  serialManager: SerialManager;
  onReceiveFrame: (frame: SerialFrame) => void;
  parkingZone: 1 | 2;
  obstacles: { x: number; y: number }[];
  racePathResults: { path: { x: number; y: number }[]; stepIndex: number; stepName: string }[];
  onShowProtocol: () => void;
}

const SerialPanel: React.FC<SerialPanelProps> = ({
  serialManager,
  onReceiveFrame,
  parkingZone,
  obstacles,
  racePathResults,
  onShowProtocol,
}) => {
  const [serialConfig, setSerialConfig] = useState<SerialState>({
    isConnected: false,
    port: '',
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
  });
  const [command, setCommand] = useState<string>('');
  const [targetCoord, setTargetCoord] = useState({ x: 24, y: 5 });
  const [speedConfig, setSpeedConfig] = useState({ speed: 500, turnSpeed: 90 });
  const [grabConfig, setGrabConfig] = useState({ materialId: 1, color: 'red', fromZone: 'material' });
  const [placeConfig, setPlaceConfig] = useState({ materialId: 1, color: 'red', toZone: 'rough', slot: 1, isStack: false });
  const [activeTab, setActiveTab] = useState<'connect' | 'commands' | 'race'>('connect');

  // 注册回调
  useEffect(() => {
    serialManager.onData(onReceiveFrame);
    serialManager.onStatusChange((connected: boolean) => {
      setSerialConfig((prev: SerialState) => ({ ...prev, isConnected: connected }));
    });
  }, [serialManager, onReceiveFrame]);

  // 连接串口
  const handleConnect = async () => {
    try {
      await serialManager.connect(serialConfig);
    } catch (error) {
      alert(`连接失败: ${error}`);
    }
  };

  // 断开连接
  const handleDisconnect = async () => {
    try {
      await serialManager.disconnect();
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  };

  // 发送原始命令
  const handleSend = async () => {
    if (!command.trim()) return;
    try {
      await serialManager.send(command);
      setCommand('');
    } catch (error) {
      alert(`发送失败: ${error}`);
    }
  };

  // 一键下发比赛流程路径
  const handleSendRacePaths = async () => {
    if (racePathResults.length === 0) {
      alert('请先规划比赛流程路径！');
      return;
    }
    try {
      // 先发送启动指令
      await serialManager.sendStart(parkingZone);
      await new Promise(r => setTimeout(r, 100));

      // 发送障碍物信息
      if (obstacles.length > 0) {
        await serialManager.sendSetObstacles(obstacles, 50);
        await new Promise(r => setTimeout(r, 100));
      }

      // 逐段下发路径
      for (let i = 0; i < racePathResults.length; i++) {
        const seg = racePathResults[i];
        await serialManager.sendSetPath(seg.path, seg.stepIndex, seg.stepName);
        await new Promise(r => setTimeout(r, 50));
      }
    } catch (error) {
      alert(`下发失败: ${error}`);
    }
  };

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <span>🔌</span> 串口通信
        <span
          className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
            serialConfig.isConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}
        >
          {serialConfig.isConnected ? '● 已连接' : '○ 未连接'}
        </span>
      </h3>

      {/* 协议文档按钮 */}
      <button
        onClick={onShowProtocol}
        className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800"
      >
        📜 查看完整通信协议文档
      </button>

      {/* 选项卡 */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {(['connect', 'commands', 'race'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
            }`}
          >
            {tab === 'connect' ? '🔗 连接' : tab === 'commands' ? '📡 命令' : '🏁 比赛'}
          </button>
        ))}
      </div>

      {/* ===== 连接设置 Tab ===== */}
      {activeTab === 'connect' && (
        <div className="space-y-3">
          {/* 串口参数 */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">波特率</label>
                <select
                  value={serialConfig.baudRate}
                  onChange={(e) => setSerialConfig((prev: SerialState) => ({ ...prev, baudRate: parseInt(e.target.value) }))}
                  className="select-field"
                  disabled={serialConfig.isConnected}
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">数据位</label>
                <select
                  value={serialConfig.dataBits}
                  onChange={(e) => setSerialConfig((prev: SerialState) => ({ ...prev, dataBits: parseInt(e.target.value) }))}
                  className="select-field"
                  disabled={serialConfig.isConnected}
                >
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">停止位</label>
                <select
                  value={serialConfig.stopBits}
                  onChange={(e) => setSerialConfig((prev: SerialState) => ({ ...prev, stopBits: parseInt(e.target.value) }))}
                  className="select-field"
                  disabled={serialConfig.isConnected}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">校验位</label>
                <select
                  value={serialConfig.parity}
                  onChange={(e) => setSerialConfig((prev: SerialState) => ({ ...prev, parity: e.target.value as 'none' | 'even' | 'odd' }))}
                  className="select-field"
                  disabled={serialConfig.isConnected}
                >
                  <option value="none">无</option>
                  <option value="even">偶校验</option>
                  <option value="odd">奇校验</option>
                </select>
              </div>
            </div>
          </div>

          {/* 连接控制 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleConnect}
              disabled={serialConfig.isConnected}
              className="btn-primary text-sm"
            >
              🔗 连接串口
            </button>
            <button
              onClick={handleDisconnect}
              disabled={!serialConfig.isConnected}
              className="btn-danger text-sm"
            >
              ❌ 断开
            </button>
          </div>

          {/* 紧急停止 */}
          <button
            onClick={async () => {
              try { await serialManager.sendEmergencyStop(); }
              catch (e) { alert(`发送失败: ${e}`); }
            }}
            disabled={!serialConfig.isConnected}
            className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors bg-red-600 hover:bg-red-700 text-white shadow-md disabled:opacity-50"
          >
            🚨 紧急停止
          </button>

          {/* 自定义命令 */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">自定义命令</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder='{"type":"START",...}'
                disabled={!serialConfig.isConnected}
                className="input-field flex-1 font-mono text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              />
              <button
                onClick={handleSend}
                disabled={!serialConfig.isConnected || !command.trim()}
                className="btn-primary text-xs whitespace-nowrap"
              >
                📤 发送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 命令面板 Tab ===== */}
      {activeTab === 'commands' && (
        <div className="space-y-3">
          {/* 启动指令 */}
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="text-xs font-bold text-blue-800 mb-2">🚀 启动与控制</h5>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  try { await serialManager.sendStart(parkingZone, 'auto'); }
                  catch (e) { alert(`发送失败: ${e}`); }
                }}
                disabled={!serialConfig.isConnected}
                className="w-full btn-primary text-xs"
              >
                START - 从启停区{parkingZone}启动
              </button>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try { await serialManager.sendReqStatus(); }
                    catch (e) { alert(`发送失败: ${e}`); }
                  }}
                  disabled={!serialConfig.isConnected}
                  className="flex-1 btn-secondary text-xs"
                >
                  REQ_STATUS
                </button>
                <button
                  onClick={async () => {
                    try { await serialManager.sendReset(); }
                    catch (e) { alert(`发送失败: ${e}`); }
                  }}
                  disabled={!serialConfig.isConnected}
                  className="flex-1 btn-danger text-xs"
                >
                  RESET
                </button>
              </div>
            </div>
          </div>

          {/* 目标坐标 */}
          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
            <h5 className="text-xs font-bold text-amber-800 mb-2">🎯 SET_TARGET - 设置目标</h5>
            <div className="flex gap-2 items-center mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">X:</span>
              <input
                type="number"
                value={targetCoord.x}
                onChange={(e) => setTargetCoord(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                className="input-field w-14 text-xs"
                disabled={!serialConfig.isConnected}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Y:</span>
              <input
                type="number"
                value={targetCoord.y}
                onChange={(e) => setTargetCoord(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                className="input-field w-14 text-xs"
                disabled={!serialConfig.isConnected}
              />
              <button
                onClick={async () => {
                  try { await serialManager.sendSetTarget(targetCoord.x, targetCoord.y); }
                  catch (e) { alert(`发送失败: ${e}`); }
                }}
                disabled={!serialConfig.isConnected}
                className="btn-primary text-xs whitespace-nowrap"
              >
                发送
              </button>
            </div>
            {/* 快速目标按钮 */}
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: 'QR区', x: 44, y: 24 },
                { label: '原料区', x: 24, y: 5 },
                { label: '粗加工区', x: 24, y: 43 },
                { label: '暂存区', x: 5, y: 20 },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={async () => {
                    setTargetCoord({ x: t.x, y: t.y });
                    try { await serialManager.sendSetTarget(t.x, t.y, t.label); }
                    catch (e) { alert(`发送失败: ${e}`); }
                  }}
                  disabled={!serialConfig.isConnected}
                  className="px-2 py-1 rounded text-xs bg-amber-50 dark:bg-gray-800 border border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  {t.label} ({t.x},{t.y})
                </button>
              ))}
            </div>
          </div>

          {/* 速度设置 */}
          <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
            <h5 className="text-xs font-bold text-purple-800 mb-2">⚡ SET_SPEED - 速度</h5>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">直线:</span>
              <input
                type="number"
                value={speedConfig.speed}
                onChange={(e) => setSpeedConfig(prev => ({ ...prev, speed: parseInt(e.target.value) || 0 }))}
                className="input-field w-16 text-xs"
                disabled={!serialConfig.isConnected}
              />
              <span className="text-xs text-gray-500">mm/s</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">转弯:</span>
              <input
                type="number"
                value={speedConfig.turnSpeed}
                onChange={(e) => setSpeedConfig(prev => ({ ...prev, turnSpeed: parseInt(e.target.value) || 0 }))}
                className="input-field w-14 text-xs"
                disabled={!serialConfig.isConnected}
              />
              <span className="text-xs text-gray-500">°/s</span>
            </div>
            <button
              onClick={async () => {
                try { await serialManager.sendSetSpeed(speedConfig.speed, speedConfig.turnSpeed); }
                catch (e) { alert(`发送失败: ${e}`); }
              }}
              disabled={!serialConfig.isConnected}
              className="w-full mt-1 btn-primary text-xs"
            >
              SET_SPEED
            </button>
          </div>

          {/* 抓取/放置 */}
          <div className="p-2 bg-green-50 rounded-lg border border-green-200">
            <h5 className="text-xs font-bold text-green-800 mb-2">🤖 物料操作</h5>
            <div className="space-y-2">
              {/* 抓取 */}
              <div className="flex gap-1 items-center">
                <span className="text-xs font-semibold text-green-700">GRAB</span>
                <select
                  value={grabConfig.materialId}
                  onChange={(e) => setGrabConfig(prev => ({ ...prev, materialId: parseInt(e.target.value) }))}
                  className="select-field flex-1 text-xs"
                >
                  {[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>物料{i}</option>)}
                </select>
                <select
                  value={grabConfig.color}
                  onChange={(e) => setGrabConfig(prev => ({ ...prev, color: e.target.value }))}
                  className="select-field flex-1 text-xs"
                >
                  {['red', 'blue', 'green', 'yellow'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  onClick={async () => {
                    try { await serialManager.sendGrab(grabConfig.materialId, grabConfig.color, grabConfig.fromZone); }
                    catch (e) { alert(`发送失败: ${e}`); }
                  }}
                  disabled={!serialConfig.isConnected}
                  className="btn-primary text-xs"
                >
                  抓取
                </button>
              </div>
              {/* 放置 */}
              <div className="flex gap-1 items-center">
                <span className="text-xs font-semibold text-green-700">PLACE</span>
                <select
                  value={placeConfig.toZone}
                  onChange={(e) => setPlaceConfig(prev => ({ ...prev, toZone: e.target.value }))}
                  className="select-field flex-1 text-xs"
                >
                  <option value="rough">粗加工区</option>
                  <option value="temp">暂存区</option>
                </select>
                <select
                  value={placeConfig.slot}
                  onChange={(e) => setPlaceConfig(prev => ({ ...prev, slot: parseInt(e.target.value) }))}
                  className="select-field w-14 text-xs"
                >
                  <option value={1}>槽1</option>
                  <option value={2}>槽2</option>
                  <option value={3}>槽3</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={placeConfig.isStack}
                    onChange={(e) => setPlaceConfig(prev => ({ ...prev, isStack: e.target.checked }))}
                    className="rounded"
                  />
                  码垛
                </label>
                <button
                  onClick={async () => {
                    try { await serialManager.sendPlace(placeConfig.materialId, placeConfig.color, placeConfig.toZone, placeConfig.slot, placeConfig.isStack); }
                    catch (e) { alert(`发送失败: ${e}`); }
                  }}
                  disabled={!serialConfig.isConnected}
                  className="btn-primary text-xs"
                >
                  放置
                </button>
              </div>
            </div>
          </div>

          {/* 障碍物 & QR */}
          <div className="p-2 bg-red-50 rounded-lg border border-red-200">
            <h5 className="text-xs font-bold text-red-800 mb-2">📡 障碍物 & 二维码</h5>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  try { await serialManager.sendSetObstacles(obstacles, 50); }
                  catch (e) { alert(`发送失败: ${e}`); }
                }}
                disabled={!serialConfig.isConnected || obstacles.length === 0}
                className="btn-secondary text-xs"
              >
                SET_OBSTACLES ({obstacles.length})
              </button>
              <button
                onClick={async () => {
                  try { await serialManager.sendQrRead(parkingZone); }
                  catch (e) { alert(`发送失败: ${e}`); }
                }}
                disabled={!serialConfig.isConnected}
                className="btn-secondary text-xs"
              >
                QR_READ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 比赛流程 Tab ===== */}
      {activeTab === 'race' && (
        <div className="space-y-3">
          {/* 一键下发比赛路径 */}
          <button
            onClick={handleSendRacePaths}
            disabled={!serialConfig.isConnected || racePathResults.length === 0}
            className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors bg-gradient-to-r from-indigo-50 dark:from-indigo-900/300 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md disabled:opacity-50"
          >
            🏁 一键下发完整比赛路径
            <span className="block text-xs font-normal mt-0.5 opacity-90">
              START + SET_OBSTACLES + SET_PATH (共{racePathResults.length}段)
            </span>
          </button>

          {/* 比赛流程概览 */}
          <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">📋 比赛流程路径 ({racePathResults.length}段)</h5>
            {racePathResults.length === 0 ? (
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">请先规划比赛流程路径</div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {racePathResults.map((seg, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{seg.stepName}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{seg.path.length}点</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 逐步下发 */}
          {racePathResults.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300">⏩ 逐步下发</h5>
              {racePathResults.map((seg, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    try { await serialManager.sendSetPath(seg.path, seg.stepIndex, seg.stepName); }
                    catch (e) { alert(`发送失败: ${e}`); }
                  }}
                  disabled={!serialConfig.isConnected}
                  className="w-full px-2 py-1.5 rounded text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-gray-900 disabled:opacity-50 text-left"
                >
                  <span className="font-bold text-indigo-600">步骤{idx + 1}</span> {seg.stepName}
                  <span className="text-gray-400 dark:text-gray-500 ml-1">({seg.path.length}点)</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SerialPanel;
