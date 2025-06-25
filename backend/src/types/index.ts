/**
 * 从 Prisma 生成的客户端导出类型和枚举
 * 这个文件用于集中管理 Prisma 类型的导出，方便在应用中引用
 */

import { $Enums } from '@prisma/client';

// 导出所有 Prisma 生成的类型
export type {
  User,
  Message,
  Conversation,
  UsageRecord
} from '@prisma/client';

// 导出所有 Prisma 生成的枚举
export { $Enums } from '@prisma/client';

// 为了方便使用，单独导出常用枚举值
export const MessageRole = $Enums.MessageRole;
export const MessageStatus = $Enums.MessageStatus;
export const MessageContentType = $Enums.MessageContentType;
export const UsageType = $Enums.UsageType;
export const SubscriptionTier = $Enums.SubscriptionTier;
export const SubscriptionStatus = $Enums.SubscriptionStatus;

// 导出枚举类型
export type MessageRoleType = $Enums.MessageRole;
export type MessageStatusType = $Enums.MessageStatus;
export type MessageContentTypeType = $Enums.MessageContentType;
export type UsageTypeType = $Enums.UsageType;
export type SubscriptionTierType = $Enums.SubscriptionTier;
export type SubscriptionStatusType = $Enums.SubscriptionStatus;
