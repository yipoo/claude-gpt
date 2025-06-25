# 📋 GitHub Issues 待创建列表

根据项目当前状态，以下是需要在 GitHub 上创建的 issues：

## 🎯 Issue 1: 创建中文版 README

**标题:** 📝 创建中文版 README  
**标签:** `documentation`, `enhancement`, `chinese`, `i18n`  
**优先级:** 中等

**描述:** 为了更好地服务中文用户群体，需要创建完整的中文版 README 文档。

**具体任务:**
- 创建 `README_zh.md` 文件
- 翻译所有章节内容
- 在主 README 中添加语言切换链接
- 保持格式和结构一致性

---

## 🎯 Issue 2: 前端国际化检查和修复

**标题:** 🌍 检查前端文字国际化覆盖率  
**标签:** `i18n`, `frontend`, `audit`, `enhancement`  
**优先级:** 高

**描述:** 全面审核前端应用，确保所有用户可见文字都已国际化。

**当前发现的问题:**
1. **硬编码 placeholder 文字** (8处)
   - `ConversationsScreen.tsx`: "输入新标题"
   - `ProfileScreen.tsx`: "Enter your display name", "Tell us about yourself"  
   - `AuthTestScreen.tsx`: "邮箱", "密码", "姓名"
   - `SearchScreen.tsx`: "Search conversations..."

2. **翻译文件不同步**
   - 英文翻译 key: 141 个
   - 中文翻译 key: 133 个
   - 缺少 8 个中文翻译

3. **技术属性硬编码** (可接受，但需确认)
   - 组件属性如 `mode="contained"`, `size="large"` 等
   - 导航名称如 `name="Chat"`, `name="Settings"` 等

**具体任务:**
- [ ] 修复所有硬编码的 placeholder 文字
- [ ] 同步英文和中文翻译文件
- [ ] 确认技术属性是否需要国际化
- [ ] 建立国际化检查工作流

---

## 🛠️ 已创建的工具和模板

### 1. GitHub Issue 模板
- `.github/ISSUE_TEMPLATE/chinese-readme.md`
- `.github/ISSUE_TEMPLATE/frontend-i18n-audit.md`
- `.github/ISSUE_TEMPLATE/config.yml`

### 2. 国际化检查工具
- `scripts/check-i18n.sh` - 自动化国际化检查脚本

## 📝 创建 Issues 的步骤

1. **访问仓库:** https://github.com/yipoo/claude-gpt
2. **点击 "Issues" 标签页**
3. **点击 "New issue" 按钮**
4. **选择对应的模板:**
   - "📝 创建中文版 README"
   - "🌍 检查前端文字国际化"
5. **填写详细信息并提交**

## 🚀 后续建议

1. **设置 GitHub Actions**
   - 在 PR 中自动运行国际化检查
   - 确保新代码符合国际化标准

2. **建立开发规范**
   - 所有用户可见文字必须使用 `t()` 函数
   - 新功能开发时同步更新翻译文件

3. **定期维护**
   - 每周运行一次国际化检查脚本
   - 及时修复发现的问题

---

**注意:** 这些 issue 模板已经准备就绪，可以直接在 GitHub 上使用！