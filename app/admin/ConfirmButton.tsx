'use client';

// Submit button for an irreversible server action: asks the browser to confirm first.
export function ConfirmButton({ action, message, children }: { action: () => Promise<void>; message: string; children: React.ReactNode }) {
  return (
    <button formAction={action} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
