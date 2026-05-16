import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

const { height: SH } = Dimensions.get('window');

const PARTICLE_CONFIG = [
  { icon: 'star' as const, size: 16, color: '#F59E0B' },
  { icon: 'star' as const, size: 12, color: '#4F46E5' },
  { icon: 'heart' as const, size: 14, color: '#EC4899' },
  { icon: 'star' as const, size: 10, color: '#10B981' },
  { icon: 'sparkles' as const, size: 14, color: '#3B82F6' },
  { icon: 'star' as const, size: 11, color: '#F59E0B' },
  { icon: 'heart' as const, size: 15, color: '#8B5CF6' },
  { icon: 'sparkles' as const, size: 13, color: '#14B8A6' },
  { icon: 'star' as const, size: 14, color: '#EC4899' },
  { icon: 'heart' as const, size: 12, color: '#F59E0B' },
];

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotate: Animated.Value;
  config: (typeof PARTICLE_CONFIG)[number];
  delay: number;
}

interface CelebrationOverlayProps {
  visible: boolean;
}

export function CelebrationOverlay({ visible }: CelebrationOverlayProps) {
  const particlesRef = useRef<Particle[]>([]);
  const showAnim = useRef(new Animated.Value(0)).current;
  const centerScale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      showAnim.setValue(0);
      centerScale.setValue(0);
      ringScale.setValue(0);
      return;
    }

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_CONFIG.length; i++) {
      particles.push({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
        rotate: new Animated.Value(0),
        config: PARTICLE_CONFIG[i],
        delay: Math.random() * 200,
      });
    }
    particlesRef.current = particles;

    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(centerScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
        Animated.timing(showAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Particle bursts
      Animated.stagger(
        60,
        particles.map((p) =>
          Animated.parallel([
            Animated.timing(p.x, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(p.y, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(p.delay),
              Animated.timing(p.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
              Animated.timing(p.opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(p.scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
              Animated.timing(p.scale, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]),
            Animated.timing(p.rotate, { toValue: 1, duration: 600, useNativeDriver: true }),
          ])
        )
      ),
    ]).start();

    return () => {
      particles.forEach((p) => {
        p.x.setValue(0);
        p.y.setValue(0);
        p.opacity.setValue(0);
        p.scale.setValue(0);
        p.rotate.setValue(0);
      });
    };
  }, [visible, showAnim, centerScale, ringScale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: showAnim }]} pointerEvents="none">
      {/* Dark backdrop */}
      <View style={styles.backdrop} />

      {/* Center icon */}
      <Animated.View
        style={[
          styles.centerWrap,
          {
            transform: [{ scale: centerScale }],
          },
        ]}
      >
        <View style={[styles.centerIcon, { backgroundColor: Colors.accent + '18' }]}>
          <Ionicons name="checkmark-circle" size={52} color={Colors.accent} />
        </View>
        <View style={[styles.ring, { borderColor: Colors.accent + '30' }]} />
        <Animated.View
          style={[
            styles.ring,
            styles.ring2,
            { borderColor: Colors.accent + '20' },
            { transform: [{ scale: ringScale }] },
          ]}
        />
      </Animated.View>

      {/* Particles */}
      {particlesRef.current.map((p, i) => {
        const dx = Math.cos((Math.PI * 2 * i) / PARTICLE_CONFIG.length) * 180;
        const dy = Math.sin((Math.PI * 2 * i) / PARTICLE_CONFIG.length) * 180;
        const angle = (Math.random() - 0.5) * 360;

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                opacity: p.opacity,
                transform: [
                  {
                    translateX: p.x.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, dx],
                    }),
                  },
                  {
                    translateY: p.y.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, dy],
                    }),
                  },
                  { scale: p.scale },
                  {
                    rotate: p.rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${angle}deg`],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name={p.config.icon} size={p.config.size} color={p.config.color} />
          </Animated.View>
        );
      })}

      {/* Text */}
      <Text style={[styles.title, { color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }]}>
        Booking Confirmed!
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
        ]}
      >
        Family has been notified
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  ring2: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  particle: {
    position: 'absolute',
  },
  title: {
    position: 'absolute',
    bottom: SH * 0.24,
    fontSize: 26,
    letterSpacing: -0.3,
  },
  subtitle: {
    position: 'absolute',
    bottom: SH * 0.2,
    fontSize: 15,
  },
});
