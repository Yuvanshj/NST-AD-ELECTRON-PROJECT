import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { AlumniProfileScreen } from '../screens/main/AlumniProfileScreen';
import { JobDetailsScreen } from '../screens/main/JobDetailsScreen';
import { EventDetailsScreen } from '../screens/main/EventDetailsScreen';
import { QrTicketScreen } from '../screens/main/QrTicketScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0f1d' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="AlumniProfile" component={AlumniProfileScreen} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        <Stack.Screen name="QrTicket" component={QrTicketScreen} />
        <Stack.Screen name="ChatConversation" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
