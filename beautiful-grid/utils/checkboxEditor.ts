import { BGridCheckboxEditorConfig, BGridCheckboxEditorContext, BGridColumn, BGridDataItem } from '../types';
import { getColumnId } from './getColumnId';

export function getCheckboxTrueValue<T>(config: BGridCheckboxEditorConfig<T>) {
  return config.trueValue === undefined ? true : config.trueValue;
}

export function getCheckboxFalseValue<T>(config: BGridCheckboxEditorConfig<T>) {
  return config.falseValue === undefined ? false : config.falseValue;
}

export function isCheckboxValueChecked<T>(config: BGridCheckboxEditorConfig<T>, value: unknown) {
  return Object.is(value, getCheckboxTrueValue(config));
}

export function createCheckboxEditorContext<T>(params: {
  index: number;
  sourceIndex: number;
  columnIndex: number;
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  value: unknown;
}): BGridCheckboxEditorContext<T> {
  return {
    ...params,
    values: params.item.values,
  };
}

export function isCheckboxEditorDisabled<T>(
  config: BGridCheckboxEditorConfig<T>,
  context: BGridCheckboxEditorContext<T>,
) {
  return typeof config.disabled === 'function' ? config.disabled(context) : config.disabled === true;
}

export function getCheckboxAriaLabel<T>(
  config: BGridCheckboxEditorConfig<T>,
  context: BGridCheckboxEditorContext<T>,
) {
  if (typeof config.ariaLabel === 'function') return config.ariaLabel(context);
  return config.ariaLabel ?? `${getColumnId(context.column)} row ${context.index + 1}`;
}

export function getCheckboxLabel<T>(
  config: BGridCheckboxEditorConfig<T>,
  context: BGridCheckboxEditorContext<T>,
) {
  return typeof config.label === 'function' ? config.label(context) : config.label;
}
