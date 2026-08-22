// First-run for a student with no class yet: enter the invite code their teacher
// shared (POST /classes/join). On success the student lands on Home in that class.
//
// Production is seeded with nothing, so this is how a student gets enrolled in a
// real deployment.

import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Button, Card, Input, Screen, Txt } from 'melda-shared/ui/components';
import { color, sp } from 'melda-shared/ui/tokens';
import { api, ApiError } from '../src/api/client';
import { useSession } from '../src/state/store';

export default function JoinClass() {
  const router = useRouter();
  const token = useSession((s) => s.token);
  const setCurrentClass = useSession((s) => s.setCurrentClass);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) return <Redirect href="/" />;

  const submit = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    setError(null);
    try {
      const klass = await api.joinClass({ code: c });
      setCurrentClass(klass);
      router.replace('/(student)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't join. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Join your class" subtitle="Enter the code your teacher shared">
      <Card style={{ gap: sp.md }}>
        <Txt variant="h3">Class code</Txt>
        <Input
          value={code}
          onChangeText={setCode}
          placeholder="e.g. ABC123"
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={submit}
        />
        {error ? (
          <Txt variant="small" c={color.struggle}>
            {error}
          </Txt>
        ) : null}
        <Button
          title="Join class"
          icon="check"
          loading={busy}
          disabled={!code.trim()}
          onPress={submit}
        />
      </Card>
    </Screen>
  );
}
