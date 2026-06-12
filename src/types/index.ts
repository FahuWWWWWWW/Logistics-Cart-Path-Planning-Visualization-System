// 网格坐标类型
export interface GridCoord {
  x: number;
  y: number;
}

// 区域定义（矩形区域）
export interface Zone {
  x: number;      // 左上角 x（格坐标）
  y: number;      // 左上角 y（格坐标）
  width: number;  // 宽度（格数）
  height: number; // 高度（格数）
  label: string;  // 区域名称
  color: string;  // 显示颜色
  isObstacle: boolean; // 是否不可触碰
}

// 小车状态类型
export interface CarState {
  position: GridCoord;
  orientation: number; // 方向角度（度）
  status: 'idle' | 'moving' | 'planning' | 'grabbing' | 'placing' | 'reading_qr' | 'error';
}

// 路径节点类型
export interface PathNode {
  x: number;
  y: number;
  g: number; // 从起点到当前节点的代价
  h: number; // 启发式代价（到终点的估计）
  f: number; // 总代价 g + h
  parent: PathNode | null;
}

// 路径规划结果
export interface PathResult {
  path: GridCoord[];
  length: number;     // 路径长度（格子数）
  realLength: number; // 实际路径长度（mm）
  nodeCount: number;  // 节点数
  timeCost: number;   // 规划耗时（ms）
  algorithm: 'A*' | 'RRT' | 'Dijkstra';
}

// 比赛流程步骤
export interface RaceStep {
  name: string;       // 步骤名称
  action: string;     // 动作描述
  from: string;       // 起点键名
  to: string;         // 终点键名
  color: string;      // 显示颜色
}

// ==================== 通信协议类型定义 ====================

// 协议版本
export const PROTOCOL_VERSION = '1.0.0';

// 上位机→下位机 帧类型
export type TxFrameType =
  | 'START'           // 启动指令
  | 'SET_TARGET'      // 设置目标坐标
  | 'SET_PATH'        // 下发规划路径
  | 'REQ_PATH'        // 请求下位机路径规划
  | 'SET_OBSTACLES'   // 设置障碍物位置
  | 'REQ_STATUS'      // 请求状态上报
  | 'EMERGENCY_STOP'  // 紧急停止
  | 'SET_SPEED'       // 设置移动速度
  | 'HEARTBEAT'       // 心跳包
  | 'QR_READ'         // 二维码读取指令
  | 'GRAB'            // 抓取物料指令
  | 'PLACE'           // 放置物料指令
  | 'SET_PARKING'     // 设置启停区
  | 'RESET'           // 复位指令
  | 'SET_TASK';       // 设置任务参数

// 下位机→上位机 帧类型
export type RxFrameType =
  | 'STATUS'          // 状态上报
  | 'OBSTACLE'        // 障碍物检测上报
  | 'PATH_RESULT'     // 路径规划结果
  | 'QR_TASK'         // 二维码任务内容（下位机解析后上报）
  | 'TASK_CODE'       // 【新增】任务码原始内容（下位机读取二维码后直接上报原始字符串）
  | 'GRABBED'         // 【新增】抓取成功上报（替代旧版GRAB_RESULT）
  | 'PLACED'          // 【新增】放置成功上报（替代旧版PLACE_RESULT）
  | 'GRAB_RESULT'     // 抓取结果（旧版兼容）
  | 'PLACE_RESULT'    // 放置结果（旧版兼容）
  | 'ACK'             // 通用应答确认
  | 'HEARTBEAT_ACK'   // 心跳应答
  | 'ERROR'           // 错误上报
  | 'ARRIVED'         // 到达目标通知
  | 'BATTERY'         // 电池状态
  | 'SENSOR_DATA';    // 传感器原始数据

// 所有帧类型
export type FrameType = TxFrameType | RxFrameType;

// 通用数据帧格式
export interface ProtocolFrame {
  ver: string;        // 协议版本号
  type: FrameType;    // 帧类型
  seq: number;        // 帧序号（递增）
  ts: number;         // 时间戳(ms)
  data: Record<string, any>; // 帧数据
}

// ===== 上位机→下位机 数据结构 =====

// START 启动指令
export interface StartData {
  parking: 1 | 2;     // 出发启停区编号
  task_mode: 'auto' | 'manual'; // 任务模式
}

// SET_TARGET 设置目标坐标
export interface SetTargetData {
  x: number;          // 目标x坐标（格）
  y: number;          // 目标y坐标（格）
  zone?: string;      // 目标区域名称
}

// SET_PATH 下发规划路径
export interface SetPathData {
  path: GridCoord[];  // 路径节点列表
  step_index: number; // 当前比赛步骤索引
  step_name: string;  // 当前步骤名称
}

// REQ_PATH 请求下位机路径规划
export interface ReqPathData {
  start: GridCoord;   // 起点坐标
  end: GridCoord;     // 终点坐标
  obstacles: GridCoord[]; // 当前障碍物列表
}

// SET_OBSTACLES 设置障碍物位置
export interface SetObstaclesData {
  obs: GridCoord[];   // 障碍物坐标列表
  count: number;      // 障碍物数量
  diameter_mm: number; // 障碍物直径(mm)
}

// SET_SPEED 设置速度
export interface SetSpeedData {
  speed: number;      // 移动速度(mm/s)
  turn_speed: number; // 转弯速度(°/s)
}

// QR_READ 二维码读取
export interface QrReadData {
  parking_zone: number; // 当前启停区编号
}

// GRAB 抓取物料
export interface GrabData {
  material_id: number; // 物料编号(1-6)
  color: string;       // 物料颜色
  from_zone: string;   // 抓取区域
}

// PLACE 放置物料
export interface PlaceData {
  material_id: number; // 物料编号
  color: string;       // 物料颜色
  to_zone: string;     // 放置区域
  slot: number;        // 放置槽位(1-3)
  is_stack: boolean;   // 是否码垛放置
}

// SET_PARKING 设置启停区
export interface SetParkingData {
  parking: 1 | 2;     // 启停区编号
  x: number;          // 启停区中心x
  y: number;          // 启停区中心y
}

// SET_TASK 设置任务参数
export interface SetTaskData {
  task_id: string;     // 任务ID
  colors: string[];    // 物料颜色顺序
  order: number[];     // 搬运顺序
}

// ===== 下位机→上位机 数据结构 =====

// STATUS 状态上报
export interface StatusData {
  x: number;          // 当前x坐标（格）
  y: number;          // 当前y坐标（格）
  angle: number;      // 当前朝向角度(°)
  speed: number;      // 当前速度(mm/s)
  status: string;     // 运行状态: idle/moving/turning/stopped/error
  step: number;       // 当前比赛步骤(0-7)
  uptime: number;     // 运行时间(ms)
}

// OBSTACLE 障碍物检测上报
export interface ObstacleData {
  obs: GridCoord[];   // 检测到的障碍物坐标
  source: string;     // 检测来源: lidar/camera/ir
  confidence: number; // 置信度(0-1)
}

// PATH_RESULT 路径规划结果
export interface PathResultData {
  path: GridCoord[];  // 路径节点列表
  length_mm: number;  // 路径长度(mm)
  node_count: number; // 节点数
  time_cost: number;  // 规划耗时(ms)
  algorithm: string;  // 使用算法
}

// QR_TASK 二维码任务（下位机解析后上报）
export interface QrTaskData {
  task_id: string;    // 任务ID
  colors: string[];   // 物料颜色列表(6个)
  batch1_order: number[]; // 第一批搬运顺序
  batch2_order: number[]; // 第二批搬运顺序
  raw_data: string;   // 原始二维码内容
}

// TASK_CODE 任务码原始内容（下位机读取二维码后直接上报原始字符串，上位机自行解析）
export interface TaskCodeData {
  raw: string;        // 原始任务码，如 "156+123+516+231"
  source: string;     // 来源：qrcode/serial/manual
}

// GRABBED 抓取成功上报（新版精简协议）
export interface GrabbedData {
  batch: number;      // 批次 1|2
  material_idx: number; // 物料索引 0|1|2（对应顺序的第几个）
  color_id: number;   // 实际抓取的颜色编号 1-6
  success: number;    // 1=成功，0=失败
}

// PLACED 放置成功上报（新版精简协议，含环数分信息）
export interface PlacedData {
  batch: number;      // 批次 1|2
  material_idx: number; // 物料索引 0|1|2
  zone: string;       // 区域：rough/temp
  ring_id: number;    // 圆环编号 1-3（粗加工区/暂存区的圆环编号）
  ring_level: number; // 靶环级别 1-6（1环=最中心=15分，6环=最外圈=1分）
  ring_score: number; // 环数分（由靶环级别查表得到，上位机可验证）
  color_id: number;   // 实际放置的物料颜色编号 1-6（用于比对）
  success: number;    // 1=成功，0=失败
}

// GRAB_RESULT 抓取结果
export interface GrabResultData {
  success: boolean;   // 是否成功
  material_id: number; // 物料编号
  color: string;       // 识别到的颜色
  confidence: number;  // 颜色识别置信度
}

// PLACE_RESULT 放置结果
export interface PlaceResultData {
  success: boolean;   // 是否成功
  zone: string;       // 放置区域
  slot: number;       // 槽位
  score: number;      // 得分(0-100)
  is_ring_visible: boolean; // 圆环外圈是否可见(评分标准)
  is_stable: boolean;  // 是否平稳(码垛评分标准)
}

// ACK 通用应答
export interface AckData {
  req_seq: number;    // 对应请求的帧序号
  req_type: string;   // 对应请求的帧类型
  result: 'ok' | 'fail' | 'unsupported';
  msg?: string;       // 附加消息
}

// ERROR 错误上报
export interface ErrorData {
  code: number;       // 错误码
  msg: string;        // 错误描述
  detail?: string;    // 详细信息
}

// ARRIVED 到达目标通知
export interface ArrivedData {
  x: number;          // 到达位置x
  y: number;          // 到达位置y
  zone: string;       // 到达的区域名称
  step: number;       // 完成的比赛步骤
}

// BATTERY 电池状态
export interface BatteryData {
  voltage: number;    // 电压(V)
  percentage: number; // 电量百分比
  is_charging: boolean; // 是否充电中
}

// SENSOR_DATA 传感器数据
export interface SensorData {
  lidar: number[];    // 激光雷达数据
  ir_front: number;   // 前方红外距离(mm)
  ir_left: number;    // 左侧红外距离(mm)
  ir_right: number;   // 右侧红外距离(mm)
  encoder_left: number; // 左编码器
  encoder_right: number; // 右编码器
}

// ===== 协议帧类型描述表 =====
export interface FrameTypeDesc {
  type: string;
  direction: 'TX' | 'RX';
  name: string;
  description: string;
  dataFields: { field: string; type: string; required: boolean; description: string }[];
  example: string;
}

// 串口连接状态
export interface SerialState {
  isConnected: boolean;
  port: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: 'none' | 'even' | 'odd';
}

// 串口数据帧（兼容旧版与新扩展协议）
export interface SerialFrame {
  type: RxFrameType;
  data: any;
  timestamp: number;
}

// 地图配置 - 2027工创赛标准场地
export interface MapConfig {
  rows: number;
  cols: number;
  cellSize: number;
  gridSizeMm: number;
  fieldWidth: number;
  fieldHeight: number;
  carWidth: number;
  carHeight: number;
  carSafeRadius: number;
  zones: Zone[];
  obstacles: GridCoord[];
  start: GridCoord;
  end: GridCoord;
  parkingZones: Zone[];
  startParking: 'parking1' | 'parking2';
}

// 绘制模式
export type DrawMode = 'start' | 'end' | 'obstacle' | 'erase' | 'none';

// 日志条目
export interface LogEntry {
  id: number;
  timestamp: string;
  direction: 'RX' | 'TX';
  data: string;
  raw: string;
  frameType?: string; // 帧类型标记
}

// ==================== 完整协议描述表 ====================
export const PROTOCOL_DESC: FrameTypeDesc[] = [
  // ---- 上位机 → 下位机 ----
  {
    type: 'START',
    direction: 'TX',
    name: '启动指令',
    description: '从指定启停区启动机器人，仅一次启动机会',
    dataFields: [
      { field: 'parking', type: '1|2', required: true, description: '出发启停区编号' },
      { field: 'task_mode', type: 'string', required: true, description: '任务模式: auto/manual' },
    ],
    example: '{"ver":"1.0.0","type":"START","seq":1,"ts":1000,"data":{"parking":1,"task_mode":"auto"}}',
  },
  {
    type: 'SET_TARGET',
    direction: 'TX',
    name: '设置目标坐标',
    description: '设置小车移动目标位置（格坐标）',
    dataFields: [
      { field: 'x', type: 'number', required: true, description: '目标x坐标（格）' },
      { field: 'y', type: 'number', required: true, description: '目标y坐标（格）' },
      { field: 'zone', type: 'string', required: false, description: '目标区域名称(如 "qrcode","material")' },
    ],
    example: '{"ver":"1.0.0","type":"SET_TARGET","seq":2,"ts":2000,"data":{"x":44,"y":24,"zone":"qrcode"}}',
  },
  {
    type: 'SET_PATH',
    direction: 'TX',
    name: '下发规划路径',
    description: '将A*算法规划的路径下发到下位机执行',
    dataFields: [
      { field: 'path', type: 'GridCoord[]', required: true, description: '路径节点坐标数组' },
      { field: 'step_index', type: 'number', required: true, description: '当前比赛步骤索引(0-7)' },
      { field: 'step_name', type: 'string', required: true, description: '当前步骤名称' },
    ],
    example: '{"ver":"1.0.0","type":"SET_PATH","seq":3,"ts":3000,"data":{"path":[{"x":45,"y":3},{"x":44,"y":4}],"step_index":0,"step_name":"启停区→二维码区"}}',
  },
  {
    type: 'REQ_PATH',
    direction: 'TX',
    name: '请求路径规划',
    description: '请求下位机使用自身算法进行路径规划，用于算法对比',
    dataFields: [
      { field: 'start', type: 'GridCoord', required: true, description: '起点坐标' },
      { field: 'end', type: 'GridCoord', required: true, description: '终点坐标' },
      { field: 'obstacles', type: 'GridCoord[]', required: true, description: '当前障碍物列表' },
    ],
    example: '{"ver":"1.0.0","type":"REQ_PATH","seq":4,"ts":4000,"data":{"start":{"x":45,"y":3},"end":{"x":44,"y":24},"obstacles":[{"x":24,"y":15}]}}',
  },
  {
    type: 'SET_OBSTACLES',
    direction: 'TX',
    name: '设置障碍物位置',
    description: '通知下位机当前障碍物位置信息',
    dataFields: [
      { field: 'obs', type: 'GridCoord[]', required: true, description: '障碍物坐标列表' },
      { field: 'count', type: 'number', required: true, description: '障碍物数量' },
      { field: 'diameter_mm', type: 'number', required: true, description: '障碍物直径(mm)' },
    ],
    example: '{"ver":"1.0.0","type":"SET_OBSTACLES","seq":5,"ts":5000,"data":{"obs":[{"x":24,"y":15},{"x":15,"y":24}],"count":2,"diameter_mm":50}}',
  },
  {
    type: 'REQ_STATUS',
    direction: 'TX',
    name: '请求状态上报',
    description: '请求下位机立即上报当前状态',
    dataFields: [],
    example: '{"ver":"1.0.0","type":"REQ_STATUS","seq":6,"ts":6000,"data":{}}',
  },
  {
    type: 'EMERGENCY_STOP',
    direction: 'TX',
    name: '紧急停止',
    description: '立即停止小车运动，优先级最高',
    dataFields: [],
    example: '{"ver":"1.0.0","type":"EMERGENCY_STOP","seq":7,"ts":7000,"data":{}}',
  },
  {
    type: 'SET_SPEED',
    direction: 'TX',
    name: '设置移动速度',
    description: '设置小车直线移动速度和转弯速度',
    dataFields: [
      { field: 'speed', type: 'number', required: true, description: '直线速度(mm/s)' },
      { field: 'turn_speed', type: 'number', required: true, description: '转弯速度(°/s)' },
    ],
    example: '{"ver":"1.0.0","type":"SET_SPEED","seq":8,"ts":8000,"data":{"speed":500,"turn_speed":90}}',
  },
  {
    type: 'HEARTBEAT',
    direction: 'TX',
    name: '心跳包',
    description: '保活心跳，每1秒发送一次',
    dataFields: [],
    example: '{"ver":"1.0.0","type":"HEARTBEAT","seq":9,"ts":9000,"data":{}}',
  },
  {
    type: 'QR_READ',
    direction: 'TX',
    name: '二维码读取指令',
    description: '指令小车读取二维码获取搬运任务',
    dataFields: [
      { field: 'parking_zone', type: 'number', required: true, description: '当前启停区编号' },
    ],
    example: '{"ver":"1.0.0","type":"QR_READ","seq":10,"ts":10000,"data":{"parking_zone":1}}',
  },
  {
    type: 'GRAB',
    direction: 'TX',
    name: '抓取物料指令',
    description: '指令小车抓取指定物料，每次仅抓1个',
    dataFields: [
      { field: 'material_id', type: 'number', required: true, description: '物料编号(1-6)' },
      { field: 'color', type: 'string', required: true, description: '目标颜色' },
      { field: 'from_zone', type: 'string', required: true, description: '抓取区域' },
    ],
    example: '{"ver":"1.0.0","type":"GRAB","seq":11,"ts":11000,"data":{"material_id":1,"color":"red","from_zone":"material"}}',
  },
  {
    type: 'PLACE',
    direction: 'TX',
    name: '放置物料指令',
    description: '指令小车放置物料到指定区域和槽位',
    dataFields: [
      { field: 'material_id', type: 'number', required: true, description: '物料编号' },
      { field: 'color', type: 'string', required: true, description: '物料颜色' },
      { field: 'to_zone', type: 'string', required: true, description: '放置区域: rough/temp' },
      { field: 'slot', type: 'number', required: true, description: '放置槽位(1-3)' },
      { field: 'is_stack', type: 'boolean', required: true, description: '是否码垛放置' },
    ],
    example: '{"ver":"1.0.0","type":"PLACE","seq":12,"ts":12000,"data":{"material_id":1,"color":"red","to_zone":"rough","slot":1,"is_stack":false}}',
  },
  // ---- 下位机 → 上位机 ----
  {
    type: 'STATUS',
    direction: 'RX',
    name: '状态上报',
    description: '下位机定期(200ms)上报当前位姿和运行状态',
    dataFields: [
      { field: 'x', type: 'number', required: true, description: '当前x坐标（格）' },
      { field: 'y', type: 'number', required: true, description: '当前y坐标（格）' },
      { field: 'angle', type: 'number', required: true, description: '朝向角度(°)' },
      { field: 'speed', type: 'number', required: true, description: '当前速度(mm/s)' },
      { field: 'status', type: 'string', required: true, description: '状态: idle/moving/turning/stopped/error' },
      { field: 'step', type: 'number', required: true, description: '当前比赛步骤(0-7)' },
      { field: 'uptime', type: 'number', required: true, description: '运行时间(ms)' },
    ],
    example: '{"ver":"1.0.0","type":"STATUS","seq":1,"ts":1000,"data":{"x":24,"y":15,"angle":90,"speed":500,"status":"moving","step":2,"uptime":5000}}',
  },
  {
    type: 'OBSTACLE',
    direction: 'RX',
    name: '障碍物检测上报',
    description: '下位机检测到障碍物时主动上报',
    dataFields: [
      { field: 'obs', type: 'GridCoord[]', required: true, description: '障碍物坐标列表' },
      { field: 'source', type: 'string', required: true, description: '检测来源: lidar/camera/ir' },
      { field: 'confidence', type: 'number', required: true, description: '置信度(0-1)' },
    ],
    example: '{"ver":"1.0.0","type":"OBSTACLE","seq":2,"ts":2000,"data":{"obs":[{"x":24,"y":15}],"source":"lidar","confidence":0.95}}',
  },
  {
    type: 'PATH_RESULT',
    direction: 'RX',
    name: '路径规划结果',
    description: '下位机路径规划结果，用于与上位机算法对比',
    dataFields: [
      { field: 'path', type: 'GridCoord[]', required: true, description: '路径节点列表' },
      { field: 'length_mm', type: 'number', required: true, description: '路径长度(mm)' },
      { field: 'node_count', type: 'number', required: true, description: '节点数' },
      { field: 'time_cost', type: 'number', required: true, description: '规划耗时(ms)' },
      { field: 'algorithm', type: 'string', required: true, description: '使用算法名称' },
    ],
    example: '{"ver":"1.0.0","type":"PATH_RESULT","seq":3,"ts":3000,"data":{"path":[{"x":45,"y":3}],"length_mm":1200,"node_count":12,"time_cost":15,"algorithm":"A*"}}',
  },
  {
    type: 'QR_TASK',
    direction: 'RX',
    name: '二维码任务内容',
    description: '下位机读取二维码后上报任务参数',
    dataFields: [
      { field: 'task_id', type: 'string', required: true, description: '任务ID' },
      { field: 'colors', type: 'string[]', required: true, description: '6个物料颜色列表' },
      { field: 'batch1_order', type: 'number[]', required: true, description: '第一批搬运顺序' },
      { field: 'batch2_order', type: 'number[]', required: true, description: '第二批搬运顺序' },
      { field: 'raw_data', type: 'string', required: true, description: '二维码原始内容' },
    ],
    example: '{"ver":"1.0.0","type":"QR_TASK","seq":4,"ts":4000,"data":{"task_id":"T001","colors":["red","blue","green","red","blue","green"],"batch1_order":[1,2,3],"batch2_order":[4,5,6],"raw_data":"..."}}',
  },
  {
    type: 'GRAB_RESULT',
    direction: 'RX',
    name: '抓取结果',
    description: '小车抓取物料后的结果反馈',
    dataFields: [
      { field: 'success', type: 'boolean', required: true, description: '是否成功' },
      { field: 'material_id', type: 'number', required: true, description: '物料编号' },
      { field: 'color', type: 'string', required: true, description: '识别到的颜色' },
      { field: 'confidence', type: 'number', required: true, description: '颜色识别置信度' },
    ],
    example: '{"ver":"1.0.0","type":"GRAB_RESULT","seq":5,"ts":5000,"data":{"success":true,"material_id":1,"color":"red","confidence":0.98}}',
  },
  {
    type: 'PLACE_RESULT',
    direction: 'RX',
    name: '放置结果',
    description: '小车放置物料后的结果与评分反馈',
    dataFields: [
      { field: 'success', type: 'boolean', required: true, description: '是否成功' },
      { field: 'zone', type: 'string', required: true, description: '放置区域' },
      { field: 'slot', type: 'number', required: true, description: '槽位' },
      { field: 'score', type: 'number', required: true, description: '得分(0-100)' },
      { field: 'is_ring_visible', type: 'boolean', required: true, description: '圆环外圈是否可见' },
      { field: 'is_stable', type: 'boolean', required: true, description: '码垛是否平稳' },
    ],
    example: '{"ver":"1.0.0","type":"PLACE_RESULT","seq":6,"ts":6000,"data":{"success":true,"zone":"rough","slot":1,"score":95,"is_ring_visible":true,"is_stable":false}}',
  },
  {
    type: 'ACK',
    direction: 'RX',
    name: '通用应答',
    description: '下位机对上位机指令的确认应答',
    dataFields: [
      { field: 'req_seq', type: 'number', required: true, description: '对应请求帧序号' },
      { field: 'req_type', type: 'string', required: true, description: '对应请求帧类型' },
      { field: 'result', type: 'string', required: true, description: '结果: ok/fail/unsupported' },
      { field: 'msg', type: 'string', required: false, description: '附加消息' },
    ],
    example: '{"ver":"1.0.0","type":"ACK","seq":7,"ts":7000,"data":{"req_seq":1,"req_type":"START","result":"ok"}}',
  },
  {
    type: 'TASK_CODE',
    direction: 'RX',
    name: '任务码原始内容',
    description: '下位机读取二维码后直接上报原始字符串，上位机自行解析任务码',
    dataFields: [
      { field: 'raw', type: 'string', required: true, description: '原始任务码，如 "156+123+516+231"' },
      { field: 'source', type: 'string', required: false, description: '来源: qrcode/serial/manual' },
    ],
    example: '{"ver":"1.0.0","type":"TASK_CODE","seq":4,"ts":4000,"data":{"raw":"156+123+516+231","source":"qrcode"}}',
  },
  {
    type: 'GRABBED',
    direction: 'RX',
    name: '抓取成功上报（新版）',
    description: '小车上报抓取结果，含批次、物料索引、实际颜色，用于与任务码比对',
    dataFields: [
      { field: 'batch', type: 'number', required: true, description: '批次 1|2' },
      { field: 'material_idx', type: 'number', required: true, description: '物料索引 0|1|2' },
      { field: 'color_id', type: 'number', required: true, description: '实际抓取颜色编号 1-6' },
      { field: 'success', type: 'number', required: true, description: '1=成功 0=失败' },
    ],
    example: '{"ver":"1.0.0","type":"GRABBED","seq":5,"ts":5000,"data":{"batch":1,"material_idx":0,"color_id":1,"success":1}}',
  },
  {
    type: 'PLACED',
    direction: 'RX',
    name: '放置成功上报（新版）',
    description: '小车上报放置结果，含靶环级别、环数分，上位机可独立验证环数分',
    dataFields: [
      { field: 'batch', type: 'number', required: true, description: '批次 1|2' },
      { field: 'material_idx', type: 'number', required: true, description: '物料索引 0|1|2' },
      { field: 'zone', type: 'string', required: true, description: '区域: rough=粗加工区 temp=暂存区' },
      { field: 'ring_id', type: 'number', required: true, description: '圆环编号 1-3' },
      { field: 'ring_level', type: 'number', required: true, description: '靶环级别 1-6（1环=中心=15分）' },
      { field: 'ring_score', type: 'number', required: true, description: '环数分（下位机计算值，上位机可验证）' },
      { field: 'color_id', type: 'number', required: true, description: '实际放置物料颜色编号 1-6' },
      { field: 'success', type: 'number', required: true, description: '1=成功 0=失败' },
    ],
    example: '{"ver":"1.0.0","type":"PLACED","seq":6,"ts":6000,"data":{"batch":1,"material_idx":0,"zone":"rough","ring_id":1,"ring_level":3,"ring_score":7,"color_id":1,"success":1}}',
  },
  {
    type: 'ARRIVED',
    direction: 'RX',
    name: '到达目标通知',
    description: '小车到达目标位置后主动通知',
    dataFields: [
      { field: 'x', type: 'number', required: true, description: '到达位置x' },
      { field: 'y', type: 'number', required: true, description: '到达位置y' },
      { field: 'zone', type: 'string', required: true, description: '到达区域名称' },
      { field: 'step', type: 'number', required: true, description: '完成的比赛步骤' },
    ],
    example: '{"ver":"1.0.0","type":"ARRIVED","seq":8,"ts":8000,"data":{"x":44,"y":24,"zone":"qrcode","step":0}}',
  },
  {
    type: 'ERROR',
    direction: 'RX',
    name: '错误上报',
    description: '下位机运行出错时主动上报',
    dataFields: [
      { field: 'code', type: 'number', required: true, description: '错误码' },
      { field: 'msg', type: 'string', required: true, description: '错误描述' },
      { field: 'detail', type: 'string', required: false, description: '详细信息' },
    ],
    example: '{"ver":"1.0.0","type":"ERROR","seq":9,"ts":9000,"data":{"code":101,"msg":"路径规划失败","detail":"目标不可达"}}',
  },
];
