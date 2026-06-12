// ==================== 任务码解析与环数分计算 ====================
// 依据：2027工创赛智能+命题规则

/** 颜色编号映射 */
export const COLOR_MAP: Record<string, string> = {
  '1': '红色', '2': '黄色', '3': '蓝色', '4': '绿色', '5': '黑色', '6': '浅蓝'
};

/** 颜色编号 → 颜色代码（用于UI显示） */
export const COLOR_CODE: Record<string, string> = {
  '1': '#ef4444', // 红
  '2': '#eab308', // 黄
  '3': '#3b82f6', // 蓝
  '4': '#22c55e', // 绿
  '5': '#1f2937', // 黑
  '6': '#06b6d4', // 浅蓝
};

/** 单批次任务信息 */
export interface BatchTask {
  colors: string[];       // 颜色名称列表（3个）
  colorIds: number[];     // 颜色编号列表（3个）
  positions: number[];    // 放置位置编号列表（3个，1-3对应圆环编号）
}

/** 完整解析后的任务信息 */
export interface ParsedTaskCode {
  raw: string;            // 原始任务码
  batch1: BatchTask;      // 第一批任务
  batch2: BatchTask;      // 第二批任务
  valid: boolean;         // 是否解析成功
  error?: string;         // 错误信息
}

/** 放置结果记录 */
export interface PlaceRecord {
  batch: number;          // 批次 1|2
  materialIdx: number;    // 物料索引 0|1|2（对应顺序的第几个）
  zone: 'rough' | 'temp'; // 区域：rough=粗加工区, temp=暂存区
  ringId: number;         // 圆环编号 1-3
  ringLevel: number;      // 靶环级别 1-6（1环=最中心=15分）
  ringScore: number;      // 环数分（由靶环级别查表得到）
  actualColorId: number;  // 实际放置的物料颜色编号（用于比对）
  expectedColorId: number; // 任务码要求的物料颜色编号
  expectedZone: 'rough' | 'temp'; // 任务码要求的区域
  expectedRingId: number;  // 任务码要求的圆环编号
  timestamp: number;       // 时间戳
}

/** 抓取结果记录 */
export interface GrabRecord {
  batch: number;
  materialIdx: number;
  actualColorId: number;
  expectedColorId: number;
  timestamp: number;
}

/** 环数分查表（靶环级别 → 分数） */
export const RING_SCORE_TABLE: Record<number, number> = {
  1: 15,  // 1环（最中心 φ3）
  2: 10,  // 2环（φ5）
  3: 7,   // 3环（φ7）
  4: 5,   // 4环
  5: 3,   // 5环
  6: 1,   // 6环
};

/** 根据靶环级别计算环数分（6环外及倾倒=0分） */
export function calcRingScore(ringLevel: number): number {
  if (ringLevel < 1 || ringLevel > 6) return 0;
  return RING_SCORE_TABLE[ringLevel] || 0;
}

/**
 * 解析任务码
 * 格式：ABC+DEF+GHI+JKL
 * - ABC：第一批3个物料的颜色顺序（1-6）
 * - DEF：第一批物料的放置位置（1-3，对应圆环编号）
 * - GHI：第二批3个物料的颜色顺序
 * - JKL：第二批物料的放置位置
 *
 * 依据规则：
 * - 第一批：原料区抓取 → 粗加工区放置（3个位置）→ 暂存区转运（3个位置）
 *   第二组三位数表示第一批在粗加工区和暂存区的放置位置。
 *   结合实际比赛流程，三个数字分别对应3个物料的圆环编号。
 * - 第二批：原料区抓取 → 粗加工区放置（3个位置）
 *   第四组三位数表示第二批在粗加工区的放置位置。
 */
export function parseTaskCode(code: string): ParsedTaskCode {
  const parts = code.split('+');
  if (parts.length !== 4) {
    return { raw: code, batch1: { colors: [], colorIds: [], positions: [] }, batch2: { colors: [], colorIds: [], positions: [] }, valid: false, error: '格式错误：应为四组三位数，用+连接' };
  }

  for (let i = 0; i < 4; i++) {
    if (parts[i].length !== 3 || !/^\d{3}$/.test(parts[i])) {
      return { raw: code, batch1: { colors: [], colorIds: [], positions: [] }, batch2: { colors: [], colorIds: [], positions: [] }, valid: false, error: `第${i + 1}组格式错误：应为3位数字` };
    }
  }

  const batch1Colors = parts[0].split('').map(c => COLOR_MAP[c] || '未知');
  const batch1ColorIds = parts[0].split('').map(c => parseInt(c));
  const batch1Positions = parts[1].split('').map(c => parseInt(c));
  const batch2Colors = parts[2].split('').map(c => COLOR_MAP[c] || '未知');
  const batch2ColorIds = parts[2].split('').map(c => parseInt(c));
  const batch2Positions = parts[3].split('').map(c => parseInt(c));

  // 校验颜色编号合法性（1-6）
  for (let i = 0; i < 3; i++) {
    if (batch1ColorIds[i] < 1 || batch1ColorIds[i] > 6) {
      return { raw: code, batch1: { colors: [], colorIds: [], positions: [] }, batch2: { colors: [], colorIds: [], positions: [] }, valid: false, error: `第一批第${i + 1}个颜色编号${batch1ColorIds[i]}不合法（应为1-6）` };
    }
    if (batch2ColorIds[i] < 1 || batch2ColorIds[i] > 6) {
      return { raw: code, batch1: { colors: [], colorIds: [], positions: [] }, batch2: { colors: [], colorIds: [], positions: [] }, valid: false, error: `第二批第${i + 1}个颜色编号${batch2ColorIds[i]}不合法（应为1-6）` };
    }
  }

  // 校验位置编号合法性（1-3）
  for (let i = 0; i < 3; i++) {
    if (batch1Positions[i] < 1 || batch1Positions[i] > 3) {
      return { raw: code, batch1: { colors: [], colorIds: [], positions: [] }, batch2: { colors: [], colorIds: [], positions: [] }, valid: false, error: `第一批第${i + 1}个位置编号${batch1Positions[i]}不合法（应为1-3）` };
    }
    if (batch2Positions[i] < 1 || batch2Positions[i] > 3) {
      return { raw: code, batch1: { colors: [], colorIds: [], positions: [] }, batch2: { colors: [], colorIds: [], positions: [] }, valid: false, error: `第二批第${i + 1}个位置编号${batch2Positions[i]}不合法（应为1-3）` };
    }
  }

  return {
    raw: code,
    batch1: { colors: batch1Colors, colorIds: batch1ColorIds, positions: batch1Positions },
    batch2: { colors: batch2Colors, colorIds: batch2ColorIds, positions: batch2Positions },
    valid: true,
  };
}

/**
 * 获取任务码要求的放置信息
 * 根据比赛流程推断：
 * - 第一批：粗加工区放置（pos[0],pos[1],pos[2]分别对应3个物料的圆环编号）
 *   然后转运到暂存区（同样位置编号）
 * - 第二批：粗加工区放置（pos[0],pos[1],pos[2]）
 *   然后码垛到暂存区（同样位置编号）
 *
 * 返回每个放置步骤的期望信息，用于与实际结果比对
 */
export function getExpectedPlaces(task: ParsedTaskCode): Array<{
  batch: number;
  materialIdx: number;
  zone: 'rough' | 'temp';
  ringId: number;
  colorId: number;
}> {
  const expected: Array<{ batch: number; materialIdx: number; zone: 'rough' | 'temp'; ringId: number; colorId: number }> = [];

  if (!task.valid) return expected;

  // 第一批：3个物料，每个先放粗加工区，后转运暂存区
  for (let i = 0; i < 3; i++) {
    const ringId = task.batch1.positions[i];
    const colorId = task.batch1.colorIds[i];
    // 粗加工区放置
    expected.push({ batch: 1, materialIdx: i, zone: 'rough', ringId, colorId });
    // 暂存区转运
    expected.push({ batch: 1, materialIdx: i, zone: 'temp', ringId, colorId });
  }

  // 第二批：3个物料，每个先放粗加工区，后码垛暂存区
  for (let i = 0; i < 3; i++) {
    const ringId = task.batch2.positions[i];
    const colorId = task.batch2.colorIds[i];
    // 粗加工区放置
    expected.push({ batch: 2, materialIdx: i, zone: 'rough', ringId, colorId });
    // 暂存区码垛
    expected.push({ batch: 2, materialIdx: i, zone: 'temp', ringId, colorId });
  }

  return expected;
}

/**
 * 比对实际放置与任务要求
 * @param record 实际放置记录
 * @param task 解析后的任务码
 * @returns 比对结果
 */
export function compareWithTask(
  record: PlaceRecord,
  task: ParsedTaskCode
): { colorMatch: boolean; zoneMatch: boolean; ringIdMatch: boolean; allMatch: boolean } {
  if (!task.valid) {
    return { colorMatch: false, zoneMatch: false, ringIdMatch: false, allMatch: false };
  }

  const batch = record.batch === 1 ? task.batch1 : task.batch2;
  const expectedColorId = batch.colorIds[record.materialIdx];
  const expectedRingId = batch.positions[record.materialIdx];

  // 区域推断：第一批和第二批都是先rough后temp
  // materialIdx 0-2 对应第1-3个物料，每个物料有两次放置（rough和temp）
  // 但record.zone已经标明实际区域，任务要求中同批次同物料在rough和temp的位置编号相同
  const colorMatch = record.actualColorId === expectedColorId;
  const ringIdMatch = record.ringId === expectedRingId;
  const zoneMatch = true; // 区域由流程决定，任务码只指定圆环编号，不区分rough/temp（两者编号一致）

  return {
    colorMatch,
    zoneMatch,
    ringIdMatch,
    allMatch: colorMatch && ringIdMatch,
  };
}

/** 环数分表（用于UI显示） */
export const RING_SCORE_DESC = [
  { level: 1, score: 15, label: '1环（中心）', color: '#ef4444' },
  { level: 2, score: 10, label: '2环', color: '#f97316' },
  { level: 3, score: 7, label: '3环', color: '#eab308' },
  { level: 4, score: 5, label: '4环', color: '#22c55e' },
  { level: 5, score: 3, label: '5环', color: '#3b82f6' },
  { level: 6, score: 1, label: '6环', color: '#6b7280' },
  { level: 0, score: 0, label: '6环外/倾倒', color: '#9ca3af' },
];
