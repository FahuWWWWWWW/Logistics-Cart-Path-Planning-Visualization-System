import React, { useState, useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onExportLogs: () => void;
}

const LogPanel: React.FC<LogPanelProps> = ({
  logs,
  onClearLogs,
  onExportLogs,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'RX' | 'TX'>('all');

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.direction === filter;
  });

  // 获取日志行样式
  const getLogStyle = (direction: string) => {
    return direction === 'RX'
      ? 'text-green-600 bg-green-50'
      : 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="flex flex-col h-full space-y-2 min-h-0">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>📝</span> 串口日志
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
            {logs.length} 条
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onExportLogs}
            disabled={logs.length === 0}
            className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700 disabled:opacity-50"
          >
            💾 导出
          </button>
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            🗑️ 清空
          </button>
        </div>
      </div>

      {/* 过滤选项 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('RX')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'RX'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
          }`}
        >
          📥 RX (接收)
        </button>
        <button
          onClick={() => setFilter('TX')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'TX'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700'
          }`}
        >
          📤 TX (发送)
        </button>
        <label className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded"
          />
          自动滚动
        </label>
      </div>

      {/* 日志显示区域 - flex-1 自适应高度 */}
      <div
        ref={logContainerRef}
        className="flex-1 min-h-0 overflow-y-auto bg-gray-100 dark:bg-gray-900 rounded-lg p-2 font-mono text-xs"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const isAtBottom =
            target.scrollHeight - target.scrollTop - target.clientHeight < 10;
          setAutoScroll(isAtBottom);
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {filter === 'all' ? '暂无日志数据' : `暂无 ${filter} 数据`}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`mb-0.5 px-2 py-0.5 rounded flex items-start gap-2 ${getLogStyle(
                log.direction
              )}`}
            >
              <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">{log.timestamp}</span>
              <span
                className={`font-bold whitespace-nowrap ${
                  log.direction === 'RX' ? 'text-green-400' : 'text-blue-400'
                }`}
              >
                {log.direction}
              </span>
              <span className="text-gray-800 dark:text-gray-200 break-all">{log.data}</span>
            </div>
          ))
        )}
      </div>

      {/* 日志统计 */}
      <div className="text-xs text-gray-500 flex gap-4">
        <span>
          接收: <span className="text-green-600 font-medium">
            {logs.filter((l) => l.direction === 'RX').length}
          </span>
        </span>
        <span>
          发送: <span className="text-blue-600 font-medium">
            {logs.filter((l) => l.direction === 'TX').length}
          </span>
        </span>
        <span>
          总计: <span className="text-gray-800 dark:text-gray-200 font-medium">{logs.length}</span>
        </span>
      </div>
    </div>
  );
};

export default LogPanel;
