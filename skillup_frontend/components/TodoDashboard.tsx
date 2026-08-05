import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem, STAGE_META } from '../constants/todo';

type Props = {
  items: TodoItem[];
  improvingId: string | null;
  onToggleComplete: (id: string) => void;
  onAdvanceStage: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenCoach: (item: TodoItem) => void;
  onImprove: (item: TodoItem) => void;
};

const TodoDashboard = ({
  items,
  improvingId,
  onToggleComplete,
  onAdvanceStage,
  onRemove,
  onOpenCoach,
  onImprove,
}: Props) => {
  const [showCompleted, setShowCompleted] = useState(true);
  const activeItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statNumber}>{activeItems.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statNumber}>{completedItems.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>To-Do</Text>
      {activeItems.length === 0 ? (
        <Text style={styles.emptyText}>
          Nothing here yet. Swipe a skill card right (or press "Add to List") to start tracking it.
        </Text>
      ) : (
        activeItems.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemText}>{item.text}</Text>
            <View style={styles.itemFooter}>
              <TouchableOpacity
                style={[styles.stageBadge, { backgroundColor: STAGE_META[item.stage].color }]}
                onPress={() => onAdvanceStage(item.id)}
              >
                <Text style={styles.stageBadgeText}>{STAGE_META[item.stage].label}</Text>
              </TouchableOpacity>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onOpenCoach(item)}
                  accessibilityRole="button"
                  accessibilityLabel="Open skill coach"
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#F0E6FA" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, improvingId === item.id && styles.iconButtonDisabled]}
                  onPress={() => onImprove(item)}
                  disabled={improvingId === item.id}
                  accessibilityRole="button"
                  accessibilityLabel="Improve skill description"
                >
                  <Ionicons
                    name="color-wand-outline"
                    size={20}
                    color={improvingId === item.id ? '#C9B2E6' : '#F0E6FA'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onToggleComplete(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Mark completed"
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#F0E6FA" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onRemove(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove skill"
                >
                  <Ionicons name="trash-outline" size={20} color="#FFC2C2" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
      {activeItems.length > 0 && (
        <Text style={styles.hint}>Tap the stage badge to advance a skill's progress stage.</Text>
      )}

      {completedItems.length > 0 && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            onPress={() => setShowCompleted(!showCompleted)}
          >
            <Text style={styles.sectionTitle}>Completed</Text>
            <Ionicons
              name={showCompleted ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#D9C6F0"
            />
          </TouchableOpacity>
          {showCompleted &&
            completedItems.map((item) => (
              <View key={item.id} style={[styles.item, styles.completedItem]}>
                <Text style={[styles.itemText, styles.itemTextDone]}>{item.text}</Text>
                <View style={styles.itemFooter}>
                  <View style={[styles.stageBadge, styles.doneBadge]}>
                    <Text style={styles.doneBadgeText}>Done</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => onToggleComplete(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Restore to to-do"
                    >
                      <Ionicons name="refresh-outline" size={20} color="#F0E6FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => onRemove(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove skill"
                    >
                      <Ionicons name="trash-outline" size={20} color="#FFC2C2" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#D9C6F0',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 17,
    color: '#F0E6FA',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyText: {
    color: '#D9C6F0',
    fontSize: 14,
    lineHeight: 20,
  },
  item: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  completedItem: {
    opacity: 0.65,
  },
  itemText: {
    color: '#F0E6FA',
    fontSize: 14,
    lineHeight: 19,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  stageBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stageBadgeText: {
    color: '#3A1355',
    fontSize: 12,
    fontWeight: 'bold',
  },
  doneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  doneBadgeText: {
    color: '#F0E6FA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 6,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  hint: {
    marginTop: 4,
    fontSize: 11,
    color: '#C9B2E6',
  },
});

export default TodoDashboard;
