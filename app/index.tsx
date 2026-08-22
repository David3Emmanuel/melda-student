import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Button, Card, Input, Screen, Txt } from 'melda-shared/ui/components';
import { color, sp } from 'melda-shared/ui/tokens';
import { api, ApiError } from '../src/api/client';
import { useSession } from '../src/state/store';

// The front door of the student app. MELDA is three separate processes - this app,
// the teacher app, and the backend that owns the shared data - so a student signs
// in here and lands on their own learning home. A live session skips straight through.
export default function Login() {
  const token = useSession((s) => s.token);
  const signIn = useSession((s) => s.signIn);
  const signOut = useSession((s) => s.signOut);
  const router = useRouter();

  // Prefilled with the backend's seeded demo student so a reviewer signs in with
  // one tap. Student logins are <id>@melda.africa; see melda-backend's seed.
  const [email, setEmail] = useState('s1@melda.africa');
  const [password, setPassword] = useState('melda');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (token) return <Redirect href="/(student)" />;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const auth = await api.login({ email: email.trim(), password, role: 'student' });
      const klass = await signIn(auth);
      if (!klass) {
        signOut();
        setError('This account is not enrolled in any class yet.');
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
    <Screen title="MELDA" subtitle="Your learning companion">
      <Card style={{ gap: sp.md }}>
        <Txt variant="h3">Student sign in</Txt>
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
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          editable={!busy}
        />
        {error ? (
          <Txt variant="small" c={color.struggle}>
            {error}
          </Txt>
        ) : null}
        <Button title="Sign in" icon="next" loading={busy} onPress={submit} />
      </Card>
      <Txt variant="tiny" c={color.inkMuted} center>
        Teachers plan and review in the MELDA teacher app.
      </Txt>
    </Screen>
  );
}
