import { useEffect, useState } from 'react';

export const useDebounce = <T>(value: T, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
};
