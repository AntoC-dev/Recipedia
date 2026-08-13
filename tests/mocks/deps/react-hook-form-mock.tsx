import React, { ReactNode, useState } from 'react';

/**
 * Freezes the form context value, reproducing what React Compiler does to
 * `<FormProvider {...form}>` in a build: `useForm` returns a stable object it
 * mutates each render, so the compiler caches the spread and consumers stop
 * re-rendering on `formState` transitions. Jest runs without the compiler, so
 * a `form.formState.x` read looks correct there while being stale on a device.
 * Consumers subscribing through `control` are unaffected.
 */
export function reactHookFormFrozenProviderMock() {
  const actual = jest.requireActual('react-hook-form');

  function FrozenFormProvider({ children, ...form }: { children: ReactNode }) {
    const [frozenForm] = useState(form);
    return <actual.FormProvider {...frozenForm}>{children}</actual.FormProvider>;
  }

  return { ...actual, FormProvider: FrozenFormProvider };
}
