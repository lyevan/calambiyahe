import { View, ViewProps, Text } from 'react-native';

interface CardProps extends ViewProps {
  accentBarColor?: string; // hex color for the left bar
}

export function Card({ accentBarColor, children, ...props }: CardProps) {
  return (
    <View
      className="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden relative"
      {...props}
    >
      {accentBarColor && (
        <View
          style={{ backgroundColor: accentBarColor }}
          className="absolute left-0 top-0 bottom-0 w-1 z-10"
        />
      )}
      {children}
    </View>
  );
}
