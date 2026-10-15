import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
}

interface CoordCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

function CoordCard({ label, value, unit, color, icon }: CoordCardProps) {
  return (
    <View style={[styles.coordCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={20} color={color} style={styles.coordIcon} />
      <Text style={styles.coordLabel}>{label}</Text>
      <Text style={[styles.coordValue, { color }]}>{value}</Text>
      <Text style={styles.coordUnit}>{unit}</Text>
    </View>
  );
}

function CompassRose({ heading }: { heading: number | null }) {
  const angle = heading ?? 0;
  const getDirection = (h: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return dirs[Math.round(h / 45) % 8];
  };

  return (
    <View style={styles.compassContainer}>
      <View style={styles.compassOuter}>
        <View style={[styles.compassNeedle, { transform: [{ rotate: `${angle}deg` }] }]}>
          <View style={styles.needleNorth} />
          <View style={styles.needleSouth} />
        </View>
        <View style={styles.compassCenter} />
      </View>
      <Text style={styles.compassDir}>
        {heading !== null ? getDirection(heading) : '--'}
      </Text>
      <Text style={styles.compassAngle}>
        {heading !== null ? `${Math.round(heading)}°` : 'Sin datos'}
      </Text>
    </View>
  );
}

export default function LocationScreen() {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy,
        speed: loc.coords.speed,
        heading: loc.coords.heading,
      });
      setLastUpdate(new Date());

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        const parts = [geo.street, geo.district, geo.city, geo.country].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch {
      setError('No se pudo obtener la ubicación. Verifica que el GPS esté activo.');
    } finally {
      setLoading(false);
    }
  }, [permission, requestPermission]);

  const openMaps = useCallback(() => {
    if (!location) return;
    const url = Platform.select({
      ios: `maps:?q=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`,
      default: `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
    });
    if (url) Linking.openURL(url);
  }, [location]);

  const formatCoord = (val: number, decimals = 6) => val.toFixed(decimals);
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (!permission) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Ionicons name="location" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.permissionTitle}>Acceso a Ubicación</Text>
          <Text style={styles.permissionDesc}>
            Necesitamos acceso a tu ubicación para mostrar las coordenadas GPS y la dirección.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={fetchLocation}>
            <Text style={styles.actionBtnText}>Conceder Permisos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Ubicación GPS</Text>
            {lastUpdate && (
              <Text style={styles.headerSub}>Actualizado: {formatTime(lastUpdate)}</Text>
            )}
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

        {/* Map placeholder */}
        <LinearGradient
          colors={['#0D2137', '#0F0F23']}
          style={styles.mapPlaceholder}
        >
          {location ? (
            <>
              <View style={styles.mapDots}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.mapDot,
                      { opacity: 0.15 + Math.random() * 0.3 },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.locationPin}>
                <View style={styles.pinRing} />
                <View style={styles.pinRing2} />
                <Ionicons name="location" size={36} color={Colors.accent} />
              </View>
              <Text style={styles.mapCoords}>
                {formatCoord(location.latitude, 4)}°, {formatCoord(location.longitude, 4)}°
              </Text>
            </>
          ) : (
            <View style={styles.mapEmpty}>
              <Ionicons name="map-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.mapEmptyText}>Presiona el botón para obtener ubicación</Text>
            </View>
          )}
        </LinearGradient>

        {/* Action button */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
            onPress={fetchLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <Ionicons name="locate-outline" size={20} color={Colors.textPrimary} />
            )}
            <Text style={styles.actionBtnText}>
              {loading ? 'Localizando...' : 'Obtener Ubicación'}
            </Text>
          </TouchableOpacity>

          {location && (
            <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
              <Ionicons name="map" size={20} color={Colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Address */}
        {address && (
          <View style={styles.addressCard}>
            <Ionicons name="business-outline" size={18} color={Colors.primary} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>Dirección aproximada</Text>
              <Text style={styles.addressValue}>{address}</Text>
            </View>
          </View>
        )}

        {/* Coordinates grid */}
        {location && (
          <>
            <Text style={styles.sectionTitle}>Coordenadas</Text>
            <View style={styles.coordGrid}>
              <CoordCard
                label="Latitud"
                value={formatCoord(location.latitude)}
                unit="°N"
                color={Colors.accent}
                icon="arrow-up-outline"
              />
              <CoordCard
                label="Longitud"
                value={formatCoord(location.longitude)}
                unit="°E"
                color={Colors.primary}
                icon="arrow-forward-outline"
              />
              <CoordCard
                label="Altitud"
                value={location.altitude !== null ? location.altitude.toFixed(1) : '--'}
                unit="m"
                color={Colors.secondary}
                icon="trending-up-outline"
              />
              <CoordCard
                label="Precisión"
                value={location.accuracy !== null ? location.accuracy.toFixed(0) : '--'}
                unit="m"
                color={Colors.warning}
                icon="radio-button-on-outline"
              />
            </View>

            <Text style={styles.sectionTitle}>Orientación</Text>
            <View style={styles.compassRow}>
              <CompassRose heading={location.heading} />
              <View style={styles.extraStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Velocidad</Text>
                  <Text style={styles.statValue}>
                    {location.speed !== null ? `${(location.speed * 3.6).toFixed(1)} km/h` : '--'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Rumbo</Text>
                  <Text style={styles.statValue}>
                    {location.heading !== null ? `${Math.round(location.heading)}°` : '--'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Sistema</Text>
                  <Text style={[styles.statValue, { color: Colors.accent }]}>
                    {Platform.OS === 'android' ? 'Android GPS' : 'iOS CoreLocation'}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
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

  mapPlaceholder: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  mapDots: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    padding: 10,
    gap: 14,
  },
  mapDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  locationPin: { alignItems: 'center', justifyContent: 'center' },
  pinRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: `${Colors.accent}40`,
  },
  pinRing2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: `${Colors.accent}20`,
  },
  mapCoords: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  mapEmpty: { alignItems: 'center', gap: 10 },
  mapEmptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  mapsBtn: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: `${Colors.error}15`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.error}40`,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error },

  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressText: { flex: 1 },
  addressLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  addressValue: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  coordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  coordCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  coordIcon: { marginBottom: 4 },
  coordLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  coordValue: { fontSize: 15, fontWeight: '800' },
  coordUnit: { fontSize: 11, color: Colors.textSecondary },

  compassRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
  },
  compassContainer: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  compassOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compassNeedle: {
    width: 6,
    height: 48,
    alignItems: 'center',
    position: 'absolute',
  },
  needleNorth: {
    flex: 1,
    width: 4,
    backgroundColor: Colors.error,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  needleSouth: {
    flex: 1,
    width: 4,
    backgroundColor: Colors.textSecondary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  compassCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.textPrimary,
    position: 'absolute',
  },
  compassDir: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  compassAngle: { fontSize: 12, color: Colors.textSecondary },

  extraStats: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border },

  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  permissionDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
