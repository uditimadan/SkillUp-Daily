import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, FlatList, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { API_URL } from '../constants/Api';
import { useAuth } from '../context/AuthContext';
import { TodoItem, nextStage } from '../constants/todo';
import SkillDeck from '../components/SkillDeck';
import TodoDashboard from '../components/TodoDashboard';
import CoachModal from '../components/CoachModal';

const DECK_SIZE = 5;
const TODO_STORAGE_KEY = 'todoItems';

const ageGroups = [
  { label: 'Kids', value: 'kids' },
  { label: 'Teens', value: 'teens' },
  { label: 'Adults', value: 'adults' },
];

const Page = () => {
  const [ageGroup, setAgeGroup] = useState(ageGroups[0]);
  const [deck, setDeck] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [todosLoaded, setTodosLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [coachItem, setCoachItem] = useState<TodoItem | null>(null);
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { token, isLoading, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  useEffect(() => {
    AsyncStorage.getItem(TODO_STORAGE_KEY)
      .then((stored) => {
        if (stored) setTodoItems(JSON.parse(stored));
      })
      .catch(() => {})
      .finally(() => setTodosLoaded(true));
  }, []);

  useEffect(() => {
    if (todosLoaded) {
      AsyncStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoItems)).catch(() => {});
    }
  }, [todoItems, todosLoaded]);

  if (isLoading) return null;
  if (!token) return <Redirect href="/auth" />;

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 2500);
  };

  const fetchDeck = async () => {
    setError('');
    setIsFetching(true);
    try {
      const response = await fetch(
        `${API_URL}/skill?age_group=${ageGroup.value}&count=${DECK_SIZE}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setDeck(data.skills ?? [data.skill]);
      } else {
        setError(data.error || data.detail || 'Failed to fetch skills.');
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setIsFetching(false);
    }
  };

  const popDeck = () => setDeck((current) => current.slice(1));

  const handleAdd = (skill: string) => {
    if (!todoItems.some((item) => item.text === skill)) {
      const newItem: TodoItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: skill,
        stage: 'starting',
        completed: false,
      };
      setTodoItems((current) => [...current, newItem]);
      showNotice('Skill added to your to-do list!');
    } else {
      showNotice('That skill is already on your list.');
    }
    popDeck();
  };

  const handleSkip = () => popDeck();

  const toggleComplete = (id: string) =>
    setTodoItems((current) =>
      current.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );

  const advanceStage = (id: string) =>
    setTodoItems((current) =>
      current.map((item) => (item.id === id ? { ...item, stage: nextStage(item.stage) } : item))
    );

  const removeItem = (id: string) =>
    setTodoItems((current) => current.filter((item) => item.id !== id));

  const improveItem = async (item: TodoItem) => {
    if (improvingId) return;
    setImprovingId(item.id);
    setError('');
    try {
      const response = await fetch(`${API_URL}/improve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ skill: item.text }),
      });
      const data = await response.json();
      if (response.ok && data.skill) {
        setTodoItems((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, text: data.skill } : entry))
        );
        showNotice('Skill description sharpened.');
      } else {
        setError(data.error || data.detail || 'Could not improve that skill.');
      }
    } catch (err) {
      console.error('Error improving skill:', err);
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setImprovingId(null);
    }
  };

  const deckSection = (
    <View style={styles.deckColumn}>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.dropdownButtonText}>{ageGroup.label}</Text>
      </TouchableOpacity>

      {deck.length > 0 ? (
        <SkillDeck skills={deck} onAdd={handleAdd} onSkip={handleSkip} />
      ) : (
        <Text style={styles.noSkillText}>
          {isFetching ? 'Shuffling up some skills...' : 'Deal a deck of skills to get started!'}
        </Text>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isFetching && styles.buttonDisabled]}
        onPress={fetchDeck}
        disabled={isFetching}
      >
        {isFetching ? (
          <ActivityIndicator color="#8A2BE2" />
        ) : (
          <Text style={styles.buttonText}>{deck.length > 0 ? 'New Deck' : 'Deal Skills'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Skill Builder</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <FlatList
              data={ageGroups}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setAgeGroup(item);
                    setDeck([]);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.value}
            />
          </View>
        </Modal>

        <View style={[styles.columns, isWide ? styles.columnsWide : styles.columnsNarrow]}>
          {deckSection}
          <View style={isWide ? styles.dashboardColumnWide : styles.dashboardColumnNarrow}>
            <TodoDashboard
              items={todoItems}
              improvingId={improvingId}
              onToggleComplete={toggleComplete}
              onAdvanceStage={advanceStage}
              onRemove={removeItem}
              onOpenCoach={setCoachItem}
              onImprove={improveItem}
            />
          </View>
        </View>
      </ScrollView>

      <CoachModal item={coachItem} token={token} onClose={() => setCoachItem(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8A2BE2',
  },
  scrollContainer: {
    padding: 20,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F0E6FA',
  },
  logoutButton: {
    padding: 6,
  },
  logoutText: {
    color: '#F0E6FA',
    fontSize: 16,
  },
  columns: {
    gap: 24,
  },
  columnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnsNarrow: {
    flexDirection: 'column',
  },
  deckColumn: {
    flex: 1,
  },
  dashboardColumnWide: {
    width: 340,
  },
  dashboardColumnNarrow: {
    width: '100%',
  },
  dropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  dropdownButtonText: {
    color: '#F0E6FA',
    fontSize: 18,
    textAlign: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    width: '100%',
  },
  modalItemText: {
    fontSize: 18,
    color: '#8A2BE2',
  },
  noSkillText: {
    fontSize: 18,
    color: '#F0E6FA',
    textAlign: 'center',
    marginVertical: 40,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FFD1D1',
    backgroundColor: 'rgba(180, 30, 60, 0.45)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 15,
  },
  noticeText: {
    color: '#E8FFE8',
    backgroundColor: 'rgba(30, 140, 60, 0.45)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 15,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#8A2BE2',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Page;
