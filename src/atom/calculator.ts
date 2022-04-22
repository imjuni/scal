import { atomWithReset } from 'jotai/utils';
import { atom } from 'jotai';
import { isNotEmpty } from 'my-easy-fp';
import * as mathjs from 'mathjs';

interface ICalculatorPropsAtom {
  formular: string[];
  operator?: string;
}

const defaultValue: ICalculatorPropsAtom = {
  formular: [],
};

export const mainAtom = atomWithReset(defaultValue);

function splitFomular(formular: string[]): { head: string[]; tail: string } {
  if (formular.length <= 0) {
    return { head: [], tail: '' };
  }

  if (formular.length <= 1) {
    return { head: [], tail: formular[0] };
  }

  const tail = formular[formular.length - 1];
  const head = formular.slice(0, formular.length - 1);

  return { head, tail };
}

function isOperator(formular: string) {
  if (formular === '+') {
    return true;
  }

  if (formular === '-') {
    return true;
  }

  if (formular === '*') {
    return true;
  }

  if (formular === '/') {
    return true;
  }

  return false;
}

const onReadableFormular = atom((get) => {
  const state = get(mainAtom);

  if (isNotEmpty(state.operator)) {
    return [...state.formular, state.operator].join(' ');
  }

  return state.formular.join(' ');
});

const onReadableEvaluation = atom((get) => {
  try {
    const state = get(mainAtom);

    if (state.formular.length > 2) {
      const result = mathjs.evaluate(state.formular.join(' '));
      return `${result}`;
    }

    if (state.formular.length === 1) {
      return `${state.formular[0]}`;
    }

    return '';
  } catch {
    return '';
  }
});

const onWritableClearFormular = atom<null, undefined>(null, (get, set) => {
  const state = { ...get(mainAtom) };
  state.formular = [];
  state.operator = undefined;

  set(mainAtom, state);
});

const onWritableAppendFormular = atom<null, string>(null, (get, set, formular) => {
  const state = get(mainAtom);

  if (state.formular.length <= 0 && isOperator(formular)) {
    return set(mainAtom, state);
  }

  if (isOperator(formular)) {
    state.operator = formular;
    return set(mainAtom, { ...state });
  }

  if (isNotEmpty(state.operator)) {
    state.formular = state.formular.concat([state.operator, formular]);
    state.operator = undefined;

    return set(mainAtom, { ...state });
  }

  const { head, tail } = splitFomular(state.formular);
  const newFormular = head.concat([`${tail}${formular}`]);

  state.formular = newFormular;
  state.operator = undefined;

  return set(mainAtom, { ...state });
});

const onWritableRemoveFormular = atom<null, undefined>(null, (get, set) => {
  const state = get(mainAtom);

  if (state.formular.length <= 0) {
    return set(mainAtom, state);
  }

  if (isNotEmpty(state.operator)) {
    state.operator = undefined;
    return set(mainAtom, { ...state });
  }

  if (state.formular[0].length <= 1) {
    state.formular = [];
    state.operator = undefined;

    return set(mainAtom, { ...state });
  }

  const { head, tail } = splitFomular(state.formular);

  if (head.length >= 2 && tail.length <= 1) {
    const { head: headOfHead, tail: headOfTail } = splitFomular(head);

    if (isOperator(headOfTail)) {
      state.formular = headOfHead;
      return set(mainAtom, { ...state });
    }

    state.formular = head;
    return set(mainAtom, { ...state });
  }

  const newTail = tail.substring(0, tail.length - 1);
  state.formular = [...head, newTail];

  return set(mainAtom, { ...state });
});

export const wirtable = {
  onWritableAppendFormular,
  onWritableRemoveFormular,
  onWritableClearFormular,
};
export const readable = { onReadableFormular, onReadableEvaluation };
