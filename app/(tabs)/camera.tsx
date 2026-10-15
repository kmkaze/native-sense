import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const THUMB_SIZE = (width - 48) / 3;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const handleRequestPermissions = useCallback(async () => {
    await requestCameraPermission();
    await requestMediaPermission();
  }, [requestCameraPermission, requestMediaPermission]);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      setPhotos(prev => [photo.uri, ...prev]);

      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        Alert.alert('Foto guardada', 'La foto fue guardada en tu galería.', [{ text: 'OK' }]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, mediaPermission]);

  const toggleFacing = useCallback(() => {
    setFacing(f => (f === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash(f => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'));
  }, []);

  const flashIcon: IoniconName =
    flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off-outline';

  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={['top']}>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera" size={48} color={Colors.secondary} />
          </View>
          <Text style={styles.permissionTitle}>Acceso a la Cámara</Text>
          <Text style={styles.permissionDesc}>
            NativeSense necesita acceso a tu cámara para capturar fotos.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermissions}>
            <Text style={styles.permissionBtnText}>Conceder Permisos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedPhoto) {
    return (
      <SafeAreaView style={styles.photoViewer} edges={['top']}>
        <Image source={{ uri: selectedPhoto }} style={styles.fullPhoto} resizeMode="contain" />
        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPhoto(null)}>
          <Ionicons name="close-circle" size={36} color={Colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cámara</Text>
        <View style={styles.platformBadge}>
          <Ionicons
            name={Platform.OS === 'android' ? 'logo-android' : 'logo-apple'}
            size={14}
            color={Platform.OS === 'android' ? Colors.accent : Colors.textPrimary}
          />
          <Text style={styles.platformText}>{Platform.OS}</Text>
        </View>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          {/* Top Controls */}
          <View style={styles.cameraTopControls}>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleFlash}>
              <Ionicons name={flashIcon} size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>
                {facing === 'back' ? 'Trasera' : 'Frontal'}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleFacing}>
              <Ionicons name="camera-reverse-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls - Android style */}
          {Platform.OS === 'android' ? (
            <View style={styles.androidCapture}>
              <TouchableOpacity
                style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
                onPress={takePhoto}
                disabled={capturing}
              >
                {capturing ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <View style={styles.captureInner} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.iosCapture}>
              <TouchableOpacity
                style={[styles.iosCaptureBtn, capturing && styles.captureBtnDisabled]}
                onPress={takePhoto}
                disabled={capturing}
              >
                {capturing ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Ionicons name="aperture" size={28} color={Colors.background} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </CameraView>
      </View>

      {/* Gallery */}
      <View style={styles.gallerySection}>
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>Capturas ({photos.length})</Text>
          {photos.length > 0 && (
            <TouchableOpacity onPress={() => setPhotos([])}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
        {photos.length === 0 ? (
          <View style={styles.emptyGallery}>
            <Ionicons name="images-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyGalleryText}>Aún no hay fotos</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            horizontal
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryList}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedPhoto(item)}>
                <Image source={{ uri: item }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
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

  cameraContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: 3 / 4,
    backgroundColor: Colors.surface,
  },
  camera: { flex: 1 },

  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
  },
  cameraBadgeText: { fontSize: 12, color: Colors.textPrimary, fontWeight: '600' },

  // Android capture
  androidCapture: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.textPrimary,
  },

  // iOS capture
  iosCapture: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  iosCaptureBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gallerySection: { flex: 1, paddingTop: 14 },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  galleryTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  clearText: { fontSize: 13, color: Colors.secondary },

  emptyGallery: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  emptyGalleryText: { fontSize: 13, color: Colors.textMuted },

  galleryList: { paddingHorizontal: 16, gap: 6 },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    marginRight: 6,
  },

  photoViewer: { flex: 1, backgroundColor: '#000' },
  fullPhoto: { flex: 1, width: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
  },

  permissionContainer: { flex: 1, backgroundColor: Colors.background },
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
    backgroundColor: `${Colors.secondary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  permissionDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permissionBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
});
