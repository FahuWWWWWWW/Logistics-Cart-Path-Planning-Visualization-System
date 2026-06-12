import {
  SerialState,
  SerialFrame,
  LogEntry,
  ProtocolFrame,
  TxFrameType,
  RxFrameType,
  PROTOCOL_VERSION,
  FrameType,
} from '../types';

/**
 * 串口通信管理器 v2.0
 * 封装 Web Serial API，实现完整的 K230 通信协议
 * 
 * 协议帧格式: {"ver":"1.0.0","type":"FRAME_TYPE","seq":1,"ts":1000,"data":{...}}\n
 */
export class SerialManager {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private isReading = false;
  private seqCounter = 0;  // 发送帧序号计数器
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // 回调
  private onDataCallback: ((frame: SerialFrame) => void) | null = null;
  private onLogCallback: ((entry: LogEntry) => void) | null = null;
  private onStatusCallback: ((connected: boolean) => void) | null = null;
  private onProtocolFrameCallback: ((frame: ProtocolFrame) => void) | null = null;

  private logIdCounter = 0;

  // ==================== 连接管理 ====================

  /** 检测浏览器是否支持 Web Serial API */
  static isSupported(): boolean {
    return 'serial' in navigator;
  }

  /** 获取已授权的串口列表 */
  async getPorts(): Promise<any[]> {
    if (!SerialManager.isSupported()) {
      throw new Error('当前浏览器不支持 Web Serial API，请使用 Chrome 89+ / Edge 89+ 浏览器');
    }
    return await (navigator as any).serial.getPorts();
  }

  /** 连接串口 */
  async connect(config: SerialState): Promise<void> {
    if (!SerialManager.isSupported()) {
      throw new Error('当前浏览器不支持 Web Serial API，请使用 Chrome 89+ / Edge 89+ 浏览器');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();

      await this.port.open({
        baudRate: config.baudRate,
        dataBits: config.dataBits as 7 | 8 | 9,
        stopBits: config.stopBits as 1 | 2,
        parity: config.parity as 'none' | 'even' | 'odd',
      });

      this.writer = this.port.writable?.getWriter() ?? null;
      this.reader = this.port.readable?.getReader() ?? null;

      this.seqCounter = 0;
      this.startReading();
      this.startHeartbeat();

      if (this.onStatusCallback) {
        this.onStatusCallback(true);
      }

      this.addLog('TX', `[系统] 串口已连接 | 波特率: ${config.baudRate} | 数据位: ${config.dataBits} | 协议: v${PROTOCOL_VERSION}`);
    } catch (error) {
      console.error('串口连接失败:', error);
      throw error;
    }
  }

  /** 断开串口 */
  async disconnect(): Promise<void> {
    this.isReading = false;
    this.stopHeartbeat();

    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }

      if (this.writer) {
        await this.writer.close();
        this.writer.releaseLock();
        this.writer = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.warn('断开连接时出错:', e);
    }

    if (this.onStatusCallback) {
      this.onStatusCallback(false);
    }

    this.addLog('TX', '[系统] 串口已断开');
  }

  /** 获取连接状态 */
  isConnected(): boolean {
    return this.port !== null && this.isReading;
  }

  // ==================== 协议帧发送 ====================

  /**
   * 发送原始字符串数据
   */
  async send(data: string): Promise<void> {
    if (!this.writer) {
      throw new Error('串口未连接');
    }

    const sendData = data.endsWith('\n') ? data : data + '\n';
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(sendData);

    await this.writer.write(dataArray);
    this.addLog('TX', data);
  }

  /**
   * 发送协议帧（核心方法）
   * 自动添加协议版本、序号、时间戳
   */
  async sendFrame(type: TxFrameType, data: Record<string, any>): Promise<number> {
    const seq = ++this.seqCounter;
    const frame: ProtocolFrame = {
      ver: PROTOCOL_VERSION,
      type,
      seq,
      ts: Date.now(),
      data,
    };

    const frameStr = JSON.stringify(frame);
    await this.send(frameStr);
    return seq;
  }

  // ===== 便捷命令方法 =====

  /** 启动指令 */
  async sendStart(parking: 1 | 2, taskMode: 'auto' | 'manual' = 'auto'): Promise<number> {
    return this.sendFrame('START', { parking, task_mode: taskMode });
  }

  /** 设置目标坐标 */
  async sendSetTarget(x: number, y: number, zone?: string): Promise<number> {
    return this.sendFrame('SET_TARGET', { x, y, ...(zone ? { zone } : {}) });
  }

  /** 下发规划路径 */
  async sendSetPath(path: { x: number; y: number }[], stepIndex: number, stepName: string): Promise<number> {
    return this.sendFrame('SET_PATH', { path, step_index: stepIndex, step_name: stepName });
  }

  /** 请求下位机路径规划 */
  async sendReqPath(start: { x: number; y: number }, end: { x: number; y: number }, obstacles: { x: number; y: number }[]): Promise<number> {
    return this.sendFrame('REQ_PATH', { start, end, obstacles });
  }

  /** 设置障碍物位置 */
  async sendSetObstacles(obs: { x: number; y: number }[], diameterMm: number = 50): Promise<number> {
    return this.sendFrame('SET_OBSTACLES', { obs, count: obs.length, diameter_mm: diameterMm });
  }

  /** 请求状态上报 */
  async sendReqStatus(): Promise<number> {
    return this.sendFrame('REQ_STATUS', {});
  }

  /** 紧急停止 */
  async sendEmergencyStop(): Promise<number> {
    return this.sendFrame('EMERGENCY_STOP', {});
  }

  /** 设置速度 */
  async sendSetSpeed(speed: number, turnSpeed: number): Promise<number> {
    return this.sendFrame('SET_SPEED', { speed, turn_speed: turnSpeed });
  }

  /** 二维码读取指令 */
  async sendQrRead(parkingZone: number): Promise<number> {
    return this.sendFrame('QR_READ', { parking_zone: parkingZone });
  }

  /** 抓取物料指令 */
  async sendGrab(materialId: number, color: string, fromZone: string): Promise<number> {
    return this.sendFrame('GRAB', { material_id: materialId, color, from_zone: fromZone });
  }

  /** 放置物料指令 */
  async sendPlace(materialId: number, color: string, toZone: string, slot: number, isStack: boolean): Promise<number> {
    return this.sendFrame('PLACE', { material_id: materialId, color, to_zone: toZone, slot, is_stack: isStack });
  }

  /** 设置启停区 */
  async sendSetParking(parking: 1 | 2, x: number, y: number): Promise<number> {
    return this.sendFrame('SET_PARKING', { parking, x, y });
  }

  /** 复位指令 */
  async sendReset(): Promise<number> {
    return this.sendFrame('RESET', {});
  }

  /** 设置任务参数 */
  async sendSetTask(taskId: string, colors: string[], order: number[]): Promise<number> {
    return this.sendFrame('SET_TASK', { task_id: taskId, colors, order });
  }

  // ==================== 心跳管理 ====================

  /** 启动心跳包发送（每1秒） */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendFrame('HEARTBEAT', {}).catch(() => {});
      }
    }, 1000);
  }

  /** 停止心跳 */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ==================== 数据接收 ====================

  /** 开始读取串口数据 */
  private async startReading(): Promise<void> {
    if (!this.reader) return;

    this.isReading = true;
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (this.isReading && this.reader) {
        const { value, done } = await this.reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 按换行符分割
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            this.addLog('RX', trimmed);
            this.parseAndNotify(trimmed);
          }
        }
      }
    } catch (error) {
      console.error('读取串口数据错误:', error);
      this.isReading = false;
      if (this.onStatusCallback) {
        this.onStatusCallback(false);
      }
    }
  }

  /** 解析接收到的数据并通知回调 */
  private parseAndNotify(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      // 尝试作为协议帧解析
      if (parsed.ver && parsed.type && parsed.seq !== undefined) {
        const frame: ProtocolFrame = {
          ver: parsed.ver,
          type: parsed.type as FrameType,
          seq: parsed.seq,
          ts: parsed.ts || Date.now(),
          data: parsed.data || {},
        };

        // 通知协议帧回调
        if (this.onProtocolFrameCallback) {
          this.onProtocolFrameCallback(frame);
        }

        // 兼容旧版 SerialFrame 回调
        const serialFrame: SerialFrame = {
          type: parsed.type as RxFrameType,
          data: parsed.data,
          timestamp: parsed.ts || Date.now(),
        };
        if (this.onDataCallback) {
          this.onDataCallback(serialFrame);
        }
      } else {
        // 旧格式兼容
        const serialFrame: SerialFrame = {
          type: (parsed.type || 'STATUS') as RxFrameType,
          data: parsed,
          timestamp: Date.now(),
        };
        if (this.onDataCallback) {
          this.onDataCallback(serialFrame);
        }
      }
    } catch {
      // 非 JSON 格式
      const serialFrame: SerialFrame = {
        type: 'STATUS' as RxFrameType,
        data: { raw: data },
        timestamp: Date.now(),
      };
      if (this.onDataCallback) {
        this.onDataCallback(serialFrame);
      }
    }
  }

  // ==================== 日志 ====================

  /** 添加日志记录 */
  private addLog(direction: 'RX' | 'TX', data: string): void {
    if (this.onLogCallback) {
      // 尝试提取帧类型
      let frameType: string | undefined;
      try {
        const parsed = JSON.parse(data);
        frameType = parsed.type;
      } catch {}

      const entry: LogEntry = {
        id: ++this.logIdCounter,
        timestamp: new Date().toLocaleTimeString('zh-CN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        direction,
        data: data.length > 200 ? data.substring(0, 200) + '...' : data,
        raw: data,
        frameType,
      };
      this.onLogCallback(entry);
    }
  }

  // ==================== 回调注册 ====================

  /** 注册数据接收回调（兼容旧版） */
  onData(callback: (frame: SerialFrame) => void): void {
    this.onDataCallback = callback;
  }

  /** 注册协议帧接收回调 */
  onProtocolFrame(callback: (frame: ProtocolFrame) => void): void {
    this.onProtocolFrameCallback = callback;
  }

  /** 注册日志回调 */
  onLog(callback: (entry: LogEntry) => void): void {
    this.onLogCallback = callback;
  }

  /** 注册连接状态回调 */
  onStatusChange(callback: (connected: boolean) => void): void {
    this.onStatusCallback = callback;
  }
}
