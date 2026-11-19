import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Filter, Search, Download, Edit2, LogOut, Ban, CheckCircle2, User, Phone, Mail, CreditCard, Key, Settings, ShieldOff, Trash2 } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';

import { Platform } from 'react-native';

// ... (imports remain)

export default function TelecallerManagement() {
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCaller, setEditingCaller] = useState(null); // null means adding

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Query all telecallers
  const { data, isLoading, error } = useQuery({
    queryKey: ['telecallersList'],
    queryFn: async () => {
      const response = await api.get('/telecallers');
      return response.data;
    }
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newTC) => api.post('/telecallers', newTC),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to add telecaller.');
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ id, details }) => api.put(`/telecallers/${id}`, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to edit telecaller.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/telecallers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to delete telecaller.';
      if (Platform.OS === 'web') window.alert('Error: ' + msg);
      else Alert.alert('Error', msg);
    }
  });

  const toggleLeaveMutation = useMutation({
    mutationFn: ({ id, on_leave }) => api.patch(`/telecallers/${id}/leave`, { on_leave }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/telecallers/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallersList'] });
    }
  });

  const openAddModal = () => {
    setEditingCaller(null);
    setName('');
    setMobile('');
    setEmail('');
    setEmployeeId('');
    setPassword('');
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (caller) => {
    setEditingCaller(caller);
    setName(caller.name);
    setMobile(caller.mobile);
    setEmail(caller.email);
    setEmployeeId(caller.employee_id);
    setPassword('');
    setFormError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCaller(null);
  };

  const handleFormSubmit = () => {
    setFormError('');
    if (!name || !mobile || !email || !employeeId) {
      setFormError('All general fields are required.');
      return;
    }

    if (!editingCaller && !password) {
      setFormError('Password is required for a new telecaller.');
      return;
    }

    const payload = {
      name,
      mobile,
      email,
      employee_id: employeeId,
      password: password || undefined
    };

    if (editingCaller) {
      editMutation.mutate({ id: editingCaller.id, details: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleToggleLeave = (caller) => {
    // caller.on_leave is a boolean in Mongoose
    const isCurrentlyOnLeave = caller.on_leave === true || caller.on_leave === 1;
    toggleLeaveMutation.mutate({ id: caller.id, on_leave: !isCurrentlyOnLeave });
  };

  const handleToggleStatus = (caller) => {
    const actionName = caller.status === 'active' ? 'disable' : 'enable';
    const nextStatus = caller.status === 'active' ? 'disabled' : 'active';
    
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to ${actionName} ${caller.name}?`)) {
        toggleStatusMutation.mutate({ id: caller.id, status: nextStatus });
      }
      return;
    }

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionName} ${caller.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => toggleStatusMutation.mutate({ id: caller.id, status: nextStatus }) 
        }
      ]
    );
  };

  const handleDelete = (caller) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to permanently delete ${caller.name}? Their assigned leads will become Fresh Leads.`)) {
        deleteMutation.mutate(caller.id);
      }
      return;
    }

    Alert.alert(
      'Delete Telecaller',
      `Are you sure you want to permanently delete ${caller.name}? Their assigned leads will become Fresh Leads.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(caller.id)
        }
      ]
    );
  };

  // Mock data if API is empty
  const mockCallers = [];

  const displayCallers = data?.telecallers && data.telecallers.length > 0 ? data.telecallers : mockCallers;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />
      
      {/* Header */}
      <View className="pt-14 pb-2 px-6">
        <Text className="text-[28px] font-bold text-indigo-950 tracking-tight">Manage Telecallers</Text>
        <Text className="text-slate-500 text-sm mt-1 pr-6 leading-5">Monitor and assign roles to your sales team.</Text>
      </View>

      {/* Action Bar */}
      <View className="px-6 mt-4 mb-6 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center border border-slate-200 bg-white px-4 rounded-xl shadow-sm shadow-slate-200/50 h-12 mr-3">
          <Search size={18} color="#64748B" />
          <TextInput 
            className="flex-1 ml-2 text-sm font-medium text-slate-800"
            placeholder="Search telecallers..."
            placeholderTextColor="#94A3B8"
          />
        </View>
        <TouchableOpacity className="w-12 h-12 bg-white border border-slate-200 rounded-xl justify-center items-center shadow-sm shadow-slate-200/50 mr-3">
          <Filter size={18} color="#4F46E5" />
        </TouchableOpacity>
        <TouchableOpacity className="w-12 h-12 bg-white border border-slate-200 rounded-xl justify-center items-center shadow-sm shadow-slate-200/50">
          <Download size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {displayCallers.map((caller) => {
          const isActive = caller.status === 'active';
          const isOnLeave = caller.on_leave === 1 || caller.on_leave === true;
          // Fix for Invalid Date: fallback to createdAt which mongoose uses
          const createdString = caller.createdAt || caller.created_at;
          const dateStr = createdString ? new Date(createdString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          const initials = caller.name ? caller.name.substring(0, 1).toUpperCase() : 'U';

          return (
            <View key={caller.id} className="bg-white rounded-2xl p-5 mb-5 border border-slate-200 shadow-sm shadow-slate-200/50">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center flex-1">
                  <Image 
                    source={
                      caller.role === 'admin' 
                        ? require('../../../assets/images/avatar-admin.png')
                        : caller.role === 'team_leader' || caller.role === 'manager'
                        ? require('../../../assets/images/avatar-teamleader.png')
                        : require('../../../assets/images/avatar-telecaller.png')
                    }
                    style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, borderWidth: 1.5, borderColor: '#CBD5E1' }}
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-base font-bold text-indigo-950">{caller.name}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">Telecaller ID: {caller.employee_id} {caller.role ? `• ${caller.role.toUpperCase()}` : ''}</Text>
                  </View>
                </View>

                {/* Status Pill */}
                {isOnLeave ? (
                  <View className="bg-amber-100 px-3 py-1 rounded-full ml-2 border border-amber-200">
                    <Text className="text-[11px] font-bold text-amber-700">On Leave</Text>
                  </View>
                ) : isActive ? (
                  <View className="bg-emerald-100 px-3 py-1 rounded-full ml-2 border border-emerald-200">
                    <Text className="text-[11px] font-bold text-emerald-700">Active</Text>
                  </View>
                ) : (
                  <View className="bg-slate-100 px-3 py-1 rounded-full ml-2 border border-slate-200">
                    <Text className="text-[11px] font-bold text-slate-500">Disabled</Text>
                  </View>
                )}
              </View>

              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-slate-500">Mobile Number:</Text>
                  <Text className="text-sm font-bold text-indigo-950">{caller.mobile}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs font-bold text-slate-500">Joined Date:</Text>
                  <Text className="text-sm font-bold text-indigo-950">{dateStr}</Text>
                </View>
              </View>

              <View className="flex-row flex-wrap border-t border-slate-100 pt-4">
                <TouchableOpacity 
                  onPress={() => openEditModal(caller)}
                  className="flex-1 flex-row justify-center items-center py-2 rounded-xl border border-slate-200 mr-2 mb-2 min-w-[70px]"
                >
                  <Edit2 size={14} color="#4F46E5" />
                  <Text className="text-indigo-950 font-bold text-xs ml-2">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleToggleLeave(caller)}
                  className="flex-1 flex-row justify-center items-center py-2 rounded-xl border border-slate-200 mr-2 mb-2 min-w-[70px]"
                >
                  {isOnLeave ? <CheckCircle2 size={14} color="#4F46E5" /> : <LogOut size={14} color="#4F46E5" />}
                  <Text className="text-indigo-950 font-bold text-xs ml-2">{isOnLeave ? 'Resume' : 'Leave'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleToggleStatus(caller)}
                  className="flex-1 flex-row justify-center items-center py-2 rounded-xl border border-slate-200 mr-2 mb-2 min-w-[70px]"
                >
                  <ShieldOff size={14} color="#4F46E5" />
                  <Text className="text-indigo-950 font-bold text-xs ml-2">{isActive ? 'Disable' : 'Enable'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDelete(caller)}
                  className="flex-1 flex-row justify-center items-center py-2 rounded-xl border border-red-200 bg-red-50 mb-2 min-w-[70px]"
                >
                  <Trash2 size={14} color="#DC2626" />
                  <Text className="text-red-600 font-bold text-xs ml-2">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        onPress={openAddModal}
        className="absolute bottom-24 right-6 w-16 h-16 bg-[#FFB703] rounded-full justify-center items-center shadow-lg shadow-[#FFB703]/50 z-50"
      >
        <Plus size={32} color="#4F46E5" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-end bg-indigo-950/50">
          <View className="bg-white rounded-t-3xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-indigo-950">
                {editingCaller ? 'Edit Telecaller' : 'Add Telecaller'}
              </Text>
              <TouchableOpacity onPress={closeModal} className="w-8 h-8 rounded-full bg-slate-100 justify-center items-center">
                <Text className="text-slate-500 font-bold">X</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {formError ? (
                <Text className="text-red-500 text-sm mb-4 font-bold">{formError}</Text>
              ) : null}

              {/* Form fields styled for KisanConnect */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 mb-2">Full Name</Text>
                <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12">
                  <User size={16} color="#64748B" />
                  <TextInput className="flex-1 ml-2 text-sm text-indigo-950" placeholder="e.g. Rahul Singh" value={name} onChangeText={setName} />
                </View>
              </View>
              
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 mb-2">Mobile Number</Text>
                <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12">
                  <Phone size={16} color="#64748B" />
                  <TextInput className="flex-1 ml-2 text-sm text-indigo-950" placeholder="e.g. 9876543210" keyboardType="numeric" value={mobile} onChangeText={setMobile} />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 mb-2">Email Address</Text>
                <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12">
                  <Mail size={16} color="#64748B" />
                  <TextInput className="flex-1 ml-2 text-sm text-indigo-950" placeholder="e.g. rahul@kisanconnect.com" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 mb-2">Employee ID</Text>
                <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12">
                  <CreditCard size={16} color="#64748B" />
                  <TextInput className="flex-1 ml-2 text-sm text-indigo-950" placeholder="e.g. OF-TC-2024-001" value={employeeId} onChangeText={setEmployeeId} autoCapitalize="characters" />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-700 mb-2">
                  {editingCaller ? "New Password (Leave blank to keep current)" : "Password"}
                </Text>
                <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12">
                  <Key size={16} color="#64748B" />
                  <TextInput className="flex-1 ml-2 text-sm text-indigo-950" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleFormSubmit}
                className="bg-indigo-600 h-14 rounded-xl justify-center items-center shadow-lg shadow-indigo-900/20 mb-10"
              >
                <Text className="text-white text-base font-bold">
                  {editingCaller ? 'Save Changes' : 'Create Telecaller'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
