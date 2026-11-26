import { useEffect, useState } from 'react';

// Wait until the user stops typing before using the value (search box: 400 ms)
export default function useDebounce(value, ms = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
