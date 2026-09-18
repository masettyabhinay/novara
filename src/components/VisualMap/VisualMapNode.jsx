import React from 'react';
import { STATUS_SYMBOLS, NODE_STATUS } from './visualMapUtils';

/**
 * VisualMapNode — Standardized, Accessible Node Card for NOVARA Visual Maps
 * Guarantees >=44px touch targets, keyboard navigation, theme variables, and accessible status indicators.
 */
export default function VisualMapNode({
  node,
  isSelected = false,
  onClick,
  compact = false
}) {
  if (!node) return null;

  const {
    id,
    label,
    sublabel,
    status = NODE_STATUS.UPCOMING,
    badge,
    badgeColor,
    entityType
  } = node;

  const isInteractive = typeof onClick === 'function';
  const symbol = STATUS_SYMBOLS[status] || '○';

  // Status visual mapping (colors, borders, backgrounds using theme tokens)
  const getStatusStyles = () => {
    switch (status) {
      case NODE_STATUS.COMPLETED:
        return {
          bg: 'var(--accent-sage-light, rgba(94, 140, 113, 0.12))',
          border: 'var(--accent-sage, #5E8C71)',
          text: 'var(--accent-sage, #5E8C71)',
          badgeBg: 'var(--accent-sage, #5E8C71)',
          badgeText: 'var(--text-on-accent, var(--bg-warm-cream))'
        };
      case NODE_STATUS.ACTIVE:
      case NODE_STATUS.CURRENT:
        return {
          bg: 'var(--bg-card)',
          border: 'var(--accent-terracotta, #C85A32)',
          text: 'var(--accent-terracotta, #C85A32)',
          badgeBg: 'var(--accent-terracotta, #C85A32)',
          badgeText: 'var(--text-on-accent, var(--bg-warm-cream))',
          shadow: '0 0 0 2px rgba(200, 90, 50, 0.2)'
        };
      case NODE_STATUS.DUE:
        return {
          bg: 'var(--bg-card)',
          border: 'var(--accent-amber, #D97706)',
          text: 'var(--accent-amber, #D97706)',
          badgeBg: 'var(--accent-amber, #D97706)',
          badgeText: 'var(--text-on-accent, var(--bg-warm-cream))'
        };
      case NODE_STATUS.OVERDUE:
        return {
          bg: 'var(--bg-card)',
          border: 'var(--accent-rose, #DC2626)',
          text: 'var(--accent-rose, #DC2626)',
          badgeBg: 'var(--accent-rose, #DC2626)',
          badgeText: 'var(--text-on-accent, var(--bg-warm-cream))'
        };
      case NODE_STATUS.BLOCKED:
        return {
          bg: 'var(--bg-card-subtle)',
          border: 'var(--border-beige)',
          text: 'var(--text-muted)',
          badgeBg: 'var(--border-beige)',
          badgeText: 'var(--text-muted)'
        };
      case NODE_STATUS.UNAVAILABLE:
        return {
          bg: 'var(--bg-card-subtle)',
          border: 'var(--border-beige-light)',
          text: 'var(--text-muted)',
          badgeBg: 'var(--bg-warm-cream-alt)',
          badgeText: 'var(--text-muted)'
        };
      case NODE_STATUS.UPCOMING:
      default:
        return {
          bg: 'var(--bg-card)',
          border: 'var(--border-beige)',
          text: 'var(--text-muted)',
          badgeBg: 'var(--bg-warm-cream)',
          badgeText: 'var(--text-secondary)'
        };
    }
  };

  const statusStyle = getStatusStyles();

  const handleKeyDown = (e) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(node);
    }
  };

  return (
    <div
      role={isInteractive ? 'button' : 'article'}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={`${label || 'Step'}${sublabel ? ` - ${sublabel}` : ''} (${status})`}
      onClick={() => isInteractive && onClick(node)}
      onKeyDown={handleKeyDown}
      className={`visual-map-node ${status === NODE_STATUS.CURRENT ? 'active-pulse' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '44px',
        minWidth: compact ? '110px' : '140px',
        maxWidth: compact ? '180px' : '220px',
        padding: compact ? '8px 10px' : '10px 14px',
        borderRadius: '10px',
        backgroundColor: statusStyle.bg,
        border: `1.5px solid ${isSelected ? 'var(--accent-terracotta, #C85A32)' : statusStyle.border}`,
        boxShadow: isSelected ? '0 0 0 2px var(--accent-terracotta)' : statusStyle.shadow || 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        cursor: isInteractive ? 'pointer' : 'default',
        transition: 'all 180ms ease',
        userSelect: 'none',
        outline: 'none',
        position: 'relative'
      }}
    >
      {/* Node Top Row: Status Symbol & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: statusStyle.bg,
            border: `1.5px solid ${statusStyle.border}`,
            color: statusStyle.text,
            fontSize: '11px',
            fontWeight: 900,
            lineHeight: 1,
            flexShrink: 0
          }}
          aria-hidden="true"
        >
          {symbol}
        </span>

        {badge && (
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '1px 6px',
              borderRadius: '9999px',
              backgroundColor: badgeColor || statusStyle.badgeBg,
              color: statusStyle.badgeText,
              maxWidth: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Node Label */}
      <div
        style={{
          fontSize: compact ? '12px' : '13px',
          fontWeight: 800,
          color: 'var(--text-charcoal)',
          lineHeight: '1.25',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}
      >
        {label}
      </div>

      {/* Node Sublabel */}
      {sublabel && (
        <div
          style={{
            fontSize: compact ? '10px' : '11px',
            color: 'var(--text-secondary)',
            marginTop: '2px',
            lineHeight: '1.2',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
