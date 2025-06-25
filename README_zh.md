# Claude GPT - AI 聊天应用

一个基于 React Native（前端）和 Node.js（后端）构建的现代化 AI 聊天应用，提供完整的 ChatGPT 体验，包含订阅管理、数据导出和云端同步功能。

## 🚀 功能特性

### ✨ 核心功能
- **AI 智能对话**：与 AI 助手进行实时对话
- **多语言支持**：支持中文和英文本地化
- **跨平台**：通过 React Native 支持 iOS 和 Android
- **云端同步**：跨设备实时数据同步
- **订阅管理**：免费增值模式，集成 Stripe 支付

### 🔧 高级功能
- **数据导出**：支持导出对话为 JSON、TXT、Markdown、CSV 格式
- **智能搜索**：全文搜索，支持相关性评分和自动建议
- **离线支持**：优雅的离线模式，带同步队列
- **性能优化**：虚拟化列表，轻松处理大型数据集
- **现代化 UI**：iOS 风格设计，支持深色/浅色主题

## 📁 项目结构

这是一个 **monorepo**，包含前端和后端应用：

```
claude-gpt/
├── frontend/          # React Native + Expo 应用
├── backend/           # Node.js + Express API
├── docs/             # 文档
├── UI/               # 设计资源
└── scripts/          # 开发脚本
```

## 🛠️ 技术栈

### 前端
- **React Native** with Expo
- **TypeScript** 类型安全
- **Zustand** 状态管理
- **React Navigation** 路由导航
- **i18next** 国际化
- **React Query** API 状态管理

### 后端  
- **Node.js** with Express
- **TypeScript** 类型安全
- **Prisma** ORM with PostgreSQL
- **Stripe** 支付处理
- **JWT** 身份验证
- **Winston** 日志记录

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- pnpm 8+
- PostgreSQL 数据库
- Expo CLI（移动端开发）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yipoo/claude-gpt.git
   cd claude-gpt
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   
   **后端** (在 `/backend` 目录下创建 `.env`):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/claudegpt"
   JWT_SECRET="your-jwt-secret"
   OPENAI_API_KEY="your-openai-api-key"
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   ```

   **前端** (在 `/frontend` 目录下创建 `.env`):
   ```env
   EXPO_PUBLIC_API_URL="http://localhost:3000/api/v1"
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   ```

4. **设置数据库**
   ```bash
   pnpm run db:setup
   ```

5. **启动开发服务器**
   ```bash
   pnpm run dev
   ```

这将同时启动后端 API（端口 3000）和前端开发服务器。

## 📱 开发指南

### 可用脚本

```bash
# 开发
pnpm run dev              # 同时启动前端和后端
pnpm run dev:frontend     # 仅启动前端
pnpm run dev:backend      # 仅启动后端

# 构建
pnpm run build            # 构建前后端应用
pnpm run build:frontend   # 构建前端
pnpm run build:backend    # 构建后端

# 测试
pnpm run test             # 运行所有测试
pnpm run test:frontend    # 运行前端测试
pnpm run test:backend     # 运行后端测试

# 代码质量
pnpm run lint             # 代码检查
pnpm run type-check       # TypeScript 类型检查

# 数据库
pnpm run db:migrate       # 运行数据库迁移
pnpm run db:studio        # 打开 Prisma Studio
```

### 前端开发

前端使用 React Native 和 Expo 构建：

```bash
cd frontend
pnpm run start           # 启动 Expo 开发服务器
pnpm run ios             # 在 iOS 模拟器中运行
pnpm run android         # 在 Android 模拟器中运行
```

### 后端开发

后端 API 使用 Express 和 TypeScript：

```bash
cd backend
pnpm run dev             # 使用 nodemon 启动
pnpm run build           # 构建 TypeScript
pnpm run start           # 启动生产服务器
```

## 🏗️ 架构设计

### 前端架构
- **组件化**：可复用的 UI 组件
- **服务层**：业务逻辑分离
- **状态管理**：使用 Zustand 管理状态
- **导航**：React Navigation，抽屉式 + 堆栈导航
- **国际化**：i18next 异步加载

### 后端架构
- **MVC 模式**：控制器、服务、路由
- **数据库**：Prisma ORM with PostgreSQL
- **身份验证**：基于 JWT 的认证系统
- **API 设计**：RESTful 端点
- **错误处理**：集中式错误中间件

## 📊 核心功能实现

### 🌍 国际化
完整的 i18n 支持：
- 动态语言切换
- 持久化语言偏好
- 设备语言检测
- 100+ 翻译键值

### ⚡ 性能优化
- **虚拟化列表**：流畅处理 1000+ 条消息
- **懒加载**：按需组件加载
- **内存管理**：高效清理机制
- **网络优化**：请求批处理和缓存

### ☁️ 数据同步
- **实时同步**：跨设备数据一致性
- **冲突解决**：智能合并算法
- **离线队列**：离线时延迟同步
- **增量更新**：基于时间戳的同步

### 🔍 高级搜索
- **全文搜索**：消息和对话标题搜索
- **相关性评分**：TF-IDF 算法实现
- **自动建议**：智能补全和历史记录
- **过滤功能**：日期范围、对话和类型筛选

## 🧪 测试

### 前端测试
```bash
cd frontend
pnpm run test           # Jest + React Native Testing Library
```

### 后端测试  
```bash
cd backend
pnpm run test           # Jest + Supertest API 测试
```

## 📦 部署

### 前端部署
```bash
cd frontend
pnpm run build         # 创建生产构建
expo build:ios          # 为 iOS App Store 构建
expo build:android      # 为 Google Play Store 构建
```

### 后端部署
```bash
cd backend
pnpm run build         # 编译 TypeScript
pnpm run start         # 启动生产服务器
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范
- 遵循 TypeScript 和 ESLint 规则
- 编写单元测试覆盖新功能
- 更新相关文档
- 所有用户界面文字必须国际化

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- OpenAI 提供 ChatGPT API
- Expo 团队提供优秀的 React Native 框架
- 所有开源贡献者

## 📞 支持

如果您有任何问题或需要帮助，请：
- 在 GitHub 上提交 issue
- 查看 [文档](./docs/)
- 联系方式：GitHub Issues

## 🌟 支持项目

如果这个项目对您有帮助，请：
- ⭐ 给项目点个星
- 🐛 报告 bug 或提出新功能建议
- 🤝 贡献代码或文档
- 💬 分享给更多的开发者

---

**基于 React Native 和 Node.js，用 ❤️ 构建**

## 🔗 相关链接

- [English README](./README.md)
- [项目文档](./docs/)
- [技术架构文档](./docs/技术架构文档.md)
- [开发计划文档](./docs/开发计划文档.md)
- [API 设计文档](./docs/后端API设计文档.md)