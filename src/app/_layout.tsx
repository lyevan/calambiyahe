import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F3F5F9' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
