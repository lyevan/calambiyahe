import { View, ViewProps, ScrollView, Pressable } from 'react-native';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react-native';

export type SnapPoint = 'minimized' | 'expanded';

interface BottomSheetProps extends ViewProps {
  snapPoint?: SnapPoint;
  onSnapPointChange?: (point: SnapPoint) => void;
}

export function BottomSheet({ snapPoint = 'minimized', onSnapPointChange, style, children, ...props }: BottomSheetProps) {
  const heightClass = 
    snapPoint === 'minimized' ? 'h-[80px]' : 
    'h-[75%]';
  
  const handleToggle = () => {
    if (!onSnapPointChange) return;
    onSnapPointChange(snapPoint === 'expanded' ? 'minimized' : 'expanded');
  };

  return (
    <View
      className={`absolute bottom-0 left-0 right-0 bg-surface-2 rounded-t-[24px] overflow-hidden ${heightClass}`}
      style={[{ elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 }, style]}
      {...props}
    >
      <Pressable onPress={handleToggle} className="w-full items-center py-2 active:bg-surface-3">
        <View className="items-center">
          <View className="w-[32px] h-[4px] bg-border-default rounded-full opacity-30 mb-1" />
          {snapPoint === 'expanded' ? (
            <ChevronDown size={20} color="#94a3b8" strokeWidth={3} />
          ) : (
            <ChevronUp size={20} color="#94a3b8" strokeWidth={3} />
          )}
        </View>
      </Pressable>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 40 }}>
        {children}
      </ScrollView>
    </View>
  );
}
