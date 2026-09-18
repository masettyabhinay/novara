import React from 'react';

/**
 * VisualMapEdge — Directional relationship connector between VisualMap nodes.
 * Supports horizontal and vertical orientations with directional arrows and optional relationship labels.
 */
export default function VisualMapEdge({
  label,
  orientation = 'horizontal', // 'horizontal' | 'vertical'
  isHighlighted = false
}) {
  const strokeColor = isHighlighted ? 'var(--accent-terracotta, #C85A32)' : 'var(--border-beige, #E0D8CE)';

  if (orientation === 'vertical') {
    return (
      <div
        className="visual-map-edge-vertical"
        aria-hidden="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 0',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            width: '2px',
            height: '14px',
            backgroundColor: strokeColor
          }}
        />
        {label && (
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              padding: '1px 4px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-card)',
              margin: '2px 0'
            }}
          >
            {label}
          </span>
        )}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `5px solid ${strokeColor}`
          }}
        />
      </div>
    );
  }

  // Horizontal edge (default)
  return (
    <div
      className="visual-map-edge-horizontal"
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6px',
        userSelect: 'none',
        flexShrink: 0
      }}
    >
      <div
        style={{
          height: '2px',
          width: '16px',
          backgroundColor: strokeColor
        }}
      />
      {label && (
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-card-subtle)',
            margin: '0 2px',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: `5px solid ${strokeColor}`
        }}
      />
    </div>
  );
}
