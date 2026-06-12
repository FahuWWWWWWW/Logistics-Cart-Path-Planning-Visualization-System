# 贡献指南

感谢你考虑为 **物流小车路径规划可视化系统** 做出贡献！

---

## 🌟 如何贡献

### 报告 Bug

请使用 [GitHub Issues](https://github.com/FahuWWWWWWW/Logistics-Cart-Path-Planning-Visualization-System/issues) 提交 Bug 报告，并包含以下信息：

- 复现步骤
- 预期行为 vs 实际行为
- 浏览器版本和操作系统
- 截图（如适用）

### 提交功能请求

同样通过 [GitHub Issues](https://github.com/FahuWWWWWWW/Logistics-Cart-Path-Planning-Visualization-System/issues) 提交，并：

- 清晰描述功能需求
- 说明该功能对比赛/项目的价值
- 如可能，附上设计草图或参考示例

### 提交代码

1. **Fork 本项目**
2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **编写代码**
   - 遵循现有代码风格
   - 添加必要的注释
   - 更新相关文档
4. **提交更改**
   ```bash
   git commit -m "feat: 添加新功能描述"
   ```
5. **推送到 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **创建 Pull Request**

---

## 📋 提交信息规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-Hans/) 规范：

| 前缀 | 说明 | 示例 |
|------|------|------|
| `feat:` | 新功能 | `feat: 添加路径导出功能` |
| `fix:` | 修复 Bug | `fix: 修复启停区对齐问题` |
| `docs:` | 文档修改 | `docs: 更新README协议说明` |
| `style:` | 代码格式（不影响功能） | `style: 规范化代码缩进` |
| `refactor:` | 重构 | `refactor: 整理项目文件结构` |
| `test:` | 测试相关 | `test: 添加A*算法单元测试` |
| `chore:` | 构建/工具链变动 | `chore: 升级Vite到6.0` |

---

## 🖥️ 开发环境配置

```bash
# 安装依赖
npm install

# 启动开发服务器（热更新）
npm run dev

# 类型检查
npx tsc --noEmit

# 构建生产版本
npm run build
```

---

## 📂 代码风格

- **语言**：TypeScript（严格模式）
- **框架**：React 19 + Hooks
- **样式**：Tailwind CSS 3
- **命名规范**：
  - 组件：`PascalCase.tsx`（如 `GridMap.tsx`）
  - 工具函数：`camelCase.ts`（如 `astar.ts`）
  - 类型：`PascalCase`（如 `GridCoord`）
  - 常量：`UPPER_SNAKE_CASE`

---

## 🔒 行为准则

请尊重所有贡献者，保持友善和专业的交流态度。

---

## 📧 联系方式

如有疑问，请通过 [GitHub Issues](https://github.com/FahuWWWWWWW/Logistics-Cart-Path-Planning-Visualization-System/issues) 联系。

感谢你的贡献！ 🎉
