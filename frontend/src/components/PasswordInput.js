import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

/**
 * PasswordInput - Reusable password input component with visibility toggle
 * 
 * Props:
 * - value: password value (string)
 * - onChangeText: callback when password changes
 * - placeholder: placeholder text (default: "Password")
 * - editable: whether input is editable (default: true)
 * - style: custom style for container
 * - inputStyle: custom style for TextInput itself
 */
const PasswordInput = ({
  value,
  onChangeText,
  placeholder = 'Password',
  editable = true,
  style,
  inputStyle,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        editable={editable}
        placeholderTextColor={COLORS.textLight}
      />
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowPassword(!showPassword)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={showPassword ? 'eye' : 'eye-off'}
          size={24}
          color={COLORS.textLight}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 15,
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    paddingRight: 50, // Space for the eye icon
    color: COLORS.text,
    height: 50, // Fixed height for consistent alignment
  },
  toggleButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
  },
});

export default PasswordInput;
