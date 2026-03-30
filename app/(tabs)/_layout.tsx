import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#0ea5e9',
                tabBarStyle: {
                    height: 90,
                    paddingBottom: 30,
                    paddingTop: 10,
                    backgroundColor: 'white',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderTopWidth: 0
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="keypad"
                options={{
                    title: 'Keypad',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'keypad' : 'keypad-outline'} size={26} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="index"
                options={{
                    title: 'Recents',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? 'history' : 'history'} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="contacts"
                options={{
                    title: 'Contacts',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'people' : 'people-outline'} size={26} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
