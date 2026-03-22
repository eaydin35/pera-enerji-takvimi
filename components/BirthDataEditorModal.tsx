import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfileStore } from '../store/profileStore';
import { useStore } from '../store/useStore';
import districtsData from '../data/districts.json';

interface Props {
    visible: boolean;
    onClose: () => void;
}

type Province = {
    id: number;
    name: string;
    districts: District[];
};

type District = {
    name: string;
    latitude: number;
    longitude: number;
};

export default function BirthDataEditorModal({ visible, onClose }: Props) {
    const { profile, updateBirthDataInfo } = useProfileStore();
    const { tokens, useTokens, isPremium } = useStore();

    // Initial values
    const [birthDate, setBirthDate] = useState(profile?.birthDate || '');
    const [birthTime, setBirthTime] = useState(profile?.birthTime || '');
    const [birthPlace, setBirthPlace] = useState(profile?.birthPlace || '');
    const [birthLat, setBirthLat] = useState<number | undefined>(profile?.birthLat);
    const [birthLng, setBirthLng] = useState<number | undefined>(profile?.birthLng);

    const [isLoading, setIsLoading] = useState(false);

    // Date Picker State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Location Picker State
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

    // Handle date change
    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);

        if (event.type === 'set' || Platform.OS === 'ios') {
            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;
            setBirthDate(formattedDate);
            if (Platform.OS === 'android') setShowDatePicker(false);
        } else {
            setShowDatePicker(false);
        }
    };

    const confirmIOSDate = () => {
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        setBirthDate(formattedDate);
        setShowDatePicker(false);
    };

    // Strict 24h format validation
    const handleBirthTimeChange = (text: string) => {
        let digits = text.replace(/[^0-9]/g, '');
        if (digits.length > 4) digits = digits.slice(0, 4);

        let validatedDigits = '';
        for (let i = 0; i < digits.length; i++) {
            const val = parseInt(digits[i]);
            if (i === 0) {
                if (val <= 2) validatedDigits += digits[i];
            } else if (i === 1) {
                const firstDigit = parseInt(validatedDigits[0]);
                if (firstDigit === 2) {
                    if (val <= 3) validatedDigits += digits[i];
                } else {
                    validatedDigits += digits[i];
                }
            } else if (i === 2) {
                if (val <= 5) validatedDigits += digits[i];
            } else if (i === 3) {
                validatedDigits += digits[i];
            }
        }

        let formatted = '';
        if (validatedDigits.length >= 3) {
            formatted = validatedDigits.slice(0, 2) + ':' + validatedDigits.slice(2);
        } else if (validatedDigits.length === 2 && text.endsWith(':')) {
            formatted = validatedDigits + ':';
        } else if (validatedDigits.length === 2 && birthTime.length === 1) {
            formatted = validatedDigits + ':';
        } else {
            formatted = validatedDigits;
        }

        setBirthTime(formatted);
    };

    // Location
    const displayData = selectedProvince
        ? selectedProvince.districts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : districtsData.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleSelectLocation = (item: any) => {
        if (!selectedProvince) {
            setSelectedProvince(item as Province);
            setSearchQuery('');
        } else {
            const district = item as District;
            setBirthPlace(`${selectedProvince.name}, ${district.name}`);
            setBirthLat(district.latitude);
            setBirthLng(district.longitude);
            setShowLocationPicker(false);
            setSelectedProvince(null);
            setSearchQuery('');
        }
    };

    const handleBackInModal = () => {
        if (selectedProvince) {
            setSelectedProvince(null);
            setSearchQuery('');
        } else {
            setShowLocationPicker(false);
        }
    };

    // Submit
    const handleSubmit = async () => {
        if (!birthDate || !birthPlace) {
            Alert.alert('Eksik Bilgi', 'Lütfen doğum tarihi ve yeri bilgilerini eksiksiz girin.');
            return;
        }

        if (birthTime.length > 0 && birthTime.length < 5) {
            Alert.alert('Geçersiz Saat', 'Lütfen tam saati (HH:MM) formatında giriniz veya boş bırakınız.');
            return;
        }

        const isGuest = profile && 'isGuest' in profile ? profile.isGuest : false;
        const needsPayment = !isGuest && !isPremium;

        if (needsPayment && tokens < 1) {
            Alert.alert('Yetersiz Jeton', 'Doğum bilgilerini güncellemek ve haritayı yeniden hesaplamak 1 jeton gerektirir.');
            return;
        }

        setIsLoading(true);
        try {
            if (needsPayment) {
                const deducted = await useTokens(1);
                if (!deducted) {
                    Alert.alert('Hata', 'Jeton bakiyeniz düşülemedi.');
                    setIsLoading(false);
                    return;
                }
            }

            // Update profile using proper birth data service
            const res = await updateBirthDataInfo({
                date: birthDate,
                time: birthTime,
                place: birthPlace,
                lat: birthLat || 0,
                lng: birthLng || 0,
            });

            if (!res.success) {
                Alert.alert('Hata', res.error || 'Doğum bilgileri güncellenemedi.');
                setIsLoading(false);
                return;
            }

            Alert.alert('Başarılı', 'Doğum bilgileriniz ve haritanız başarıyla güncellendi.', [
                { text: 'Tamam', onPress: onClose }
            ]);

        } catch (error: any) {
            Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Doğum Haritasını Güncelle</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={24} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        {(profile && !('isGuest' in profile) && !isPremium)
                            ? "Doğum bilgilerini güncellemek ve haritayı yeniden hesaplatmak 1 jeton harcayacaktır." 
                            : "Yıldız haritanızı daha doğru hesaplamak için lütfen doğum bilgilerinizi girin/güncelleyin."}
                    </Text>

                    <View style={styles.form}>
                        {/* Doğum Tarihi */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Doğum Tarihi</Text>
                            <TouchableOpacity style={styles.inputTouchable} onPress={() => setShowDatePicker(true)}>
                                <MaterialIcons name="calendar-today" size={20} color="#71717a" />
                                <Text style={[styles.inputText, !birthDate && styles.inputPlaceholder]}>
                                    {birthDate || 'GG.AA.YYYY'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Doğum Saati */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Doğum Saati (İsteğe Bağlı ama Önemli)</Text>
                            <View style={[styles.inputTouchable, { paddingHorizontal: 0, paddingLeft: 18 }]}>
                                <MaterialIcons name="access-time" size={20} color="#71717a" />
                                <TextInput
                                    style={styles.timeInput}
                                    placeholder="SS:DD (Örn: 14:30)"
                                    placeholderTextColor="#a1a1aa"
                                    value={birthTime}
                                    onChangeText={handleBirthTimeChange}
                                    keyboardType="numeric"
                                    maxLength={5}
                                />
                            </View>
                        </View>

                        {/* Doğum Yeri */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Doğum Yeri</Text>
                            <TouchableOpacity style={styles.inputTouchable} onPress={() => setShowLocationPicker(true)}>
                                <MaterialIcons name="location-on" size={20} color="#71717a" />
                                <Text style={[styles.inputText, !birthPlace && styles.inputPlaceholder]} numberOfLines={1}>
                                    {birthPlace || 'İl, İlçe seçin'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>Güncelle ve Hesapla</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* DatePicker Modals omitted for brevity, handled below */}
            {Platform.OS === 'ios' && showDatePicker && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.iosPickerOverlay}>
                        <View style={styles.iosPickerContainer}>
                            <View style={styles.iosPickerHeader}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.iosPickerCancel}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={confirmIOSDate}>
                                    <Text style={styles.iosPickerDone}>Tamam</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker value={date} mode="date" display="spinner" onChange={onChangeDate} maximumDate={new Date()} textColor="#000" themeVariant="light" />
                        </View>
                    </View>
                </Modal>
            )}
            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker value={date} mode="date" display="calendar" onChange={onChangeDate} maximumDate={new Date()} />
            )}

            {showLocationPicker && (
                <Modal visible={true} animationType="slide">
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                        <View style={styles.searchHeader}>
                            <TouchableOpacity onPress={handleBackInModal} style={{ padding: 8 }}>
                                <MaterialIcons name="arrow-back" size={24} color="#111827" />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.searchInput}
                                placeholder={selectedProvince ? `${selectedProvince.name} ilçelerinde ara...` : "İl ara (Örn: İstanbul)"}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                        <FlatList
                            data={displayData as any[]}
                            keyExtractor={(item) => item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.locationItem} onPress={() => handleSelectLocation(item)}>
                                    <Text style={styles.locationItemText}>{item.name}</Text>
                                    <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                                </TouchableOpacity>
                            )}
                        />
                    </SafeAreaView>
                </Modal>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 20, fontWeight: '700', color: '#1f1317' },
    closeBtn: { padding: 4 },
    subtitle: { fontSize: 13, color: '#71717a', marginBottom: 24, lineHeight: 18 },
    form: { marginBottom: 8 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    inputTouchable: {
        flexDirection: 'row', alignItems: 'center',
        height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#e4e4e7',
        backgroundColor: '#f9fafb', paddingHorizontal: 18, gap: 12,
    },
    inputText: { fontSize: 15, color: '#111827', flex: 1 },
    inputPlaceholder: { color: '#a1a1aa' },
    timeInput: { flex: 1, fontSize: 15, color: '#111827', height: '100%', paddingLeft: 12 },
    submitBtn: {
        height: 56, borderRadius: 20, backgroundColor: '#ad92c9',
        alignItems: 'center', justifyContent: 'center', marginTop: 8,
        shadowColor: '#ad92c9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    iosPickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    iosPickerContainer: { backgroundColor: '#fff', paddingBottom: 20 },
    iosPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    iosPickerCancel: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
    iosPickerDone: { color: '#ad92c9', fontSize: 16, fontWeight: '600' },
    searchHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
    searchInput: { flex: 1, height: 44, backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 16, fontSize: 15 },
    locationItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    locationItemText: { fontSize: 15, color: '#374151' },
});
