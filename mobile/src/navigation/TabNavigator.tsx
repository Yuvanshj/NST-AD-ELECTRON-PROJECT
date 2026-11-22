import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DirectoryScreen } from '../screens/main/DirectoryScreen';
import { JobsScreen } from '../screens/main/JobsScreen';
import { EventsScreen } from '../screens/main/EventsScreen';
import { DonationsScreen } from '../screens/main/DonationsScreen';
import { MentorshipScreen } from '../screens/main/MentorshipScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { MainTabParamList } from '../types';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0f1d',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{
          tabBarLabel: 'Alumni',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          tabBarLabel: 'Careers',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💼</Text>,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎟️</Text>,
        }}
      />
      <Tab.Screen
        name="Giving"
        component={DonationsScreen}
        options={{
          tabBarLabel: 'Giving 80G',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🤝</Text>,
        }}
      />
      <Tab.Screen
        name="Mentorship"
        component={MentorshipScreen}
        options={{
          tabBarLabel: 'Mentorship',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🧭</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};
