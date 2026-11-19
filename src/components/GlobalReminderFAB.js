import React from 'react';
import { View, TouchableOpacity, Alert, Linking } from 'react-native';
import { PhoneCall, Bell } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useRouter } from 'expo-router';

export default function GlobalReminderFAB() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['telecallerDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/reports/telecaller-dashboard');
      return response.data;
    },
    staleTime: 60 * 1000
  });

  const todaysFollowups = data?.todaysFollowups || [];

  const showReminder = () => {
    if (todaysFollowups.length > 0) {
      const activeFollowup = todaysFollowups[0];
      const leadId = activeFollowup.lead?._id || activeFollowup.lead;
      const rawMobile = activeFollowup.lead_mobile;
      const cleanMobile = String(rawMobile || '').replace(/\D/g, '').slice(-10);

      Alert.alert(
        '🔔 Follow-up Reminder',
        `Lead: ${activeFollowup.lead_name}\nMobile: ${cleanMobile ? `+91 ${cleanMobile}` : (rawMobile || 'N/A')}\nScheduled Time: ${activeFollowup.time}\nNotes: ${activeFollowup.notes || 'Routine follow-up call'}`,
        [
          ...(cleanMobile ? [{
            text: '📞 Call Now',
            onPress: () => {
              Linking.openURL(`tel:${cleanMobile}`).catch(() => {});
              if (leadId) router.push(`/lead/${leadId}`);
            }
          }] : []),
          { text: 'Open Lead', onPress: () => { if (leadId) router.push(`/lead/${leadId}`); } },
          { text: 'Dismiss', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert('Follow-ups', 'You have no pending follow-up reminders right now. All caught up! 🎉');
    }
  };

  return (
    <TouchableOpacity 
      onPress={showReminder}
      activeOpacity={0.8}
      className={`absolute bottom-[110px] right-4 w-14 h-14 rounded-full justify-center items-center shadow-xl z-50 border-2 border-white bg-[#10B981] shadow-emerald-600/40`}
    >
      <PhoneCall size={22} color="#ffffff" fill="#ffffff" />
      {todaysFollowups.length > 0 && (
        <View className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full border-2 border-white items-center justify-center">
          <View className="w-1.5 h-1.5 bg-white rounded-full" />
        </View>
      )}
    </TouchableOpacity>
  );
}
