import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const LEVEL_SIZE = width - 64;

interface SensorData {
  x: number;
  y: number;
  z: number;
}

function AxisBar({ label, value, color }: { label: string; value: number; color: string }) {
  const normalized = Math.min(Math.abs(value), 2) / 2;
  return (
    <View style={styles.axisRow}>
      <Text style={styles.axisLabel}>{label}</Text>
      <View style={styles.axisBarTrack}>
        <View
          style={[
            styles.axisBarFill,
            { width: `${normalized * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.axisValue, { color }]}>{value.toFixed(3)}</Text>
    </View>
  );
}

function BubbleLevel({ x, y }: { x: number; y: number }) {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const cx = clamp(x) * (LEVEL_SIZE / 2 - 28);
  const cy = clamp(-y) * (LEVEL_SIZE / 2 - 28);
  const isLevel = Math.abs(x) < 0.05 && Math.abs(y) < 0.05;

  return (
    <View style={styles.levelContainer}>
      <View style={[styles.levelOuter, isLevel && styles.levelOuterLevel]}>
        {/* Grid lines */}
        <View style={styles.levelLineH} />
        <View style={styles.levelLineV} />
        <View style={styles.levelCircle1} />
        <View style={styles.levelCircle2} />

        {/* Bubble */}
        <View
          style={[
            styles.bubble,
            { transform: [{ translateX: cx }, { translateY: cy }] },
            isLevel && styles.bubbleLevel,
          ]}
        />

        {isLevel && (
          <View style={styles.levelLabel}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
            <Text style={styles.levelLabelText}>Nivelado</Text>
          </View>
        )}
      </View>
      <Text style={styles.levelHint}>Inclina el dispositivo para ver el movimiento</Text>
    </View>
  );
}

export default function SensorScreen() {
  const [accel, setAccel] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  const [gyro, setGyro] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  const [active, setActive] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  useEffect(() => {
    if (!active) return;

    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    const accelSub = Accelerometer.addListener((data) => {
      setAccel(data);
      const mag = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      setHistory(prev => [...prev.slice(-49), mag]);
    });

    const gyroSub = Gyroscope.addListener(setGyro);

    return () => {
      accelSub.remove();
      gyroSub.remove();
    };
  }, [active]);

  const toggle = useCallback(() => {
    setActive(prev => {
      if (!prev) startPulse(); else stopPulse();
      return !prev;
    });
  }, [startPulse, stopPulse]);

  const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
  const motionLevel =
    magnitude < 1.05 ? 'Estático' :
    magnitude < 1.5  ? 'Leve movimiento' :
    magnitude < 2.5  ? 'Movimiento moderado' : 'Agitación fuerte';

  const motionColor =
    magnitude < 1.05 ? Colors.accent :
    magnitude < 1.5  ? Colors.warning :
    magnitude < 2.5  ? Colors.secondary : Colors.error;

  const graphMax = Math.max(...history, 2);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Sensores</Text>
            <Text style={styles.headerSub}>Acelerómetro & Giroscopio</Text>
          </View>
          <View style={styles.platformBadge}>
            <Ionicons
              name={Platform.OS === 'android' ? 'logo-android' : 'logo-apple'}
              size={14}
              color={Platform.OS === 'android' ? Colors.accent : Colors.textPrimary}
            />
            <Text style={styles.platformText}>{Platform.OS}</Text>
          </View>
        </View>

        {/* Toggle button */}
        <View style={styles.toggleSection}>
          <TouchableOpacity
            onPress={toggle}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.toggleBtn,
                active && styles.toggleBtnActive,
                { transform: [{ scale: active ? pulseAnim : 1 }] },
              ]}
            >
              <Ionicons
                name={active ? 'pause-circle' : 'play-circle'}
                size={32}
                color={Colors.textPrimary}
              />
              <Text style={styles.toggleText}>
                {active ? 'Pausar Sensores' : 'Iniciar Sensores'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={[styles.statusCard, { borderColor: motionColor }]}>
          <View style={[styles.statusDot, { backgroundColor: active ? motionColor : Colors.textMuted }]} />
          <Text style={[styles.statusText, { color: active ? motionColor : Colors.textMuted }]}>
            {active ? motionLevel : 'Sensores inactivos'}
          </Text>
          {active && (
            <Text style={styles.statusMag}>|a| = {magnitude.toFixed(3)} g</Text>
          )}
        </View>

        {/* Bubble Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nivel de Burbuja</Text>
          <BubbleLevel x={active ? accel.x : 0} y={active ? accel.y : 0} />
        </View>

        {/* Accelerometer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acelerómetro (g)</Text>
          <View style={styles.axisCard}>
            <AxisBar label="X" value={active ? accel.x : 0} color={Colors.secondary} />
            <AxisBar label="Y" value={active ? accel.y : 0} color={Colors.accent} />
            <AxisBar label="Z" value={active ? accel.z : 0} color={Colors.primary} />
          </View>
        </View>

        {/* Gyroscope */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giroscopio (rad/s)</Text>
          <View style={styles.axisCard}>
            <AxisBar label="X" value={active ? gyro.x : 0} color={Colors.secondary} />
            <AxisBar label="Y" value={active ? gyro.y : 0} color={Colors.accent} />
            <AxisBar label="Z" value={active ? gyro.z : 0} color={Colors.primary} />
          </View>
        </View>

        {/* Graph */}
        {history.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Magnitud (historial)</Text>
            <LinearGradient colors={['#1A1A2E', '#0F0F23']} style={styles.graph}>
              <View style={styles.graphBars}>
                {history.map((val, i) => (
                  <View
                    key={i}
                    style={[
                      styles.graphBar,
                      {
                        height: `${(val / graphMax) * 100}%`,
                        backgroundColor: val > 2 ? Colors.error : val > 1.5 ? Colors.warning : Colors.primary,
                        opacity: 0.4 + (i / history.length) * 0.6,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.graphBaseline} />
            </LinearGradient>
          </View>
        )}

        {/* Platform info */}
        <View style={styles.infoBox}>
          <Ionicons name="hardware-chip-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            {Platform.OS === 'android'
              ? 'Usando Android Sensor Manager — actualización cada 100ms.'
              : 'Usando iOS Core Motion — actualización cada 100ms.'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  toggleSection: { paddingHorizontal: 16, marginBottom: 16 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: `${Colors.primary}25`,
    borderColor: Colors.primary,
  },
  toggleText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { flex: 1, fontSize: 14, fontWeight: '600' },
  statusMag: { fontSize: 12, color: Colors.textSecondary },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },

  levelContainer: { alignItems: 'center', gap: 10 },
  levelOuter: {
    width: LEVEL_SIZE,
    height: LEVEL_SIZE,
    borderRadius: LEVEL_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  levelOuterLevel: { borderColor: Colors.accent },
  levelLineH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
  },
  levelLineV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  levelCircle1: {
    position: 'absolute',
    width: LEVEL_SIZE * 0.5,
    height: LEVEL_SIZE * 0.5,
    borderRadius: LEVEL_SIZE * 0.25,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelCircle2: {
    position: 'absolute',
    width: LEVEL_SIZE * 0.25,
    height: LEVEL_SIZE * 0.25,
    borderRadius: LEVEL_SIZE * 0.125,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}CC`,
    borderWidth: 2,
    borderColor: Colors.primary,
    position: 'absolute',
  },
  bubbleLevel: {
    backgroundColor: `${Colors.accent}CC`,
    borderColor: Colors.accent,
  },
  levelLabel: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelLabelText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  levelHint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  axisCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  axisRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  axisLabel: { width: 18, fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  axisBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  axisBarFill: { height: '100%', borderRadius: 4 },
  axisValue: { width: 60, fontSize: 12, fontWeight: '700', textAlign: 'right' },

  graph: {
    height: 100,
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'flex-end',
  },
  graphBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  graphBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 2,
  },
  graphBaseline: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});
