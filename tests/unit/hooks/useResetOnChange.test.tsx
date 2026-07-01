import { renderHook } from '@testing-library/react-native';
import { useResetOnChange } from '@hooks/useResetOnChange';

describe('useResetOnChange', () => {
  test('does not fire onChange on initial render', () => {
    const onChange = jest.fn();
    renderHook(({ deps }: { deps: readonly unknown[] }) => useResetOnChange(deps, onChange), {
      initialProps: { deps: [1] as readonly unknown[] },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  test('fires onChange when a dependency changes', () => {
    const onChange = jest.fn();
    const { rerender } = renderHook(
      ({ deps }: { deps: readonly unknown[] }) => useResetOnChange(deps, onChange),
      {
        initialProps: { deps: [1] as readonly unknown[] },
      }
    );
    rerender({ deps: [2] });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('does not fire onChange when dependencies are unchanged', () => {
    const onChange = jest.fn();
    const { rerender } = renderHook(
      ({ deps }: { deps: readonly unknown[] }) => useResetOnChange(deps, onChange),
      {
        initialProps: { deps: [1, 'a'] as readonly unknown[] },
      }
    );
    rerender({ deps: [1, 'a'] });
    expect(onChange).not.toHaveBeenCalled();
  });

  test('fires onChange when any of multiple dependencies changes', () => {
    const onChange = jest.fn();
    const { rerender } = renderHook(
      ({ deps }: { deps: readonly unknown[] }) => useResetOnChange(deps, onChange),
      {
        initialProps: { deps: [1, 'a'] as readonly unknown[] },
      }
    );
    rerender({ deps: [1, 'b'] });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('fires onChange once per distinct change', () => {
    const onChange = jest.fn();
    const { rerender } = renderHook(
      ({ deps }: { deps: readonly unknown[] }) => useResetOnChange(deps, onChange),
      {
        initialProps: { deps: [1] as readonly unknown[] },
      }
    );
    rerender({ deps: [2] });
    rerender({ deps: [2] });
    rerender({ deps: [3] });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('fires onChange when the dependency list length changes', () => {
    const onChange = jest.fn();
    const { rerender } = renderHook(
      ({ deps }: { deps: readonly unknown[] }) => useResetOnChange(deps, onChange),
      {
        initialProps: { deps: [1] as readonly unknown[] },
      }
    );
    rerender({ deps: [1, 2] });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
