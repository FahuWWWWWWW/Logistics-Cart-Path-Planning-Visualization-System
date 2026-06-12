import React, { useState } from 'react';
import { PROTOCOL_DESC, PROTOCOL_VERSION, FrameTypeDesc } from '../types';

interface ProtocolPanelProps {
  onClose?: () => void;
}

const ProtocolPanel: React.FC<ProtocolPanelProps> = ({ onClose }) => {
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [filterDir, setFilterDir] = useState<'all' | 'TX' | 'RX'>('all');

  const filtered = PROTOCOL_DESC.filter(d => filterDir === 'all' || d.direction === filterDir);
  const txCount = PROTOCOL_DESC.filter(d => d.direction === 'TX').length;
  const rxCount = PROTOCOL_DESC.filter(d => d.direction === 'RX').length;

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>📜</span> 通信协议文档
          <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
            v{PROTOCOL_VERSION}
          </span>
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-500 text-lg">✕</button>
        )}
      </div>

      {/* 帧格式说明 */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-xs font-bold text-blue-800 mb-1">📡 数据帧格式</h4>
        <code className="block p-2 bg-white dark:bg-gray-800 rounded text-xs text-gray-800 dark:text-gray-200 border border-blue-100 overflow-x-auto">
          {'{"ver":"1.0.0","type":"帧类型","seq":帧序号,"ts":时间戳ms,"data":{...}}\\n'}
        </code>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700 dark:text-blue-400">
          <div><span className="font-semibold">ver</span>: 协议版本号</div>
          <div><span className="font-semibold">type</span>: 帧类型标识</div>
          <div><span className="font-semibold">seq</span>: 帧序号（递增）</div>
          <div><span className="font-semibold">ts</span>: 发送时间戳(ms)</div>
          <div className="col-span-2"><span className="font-semibold">data</span>: 帧数据（各类型不同）</div>
        </div>
      </div>

      {/* 基本参数 */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">⚙️ 默认参数</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div>波特率: <span className="font-mono font-semibold">115200</span></div>
          <div>数据位: <span className="font-mono font-semibold">8</span></div>
          <div>停止位: <span className="font-mono font-semibold">1</span></div>
          <div>校验位: <span className="font-mono font-semibold">无</span></div>
          <div>心跳间隔: <span className="font-mono font-semibold">1000ms</span></div>
          <div>状态上报: <span className="font-mono font-semibold">200ms</span></div>
          <div>坐标单位: <span className="font-mono font-semibold">格(50mm)</span></div>
          <div>数据编码: <span className="font-mono font-semibold">UTF-8 JSON</span></div>
        </div>
      </div>

      {/* 坐标系说明 */}
      <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
        <h4 className="text-xs font-bold text-green-800 dark:text-green-300 mb-1">🗺️ 坐标系定义</h4>
        <div className="text-xs text-green-700 dark:text-green-400 space-y-1">
          <div>• 原点(0,0)在场地左上角</div>
          <div>• X轴向右递增(0~47)，Y轴向下递增(0~47)</div>
          <div>• 1格 = 50mm，场地共 48×48 = 2400×2400mm</div>
          <div>• 角度: 正东为0°，顺时针递增(0~359°)</div>
        </div>
      </div>

      {/* 任务码格式说明 */}
      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
        <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 mb-1">📝 任务码格式（2027工创赛）</h4>
        <div className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
          <div>• 格式：<span className="font-mono font-semibold">ABC+DEF+GHI+JKL</span></div>
          <div>• 第1组(ABC)：第一批3个物料的颜色顺序（1红2黄3蓝4绿5黑6浅蓝）</div>
          <div>• 第2组(DEF)：第一批物料在粗加工区/暂存区的圆环编号（1-3）</div>
          <div>• 第3组(GHI)：第二批3个物料的颜色顺序</div>
          <div>• 第4组(JKL)：第二批物料在粗加工区的圆环编号（1-3）</div>
          <div>• 示例：<span className="font-mono">156+123+516+231</span></div>
        </div>
      </div>

      {/* 环数分规则 */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">🎯 环数分规则</h4>
        <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
          <div>• 上位机根据 <span className="font-mono font-semibold">ring_level</span> 独立查表计算环数分</div>
          <div>• 下位机上报 <span className="font-mono font-semibold">ring_score</span>，双方互相比对验证</div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            <span className="px-1 py-0.5 bg-red-500 text-white rounded text-center text-[10px]">1环:15</span>
            <span className="px-1 py-0.5 bg-orange-500 text-white rounded text-center text-[10px]">2环:10</span>
            <span className="px-1 py-0.5 bg-yellow-500 text-white rounded text-center text-[10px]">3环:7</span>
            <span className="px-1 py-0.5 bg-green-500 text-white rounded text-center text-[10px]">4环:5</span>
            <span className="px-1 py-0.5 bg-blue-500 text-white rounded text-center text-[10px]">5环:3</span>
            <span className="px-1 py-0.5 bg-gray-50 dark:bg-gray-900 text-white rounded text-center text-[10px]">6环:1</span>
            <span className="px-1 py-0.5 bg-gray-400 text-white rounded text-center text-[10px] col-span-2">6环外:0</span>
          </div>
        </div>
      </div>

      {/* 方向过滤 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterDir('all')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            filterDir === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
          }`}
        >
          全部 ({PROTOCOL_DESC.length})
        </button>
        <button
          onClick={() => setFilterDir('TX')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            filterDir === 'TX' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
          }`}
        >
          📤 上位机→下位机 ({txCount})
        </button>
        <button
          onClick={() => setFilterDir('RX')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            filterDir === 'RX' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
          }`}
        >
          📥 下位机→上位机 ({rxCount})
        </button>
      </div>

      {/* 帧类型列表 */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filtered.map((desc) => (
          <FrameTypeCard
            key={desc.type}
            desc={desc}
            isExpanded={expandedType === desc.type}
            onToggle={() => setExpandedType(expandedType === desc.type ? null : desc.type)}
          />
        ))}
      </div>

      {/* 错误码定义 */}
      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
        <h4 className="text-xs font-bold text-red-800 mb-1">⚠️ 错误码定义</h4>
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">101</span><span className="text-red-600">路径规划失败（目标不可达）</span></div>
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">102</span><span className="text-red-600">路径执行失败（遇到新障碍物）</span></div>
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">201</span><span className="text-red-600">抓取失败（物料不存在或位置偏移）</span></div>
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">202</span><span className="text-red-600">放置失败（位置不正确或码垛不稳）</span></div>
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">301</span><span className="text-red-600">二维码读取失败</span></div>
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">401</span><span className="text-red-600">电机过流/堵转</span></div>
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">402</span><span className="text-red-600">传感器异常</span></div>
          <div className="flex gap-2"><span className="font-mono text-red-700 font-semibold w-16">501</span><span className="text-red-600">电量不足（低于20%）</span></div>
        </div>
      </div>
    </div>
  );
};

// 单个帧类型卡片
const FrameTypeCard: React.FC<{
  desc: FrameTypeDesc;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ desc, isExpanded, onToggle }) => {
  const dirColors = {
    TX: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
    RX: { bg: 'bg-green-50 dark:bg-green-900/40', border: 'border-green-200 dark:border-green-800', badge: 'bg-green-500', text: 'text-green-700 dark:text-green-300' },
  };
  const colors = dirColors[desc.direction];

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden transition-all`}>
      {/* 标题行 */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:opacity-80"
        onClick={onToggle}
      >
        <span className={`px-1.5 py-0.5 rounded text-white text-xs font-bold ${colors.badge}`}>
          {desc.direction}
        </span>
        <code className="font-mono text-sm font-bold text-gray-800 dark:text-white">{desc.type}</code>
        <span className={`text-xs font-medium ${colors.text}`}>{desc.name}</span>
        <span className="ml-auto text-gray-400 dark:text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-gray-700/50">
          {/* 描述 */}
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{desc.description}</p>

          {/* 数据字段表格 */}
          {desc.dataFields.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">数据字段 (data)</h5>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">字段</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">类型</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300">必填</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {desc.dataFields.map((field, idx) => (
                    <tr key={idx} className="bg-gray-50 dark:bg-gray-800/30">
                      <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-mono text-indigo-700">{field.field}</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-mono text-gray-500">{field.type}</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-center">
                        {field.required ? (
                          <span className="text-red-500 font-bold">*</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-600 dark:text-gray-400">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 示例 */}
          <div>
            <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">示例</h5>
            <pre className="p-2 bg-gray-900 dark:bg-gray-950 rounded text-xs text-green-700 dark:text-green-400 dark:text-green-300 overflow-x-auto whitespace-pre-wrap break-all">
              {desc.example}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolPanel;
