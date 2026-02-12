import { useEffect, useCallback } from 'react';

export default function useKeyboardShortcuts({
  onToggleMic,
  onCancel,
  onMute,
  onNewTask,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onToggleMic?.();
          break;
        case 'Escape':
          e.preventDefault();
          onCancel?.();
          break;
        case 'KeyM':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onMute?.();
          }
          break;
        case 'KeyN':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onNewTask?.();
          }
          break;
      }
    },
    [onToggleMic, onCancel, onMute, onNewTask]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
