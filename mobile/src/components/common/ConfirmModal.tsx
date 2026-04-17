import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <SecondaryButton title={cancelLabel} onPress={onCancel} />
            <PrimaryButton title={confirmLabel} onPress={onConfirm} loading={loading} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.overlay,
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 24,
  },
  message: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
