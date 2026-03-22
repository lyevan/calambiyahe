import { View, Text, Pressable } from 'react-native';

interface AlertBannerProps {
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({ type, title, description, onDismiss, className }: AlertBannerProps) {
  const getColors = () => {
    switch (type) {
      case 'danger': return { bg: 'bg-danger-surface', border: 'border-l-danger', text: 'text-danger' };
      case 'warning': return { bg: 'bg-warning-surface', border: 'border-l-warning', text: 'text-warning' };
      case 'success': return { bg: 'bg-success-surface', border: 'border-l-success', text: 'text-success' };
      case 'info': return { bg: 'bg-info-surface', border: 'border-l-info', text: 'text-info' };
    }
  };

  const { bg, border, text } = getColors();

  return (
    <View className={`w-full flex-row items-start p-4 ${bg} border-l-[4px] ${border} rounded-r-lg ${className || ''}`}>
      <View className="flex-1 mr-2">
        <Text className={`font-body font-medium text-[14px] ${text}`}>{title}</Text>
        {description && (
          <Text className="font-body text-[14px] text-text-secondary mt-1">{description}</Text>
        )}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} className="p-1">
          <Text className="text-text-tertiary">✕</Text>
        </Pressable>
      )}
    </View>
  );
}
