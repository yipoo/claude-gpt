---
name: 🌍 检查前端文字国际化
about: 审核前端所有文字是否都已国际化
title: '🌍 检查前端文字国际化覆盖率'
labels: ['i18n', 'frontend', 'audit', 'enhancement']
assignees: ''
---

## 🌍 需求描述

需要全面检查前端应用中的所有文字内容，确保都已经通过 i18next 进行国际化处理，没有硬编码的中英文文字。

## 🎯 检查范围

### 1. 组件文字检查
- [ ] **Chat 组件**
  - [ ] `MessageBubble.tsx` - 消息气泡文字
  - [ ] `MessageInput.tsx` - 输入框提示文字
  - [ ] `MessageList.tsx` - 列表相关文字
  
- [ ] **Screen 页面**
  - [ ] `AuthTestScreen.tsx` - 认证测试页面
  - [ ] `ChatScreen.tsx` - 聊天页面
  - [ ] `ConversationsScreen.tsx` - 对话列表页面
  - [ ] `LoadingScreen.tsx` - 加载页面
  - [ ] `LoginScreen.tsx` - 登录页面
  - [ ] `ProfileScreen.tsx` - 个人资料页面
  - [ ] `RegisterScreen.tsx` - 注册页面
  - [ ] `SearchScreen.tsx` - 搜索页面
  - [ ] `SettingsScreen.tsx` - 设置页面
  - [ ] `SubscriptionScreen.tsx` - 订阅页面
  - [ ] `SubscriptionSuccessScreen.tsx` - 订阅成功页面

- [ ] **通用组件**
  - [ ] `LoadingOverlay.tsx` - 加载遮罩
  - [ ] `NetworkStatusBar.tsx` - 网络状态栏
  - [ ] `DrawerContent.tsx` - 抽屉菜单内容
  - [ ] `VirtualizedMessageList.tsx` - 虚拟化消息列表
  - [ ] `Subscription/*` - 订阅相关组件

### 2. 服务和工具类检查
- [ ] **ExportService.ts** - 导出功能相关文字
- [ ] **SearchService.ts** - 搜索功能相关文字
- [ ] **SyncService.ts** - 同步功能相关文字
- [ ] **错误消息** - API 错误提示文字
- [ ] **成功消息** - 操作成功提示文字

### 3. 配置文件检查
- [ ] **app.json** - 应用配置中的显示文字
- [ ] **package.json** - 应用描述文字

## 🔍 具体检查项目

### 硬编码文字类型
1. **按钮文字**
   - 登录、注册、保存、取消等按钮
   - 确认、删除、编辑等操作按钮

2. **提示信息**
   - 错误提示消息
   - 成功提示消息
   - 警告提示消息
   - 空状态提示

3. **标签和标题**
   - 页面标题
   - 字段标签
   - 分组标题

4. **占位符文字**
   - 输入框 placeholder
   - 搜索框提示文字

5. **状态文字**
   - 加载中、无数据、错误状态等

## 📋 检查标准

### 1. 文字提取原则
- [ ] 所有用户可见的文字都应该使用 `t()` 函数
- [ ] 文字 key 应该有意义且结构化
- [ ] 避免在代码中直接写中文或英文字符串

### 2. i18n key 命名规范
```javascript
// ✅ 好的命名
t('common.buttons.save')
t('auth.login.emailPlaceholder')
t('error.network.connectionFailed')

// ❌ 不好的命名
t('btn1')
t('msg')
t('text')
```

### 3. 翻译文件完整性
- [ ] `/frontend/src/locales/en.json` 包含所有 key
- [ ] `/frontend/src/locales/zh.json` 包含所有 key
- [ ] 两个语言文件的 key 结构完全一致

## 🛠️ 检查工具

### 1. 代码搜索命令
```bash
# 搜索可能的硬编码中文
grep -r "[\u4e00-\u9fa5]" frontend/src/ --include="*.tsx" --include="*.ts"

# 搜索可能的硬编码英文字符串
grep -r '"[A-Za-z][^"]*[A-Za-z]"' frontend/src/ --include="*.tsx" --include="*.ts"

# 搜索未使用 t() 的文字
grep -r "placeholder\|title\|label" frontend/src/ --include="*.tsx" | grep -v "t("
```

### 2. 使用 i18n key 检查器
可以编写脚本检查:
- 代码中使用但翻译文件中缺失的 key
- 翻译文件中存在但代码中未使用的 key

## ✅ 验收标准

- [ ] 前端所有用户可见文字都通过 i18next 处理
- [ ] en.json 和 zh.json 文件完整且结构一致
- [ ] 没有硬编码的中英文字符串
- [ ] 所有 i18n key 命名规范且有意义
- [ ] 新增的文字内容都有对应的翻译
- [ ] 应用在中英文切换时没有遗漏的文字

## 📝 检查报告格式

完成检查后，请提供以下信息：
1. 发现的硬编码文字列表
2. 缺失的翻译 key 列表
3. 修复建议和优先级
4. 测试验证结果

## 🚀 优先级

高优先级 - 影响用户体验和产品的国际化质量