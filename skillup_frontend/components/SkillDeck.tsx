import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SWIPE_THRESHOLD = 110;
const OFFSCREEN_X = 500;

type Props = {
  skills: string[];
  onAdd: (skill: string) => void;
  onSkip: (skill: string) => void;
};

/**
 * A stacked deck of skill cards. The top card can be dragged: right adds the
 * skill to the to-do list, left skips it. Buttons do the same for
 * click-first platforms like web.
 */
const SkillDeck = ({ skills, onAdd, onSkip }: Props) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const topSkillRef = useRef<string | null>(null);
  topSkillRef.current = skills[0] ?? null;
  const onAddRef = useRef(onAdd);
  const onSkipRef = useRef(onSkip);
  onAddRef.current = onAdd;
  onSkipRef.current = onSkip;
  const animatingRef = useRef(false);

  const settle = (direction: 'add' | 'skip') => {
    const skill = topSkillRef.current;
    if (!skill || animatingRef.current) return;
    animatingRef.current = true;
    Animated.timing(pan, {
      toValue: { x: direction === 'add' ? OFFSCREEN_X : -OFFSCREEN_X, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      animatingRef.current = false;
      if (direction === 'add') onAddRef.current(skill);
      else onSkipRef.current(skill);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_evt, gesture) => {
        if (!animatingRef.current) pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) settle('add');
        else if (gesture.dx < -SWIPE_THRESHOLD) settle('skip');
        else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const addOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (skills.length === 0) return null;

  return (
    <View>
      <View style={styles.deckArea}>
        {skills.length > 2 && <View style={[styles.card, styles.backCard, styles.backCardTwo]} />}
        {skills.length > 1 && <View style={[styles.card, styles.backCard, styles.backCardOne]} />}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            styles.topCard,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
          ]}
        >
          <Animated.View style={[styles.stamp, styles.addStamp, { opacity: addOpacity }]}>
            <Text style={styles.stampText}>ADD</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.skipStamp, { opacity: skipOpacity }]}>
            <Text style={styles.stampText}>SKIP</Text>
          </Animated.View>
          <Text style={styles.cardText}>{skills[0]}</Text>
          <Text style={styles.cardHint}>
            {skills.length > 1 ? `${skills.length - 1} more in the deck` : 'Last card in the deck'}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.deckButton, styles.skipButton]} onPress={() => settle('skip')}>
          <Ionicons name="close" size={22} color="#FFD1D1" />
          <Text style={styles.deckButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.deckButton, styles.addButton]} onPress={() => settle('add')}>
          <Ionicons name="add" size={22} color="#D8FFD8" />
          <Text style={styles.deckButtonText}>Add to List</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.swipeHint}>Swipe right to add, left to skip — or use the buttons</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  deckArea: {
    height: 240,
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
  },
  backCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  backCardOne: {
    top: 12,
    marginHorizontal: 10,
  },
  backCardTwo: {
    top: 24,
    marginHorizontal: 20,
  },
  topCard: {
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  cardText: {
    fontSize: 17,
    color: '#5A1E96',
    fontWeight: '600',
    textAlign: 'center',
  },
  cardHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#9B7BB8',
    textAlign: 'center',
  },
  stamp: {
    position: 'absolute',
    top: 14,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  addStamp: {
    left: 14,
    borderColor: '#2E9E4F',
    transform: [{ rotate: '-15deg' }],
  },
  skipStamp: {
    right: 14,
    borderColor: '#C93A3A',
    transform: [{ rotate: '15deg' }],
  },
  stampText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5A1E96',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  deckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  skipButton: {
    backgroundColor: 'rgba(180, 30, 60, 0.5)',
  },
  addButton: {
    backgroundColor: 'rgba(30, 140, 60, 0.55)',
  },
  deckButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  swipeHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#D9C6F0',
    textAlign: 'center',
  },
});

export default SkillDeck;
