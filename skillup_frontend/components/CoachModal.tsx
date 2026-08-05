import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../constants/Api';
import { TodoItem, STAGE_META } from '../constants/todo';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Props = {
  item: TodoItem | null;
  token: string;
  onClose: () => void;
};

const CoachModal = ({ item, token, onClose }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setError('');
  }, [item?.id]);

  const send = async () => {
    const text = input.trim();
    if (!text || !item || isSending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          skill: item.text,
          stage: item.stage,
          messages: nextMessages,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setError(data.error || data.detail || 'The coach could not reply. Try again.');
      }
    } catch (err) {
      console.error('Error contacting coach:', err);
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={item !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Skill Coach</Text>
              {item && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.text.split(':')[0]} · {STAGE_META[item.stage].label}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close coach"
            >
              <Ionicons name="close" size={24} color="#F0E6FA" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <Text style={styles.introText}>
                Tell the coach where you are with this skill — just starting, stuck, or ready to
                level up — and it will help you plan your next step.
              </Text>
            )}
            {messages.map((message, index) => (
              <View
                key={index}
                style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.coachBubble]}
              >
                <Text style={message.role === 'user' ? styles.userBubbleText : styles.coachBubbleText}>
                  {message.content}
                </Text>
              </View>
            ))}
            {isSending && (
              <View style={[styles.bubble, styles.coachBubble]}>
                <ActivityIndicator color="#8A2BE2" size="small" />
              </View>
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask your coach..."
              placeholderTextColor="#B19CD9"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              editable={!isSending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (isSending || !input.trim()) && styles.sendButtonDisabled]}
              onPress={send}
              disabled={isSending || !input.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 5, 35, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    height: '75%',
    backgroundColor: '#5A1E96',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#D9C6F0',
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  messages: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
  },
  messagesContent: {
    padding: 12,
  },
  introText: {
    color: '#D9C6F0',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  coachBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  userBubbleText: {
    color: '#5A1E96',
    fontSize: 14,
    lineHeight: 19,
  },
  coachBubbleText: {
    color: '#F5EEFC',
    fontSize: 14,
    lineHeight: 19,
  },
  errorText: {
    color: '#FFD1D1',
    backgroundColor: 'rgba(180, 30, 60, 0.45)',
    borderRadius: 10,
    padding: 8,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 23,
    paddingHorizontal: 18,
    fontSize: 15,
    color: '#FFFFFF',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CoachModal;
