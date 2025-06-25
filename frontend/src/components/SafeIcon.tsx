import * as React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export const SafeIcon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = "#000"
}) => {
  // 直接使用@expo/vector-icons，现在已经正常工作
  return (
    <Ionicons 
      name={name as any} 
      size={size} 
      color={color}
      style={{ textAlign: 'center' }}
    />
  );
};