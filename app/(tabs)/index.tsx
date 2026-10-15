import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface FeatureCardProps {
  icon: IoniconName;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <View style={[styles.featureCard, { borderLeftColor: color }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  icon: IoniconName;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={Colors.primary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const isAndroid = Platform.OS === 'android';
  const isIos = Platform.OS === 'ios';

  const osName = isAndroid ? 'Android' : isIos ? 'iOS' : 'Web';
  const osIcon: IoniconName = isAndroid ? 'logo-android' : isIos ? 'logo-apple' : 'globe-outline';
  const osColor = isAndroid ? Colors.accent : Colors.textPrimary;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#1A1A3E', '#0F0F23']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Bienvenido a</Text>
              <Text style={styles.appName}>NativeSense</Text>
            </View>
            <View style={[styles.osBadge, { borderColor: osColor }]}>
              <Ionicons name={osIcon} size={18} color={osColor} />
              <Text style={[styles.osText, { color: osColor }]}>{osName}</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Explora las capacidades nativas de tu dispositivo
          </Text>
        </LinearGradient>

        {/* OS Detection Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sistema Operativo Detectado</Text>
          <LinearGradient
            colors={isAndroid ? ['#00D4AA20', '#1A1A2E'] : ['#FFFFFF15', '#1A1A2E']}
            style={styles.osCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={osIcon} size={48} color={osColor} />
            <View style={styles.osInfo}>
              <Text style={[styles.osCardName, { color: osColor }]}>{osName}</Text>
              <Text style={styles.osCardVersion}>
                {isAndroid
                  ? `API Level ${Platform.Version}`
                  : `Versión ${Platform.Version}`}
              </Text>
              <View style={styles.osTag}>
                <Text style={styles.osTagText}>
                  {isAndroid ? 'Plataforma Android' : isIos ? 'Plataforma Apple' : 'Plataforma Web'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Dispositivo</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="phone-portrait-outline"
              label="Plataforma"
              value={Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1)}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="resize-outline"
              label="Pantalla"
              value={`${Math.round(width)} px`}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="code-slash-outline"
              label="SDK Expo"
              value={Constants.expoConfig?.sdkVersion ?? 'N/A'}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="layers-outline"
              label="App Versión"
              value={Constants.expoConfig?.version ?? '1.0.0'}
            />
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funcionalidades</Text>
          <FeatureCard
            icon="camera"
            title="Cámara Nativa"
            description="Captura fotos con la cámara del dispositivo y guárdalas en la galería."
            color={Colors.secondary}
          />
          <FeatureCard
            icon="location"
            title="GPS y Ubicación"
            description="Obtén coordenadas GPS en tiempo real con geocodificación inversa."
            color={Colors.accent}
          />
          <FeatureCard
            icon="pulse"
            title="Acelerómetro"
            description="Visualiza el movimiento del dispositivo en los ejes X, Y y Z."
            color={Colors.primary}
          />
        </View>

        {/* Platform note */}
        <View style={[styles.platformNote, { borderColor: isAndroid ? Colors.accent : Colors.primary }]}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={isAndroid ? Colors.accent : Colors.primary}
          />
          <Text style={styles.platformNoteText}>
            {isAndroid
              ? 'Interfaz optimizada para Android. Los controles y el comportamiento se ajustan automáticamente.'
              : 'Interfaz optimizada para iOS. Navegación y controles nativos de Apple.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 24 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  osBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  osText: { fontSize: 13, fontWeight: '600' },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  osCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  osInfo: { flex: 1 },
  osCardName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  osCardVersion: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  osTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  osTagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  infoIcon: { width: 20 },
  infoLabel: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  featureDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  platformNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  platformNoteText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});
