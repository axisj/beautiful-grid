import React from 'react';

export function getCellValueByRowKey<T>(rowKey: React.Key | React.Key[], values: T) {
  if (Array.isArray(rowKey)) {
    return rowKey.reduce((acc, cur) => {
      if (!acc) return acc;
      const key = typeof cur === 'bigint' ? cur.toString() : cur;
      if (typeof key === 'string' || typeof key === 'number' || typeof key === 'symbol') {
        if (key in acc) return acc[key];
      }
      return '';
    }, values as Record<string, any>);
  } else {
    const key = typeof rowKey === 'bigint' ? rowKey.toString() : rowKey;
    return (values as Record<PropertyKey, any>)[key as PropertyKey];
  }
}
