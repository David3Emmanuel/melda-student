import { Tabs } from 'expo-router';
import { StackActions } from '@react-navigation/native';
import { Icon, type IconName } from 'melda-shared/ui/components';
import { color, sp } from 'melda-shared/ui/tokens';

const tabIcon =
  (name: IconName) =>
  ({ color: c, size }: { color: string; size: number }) => (
    <Icon name={name} size={size} color={c} />
  );

// Re-tapping the active tab pops that tab's nested stack back to its home
// (index) instead of doing nothing - the gesture people expect on mobile.
const popToHome =
  ({ navigation }: { navigation: { isFocused: () => boolean; dispatch: (a: unknown) => void } }) => ({
    tabPress: () => {
      if (navigation.isFocused()) navigation.dispatch(StackActions.popToTop());
    },
  });

// The student's two tabs: the lessons/reviews they've been set (Home) and the
// lessons they've bookmarked (Saved). The whole (student) surface is already
// guarded by the parent stack, so no token check is repeated here. Detail screens
// (lesson, quiz) live in the parent stack and push ABOVE this bar.
export default function StudentTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.inkMuted,
        tabBarStyle: {
          backgroundColor: color.card,
          borderTopColor: color.border,
          height: 70,
          paddingBottom: sp.md,
          paddingTop: sp.xs,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home') }}
        listeners={popToHome}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: 'Saved', tabBarIcon: tabIcon('bookmark') }}
        listeners={popToHome}
      />
    </Tabs>
  );
}
