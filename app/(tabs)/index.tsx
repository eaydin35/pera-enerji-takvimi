import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
    const { userProfile } = useStore();
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
                <View className="flex-row items-center gap-2">
                    {/* User Avatar */}
                    <View className="h-12 w-12 rounded-full border-2 border-primary">
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_XhyEFXefcU9wA9FNdiFZhj7X8eAu5lPtIwFauQjw9C_W2ZZWDOrHPnwJ6EzFvPmSnAads9LbCwtMdlcA8lHc6j34Rhc90BlM-xHdgJ4ojWBPFzvJ3enWXq4E1abzAm6GQUUiuTt-iY6ddLG5_NfvN1pTohGooLDTS_enluA4EkoNWC9iRzNwTUT7cwyE4uwF0Ge171kBez2YEQeECN9QEphQsYoFPCXvC-L_W6J8JEBI1xq9SCL-Ds3CLKuW1nwSWpFm-nfVrA' }}
                            className="flex-1 rounded-full"
                        />
                    </View>
                    {/* Spouse Avatar */}
                    <View className="h-10 w-10 opacity-60">
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDs53rt9wanX7NWWQhqg2cfaLiPUpsdiOhxbAyBEdIuBzpCc2zrIWlZZZEXUibG96XTXPf2ZHfa5-Wp8tD8LVn2qMB8vJViEPfE8QYTw9mNIeVbwFe5fMDDUqfYR_eQAG3BDwrK69Zt4rG3bKJCofAupzNFtAIoN-hRkg_ArYIEwTc0rhrpJPx_RHudvrWZSssD9CxNcIhrtFLWOqOqHuTINJuH5qPvrTZaeoQQVtvKXNXPpdBQ-_6rjWa5oJvlgOJohclkT_0ZSw' }}
                            className="flex-1 rounded-full"
                        />
                    </View>
                    {/* Add Profile */}
                    <TouchableOpacity className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-zinc-400">
                        <MaterialIcons name="add" size={20} color="#71717a" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity className="flex h-10 w-10 items-center justify-center rounded-full bg-card-light dark:bg-card-dark">
                    <MaterialIcons name="notifications-none" size={24} color="#1f2937" className="dark:text-white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                {/* Greeting */}
                <View className="px-4 pb-3 pt-2">
                    <Text className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Günaydın, {userProfile?.firstName || 'Bilinmeyen'}
                    </Text>
                    <Text className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        24 Ekim 2024, Ay Ikizler burcunda
                    </Text>
                </View>

                {/* Daily Energy Theme */}
                <View className="px-4 mb-4">
                    <View className="overflow-hidden rounded-[24px] border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm">
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdGvb7yIWHUneDnq9K6wakcs4ebyqyTOjt6QN66qOcQ0NwHqu859FykCiSd3_94xHJse99yfU4Xg2EX_fl1cBocDkuZl9YntXAbV0J2dJfpkuvW3rQXeUsEmfOYB1H1UGdO2FqS6kzzdm2g8GtDsUSVOC1RmKP1zrbz1D7vrInxNA0IXaEPQJzUoGAOVuWp1aOAiiZK3tqYuYsYqu4N_veTo_YU10zjK245mgXFe6ZN9lhEmNwLTDUPTPcUwUNJMZXGlNuyinZKw' }}
                            className="h-40 w-full"
                        />
                        <View className="p-5">
                            <Text className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Günün Enerji Teması</Text>
                            <Text className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-1">Bugün İletişim Günü</Text>
                            <Text className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark mt-2">
                                Fikirlerini cesurca ifade etmek için harika bir gün. Zihnin berrak ve sezgilerin güçlü.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Recommendations Grid */}
                <View className="flex-row px-4 mb-4 gap-4">
                    <View className="flex-1 rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary mb-2">
                            <MaterialIcons name="palette" size={20} color="#1f1317" />
                        </View>
                        <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mt-auto">Mavi</Text>
                        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Günün Rengi</Text>
                    </View>
                    <View className="flex-1 rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary mb-2">
                            <MaterialIcons name="diamond" size={20} color="#1f1317" />
                        </View>
                        <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mt-auto">Lapis Lazuli</Text>
                        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Günün Taşı</Text>
                    </View>
                </View>

                <View className="px-4 mb-4">
                    <View className="rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm flex-row items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary mr-4">
                            <MaterialIcons name="star" size={24} color="#1f1317" />
                        </View>
                        <View>
                            <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">El-Fettâh</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Günün Esması</Text>
                        </View>
                    </View>
                </View>

                {/* Alerts */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-start rounded-[24px] border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 p-5 shadow-sm">
                        <MaterialIcons name="warning-amber" size={24} color="#eab308" />
                        <View className="ml-3 flex-1">
                            <Text className="text-base font-bold text-zinc-900 dark:text-white">Ay Boşlukta Uyarısı</Text>
                            <Text className="mt-1 text-sm leading-normal text-zinc-600 dark:text-zinc-300">
                                14:30 - 18:00 arası Ay boşlukta. Bu saatlerde yeni başlangıçlardan, önemli kararlardan ve imzalardan kaçın.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Important Timings */}
                <View className="px-4 mb-6">
                    <Text className="mb-4 text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Önemli Zamanlamalar</Text>

                    <View className="mb-3 flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                            <MaterialIcons name="self-improvement" size={24} color="#1f1317" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Dua & Meditasyon</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">06:00 - 07:30</Text>
                        </View>
                    </View>

                    <View className="mb-3 flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                            <MaterialIcons name="record-voice-over" size={24} color="#1f1317" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Önemli Konuşma</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">11:00 - 13:00</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 opacity-60 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <MaterialIcons name="trending-down" size={24} color="#71717a" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Yatırım Kararı</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Bugün uygun değil</Text>
                        </View>
                    </View>
                </View>

                {/* Günlük Egzersiz Card */}
                <View className="px-4 mb-4">
                    <TouchableOpacity
                        onPress={() => router.push('/workout' as any)}
                        className="overflow-hidden rounded-[24px] shadow-sm"
                        style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }}
                    >
                        <View className="flex-row items-center p-5">
                            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                <MaterialIcons name="self-improvement" size={26} color="#fff" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#14532d' }}>Günlük Esneme Rutini</Text>
                                <Text style={{ fontSize: 13, color: '#16a34a', marginTop: 2 }}>10 adım • ~10 dakika</Text>
                            </View>
                            <View style={{ backgroundColor: '#22c55e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Başla</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Günün Niyeti & Stones of Pera */}
                <View className="px-4 gap-4">
                    <TouchableOpacity className="relative flex-row overflow-hidden rounded-[24px] border border-border-light bg-card-light p-5 pt-6 pb-6 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex-1 pr-4 z-10">
                            <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Günün Niyeti</Text>
                            <Text className="text-sm font-normal text-text-secondary-light dark:text-text-secondary-dark mb-3">
                                "Bugün sevgi ve bolluğu hayatıma davet ediyorum."
                            </Text>
                            <View className="flex-row items-center">
                                <MaterialIcons name="calendar-month" size={16} color="#ad92c9" />
                                <Text className="text-sm text-[#ad92c9] ml-1 font-medium">Takvime Ekle (Google)</Text>
                            </View>
                        </View>
                        <View className="absolute right-0 top-0 bottom-0 w-24 bg-primary/20 items-center justify-center">
                            <MaterialIcons name="add-task" size={32} color="#f7e1e8" className="opacity-80" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => Linking.openURL('https://instagram.com')}
                        className="flex-row items-center justify-between rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm"
                    >
                        <View className="flex-row items-center flex-1 pr-4">
                            <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mr-4">
                                <MaterialIcons name="shopping-bag" size={20} color="#71717a" />
                            </View>
                            <View>
                                <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Stones of Pera</Text>
                                <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sana özel taşlar ve takılar</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#71717a" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
