#!/bin/bash

# GitHub Issues 创建脚本
# 使用此脚本在认证后自动创建项目issues

echo "🚀 Claude GPT GitHub Issues 创建工具"
echo "====================================="

# 检查是否已认证
if ! gh auth status &>/dev/null; then
    echo "❌ 错误: 请先运行 'gh auth login' 进行GitHub认证"
    exit 1
fi

echo "✅ GitHub CLI 已认证"
echo ""

# Issue 1: 创建中文版README
echo "📝 创建 Issue 1: 中文版 README..."
gh issue create \
  --title "📝 创建中文版 README" \
  --label "documentation,enhancement,chinese,i18n" \
  --body "$(cat <<'EOF'
## 📝 需求描述

为了更好地服务中文用户，需要创建一个中文版的 README 文档。

## 🎯 具体任务

### 1. 创建 README_zh.md
- [ ] 翻译项目标题和描述
- [ ] 翻译功能特性列表
- [ ] 翻译项目结构说明
- [ ] 翻译技术栈介绍
- [ ] 翻译快速开始指南
- [ ] 翻译开发指南
- [ ] 翻译架构说明
- [ ] 翻译部署指南
- [ ] 翻译贡献指南

### 2. 更新主 README.md
- [ ] 在顶部添加语言切换链接
- [ ] 添加中文 README 链接

## 📋 具体要求

1. **文件结构**
   ```
   README.md          # 英文版（主要）
   README_zh.md       # 中文版
   ```

2. **内容要求**
   - 保持与英文版结构一致
   - 使用地道的中文表达
   - 技术术语保持英文，添加中文解释
   - 命令行示例保持英文

3. **样式要求**
   - 使用合适的中文标点符号
   - emoji 使用保持一致
   - 代码块格式保持一致

## 🔗 参考

- 英文版 README.md
- 项目的中文本地化文件 `/frontend/src/locales/zh.json`

## ✅ 验收标准

- [ ] README_zh.md 文件创建完成
- [ ] 中文内容准确，无语法错误
- [ ] 格式与英文版保持一致
- [ ] 主 README.md 添加了语言切换链接
- [ ] 中文技术文档易于理解

## 🚀 优先级

中等优先级 - 有助于扩大项目的中文用户群体
EOF
)"

if [ $? -eq 0 ]; then
    echo "✅ Issue 1 创建成功"
else
    echo "❌ Issue 1 创建失败"
fi

echo ""

# Issue 2: 前端国际化检查
echo "🌍 创建 Issue 2: 前端国际化检查..."
gh issue create \
  --title "🌍 检查前端文字国际化覆盖率" \
  --label "i18n,frontend,audit,enhancement" \
  --body "$(cat <<'EOF'
## 🌍 需求描述

需要全面检查前端应用中的所有文字内容，确保都已经通过 i18next 进行国际化处理，没有硬编码的中英文文字。

## 📊 当前检查结果

运行 `./scripts/check-i18n.sh` 发现以下问题：

### 1. 硬编码 placeholder 文字 (8处)
- `ConversationsScreen.tsx`: "输入新标题"
- `ProfileScreen.tsx`: "Enter your display name", "Tell us about yourself"  
- `AuthTestScreen.tsx`: "邮箱", "密码", "姓名"
- `SearchScreen.tsx`: "Search conversations..."

### 2. 翻译文件不同步
- 英文翻译 key: 141 个
- 中文翻译 key: 133 个
- **缺少 8 个中文翻译**

### 3. 技术属性 (需确认是否需要国际化)
- 组件属性: `mode="contained"`, `size="large"` 等
- 导航名称: `name="Chat"`, `name="Settings"` 等

## 🎯 具体任务

### 1. 修复硬编码文字
- [ ] 修复 ConversationsScreen.tsx 中的 "输入新标题"
- [ ] 修复 ProfileScreen.tsx 中的英文 placeholder
- [ ] 修复 AuthTestScreen.tsx 中的中文 placeholder  
- [ ] 修复 SearchScreen.tsx 中的 "Search conversations..."
- [ ] 修复 MessageInput.tsx 中的动态 placeholder

### 2. 同步翻译文件
- [ ] 找出缺失的 8 个翻译 key
- [ ] 补充中文翻译文件
- [ ] 确保英文和中文翻译结构一致

### 3. 建立检查流程
- [ ] 将 `./scripts/check-i18n.sh` 集成到 CI/CD
- [ ] 建立 PR 中的国际化检查规范
- [ ] 创建开发文档说明国际化要求

## 🔍 检查工具

项目已提供自动化检查工具：
```bash
./scripts/check-i18n.sh
```

该工具会检查：
- 硬编码中文字符
- 硬编码英文字符串
- 未国际化的 placeholder
- 翻译文件完整性
- t() 函数使用情况

## ✅ 验收标准

- [ ] 所有用户可见文字都通过 i18next 处理
- [ ] en.json 和 zh.json 文件完整且结构一致
- [ ] 没有硬编码的中英文字符串
- [ ] 运行检查脚本无警告
- [ ] 应用中英文切换完全正常

## 🚀 优先级

**高优先级** - 直接影响用户体验和产品国际化质量

## 💡 相关文件

- `/frontend/src/locales/en.json` - 英文翻译
- `/frontend/src/locales/zh.json` - 中文翻译  
- `/scripts/check-i18n.sh` - 检查工具
EOF
)"

if [ $? -eq 0 ]; then
    echo "✅ Issue 2 创建成功"
else
    echo "❌ Issue 2 创建失败"
fi

echo ""
echo "🎉 Issues 创建完成!"
echo ""
echo "📋 总结:"
echo "- Issue 1: 📝 创建中文版 README (中等优先级)"
echo "- Issue 2: 🌍 检查前端文字国际化覆盖率 (高优先级)"
echo ""
echo "🔗 访问项目 Issues: https://github.com/yipoo/claude-gpt/issues"