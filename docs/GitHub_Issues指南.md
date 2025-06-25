# 📋 GitHub Issues 创建和管理指南

本文档提供了在Claude GPT项目中创建和管理GitHub Issues的完整指南。

## 🎯 Issue类型和模板

### 1. 🐛 Bug Report (错误报告)
**使用场景：** 发现应用功能异常、错误或不符合预期行为时
- **模板文件：** `.github/ISSUE_TEMPLATE/bug_report.md`
- **标签：** `bug`, `needs-triage`
- **包含信息：**
  - 详细的复现步骤
  - 期望行为 vs 实际行为
  - 环境信息（设备、操作系统、应用版本）
  - 截图或错误日志
  - 紧急程度评估

### 2. ✨ Feature Request (功能请求)
**使用场景：** 提出新功能需求或现有功能改进建议
- **模板文件：** `.github/ISSUE_TEMPLATE/feature_request.md`
- **标签：** `enhancement`, `feature-request`
- **包含信息：**
  - 功能描述和背景
  - 详细设计方案
  - 目标用户群体
  - 优先级评估
  - 成功指标

### 3. ⚡ Performance Issue (性能问题)
**使用场景：** 报告性能瓶颈、优化建议或资源使用问题
- **模板文件：** `.github/ISSUE_TEMPLATE/performance_issue.md`
- **标签：** `performance`, `optimization`
- **包含信息：**
  - 性能问题类型和影响范围
  - 实际 vs 期望性能数据
  - 性能分析结果
  - 优化建议

### 4. 📝 创建中文版 README
**使用场景：** 项目文档国际化任务
- **模板文件：** `.github/ISSUE_TEMPLATE/chinese-readme.md`
- **标签：** `documentation`, `enhancement`, `chinese`, `i18n`

### 5. 🌍 检查前端文字国际化
**使用场景：** 审核前端应用国际化覆盖率
- **模板文件：** `.github/ISSUE_TEMPLATE/frontend-i18n-audit.md`
- **标签：** `i18n`, `frontend`, `audit`, `enhancement`

## 🏷️ 标签系统

### 类型标签
- `bug` - 错误报告
- `enhancement` - 功能增强
- `feature-request` - 新功能请求
- `documentation` - 文档相关
- `performance` - 性能相关
- `i18n` - 国际化相关

### 优先级标签
- `priority-low` - 低优先级
- `priority-medium` - 中优先级  
- `priority-high` - 高优先级
- `priority-critical` - 紧急

### 状态标签
- `needs-triage` - 需要分类
- `in-progress` - 正在处理
- `needs-review` - 需要审核
- `blocked` - 被阻塞
- `wontfix` - 不会修复

### 组件标签
- `frontend` - 前端相关
- `backend` - 后端相关
- `mobile` - 移动端相关
- `api` - API相关
- `database` - 数据库相关

## 📝 创建Issue的最佳实践

### 1. 标题写作规范
```
✅ 好的标题：
[BUG] 聊天页面在iPhone 12上加载超过5秒
[FEATURE] 添加对话导出PDF功能
[PERFORMANCE] 消息列表滚动卡顿优化

❌ 不好的标题：
Bug
新功能
很慢
```

### 2. 描述详细程度
- **Bug报告：** 越详细越好，包含完整复现步骤
- **功能请求：** 说明需求背景和期望效果
- **性能问题：** 提供具体的性能数据

### 3. 附件和截图
- 优先使用截图或录屏说明问题
- 重要错误需要提供日志文件
- 设计类需求可以提供原型图

### 4. 环境信息
始终包含以下信息：
- 设备型号和操作系统版本
- 应用版本号
- 网络环境
- 相关的第三方服务状态

## 🔄 Issue生命周期管理

### 1. 创建阶段
1. 选择合适的Issue模板
2. 填写完整信息
3. 添加相关标签
4. 指定负责人（如果已知）

### 2. 分类阶段 (Triage)
- 验证问题的有效性
- 确定优先级和严重程度
- 分配给合适的开发者
- 估算解决时间

### 3. 开发阶段
- 更新状态为 `in-progress`
- 定期更新进展
- 关联相关的Pull Request
- 与报告者保持沟通

### 4. 验证阶段
- 标记为 `needs-review`
- 邀请原报告者验证
- 进行完整的测试验证
- 更新文档（如需要）

### 5. 关闭阶段
- 确认问题已解决
- 更新相关文档
- 关闭Issue并添加解决说明
- 感谢贡献者

## 🚀 快速创建Issue

### 访问地址
https://github.com/yipoo/claude-gpt/issues/new/choose

### 快速链接
- [🐛 报告Bug](https://github.com/yipoo/claude-gpt/issues/new?assignees=&labels=bug%2Cneeds-triage&template=bug_report.md&title=%5BBUG%5D+)
- [✨ 功能请求](https://github.com/yipoo/claude-gpt/issues/new?assignees=&labels=enhancement%2Cfeature-request&template=feature_request.md&title=%5BFEATURE%5D+)
- [⚡ 性能问题](https://github.com/yipoo/claude-gpt/issues/new?assignees=&labels=performance%2Coptimization&template=performance_issue.md&title=%5BPERFORMANCE%5D+)

## 📊 Issue管理仪表板

### 过滤器使用
```
# 查看所有开放的Bug
is:issue is:open label:bug

# 查看高优先级的功能请求
is:issue is:open label:enhancement label:priority-high

# 查看需要分类的Issue
is:issue is:open label:needs-triage

# 查看我负责的Issue
is:issue is:open assignee:@me
```

### 项目看板
建议使用GitHub Projects创建看板：
- **待处理 (To Do)**
- **进行中 (In Progress)**
- **审核中 (Review)**
- **已完成 (Done)**

## 💡 贡献者指南

### 对于Issue创建者
1. 搜索现有Issue，避免重复
2. 使用合适的模板
3. 提供详细信息
4. 及时响应维护者的问题
5. 验证问题修复效果

### 对于维护者
1. 及时响应新Issue
2. 保持友好和专业的沟通
3. 定期清理过期Issue
4. 维护标签系统的一致性
5. 记录重要决策和讨论

## 📞 其他联系方式

如果您的问题不适合创建Issue，可以尝试：
- [💬 讨论区](https://github.com/yipoo/claude-gpt/discussions) - 提问和交流想法
- [📖 项目文档](https://github.com/yipoo/claude-gpt/tree/master/docs) - 查看详细文档
- [🚀 开发计划](https://github.com/yipoo/claude-gpt/blob/master/docs/开发计划文档.md) - 了解开发路线图

---

**感谢您为Claude GPT项目的贡献！🙏**