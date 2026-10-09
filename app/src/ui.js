import React from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';

export const colors = { primary: '#1d3557', accent: '#e63946', bg: '#f5f6f8', muted: '#6b7280' };

export const Btn = ({ title, onPress, kind = 'primary', disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[s.btn, kind === 'ghost' && s.ghost, kind === 'danger' && { backgroundColor: colors.accent }, disabled && { opacity: 0.5 }]}
  >
    <Text style={[s.btnText, kind === 'ghost' && { color: colors.primary }]}>{title}</Text>
  </TouchableOpacity>
);

export const Input = (p) => <TextInput placeholderTextColor="#9ca3af" {...p} style={[s.input, p.style]} />;
export const Card = ({ children, onPress }) =>
  onPress ? (
    <TouchableOpacity onPress={onPress} style={s.card}>{children}</TouchableOpacity>
  ) : (
    <View style={s.card}>{children}</View>
  );
export const H = ({ children }) => <Text style={s.h}>{children}</Text>;
export const Muted = ({ children }) => <Text style={{ color: colors.muted, marginTop: 2 }}>{children}</Text>;

export const STATUS_LABEL = {
  searching: 'Finding a professional…',
  assigned: 'Professional assigned',
  on_the_way: 'On the way',
  in_progress: 'Service in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  unassigned: 'No professional available yet',
};

const s = StyleSheet.create({
  btn: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginVertical: 6 },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, marginVertical: 6, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginVertical: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  h: { fontSize: 20, fontWeight: '700', marginVertical: 8, color: colors.primary },
});
