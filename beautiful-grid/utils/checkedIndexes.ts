export function countVisibleCheckedIndexes(
  dataLength: number,
  checkedIndexesMap: ReadonlyMap<number, unknown>,
  sourceIndexByVisibleIndex?: readonly number[],
): number {
  if (dataLength <= 0 || checkedIndexesMap.size === 0) return 0;

  if (sourceIndexByVisibleIndex) {
    let count = 0;
    for (let visibleIndex = 0; visibleIndex < dataLength; visibleIndex++) {
      const sourceIndex = sourceIndexByVisibleIndex[visibleIndex] ?? visibleIndex;
      if (checkedIndexesMap.has(sourceIndex)) count++;
    }
    return count;
  }

  let count = 0;
  for (const sourceIndex of checkedIndexesMap.keys()) {
    if (Number.isInteger(sourceIndex) && sourceIndex >= 0 && sourceIndex < dataLength) count++;
  }
  return count;
}
