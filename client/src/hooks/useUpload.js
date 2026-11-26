import { useCallback, useState } from 'react';

// Wraps an upload call that accepts an onUploadProgress callback; exposes a 0-100 progress value
export default function useUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (call) => {
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const res = await call((e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      setProgress(100);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
  }, []);

  return { upload, progress, uploading, error, reset };
}
