import { View, TextInput, TextInputProps, Text, TouchableOpacity } from 'react-native';
import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, isPassword, className = '', secureTextEntry, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isSecure = isPassword ? !showPassword : secureTextEntry;

    return (
      <View className={`flex-col space-y-2 ${className}`}>
        {label && <Text className="text-text-secondary font-body text-[14px]">{label}</Text>}
        <View className="relative justify-center">
          <TextInput
            ref={ref}
            placeholderTextColor="#555B6E" // text-tertiary
            secureTextEntry={isSecure}
            className={`${!props.multiline ? 'h-12' : 'py-3'} px-4 rounded-[12px] bg-surface-2 border font-body text-[14px] text-text-primary focus:border-accent ${
              error ? 'border-danger' : 'border-border-default'
            } ${isPassword ? 'pr-12' : ''}`}
            textAlignVertical={props.multiline ? 'top' : 'center'}
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4"
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={20} color="#A1A1AA" />
              ) : (
                <Eye size={20} color="#A1A1AA" />
              )}
            </TouchableOpacity>
          )}
        </View>
        {error && <Text className="text-danger text-[11px] font-body tracking-[0.3px]">{error}</Text>}
      </View>
    );
  }
);
