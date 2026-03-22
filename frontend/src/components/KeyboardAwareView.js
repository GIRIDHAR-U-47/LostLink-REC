import React from 'react';
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native';

/**
 * KeyboardAwareView - Reusable wrapper for keyboard-safe form screens
 * Combines KeyboardAvoidingView + ScrollView with proper props
 * 
 * Props:
 * - style: style for outer KeyboardAvoidingView
 * - contentContainerStyle: style for ScrollView content
 * - children: components to render
 * - enabled: whether keyboard avoidance is enabled (default: true)
 */
const KeyboardAwareView = ({ 
  style, 
  contentContainerStyle, 
  children,
  enabled = true 
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={style}
      enabled={enabled}
    >
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default KeyboardAwareView;
