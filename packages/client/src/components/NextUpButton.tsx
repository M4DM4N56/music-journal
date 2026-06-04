interface NextUpButtonProps {
  nextUp: boolean
  saving: boolean
  onToggle: () => void
}

export default function NextUpButton({ nextUp, saving, onToggle }: NextUpButtonProps) {
  const activeStyle: React.CSSProperties = {
    backgroundColor: '#d97706',
    color: 'white',
    border: '1px solid #d97706',
  }
  const inactiveStyle: React.CSSProperties = {
    backgroundColor: 'white',
    color: '#d97706',
    border: '1px solid #d97706',
  }

  return (
    <button
      onClick={onToggle}
      disabled={saving}
      style={{
        ...(nextUp ? activeStyle : inactiveStyle),
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: saving ? 'default' : 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {saving ? '...' : nextUp ? '🔖 In Next Up' : '🔖 Add to Next Up'}
    </button>
  )
}
