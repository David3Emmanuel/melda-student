import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import {
  Button,
  Card,
  Input,
  LOGIN_MOTIF_XML,
  Screen,
  Txt,
  Wordmark,
} from 'melda-shared/ui/components';
import { color, sp, weight } from 'melda-shared/ui/tokens';
import { api, ApiError } from '../src/api/client';
import { useSession } from '../src/state/store';

// The front door of the student app. Sign in with an existing account, or create
// one (production is seeded with nothing). A live session skips straight through;
// a signed-in student with no class yet lands on the join-code flow.
export default function Login() {
  const token = useSession((s) => s.token);
  const signIn = useSession((s) => s.signIn);
  const signOut = useSession((s) => s.signOut);
  const router = useRouter();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  // Prefilled with the backend's seeded demo student so a reviewer signs in with
  // one tap. Student logins are <id>@melda.africa; see melda-backend's seed.
  const [email, setEmail] = useState('s1@melda.africa');
  const [password, setPassword] = useState('melda');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (token) return <Redirect href="/(student)" />;

  const switchMode = () => {
    setError(null);
    if (mode === 'in') {
      setMode('up');
      setEmail('');
      setPassword('');
    } else {
      setMode('in');
      setEmail('s1@melda.africa');
      setPassword('melda');
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const auth =
        mode === 'in'
          ? await api.login({ email: email.trim(), password, role: 'student' })
          : await api.signup({ name: name.trim(), email: email.trim(), password, role: 'student' });
      const klass = await signIn(auth);
      if (!klass) {
        router.replace('/join-class');
        return;
      }
      router.replace('/(student)');
    } catch (e) {
      // Clear any half-set token so a failed attempt leaves a clean signed-out state.
      signOut();
      setError(
        e instanceof ApiError
          ? e.message
          : "Can't connect to MELDA right now. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: sp.xs }}>
        <Wordmark width={176} />
        <Txt variant="small" c={color.inkMuted}>
          Your learning companion
        </Txt>
      </View>
      <Card style={{ gap: sp.md }}>
        <Txt variant="h3">{mode === 'in' ? 'Student sign in' : 'Create a student account'}</Txt>
        {mode === 'up' ? (
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoComplete="name"
            editable={!busy}
          />
        ) : null}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@melda.africa"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!busy}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'up' ? 'at least 6 characters' : undefined}
          secureTextEntry
          autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          textContentType={mode === 'up' ? 'newPassword' : 'password'}
          editable={!busy}
        />
        {error ? (
          <Txt variant="small" c={color.struggle}>
            {error}
          </Txt>
        ) : null}
        <Button
          title={mode === 'in' ? 'Sign in' : 'Create account'}
          icon="next"
          loading={busy}
          disabled={mode === 'up' && (!name.trim() || !email.trim() || !password)}
          onPress={submit}
        />
        <Pressable onPress={switchMode} accessibilityRole="button">
          <Txt variant="small" c={color.accent} w={weight.semibold}>
            {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </Txt>
        </Pressable>
      </Card>
      <Txt variant="tiny" c={color.inkMuted} center>
        Teachers plan and review in the MELDA teacher app.
      </Txt>
      <View style={{ alignItems: 'center', paddingTop: sp.md }}>
        <SvgXml xml={LOGIN_MOTIF_XML} width={150} height={86} opacity={0.18} />
      </View>
    </Screen>
  );
}
