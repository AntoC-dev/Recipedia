import type { UseFormReturn } from 'react-hook-form';
import { makeFormSetter } from '@utils/recipeFormSetters';

type Shape = {
  title: string;
  items: number[];
};

function createFormMock(initial: Shape) {
  let state: Shape = { ...initial, items: [...initial.items] };
  const getValues = jest.fn((name?: keyof Shape) => (name === undefined ? state : state[name]));
  const setValue = jest.fn((name: keyof Shape, value: unknown) => {
    state = { ...state, [name]: value } as Shape;
  });
  return {
    form: { getValues, setValue } as unknown as UseFormReturn<Shape, unknown, Shape>,
    read: () => state,
    getValues,
    setValue,
  };
}

describe('makeFormSetter', () => {
  test('writes a direct value via form.setValue', () => {
    const { form, read, setValue } = createFormMock({ title: '', items: [] });
    const setTitle = makeFormSetter<Shape, 'title'>(form, 'title');

    setTitle('Pancakes');

    expect(setValue).toHaveBeenCalledWith('title', 'Pancakes', undefined);
    expect(read().title).toBe('Pancakes');
  });

  test('forwards options to form.setValue when provided', () => {
    const { form, setValue } = createFormMock({ title: '', items: [] });
    const setTitle = makeFormSetter<Shape, 'title'>(form, 'title', {
      shouldValidate: true,
      shouldDirty: false,
    });

    setTitle('Pancakes');

    expect(setValue).toHaveBeenCalledWith('title', 'Pancakes', {
      shouldValidate: true,
      shouldDirty: false,
    });
  });

  test('passes the current value to a functional updater', () => {
    const { form, getValues } = createFormMock({ title: 'old', items: [] });
    const setTitle = makeFormSetter<Shape, 'title'>(form, 'title');
    const updater = jest.fn((prev: string) => prev + '!');

    setTitle(updater);

    expect(getValues).toHaveBeenCalledWith('title');
    expect(updater).toHaveBeenCalledWith('old');
  });

  test('writes the functional updater result back to the form', () => {
    const { form, read } = createFormMock({ title: '', items: [1, 2] });
    const setItems = makeFormSetter<Shape, 'items'>(form, 'items');

    setItems(prev => [...prev, 3]);

    expect(read().items).toEqual([1, 2, 3]);
  });

  test('reads the latest value on each invocation', () => {
    const { form, read } = createFormMock({ title: '', items: [] });
    const setItems = makeFormSetter<Shape, 'items'>(form, 'items');

    setItems([10]);
    setItems(prev => [...prev, 20]);
    setItems(prev => [...prev, 30]);

    expect(read().items).toEqual([10, 20, 30]);
  });

  test('invokes setValue exactly once per call', () => {
    const { form, setValue } = createFormMock({ title: '', items: [] });
    const setTitle = makeFormSetter<Shape, 'title'>(form, 'title');

    setTitle('direct');
    setTitle(prev => prev + 'X');

    expect(setValue).toHaveBeenCalledTimes(2);
  });
});
