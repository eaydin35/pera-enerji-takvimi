import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Platform, Image, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/profileStore';
import { supabase } from '../utils/supabase';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import districtsData from '../data/districts.json';
import { uploadAvatar } from '../utils/storage';
import { normalizeTurkishSearch } from '../utils/stringUtils';
import type { Gender, LifeFocus } from '../types/profile';

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

export default function OnboardingScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [birthLat, setBirthLat] = useState<number | undefined>(undefined);
    const [birthLng, setBirthLng] = useState<number | undefined>(undefined);
    const [gender, setGender] = useState<Gender | undefined>(undefined);
    const [lifeFocus, setLifeFocus] = useState<LifeFocus[]>([]);

    // Date Picker State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Location Picker State (Two-Step: Province -> District)
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

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
    }

    // 🛡️ REGRESSION GUARD: This function strictly validates 24h format (00:00-23:59).
    // DO NOT remove the digit-by-digit validation loop below. It prevents invalid hours (like 32:32).
    const handleBirthTimeChange = (text: string) => {
        // Extract only digits
        let digits = text.replace(/[^0-9]/g, '');

        // Limit to 4 digits (HHMM)
        if (digits.length > 4) digits = digits.slice(0, 4);

        // Validation logic for each digit as typed
        let validatedDigits = '';
        for (let i = 0; i < digits.length; i++) {
            const digit = digits[i];
            const val = parseInt(digit);

            if (i === 0) {
                // First digit of hour: 0, 1, or 2
                if (val <= 2) validatedDigits += digit;
            } else if (i === 1) {
                // Second digit of hour: if first was 2, max is 3 (23:59)
                const firstDigit = parseInt(validatedDigits[0]);
                if (firstDigit === 2) {
                    if (val <= 3) validatedDigits += digit;
                } else {
                    validatedDigits += digit;
                }
            } else if (i === 2) {
                // First digit of minute: 0 to 5
                if (val <= 5) validatedDigits += digit;
            } else if (i === 3) {
                // Second digit of minute: 0 to 9
                validatedDigits += digit;
            }
        }

        let formatted = '';
        if (validatedDigits.length >= 3) {
            formatted = validatedDigits.slice(0, 2) + ':' + validatedDigits.slice(2);
        } else if (validatedDigits.length === 2 && text.endsWith(':')) {
            // Keep colon if user typed 2 digits and then explicitly a colon
            formatted = validatedDigits + ':';
        } else if (validatedDigits.length === 2 && birthTime.length === 1) {
            // Auto-add colon after 2nd digit if moving forward
            formatted = validatedDigits + ':';
        } else {
            formatted = validatedDigits;
        }

        setBirthTime(formatted);
    };

    // Modal data filtering
    const normalizedQuery = normalizeTurkishSearch(searchQuery);

    let displayData: any[] = [];
    if (selectedProvince) {
        displayData = selectedProvince.districts.filter(d =>
            normalizeTurkishSearch(d.name).includes(normalizedQuery)
        );
    } else {
        const filteredProvinces = districtsData.filter(p =>
            normalizeTurkishSearch(p.name).includes(normalizedQuery)
        );
        if (!searchQuery) {
            const priorityCityNames = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
            const priorityCities = filteredProvinces.filter(p => priorityCityNames.includes(p.name));
            const otherCities = filteredProvinces.filter(p => !priorityCityNames.includes(p.name));
            displayData = [...priorityCities, ...otherCities];
        } else {
            displayData = filteredProvinces;
        }
    }

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

    const handleComplete = async () => {
        if (!firstName || !birthDate || !birthPlace || birthLat === undefined || birthLng === undefined) {
            Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        // 🛡️ REGRESSION GUARD: Final validation for birth time data integrity.
        if (birthTime && birthTime.length > 0) {
            const timePattern = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
            if (!timePattern.test(birthTime)) {
                Alert.alert('Hatalı Saat', 'Lütfen geçerli bir doğum saati girin (Örn: 17:34). Saat formatı 00:00 ile 23:59 arasında olmalıdır.');
                return;
            }
        }

        let finalAvatarUrl = profileImageUri;

        // Upload to Supabase if signed in and has local URI
        if (user && profileImageUri && profileImageUri.startsWith('file://')) {
            const uploadedUrl = await uploadAvatar(profileImageUri, user.id);
            if (uploadedUrl) finalAvatarUrl = uploadedUrl;
        }

        const profileStore = useProfileStore.getState();
        const currentProfile = profileStore.profile;

        if (user) {
            // If user is logged in but profile is null (from db discrepancy or trigger failure), we should insert the missing profile first
            if (!currentProfile) {
                try {
                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: user.id,
                        first_name: firstName,
                        last_name: lastName,
                        birth_date: birthDate,
                        birth_time: birthTime,
                        birth_place: birthPlace,
                        birth_lat: birthLat,
                        birth_lng: birthLng,
                        gender: gender || null,
                        life_focus: lifeFocus.length > 0 ? lifeFocus : null,
                        avatar_url: finalAvatarUrl || null,
                        chart_updates_remaining: 1 // Default start tokens
                    });

                    if (insertError) {
                        console.error('[Onboarding] Profile insert error:', insertError);
                        Alert.alert('Hata', 'Kayıtlı profiliniz bulunamadı ve oluşturulamadı. Lütfen çıkış yapıp tekrar giriş yapmayı deneyin.');
                        return;
                    }

                    // Force the profileStore to reload the newly inserted profile
                    await profileStore.initialize();
                } catch (err) {
                    console.error('[Onboarding] Fallback profile creation failed', err);
                }
            } else {
                // Normal flow: Already signed in and profile exists
                await profileStore.updateProfile({
                    firstName,
                    lastName,
                    gender: gender || undefined,
                    lifeFocus: lifeFocus.length > 0 ? lifeFocus : undefined,
                    avatarUrl: finalAvatarUrl || undefined
                });
                await profileStore.updateBirthDataInfo({
                    date: birthDate,
                    time: birthTime,
                    place: birthPlace,
                    lat: birthLat,
                    lng: birthLng
                });
            }
        } else {
            // Guest mode
            await profileStore.createGuestProfile({
                firstName,
                lastName,
                gender: gender || undefined,
                lifeFocus: lifeFocus.length > 0 ? lifeFocus : undefined,
                birthDate,
                birthTime,
                birthPlace,
                birthLat,
                birthLng,
                avatarUrl: finalAvatarUrl || undefined,
            });
        }

        // Direct routing fallback in case root layout listener delays
        router.replace('/(tabs)');
    };

    // Real photo upload using expo-image-picker
    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişimine izin verin.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets.length > 0) {
            setProfileImageUri(result.assets[0].uri);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#ffffff' }}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#ffffff' }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4">
                        <TouchableOpacity className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                            <MaterialIcons name="arrow-back" size={24} color="#71717a" />
                        </TouchableOpacity>
                        <View className="flex-1 items-center">
                            <View className="mx-auto h-1.5 w-24 rounded-full bg-zinc-200 overflow-hidden">
                                <View className="h-full w-1/3 bg-primary" />
                            </View>
                        </View>
                        {!user && (
                            <TouchableOpacity onPress={() => router.push('/auth')} className="bg-primary/20 px-4 py-2 rounded-full border border-primary/30">
                                <Text className="text-sm font-bold text-primary">Kayıt Ol / Giriş</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Content */}
                    <View className="flex flex-1 flex-col px-4 pt-2 pb-6">
                        <View className="mb-6">
                            <Text className="text-3xl font-bold leading-tight tracking-tight text-zinc-900">
                                Kişisel Rehberin Seni Bekliyor
                            </Text>
                            <Text className="mt-2 text-base font-normal leading-normal text-zinc-600">
                                Doğru bir analiz için lütfen doğum bilgilerini eksiksiz gir.
                            </Text>
                        </View>

                        {/* Form */}
                        <View className="flex flex-col gap-y-4">
                            <View className="flex flex-col">
                                <Text className="pb-2 text-base font-medium text-zinc-900">Ad</Text>
                                <TextInput
                                    className="h-14 w-full rounded-[32px] border border-zinc-300 bg-white p-4 text-base font-normal leading-normal text-zinc-900"
                                    placeholder="Adını gir"
                                    placeholderTextColor="#a1a1aa"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>
                            <View className="flex flex-col">
                                <Text className="pb-2 text-base font-medium text-zinc-900">Soyad</Text>
                                <TextInput
                                    className="h-14 w-full rounded-[32px] border border-zinc-300 bg-white p-4 text-base font-normal leading-normal text-zinc-900"
                                    placeholder="Soyadını gir"
                                    placeholderTextColor="#a1a1aa"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>

                            {/* Profile Photo Upload */}
                            <View className="flex flex-col">
                                <Text className="pb-2 text-base font-medium text-zinc-900">Profil Fotoğrafı</Text>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="flex-row items-center h-14 w-full rounded-[32px] border border-dashed border-zinc-400 bg-white px-4 gap-3"
                                >
                                    <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                                        <MaterialIcons name="add-a-photo" size={16} color="#1f1317" />
                                    </View>
                                    <Text className="text-base text-zinc-400">
                                        {profileImageUri ? 'Fotoğraf Seçildi' : 'Fotoğraf Yükle (İsteğe Bağlı)'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex flex-col flex-1">
                                    <Text className="pb-2 text-base font-medium text-zinc-900">Doğum Tarihi</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        className="relative h-14 w-full justify-center rounded-[32px] border border-zinc-300 bg-white pl-4 pr-12"
                                    >
                                        <Text className={`text-base font-normal leading-normal ${birthDate ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                            {birthDate || "GG.AA.YYYY"}
                                        </Text>
                                        <MaterialIcons name="calendar-today" size={20} color="#71717a" style={{ position: 'absolute', right: 16 }} />
                                    </TouchableOpacity>
                                </View>
                                <View className="flex flex-col flex-1">
                                    <View className="flex-row items-center gap-1.5 pb-2">
                                        <Text className="text-base font-medium text-zinc-900">Doğum Saati</Text>
                                        <MaterialIcons name="help-outline" size={16} color="#71717a" />
                                    </View>
                                    <View className="relative justify-center">
                                        <TextInput
                                            className="h-14 w-full rounded-[32px] border border-zinc-300 bg-white pl-4 pr-12 text-base font-normal leading-normal text-zinc-900"
                                            placeholder="SS:DD"
                                            placeholderTextColor="#a1a1aa"
                                            value={birthTime}
                                            onChangeText={handleBirthTimeChange}
                                            keyboardType="default"
                                            maxLength={5}
                                            returnKeyType="done"
                                        />
                                        <MaterialIcons name="schedule" size={20} color="#71717a" style={{ position: 'absolute', right: 16 }} />
                                    </View>
                                </View>
                            </View>

                            <View className="flex flex-col">
                                <Text className="pb-2 text-base font-medium text-zinc-900">Doğum Yeri</Text>
                                <TouchableOpacity
                                    onPress={() => setShowLocationPicker(true)}
                                    className="relative h-14 w-full justify-center rounded-[32px] border border-zinc-300 bg-white pl-12 pr-4"
                                >
                                    <MaterialIcons name="search" size={20} color="#71717a" style={{ position: 'absolute', left: 16, zIndex: 1 }} />
                                    <Text className={`text-base font-normal leading-normal ${birthPlace ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                        {birthPlace || "Şehir ara"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Gender Selector */}
                            <View className="flex flex-col">
                                <Text className="pb-2 text-base font-medium text-zinc-900">Cinsiyet</Text>
                                <View className="flex-row gap-3">
                                    {[
                                        { value: 'female' as Gender, label: 'Kadın', icon: '♀️' },
                                        { value: 'male' as Gender, label: 'Erkek', icon: '♂️' },
                                        { value: 'other' as Gender, label: 'Diğer', icon: '⚧️' },
                                    ].map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() => setGender(opt.value)}
                                            className={`flex-1 h-14 rounded-[32px] border flex-row items-center justify-center gap-2 ${gender === opt.value
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-zinc-300 bg-white'
                                                }`}
                                        >
                                            <Text className="text-lg">{opt.icon}</Text>
                                            <Text className={`text-base font-medium ${gender === opt.value ? 'text-primary' : 'text-zinc-600'
                                                }`}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Life Focus Multi-Select */}
                            <View className="flex flex-col">
                                <Text className="pb-2 text-base font-medium text-zinc-900">Hayattaki Odak Noktanız</Text>
                                <Text className="pb-3 text-sm text-zinc-500">Birden fazla seçebilirsiniz</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {[
                                        { value: 'love' as LifeFocus, label: 'Aşk', emoji: '💕' },
                                        { value: 'career' as LifeFocus, label: 'Kariyer', emoji: '💼' },
                                        { value: 'family' as LifeFocus, label: 'Aile', emoji: '👨‍👩‍👧' },
                                        { value: 'children' as LifeFocus, label: 'Çocuk', emoji: '👶' },
                                        { value: 'money' as LifeFocus, label: 'Para', emoji: '💰' },
                                        { value: 'health' as LifeFocus, label: 'Sağlık', emoji: '🏥' },
                                        { value: 'spiritual' as LifeFocus, label: 'Maneviyat', emoji: '✨' },
                                    ].map((opt) => {
                                        const selected = lifeFocus.includes(opt.value);
                                        return (
                                            <TouchableOpacity
                                                key={opt.value}
                                                onPress={() => {
                                                    setLifeFocus(prev => {
                                                        if (prev.includes(opt.value)) return prev.filter(v => v !== opt.value);
                                                        if (prev.length >= 3) {
                                                            Alert.alert('Bilgi', 'Hayattaki amacınız için en fazla 3 seçenek belirleyebilirsiniz.');
                                                            return prev;
                                                        }
                                                        return [...prev, opt.value];
                                                    });
                                                }}
                                                className={`px-4 py-3 rounded-full border flex-row items-center gap-1.5 ${selected
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-zinc-300 bg-white'
                                                    }`}
                                            >
                                                <Text className="text-base">{opt.emoji}</Text>
                                                <Text className={`text-sm font-medium ${selected ? 'text-primary' : 'text-zinc-600'
                                                    }`}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        <View className="mt-8 flex flex-col items-center pt-4">
                            <TouchableOpacity
                                onPress={handleComplete}
                                className="flex h-14 w-full items-center justify-center rounded-full bg-zinc-900 px-8"
                            >
                                <Text className="text-base font-bold text-white">Haritamı Hesapla</Text>
                            </TouchableOpacity>
                            <View className="mt-4 flex flex-row items-center gap-2 text-center text-xs text-zinc-500">
                                <MaterialIcons name="lock" size={16} color="#71717a" />
                                <Text className="text-sm text-zinc-500">Bilgilerin bizimle güvende.</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Date Picker Modal for iOS */}
                {Platform.OS === 'ios' && showDatePicker ? (
                    <Modal transparent={true} animationType="fade">
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white pb-8 pt-4 rounded-t-3xl">
                                <View className="flex-row justify-between px-6 mb-4">
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text className="text-zinc-500 text-lg">İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={confirmIOSDate}>
                                        <Text className="text-primary text-lg font-bold">Onayla</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={date}
                                    mode="date"
                                    display="spinner"
                                    onChange={onChangeDate}
                                    maximumDate={new Date()}
                                    locale="tr"
                                />
                            </View>
                        </View>
                    </Modal>
                ) : null}

                {/* Date Picker for Android */}
                {Platform.OS === 'android' && showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                        locale="tr"
                    />
                )}

                {/* Two-Step Location Picker Modal */}
                <Modal visible={showLocationPicker} animationType="slide" transparent={true}>
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white h-[80%] rounded-t-3xl p-4">
                            <View className="flex-row justify-between items-center mb-4 mt-2">
                                <View className="flex-row items-center">
                                    {selectedProvince && (
                                        <TouchableOpacity onPress={handleBackInModal} className="mr-3">
                                            <MaterialIcons name="arrow-back" size={24} color="#71717a" />
                                        </TouchableOpacity>
                                    )}
                                    <Text className="text-xl font-bold text-zinc-900">
                                        {selectedProvince ? `${selectedProvince.name} İlçeleri` : 'Doğum Yeri Seç'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => { setShowLocationPicker(false); setSelectedProvince(null); setSearchQuery(''); }} className="p-2">
                                    <MaterialIcons name="close" size={24} color="#71717a" />
                                </TouchableOpacity>
                            </View>

                            <View className="relative mb-4">
                                <MaterialIcons name="search" size={20} color="#71717a" style={{ position: 'absolute', left: 16, top: 14, zIndex: 1 }} />
                                <TextInput
                                    placeholder={selectedProvince ? "İlçe Ara..." : "Şehir Ara..."}
                                    placeholderTextColor="#a1a1aa"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    className="h-12 border border-zinc-300 bg-white rounded-[32px] pl-12 pr-4 text-zinc-900"
                                />
                            </View>

                            <FlatList
                                data={displayData as any[]}
                                keyExtractor={(item: any) => 'id' in item ? item.id.toString() : item.name}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }: { item: any }) => (
                                    <TouchableOpacity
                                        className="py-4 border-b border-zinc-100 flex-row justify-between items-center"
                                        onPress={() => handleSelectLocation(item)}
                                    >
                                        <Text className="text-lg text-zinc-900">{item.name}</Text>
                                        <MaterialIcons name="chevron-right" size={24} color="#d4d4d8" />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text className="text-center text-zinc-500 mt-8">Sonuç bulunamadı.</Text>
                                }
                            />
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
