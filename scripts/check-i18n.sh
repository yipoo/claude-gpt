#!/bin/bash

# 前端国际化检查脚本
# 用于检查前端代码中可能的硬编码文字

echo "🌍 Claude GPT 前端国际化检查工具"
echo "=================================="

FRONTEND_DIR="./frontend/src"

# 检查是否存在前端目录
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ 错误: 前端目录不存在: $FRONTEND_DIR"
    exit 1
fi

echo ""
echo "📁 检查目录: $FRONTEND_DIR"
echo ""

# 1. 检查硬编码中文
echo "🔍 检查硬编码中文..."
echo "----------------------------------------"
CHINESE_RESULTS=$(grep -r "[\u4e00-\u9fa5]" "$FRONTEND_DIR" --include="*.tsx" --include="*.ts" 2>/dev/null || true)
if [ -n "$CHINESE_RESULTS" ]; then
    echo "⚠️  发现硬编码中文:"
    echo "$CHINESE_RESULTS"
else
    echo "✅ 未发现硬编码中文"
fi

echo ""

# 2. 检查可能的硬编码英文字符串（排除常见的技术术语）
echo "🔍 检查可能的硬编码英文字符串..."
echo "----------------------------------------"
ENGLISH_RESULTS=$(grep -r '"[A-Za-z][A-Za-z ]*[A-Za-z]"' "$FRONTEND_DIR" --include="*.tsx" --include="*.ts" 2>/dev/null | \
    grep -v "import\|export\|console\|require\|module\|typeof\|undefined\|boolean\|string\|number\|object\|function" | \
    grep -v "npm\|node\|react\|expo\|typescript\|javascript\|ios\|android" | \
    grep -v "url\|api\|http\|https\|localhost\|dev\|prod\|test" | \
    grep -v "px\|rem\|em\|vh\|vw\|flex\|center\|left\|right\|top\|bottom" || true)

if [ -n "$ENGLISH_RESULTS" ]; then
    echo "⚠️  发现可能的硬编码英文字符串:"
    echo "$ENGLISH_RESULTS"
else
    echo "✅ 未发现明显的硬编码英文字符串"
fi

echo ""

# 3. 检查 placeholder 是否国际化
echo "🔍 检查 placeholder 国际化..."
echo "----------------------------------------"
PLACEHOLDER_RESULTS=$(grep -r "placeholder=" "$FRONTEND_DIR" --include="*.tsx" 2>/dev/null | grep -v 't(' || true)
if [ -n "$PLACEHOLDER_RESULTS" ]; then
    echo "⚠️  发现未国际化的 placeholder:"
    echo "$PLACEHOLDER_RESULTS"
else
    echo "✅ placeholder 都已国际化"
fi

echo ""

# 4. 检查翻译文件结构
echo "🔍 检查翻译文件..."
echo "----------------------------------------"
EN_FILE="$FRONTEND_DIR/locales/en.json"
ZH_FILE="$FRONTEND_DIR/locales/zh.json"

if [ -f "$EN_FILE" ] && [ -f "$ZH_FILE" ]; then
    echo "✅ 翻译文件存在"
    
    # 检查两个文件的key数量
    EN_KEYS=$(cat "$EN_FILE" | jq -r 'paths(scalars) as $p | $p | join(".")' 2>/dev/null | wc -l || echo "0")
    ZH_KEYS=$(cat "$ZH_FILE" | jq -r 'paths(scalars) as $p | $p | join(".")' 2>/dev/null | wc -l || echo "0")
    
    echo "📊 英文翻译 key 数量: $EN_KEYS"
    echo "📊 中文翻译 key 数量: $ZH_KEYS"
    
    if [ "$EN_KEYS" -eq "$ZH_KEYS" ]; then
        echo "✅ 两个语言文件的 key 数量一致"
    else
        echo "⚠️  两个语言文件的 key 数量不一致"
    fi
else
    echo "❌ 翻译文件缺失"
    [ ! -f "$EN_FILE" ] && echo "   缺失: $EN_FILE"
    [ ! -f "$ZH_FILE" ] && echo "   缺失: $ZH_FILE"
fi

echo ""

# 5. 检查 t() 函数使用
echo "🔍 检查 t() 函数使用情况..."
echo "----------------------------------------"
T_USAGE=$(grep -r "t(" "$FRONTEND_DIR" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l || echo "0")
echo "📊 t() 函数使用次数: $T_USAGE"

echo ""

# 6. 生成检查报告
echo "📋 检查总结"
echo "----------------------------------------"
if [ -z "$CHINESE_RESULTS" ] && [ -z "$ENGLISH_RESULTS" ] && [ -z "$PLACEHOLDER_RESULTS" ]; then
    echo "🎉 恭喜! 未发现明显的国际化问题"
else
    echo "⚠️  发现需要关注的国际化问题，请查看上述详细信息"
fi

echo ""
echo "💡 建议:"
echo "1. 定期运行此脚本检查新添加的代码"
echo "2. 在 PR 中包含国际化检查"
echo "3. 确保所有用户可见文字都使用 t() 函数"
echo "4. 保持英文和中文翻译文件同步"

echo ""
echo "✨ 检查完成!"