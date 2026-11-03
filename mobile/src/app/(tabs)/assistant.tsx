import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAlerts } from '../../context/AlertsContext';
import { useLocation } from '../../context/LocationContext';
import { askAssistant } from '../../lib/api';
import { makeId } from '../../lib/format';
import { colors, radius } from '../../theme';
import type { ChatMessage } from '../../types';

const SUGGESTIONS = [
  'What should I do right now?',
  'Where is the nearest shelter?',
  'What should I pack in an emergency kit?',
  'How do I stay safe during an earthquake?',
  'What to do during a flood?',
];

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  text: "Hi, I'm the Oarfin safety assistant. Ask me what to do in an emergency — I know your location and the alerts around you.",
};

export default function AssistantScreen() {
  const { position } = useLocation();
  const { dangerAlerts, nearby, shelters } = useAlerts();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const context = () => {
    const focus = dangerAlerts[0] ?? nearby[0];
    return {
      location: position ? `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}` : 'Unknown',
      disaster: focus
        ? `${focus.type} - ${focus.title}${dangerAlerts[0] ? ' (user is inside the danger zone)' : ''}`
        : 'General Emergency',
      shelters: shelters.slice(0, 5).map((s) => ({ name: s.name || s.type, distance_km: s.distance_km })),
    };
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { id: makeId(), role: 'user', text: message }]);
    setSending(true);
    try {
      const res = await askAssistant({ message, ...context() });
      const failed = !!res.error;
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'ai', text: res.reply || 'No response.', isError: failed, retryText: failed ? message : undefined },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'ai',
          text: e?.status === 404 ? 'The assistant is not available on this server yet.' : e?.message || 'Something went wrong.',
          isError: true,
          retryText: message,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble, item.isError && styles.errorBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' && { color: colors.white }]}>{item.text}</Text>
            {item.retryText && (
              <Pressable onPress={() => send(item.retryText!)} style={styles.retry}>
                <Ionicons name="refresh" size={14} color={colors.primary} />
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            )}
          </View>
        )}
        ListFooterComponent={
          sending ? (
            <View style={[styles.bubble, styles.aiBubble, styles.typing]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.typingText}>Thinking…</Text>
            </View>
          ) : undefined
        }
      />

      {messages.length <= 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => send(s)} style={styles.suggestion}>
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about safety, shelters, first aid…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim() || sending}
          style={[styles.sendButton, (!input.trim() || sending) && { opacity: 0.4 }]}
          accessibilityLabel="Send"
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
      <Text style={styles.disclaimer}>AI guidance can be wrong. In an emergency, follow official instructions and call your local emergency number.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: radius.lg },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  errorBubble: { borderColor: colors.warning, backgroundColor: '#FFFBEB' },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  retryText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  typingText: { color: colors.textSecondary, fontSize: 14 },
  suggestions: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  suggestion: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: colors.card },
});
