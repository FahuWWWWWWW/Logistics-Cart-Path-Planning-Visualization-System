import React from 'react';
import LogPanel from './LogPanel';
import FloatingPanel from './FloatingPanel';

interface FloatingLogPanelProps {
  logs: any[];
  onClearLogs: () => void;
  onExportLogs: () => void;
  onClose: () => void;
}

const FloatingLogPanel: React.FC<FloatingLogPanelProps> = ({
  logs,
  onClearLogs,
  onExportLogs,
  onClose,
}) => {
  const headerExtra = logs.length > 0 ? (
    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
      {logs.length}
    </span>
  ) : undefined;

  return (
    <FloatingPanel
      title="运行日志"
      icon="📋"
      onClose={onClose}
      initialSize={{ width: 500, height: 400 }}
      headerExtra={headerExtra}
    >
      <div className="flex-1 flex flex-col min-h-0 p-2">
        <LogPanel
          logs={logs}
          onClearLogs={onClearLogs}
          onExportLogs={onExportLogs}
        />
      </div>
    </FloatingPanel>
  );
};

export default FloatingLogPanel;
