interface ListenedButtonProps {
  listened: boolean
  saving: boolean
  onToggle: () => void
}

export default function ListenedButton({ listened, saving, onToggle }: ListenedButtonProps) {
  const activeStyle: React.CSSProperties = {
    backgroundColor: '#16a34a',
    color: 'white',
    border: '1px solid #16a34a',
  }
  const inactiveStyle: React.CSSProperties = {
    backgroundColor: 'white',
    color: '#16a34a',
    border: '1px solid #16a34a',
  }

  return (
    <button
      onClick={onToggle}
      disabled={saving}
      style={{
        ...(listened ? activeStyle : inactiveStyle),
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: saving ? 'default' : 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {saving ? '...' : listened ? '✓ Listened' : 'Mark as listened'}
    </button>
  )
}
