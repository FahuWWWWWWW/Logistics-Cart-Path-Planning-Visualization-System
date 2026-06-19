import React, { useState, useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onExportLogs: () => void;
}

// 尝试格式化 JSON 字符串
const formatData = (data: string): { formatted: string; isJSON: boolean } => {
  try {
    const parsed = JSON.parse(data);
    return {
      formatted: JSON.stringify(parsed, null, 2),
      isJSON: true,
    };
  } catch {
    return { formatted: data, isJSON: false };
  }
};

// 获取帧类型对应的颜色、图标和背景色
const getFrameStyle = (frameType?: string): { icon: string; color: string; bgColor: string } => {
  if (!frameType) return { icon: '📄', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800' };
  
  const type = frameType.toUpperCase();
  
  // TX 命令类型 - 蓝色系
  if (['START', 'SET_TARGET', 'SET_PATH', 'SET_OBSTACLES', 'SET_SPEED', 'SET_PARKING', 'SET_TASK'].includes(type)) {
    return { icon: '🚀', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/30' };
  }
  if (['EMERGENCY_STOP', 'RESET', 'STOP'].includes(type)) {
    return { icon: '🛑', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-50 dark:bg-red-900/30' };
  }
  if (['GRAB', 'PLACE'].includes(type)) {
    return { icon: '🤖', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-50 dark:bg-green-900/30' };
  }
  if (['QR_READ', 'QR_TASK', 'TASK_CODE'].includes(type)) {
    return { icon: '📷', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-50 dark:bg-purple-900/30' };
  }
  if (['HEARTBEAT'].includes(type)) {
    return { icon: '💓', color: 'text-cyan-700 dark:text-cyan-300', bgColor: 'bg-cyan-50 dark:bg-cyan-900/30' };
  }
  
  // RX 上报类型 - 绿色系
  if (['STATUS', 'POSITION', 'SENSOR_DATA'].includes(type)) {
    return { icon: '📡', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-50 dark:bg-green-900/30' };
  }
  if (['ACK', 'HEARTBEAT_ACK'].includes(type)) {
    return { icon: '✅', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30' };
  }
  if (['ERROR'].includes(type)) {
    return { icon: '❌', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-50 dark:bg-red-900/30' };
  }
  if (['ARRIVED', 'GRABBED', 'PLACED'].includes(type)) {
    return { icon: '🎯', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-50 dark:bg-amber-900/30' };
  }
  if (['OBSTACLE', 'PATH_RESULT'].includes(type)) {
    return { icon: '📊', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-50 dark:bg-indigo-900/30' };
  }
  
  return { icon: '📄', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800' };
};

const LogPanel: React.FC<LogPanelProps> = ({
  logs,
  onClearLogs,
  onExportLogs,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'RX' | 'TX'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.direction !== filter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        log.data.toLowerCase().includes(term) ||
        log.raw.toLowerCase().includes(term) ||
        (log.frameType && log.frameType.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // 切换日志展开/折叠
  const toggleExpand = (id: number) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 渲染单条日志
  const renderLogEntry = (log: LogEntry) => {
    const { formatted, isJSON } = formatData(log.data);
    const isExpanded = expandedLogs.has(log.id);
    const style = getFrameStyle(log.frameType);
    const isRX = log.direction === 'RX';
    
    return (
      <div
        key={log.id}
        className={`mb-1 rounded-lg border transition-all duration-200 ${
          isRX 
            ? 'bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' 
            : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'
        } hover:shadow-md hover:border-opacity-100`}
      >
        {/* 日志头部 - 始终显示 */}
        <div
          className={`px-2 py-1.5 flex items-start gap-2 ${isJSON ? 'cursor-pointer' : ''}`}
          onClick={() => isJSON && toggleExpand(log.id)}
        >
          {/* 时间戳 */}
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap mt-0.5 select-none">
            {log.timestamp}
          </span>
          
          {/* 方向标识 - 更明显的颜色 */}
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm ${
              isRX
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {log.direction}
          </span>
          
          {/* 帧类型图标 */}
          <span className="text-sm">{style.icon}</span>
          
          {/* 帧类型标签 */}
          {log.frameType && (
            <span className={`text-xs font-semibold ${style.color} whitespace-nowrap px-1.5 py-0.5 rounded bg-opacity-20 ${style.bgColor}`}>
              {log.frameType}
            </span>
          )}
          
          {/* 简要信息 - JSON 时显示一行摘要 */}
          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate ml-1">
            {isJSON ? (
              <span className="opacity-70">
                {log.frameType || '数据帧'} · {formatted.split('\n').length} 行
              </span>
            ) : (
              <span className="font-mono text-gray-700 dark:text-gray-300">{log.data}</span>
            )}
          </span>
          
          {/* 展开/折叠按钮 */}
          {isJSON && (
            <button
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-1"
              onClick={(e) => { e.stopPropagation(); toggleExpand(log.id); }}
              title={isExpanded ? '折叠' : '展开详情'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
        
        {/* 日志详情 - 展开时显示 */}
        {isExpanded && isJSON && (
          <div className="px-2 pb-2 pt-0 animate-fadeIn">
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 rounded-md p-3 overflow-x-auto font-mono whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-inner">
              {formatted}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-2 min-h-0">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>📝</span> 串口日志
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
            {filteredLogs.length} / {logs.length} 条
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onExportLogs}
            disabled={logs.length === 0}
            className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            💾 导出
          </button>
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            🗑️ 清空
          </button>
        </div>
      </div>

      {/* 过滤和搜索选项 */}
      <div className="space-y-2">
        {/* 方向过滤 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            全部 ({logs.length})
          </button>
          <button
            onClick={() => setFilter('RX')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === 'RX'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            📥 RX ({logs.filter(l => l.direction === 'RX').length})
          </button>
          <button
            onClick={() => setFilter('TX')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === 'TX'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            📤 TX ({logs.filter(l => l.direction === 'TX').length})
          </button>
          <label className="ml-auto flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>自动滚动</span>
          </label>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 搜索日志（支持帧类型、关键词、JSON 字段）..."
            className="input-field w-full text-xs pl-8 pr-8"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title="清除搜索"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 日志显示区域 */}
      <div
        ref={logContainerRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-1 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const isAtBottom =
            target.scrollHeight - target.scrollTop - target.clientHeight < 10;
          setAutoScroll(isAtBottom);
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8 text-sm">
            {searchTerm ? (
              <div>
                <div className="text-4xl mb-2">🔍</div>
                <div>没有找到匹配的日志</div>
                <div className="text-xs text-gray-400 mt-1">尝试使用其他关键词搜索</div>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📭</div>
                <div>{filter === 'all' ? '暂无日志数据' : `暂无 ${filter} 数据`}</div>
                <div className="text-xs text-gray-400 mt-1">连接串口并发送/接收数据后此处会显示日志</div>
              </div>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => renderLogEntry(log))
        )}
      </div>

      {/* 日志统计和操作 */}
      <div className="text-xs text-gray-500 flex gap-4 pt-2 border-t border-gray-200 dark:border-gray-700 items-center">
        <span className="flex items-center gap-1">
          📥 接收: <span className="text-green-600 dark:text-green-400 font-semibold">
            {logs.filter((l) => l.direction === 'RX').length}
          </span>
        </span>
        <span className="flex items-center gap-1">
          📤 发送: <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {logs.filter((l) => l.direction === 'TX').length}
          </span>
        </span>
        <span className="flex items-center gap-1">
          📊 已过滤: <span className="text-gray-700 dark:text-gray-300 font-semibold">{filteredLogs.length}</span>
        </span>
        <span className="ml-auto flex items-center gap-1">
          📈 总计: <span className="text-gray-900 dark:text-gray-100 font-bold">{logs.length}</span>
        </span>
      </div>
    </div>
  );
};

export default LogPanel;
