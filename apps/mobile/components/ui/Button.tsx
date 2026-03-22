import {
  Pressable,
  Text,
  PressableProps,
  ActivityIndicator,
} from "react-native";
import { LucideIcon } from 'lucide-react-native';

interface ButtonProps extends PressableProps {
  variant?: "primary" | "ghost" | "destructive";
  label: string;
  loading?: boolean;
  icon?: LucideIcon;
}

export function Button({
  variant = "primary",
  label,
  loading,
  disabled,
  icon: Icon,
  className = "",
  ...props
}: ButtonProps) {
  let containerClasses =
    "h-12 rounded-[10px] items-center justify-center flex-row px-4 ";
  let textClasses = "font-body font-medium text-[14px] ";

  if (variant === "primary") {
    containerClasses += disabled
      ? "bg-accent-muted "
      : "bg-accent active:bg-accent-hover ";
    textClasses += disabled ? "text-text-disabled" : "text-background";
  } else if (variant === "ghost") {
    containerClasses += disabled
      ? "border border-border-default "
      : "border border-accent active:bg-accent-muted ";
    textClasses += disabled ? "text-text-disabled" : "text-accent";
  } else if (variant === "destructive") {
    containerClasses += disabled
      ? "bg-border-subtle "
      : "bg-danger-surface border border-danger active:bg-[#E8404020] ";
    textClasses += disabled ? "text-text-disabled" : "text-danger";
  }

  return (
    <Pressable
      className={`${containerClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#0F1117" : "#0AADA8"}
        />
      ) : (
        <>
          {Icon && (
            <Icon
              size={18}
              color={variant === "primary" ? "white" : getIconColor(variant)}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={textClasses}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const getIconColor = (variant: string) => {
  if (variant === "destructive") return "#ef4444";
  return "#0AADA8";
};
