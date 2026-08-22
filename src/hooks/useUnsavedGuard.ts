// Guards the quiz against silently losing in-progress answers - the same guard
// the teacher authoring flows use. While `active`, any attempt to leave the
// screen - the header back button, the native back gesture, a router.back() - is
// intercepted and the student must confirm the discard first.
//
// usePreventRemove wraps React Navigation's `beforeRemove` event; the confirm is
// platform-split because react-native-web's Alert is a no-op (its alert() does
// nothing), so blocking navigation and then calling Alert.alert would trap the
// student on the screen. window.confirm is the web equivalent.
//
// Known ceiling: on web this covers in-app navigation, not the browser's own
// back/forward button or a tab close. A window `beforeunload` listener is the
// upgrade path if that gap ever bites.

import { Alert, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';

export function useUnsavedGuard(active: boolean) {
  const navigation = useNavigation();
  usePreventRemove(active, ({ data }) => {
    const discard = () => navigation.dispatch(data.action);
    if (Platform.OS === 'web') {
      if (window.confirm('Discard your answers? They will be lost.')) discard();
      return;
    }
    Alert.alert('Discard your answers?', 'They will be lost.', [
      { text: 'Keep answering', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: discard },
    ]);
  });
}
