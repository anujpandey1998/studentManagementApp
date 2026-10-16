import React from 'react';
import { Modal, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './ui';
import { theme } from '../theme';

export function AppModal({
  visible,
  title,
  onClose,
  children,
}: React.PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} accessibilityViewIsModal>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {children}
          <Button title="Close" onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text },
});
