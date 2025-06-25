# 后端API设计文档

## API概述

Claude GPT 后端采用 RESTful API 设计，提供完整的用户管理、对话处理、订阅支付和数据管理功能。所有API都采用JSON格式进行数据交换，并支持JWT认证。

### 基础信息
- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **编码**: UTF-8

### 通用响应格式
```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
    };
    timestamp: string;
    requestId: string;
  };
}
```

## 认证相关API

### 1. 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "张三"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "fullName": "张三",
      "subscriptionTier": "free",
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

### 2. 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 3. 刷新Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

### 4. 退出登录
```http
POST /api/v1/auth/logout
Authorization: Bearer jwt-access-token
```

## 用户管理API

### 1. 获取用户信息
```http
GET /api/v1/user/profile
Authorization: Bearer jwt-access-token
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "fullName": "张三",
    "avatarUrl": null,
    "subscriptionTier": "free",
    "subscriptionStatus": "active",
    "monthlyMessageCount": 5,
    "totalMessageCount": 25,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastActiveAt": "2024-01-01T12:00:00Z"
  }
}
```

### 2. 更新用户信息
```http
PUT /api/v1/user/profile
Authorization: Bearer jwt-access-token
Content-Type: application/json

{
  "fullName": "张三丰",
  "preferredLanguage": "zh",
  "themePreference": "dark"
}
```

### 3. 获取使用量统计
```http
GET /api/v1/user/usage
Authorization: Bearer jwt-access-token
```

## 对话管理API

### 1. 获取对话列表
```http
GET /api/v1/conversations?page=1&limit=20&archived=false
Authorization: Bearer jwt-access-token
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `archived`: 是否包含已归档 (默认: false)
- `search`: 搜索关键词

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-uuid",
      "title": "关于产品设计的讨论",
      "summary": "讨论了移动应用的用户体验设计...",
      "messageCount": 15,
      "totalTokens": 2500,
      "isArchived": false,
      "isPinned": true,
      "createdAt": "2024-01-01T10:00:00Z",
      "lastMessageAt": "2024-01-01T12:30:00Z",
      "lastMessage": {
        "role": "assistant",
        "content": "这个设计方案确实很有创意..."
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "hasNext": true
    }
  }
}
```

### 2. 创建新对话
```http
POST /api/v1/conversations
Authorization: Bearer jwt-access-token
Content-Type: application/json

{
  "title": "新的对话主题"
}
```

### 3. 获取对话详情
```http
GET /api/v1/conversations/:conversationId
Authorization: Bearer jwt-access-token
```

### 4. 获取对话消息
```http
GET /api/v1/conversations/:conversationId/messages?page=1&limit=50
Authorization: Bearer jwt-access-token
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "conversationId": "conv-uuid",
      "role": "user",
      "content": "你能帮我设计一个移动应用吗？",
      "contentType": "text",
      "status": "sent",
      "createdAt": "2024-01-01T10:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "conversationId": "conv-uuid",
      "role": "assistant",
      "content": "当然可以！首先我需要了解...",
      "contentType": "text",
      "modelUsed": "gpt-4",
      "promptTokens": 50,
      "completionTokens": 120,
      "totalTokens": 170,
      "status": "sent",
      "createdAt": "2024-01-01T10:01:00Z"
    }
  ]
}
```

## AI对话API (流式传输)

### 1. 发送消息 (流式响应)
```http
POST /api/v1/chat/stream
Authorization: Bearer jwt-access-token
Content-Type: application/json
Accept: text/event-stream

{
  "conversationId": "conv-uuid",
  "message": "请帮我分析一下当前的市场趋势",
  "model": "gpt-4"
}
```

**Server-Sent Events 响应格式:**
```
event: start
data: {"messageId": "msg-uuid", "conversationId": "conv-uuid"}

event: chunk
data: {"content": "当前市场"}

event: chunk  
data: {"content": "趋势显示"}

event: chunk
data: {"content": "技术股表现强劲..."}

event: complete
data: {"messageId": "msg-uuid", "totalTokens": 150, "cost": 0.003}

event: error
data: {"error": "rate_limit_exceeded", "message": "请求过于频繁"}
```

### 2. 重新生成消息
```http
POST /api/v1/chat/regenerate
Authorization: Bearer jwt-access-token
Content-Type: application/json
Accept: text/event-stream

{
  "messageId": "msg-uuid",
  "model": "gpt-4"
}
```

### 3. 停止生成
```http
POST /api/v1/chat/stop
Authorization: Bearer jwt-access-token
Content-Type: application/json

{
  "messageId": "msg-uuid"
}
```

## 订阅支付API

### 1. 获取订阅计划
```http
GET /api/v1/subscription/plans
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "currency": "CNY",
      "interval": "month",
      "features": [
        "每月10次对话",
        "基础AI模型",
        "基础客服支持"
      ],
      "limits": {
        "messagesPerMonth": 10,
        "aiModels": ["gpt-3.5-turbo"],
        "prioritySupport": false
      }
    },
    {
      "id": "base",
      "name": "Base",
      "price": 2900,
      "currency": "CNY", 
      "interval": "month",
      "stripePriceId": "price_1234567890",
      "features": [
        "每月100次对话",
        "高级AI模型",
        "优先响应"
      ],
      "limits": {
        "messagesPerMonth": 100,
        "aiModels": ["gpt-3.5-turbo", "gpt-4"],
        "prioritySupport": true
      }
    }
  ]
}
```

### 2. 获取订阅状态
```http
GET /api/v1/subscription/status
Authorization: Bearer jwt-access-token
```

### 3. 创建订阅
```http
POST /api/v1/subscription/create
Authorization: Bearer jwt-access-token
Content-Type: application/json

{
  "planId": "base",
  "paymentMethodId": "pm_1234567890"
}
```

### 4. 取消订阅
```http
POST /api/v1/subscription/cancel
Authorization: Bearer jwt-access-token
```

### 5. 获取账单历史
```http
GET /api/v1/subscription/invoices?page=1&limit=10
Authorization: Bearer jwt-access-token
```

## 系统配置API

### 1. 获取AI模型列表
```http
GET /api/v1/system/models
Authorization: Bearer jwt-access-token
```

### 2. 检查服务状态
```http
GET /api/v1/system/health
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "services": {
      "database": "healthy",
      "openai": "healthy",
      "stripe": "healthy"
    }
  }
}
```

## 数据导出API

### 1. 导出对话记录
```http
POST /api/v1/export/conversations
Authorization: Bearer jwt-access-token
Content-Type: application/json

{
  "format": "json",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "includeArchived": false
}
```

### 2. 获取导出状态
```http
GET /api/v1/export/:exportId/status
Authorization: Bearer jwt-access-token
```

### 3. 下载导出文件
```http
GET /api/v1/export/:exportId/download
Authorization: Bearer jwt-access-token
```

## WebHook API

### 1. Stripe WebHook
```http
POST /api/v1/webhooks/stripe
Content-Type: application/json
Stripe-Signature: stripe-signature-header

{
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "customer": "cus_1234567890",
      "status": "active"
    }
  }
}
```

## 错误处理

### 错误码定义
```typescript
enum ErrorCode {
  // 认证错误 (1000-1099)
  UNAUTHORIZED = 'AUTH_001',
  INVALID_TOKEN = 'AUTH_002', 
  TOKEN_EXPIRED = 'AUTH_003',
  INVALID_CREDENTIALS = 'AUTH_004',
  
  // 权限错误 (1100-1199)
  FORBIDDEN = 'PERM_001',
  INSUFFICIENT_PERMISSIONS = 'PERM_002',
  
  // 资源错误 (1200-1299)
  NOT_FOUND = 'RESOURCE_001',
  ALREADY_EXISTS = 'RESOURCE_002',
  
  // 业务逻辑错误 (1300-1399)
  SUBSCRIPTION_REQUIRED = 'BIZ_001',
  USAGE_LIMIT_EXCEEDED = 'BIZ_002',
  INVALID_SUBSCRIPTION_STATUS = 'BIZ_003',
  
  // 外部服务错误 (1400-1499)
  OPENAI_API_ERROR = 'EXT_001',
  STRIPE_API_ERROR = 'EXT_002',
  DATABASE_ERROR = 'EXT_003',
  
  // 验证错误 (1500-1599)
  VALIDATION_ERROR = 'VAL_001',
  INVALID_REQUEST_FORMAT = 'VAL_002',
  
  // 系统错误 (9000-9999)
  INTERNAL_SERVER_ERROR = 'SYS_001',
  SERVICE_UNAVAILABLE = 'SYS_002'
}
```

### 错误响应示例
```json
{
  "success": false,
  "error": {
    "code": "BIZ_002",
    "message": "已达到当月使用限制",
    "details": {
      "currentUsage": 10,
      "limit": 10,
      "resetDate": "2024-02-01T00:00:00Z"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T12:00:00Z",
    "requestId": "req-uuid"
  }
}
```

## 请求限制与配额

### 速率限制
```
- 认证相关API: 10 requests/minute
- 对话API: 基于订阅等级
  - Free: 10 requests/minute
  - Base: 60 requests/minute  
  - Pro: 300 requests/minute
- 其他API: 100 requests/minute
```

### 响应头
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## 安全措施

### 1. 认证安全
- JWT Token过期时间: 1小时
- Refresh Token过期时间: 30天
- 密码最小复杂度要求
- 登录失败次数限制

### 2. API安全
- HTTPS强制传输
- CORS配置
- 请求体大小限制
- SQL注入防护
- XSS防护

### 3. 数据安全
- 敏感数据加密存储
- API密钥环境变量管理
- 数据库连接加密
- 审计日志记录

## 监控与日志

### 1. 请求日志格式
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "requestId": "req-uuid",
  "method": "POST",
  "path": "/api/v1/chat/stream",
  "userId": "user-uuid",
  "userAgent": "Claude-GPT-Mobile/1.0.0",
  "ip": "192.168.1.100",
  "duration": 1500,
  "statusCode": 200,
  "error": null
}
```

### 2. 错误日志格式
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "level": "error",
  "requestId": "req-uuid",
  "userId": "user-uuid",
  "error": {
    "name": "OpenAIAPIError",
    "message": "Rate limit exceeded",
    "stack": "Error stack trace...",
    "code": "EXT_001"
  },
  "context": {
    "endpoint": "/api/v1/chat/stream",
    "model": "gpt-4",
    "tokenCount": 150
  }
}
```

### 3. 业务指标监控
- API响应时间
- 错误率统计
- 用户活跃度
- 订阅转化率
- AI使用量统计
- 系统资源使用率

这个API设计提供了完整的后端服务接口，支持前后端分离架构，确保了安全性、可扩展性和易用性。