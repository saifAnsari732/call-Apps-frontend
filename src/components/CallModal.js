import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { X, Calendar, Clock, AlertTriangle, Tag, PhoneCall } from 'lucide-react-native';

export default function CallModal({ visible, onClose, lead, onSubmit, isDark, initialDuration = 0 }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [durationSec, setDurationSec] = useState('0');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tags
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Follow-up scheduling
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');

  useEffect(() => {
    if (visible) {
      setDurationSec(String(initialDuration || 0));
      if (lead?.tags && Array.isArray(lead.tags)) {
        setSelectedTags(lead.tags);
      }
    }
  }, [visible, initialDuration, lead]);

  const statuses = [
    { label: 'Interested', value: 'Interested', color: 'bg-emerald-500' },
    { label: 'Not Interested', value: 'Rejected', color: 'bg-red-500' },
    { label: 'Follow Up', value: 'Follow Up', color: 'bg-amber-500', triggersFollowup: true },
    { label: 'Callback', value: 'Callback', color: 'bg-yellow-500', triggersFollowup: true },
    { label: 'Not Connected', value: 'Not Connected', color: 'bg-slate-500' },
    { label: 'Distributor', value: 'Distributor Interested', color: 'bg-purple-500' },
    { label: 'Trader', value: 'Trader Interested', color: 'bg-blue-500' },
    { label: 'DSS', value: 'DSS Interested', color: 'bg-green-500' },
    { label: 'RSS', value: 'RSS Interested', color: 'bg-slate-500' },
    { label: 'SS', value: 'SS Interested', color: 'bg-emerald-500' },
    { label: 'Wrong Number', value: 'Wrong Number', color: 'bg-rose-500' },
    { label: 'Closed', value: 'Closed', color: 'bg-teal-500' },
  ];

  const handleStatusSelect = (statusObj) => {
    setStatus(statusObj.value);
    if (statusObj.triggersFollowup) {
      setScheduleFollowup(true);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFollowupDate(tomorrow.toISOString().split('T')[0]);
      setFollowupTime('11:00');
    } else {
      setScheduleFollowup(false);
    }
  };

  const handleQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowupDate(d.toISOString().split('T')[0]);
  };

  const handleQuickTime = (minutesToAdd) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setFollowupDate(`${yyyy}-${mm}-${dd}`);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setFollowupTime(`${hours}:${minutes}`);
  };

  const handleFormSubmit = async () => {
    setErrorMsg('');

    if (!status) {
      setErrorMsg('Please select a Call Status.');
      return;
    }

    if (scheduleFollowup && (!followupDate || !followupTime)) {
      setErrorMsg('Please fill in Date and Time for Follow-up.');
      return;
    }

    setSubmitting(true);
    try {
      const parsedDuration = Math.max(0, parseInt(durationSec, 10) || 0);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - parsedDuration * 1000);

      const payload = {
        lead_id: lead?.id || lead?._id,
        status,
        notes: notes.trim(),
        duration: parsedDuration,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tags: selectedTags,
        followupDate: scheduleFollowup ? followupDate : null,
        followupTime: scheduleFollowup ? followupTime : null,
        followupNotes: scheduleFollowup ? (notes.trim() || `Scheduled Follow-up (${status})`) : null
      };

      if (onSubmit) {
        await onSubmit(payload);
      }
      setStatus('');
      setNotes('');
      setDurationSec('0');
      setSelectedTags([]);
      setTagInput('');
      setScheduleFollowup(false);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to log call data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className={`rounded-t-3xl p-6 h-[88%] ${isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'}`}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1 pr-2">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Log Call Outcome</Text>
              <Text className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lead?.name} • {lead?.mobile || lead?.lead_id || ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <X size={18} color={isDark ? '#E2E8F0' : '#475569'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {errorMsg ? (
              <View className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl mb-4 flex-row items-center">
                <AlertTriangle size={16} color="#EF4444" />
                <Text className="text-red-500 text-xs font-semibold flex-1 ml-2">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Talk Time / Call Duration Bar */}
            <View className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 mb-5 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <PhoneCall size={16} color="#E11D48" />
                <Text className="text-xs font-bold text-rose-900 ml-2">Call Duration (Seconds)</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                {[0, 30, 60, 120].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => setDurationSec(String(sec))}
                    className={`px-2 py-1 rounded-lg border ${Number(durationSec) === sec ? 'bg-rose-600 border-rose-600' : 'bg-white border-rose-200'}`}
                  >
                    <Text className={`text-[10px] font-bold ${Number(durationSec) === sec ? 'text-white' : 'text-rose-700'}`}>
                      {sec === 0 ? '0s' : sec < 60 ? `${sec}s` : `${sec / 60}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  value={durationSec}
                  onChangeText={setDurationSec}
                  keyboardType="numeric"
                  className="bg-white border border-rose-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 w-14 text-center"
                />
              </View>
            </View>

            {/* Select Status */}
            <Text className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select Call Outcome / Lead Status
            </Text>

            <View className="flex-row flex-wrap justify-between mb-5">
              {statuses.map((item, index) => {
                const isSelected = status === item.value && (item.label !== 'Wrong Number' || status === 'Wrong Number');
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleStatusSelect(item)}
                    className={`w-[31%] py-3 mb-2.5 rounded-xl border justify-center items-center ${
                      isSelected 
                        ? `${item.color} border-transparent` 
                        : isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Text className={`text-xs font-bold text-center ${isSelected ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Follow-up Scheduling Section */}
            {scheduleFollowup && (
              <View className={`p-4 rounded-2xl mb-6 border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <Text className={`text-xs font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Schedule Follow-up Reminder
                </Text>
                
                <View className="flex-row mb-3.5 flex-wrap gap-2">
                  <TouchableOpacity onPress={() => handleQuickDate(0)} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                    <Text className="text-xs font-semibold text-slate-700">Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickDate(1)} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                    <Text className="text-xs font-semibold text-slate-700">Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickDate(3)} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                    <Text className="text-xs font-semibold text-slate-700">In 3 Days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickTime(10)} className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50">
                    <Text className="text-xs font-bold text-amber-700">In 10 Min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickTime(15)} className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50">
                    <Text className="text-xs font-bold text-amber-700">In 15 Min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickTime(30)} className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50">
                    <Text className="text-xs font-bold text-amber-700">In 30 Min</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row justify-between">
                  <View className="w-[48%]">
                    <Text className="text-[10px] font-semibold uppercase mb-1.5 text-slate-500">Date (YYYY-MM-DD)</Text>
                    <View className="flex-row items-center border rounded-lg px-2 py-2.5 border-slate-200 bg-white">
                      <Calendar size={14} color="#64748B" />
                      <TextInput
                        className="flex-1 ml-2 text-xs py-0 text-slate-800"
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#475569"
                        value={followupDate}
                        onChangeText={setFollowupDate}
                      />
                    </View>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-[10px] font-semibold uppercase mb-1.5 text-slate-500">Time (HH:MM)</Text>
                    <View className="flex-row items-center border rounded-lg px-2 py-2.5 border-slate-200 bg-white">
                      <Clock size={14} color="#64748B" />
                      <TextInput
                        className="flex-1 ml-2 text-xs py-0 text-slate-800"
                        placeholder="11:30"
                        placeholderTextColor="#475569"
                        value={followupTime}
                        onChangeText={setFollowupTime}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Tags Selection */}
            <View className="mb-6">
              <Text className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-500">
                Add Tags (Optional)
              </Text>
              
              <View className="flex-row flex-wrap mb-3">
                {['VIP', 'Urgent', 'WhatsApp', 'WhatsApp Needed', 'Call Again', 'FollowUp Soon'].map((presetTag) => {
                  const isSelected = selectedTags.includes(presetTag);
                  return (
                    <TouchableOpacity
                      key={presetTag}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== presetTag));
                        } else {
                          setSelectedTags([...selectedTags, presetTag]);
                        }
                      }}
                      className={`mr-2 mb-2 px-3 py-1.5 rounded-full border ${isSelected ? 'bg-rose-500 border-rose-500' : 'bg-slate-100 border-slate-200'} flex-row items-center`}
                    >
                      <Tag size={12} color={isSelected ? '#FFFFFF' : '#64748B'} className="mr-1.5" />
                      <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>{presetTag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="flex-row items-center border rounded-xl px-3 h-12 border-slate-200 bg-white">
                <TextInput
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Type a custom tag and press Add..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-sm text-slate-800"
                  onSubmitEditing={() => {
                    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
                      setSelectedTags([...selectedTags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }}
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  onPress={() => {
                    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
                      setSelectedTags([...selectedTags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }}
                  className="bg-slate-200 px-3 py-1.5 rounded-lg ml-2"
                >
                  <Text className="text-xs font-bold text-slate-700">Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes Input */}
            <View className="mb-8">
              <Text className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500">
                Call Discussion Notes (Optional)
              </Text>
              <TextInput
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter client discussion details (e.g. Interested in 15L tin, send rate list on WhatsApp)..."
                placeholderTextColor="#94A3B8"
                className="border rounded-xl p-3 text-sm h-24 border-slate-200 bg-slate-50 text-slate-800"
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View className="pt-4 border-t border-slate-800/10 flex-row justify-between">
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              className="w-[30%] py-3.5 rounded-xl border justify-center items-center border-slate-300 bg-white"
            >
              <Text className="text-xs font-bold text-slate-700">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFormSubmit}
              disabled={submitting}
              className="w-[65%] bg-[#E11D48] py-3.5 rounded-xl flex-row justify-center items-center shadow-md"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-xs font-bold">Save Call Log</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
