import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';

export default function SimpleCalendarModal({ visible, onClose, onSelect, isDark, title }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-indigo-950/50 px-4">
        <View className={`w-full max-w-sm rounded-3xl p-5 shadow-xl ${isDark ? 'bg-indigo-900' : 'bg-white'}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</Text>
            <TouchableOpacity onPress={onClose} className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <X size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => changeMonth(-1)} className={`px-4 py-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{'<'}</Text>
            </TouchableOpacity>
            <Text className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} className={`px-4 py-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <Text key={d} className={`w-[14%] text-center text-xs mb-3 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d}</Text>
            ))}
            {days.map((d, i) => (
              <TouchableOpacity 
                key={i} 
                disabled={!d}
                onPress={() => {
                  if(d) {
                    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                    // Adjust to local timezone string format
                    const tzOffset = selected.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(selected - tzOffset)).toISOString().slice(0, -1).split('T')[0];
                    onSelect(localISOTime);
                  }
                }}
                className={`w-[14%] aspect-square items-center justify-center rounded-full mb-1 ${!d ? '' : isDark ? 'active:bg-slate-800' : 'active:bg-slate-100'}`}
              >
                <Text className={`font-semibold ${!d ? '' : isDark ? 'text-white' : 'text-slate-800'}`}>{d || ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
