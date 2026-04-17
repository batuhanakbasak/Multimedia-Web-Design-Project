import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let emitToast:
  | ((message: string, variant?: ToastVariant) => void)
  | undefined;

export const showToast = (message: string, variant: ToastVariant = 'info') => {
  emitToast?.(message, variant);
};

const getToastAppearance = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return {
        backgroundColor: theme.colors.successSoft,
        borderColor: '#c7e3d4',
        icon: 'checkmark-circle',
        iconColor: theme.colors.success,
      };
    case 'error':
      return {
        backgroundColor: theme.colors.dangerSoft,
        borderColor: '#f0caca',
        icon: 'alert-circle',
        iconColor: theme.colors.danger,
      };
    default:
      return {
        backgroundColor: theme.colors.primarySoft,
        borderColor: '#c7e8e4',
        icon: 'information-circle',
        iconColor: theme.colors.primaryDeep,
      };
  }
};

const ToastCard = ({ item }: { item: ToastItem }) => {
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const appearance = getToastAppearance(item.variant);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: appearance.backgroundColor,
          borderColor: appearance.borderColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name={appearance.icon as never} size={20} color={appearance.iconColor} />
      <Text style={styles.toastText}>{item.message}</Text>
    </Animated.View>
  );
};

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    emitToast = (message, variant = 'info') => {
      const toastId = Date.now() + Math.random();
      setItems((previous) => [...previous, { id: toastId, message, variant }]);

      setTimeout(() => {
        setItems((previous) => previous.filter((entry) => entry.id !== toastId));
      }, 2800);
    };

    return () => {
      emitToast = undefined;
    };
  }, []);

  return (
    <>
      {children}
      <View pointerEvents="none" style={styles.stack}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    gap: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    ...theme.shadow.floating,
  },
  toastText: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
});
