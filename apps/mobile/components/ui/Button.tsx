// components/ui/Button.tsx
import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  onPress, 
  title, 
  loading, 
  variant = "primary",
  className = ""
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary": return "bg-blue-600 border-blue-600";
      case "secondary": return "bg-gray-200 border-gray-200";
      case "danger": return "bg-red-500 border-red-500";
      case "ghost": return "bg-transparent border-transparent";
      default: return "bg-blue-600 border-blue-600";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "secondary": return "text-gray-900";
      case "ghost": return "text-blue-600";
      default: return "text-white";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className={`p-4 rounded-xl border flex-row justify-center items-center ${getVariantStyles()} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#000" : "#fff"} />
      ) : (
        <Text className={`text-center font-bold text-lg ${getTextColor()}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
