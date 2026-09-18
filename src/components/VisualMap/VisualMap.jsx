import React, { useRef } from 'react';
import VisualMapNode from './VisualMapNode';
import VisualMapEdge from './VisualMapEdge';
import VisualMapLegend from './VisualMapLegend';
import { Compass } from 'lucide-react';

/**
 * VisualMap — Reusable, context-aware visual map container for NOVARA.
 * Connects entities across Roadmap, Today, Focus, Revision, Coach, Interview, Applications, Calendar, and Profile.
 * Ensures zero page-level horizontal overflow, >=44px touch targets, full keyboard accessibility, and theme styling.
 */
export default function VisualMap({
  nodes = [],
  edges = [],
  title,
  subtitle,
  direction = 'horizontal', // 'horizontal' | 'vertical'
  orientation = 'horizontal', // 'horizontal' | 'vertical' | 'tree'
  compact = false,
  interactive = true,
  onNodeClick,
  selectedNodeId = null,
  showLegend = false,
  emptyMessage = 'No journey data to map currently.',
  ariaLabel = 'Visual learning journey map',
  accessibleSummary = null
}) {
  const scrollRef = useRef(null);
  const isVertical = direction === 'vertical' || orientation === 'vertical';

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return (
      <div
        className="visual-map-empty"
        style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-beige)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}
      >
        <Compass size={20} style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
        <p style={{ margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  // Generate an accessible summary from nodes if not explicitly provided
  const summaryText = accessibleSummary || `${title || 'Journey map'} with ${nodes.length} connected steps: ${nodes.map(n => `${n.label} (${n.status})`).join(', ')}.`;

  return (
    <figure
      className={`visual-map-container ${compact ? 'visual-map-compact' : ''}`}
      role="region"
      aria-label={ariaLabel}
      style={{
        margin: compact ? '8px 0' : '14px 0',
        padding: compact ? '12px 14px' : '16px 18px',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-beige)',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* MAP HEADER */}
      {(title || subtitle || showLegend) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: compact ? '10px' : '14px',
            paddingBottom: compact ? '8px' : '10px',
            borderBottom: '1px solid var(--border-beige)'
          }}
        >
          <div>
            {title && (
              <figcaption
                style={{
                  fontSize: compact ? '13px' : '14.5px',
                  fontWeight: 800,
                  color: 'var(--text-charcoal)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Compass size={15} color="var(--accent-terracotta)" />
                <span>{title}</span>
              </figcaption>
            )}
            {subtitle && (
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>

          {showLegend && <VisualMapLegend compact={compact} />}
        </div>
      )}

      {/* ACCESSIBLE SCREEN-READER SUMMARY */}
      <div className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        {summaryText}
      </div>

      {/* SCROLLABLE MAP CANVAS (INTERNAL HORIZONTAL SCROLLING ONLY, NEVER OVERFLOWING PAGE) */}
      <div
        ref={scrollRef}
        className="visual-map-scroll-canvas custom-scrollbar"
        tabIndex={0}
        aria-label="Scrollable visual map track. Use left and right arrow keys or mouse drag to pan."
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '6px 2px',
          outline: 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: (isVertical || direction === 'vertical') ? 'column' : 'row',
            alignItems: (isVertical || direction === 'vertical') ? 'stretch' : 'center',
            gap: '2px',
            minWidth: 'min-content'
          }}
        >
          {nodes.map((node, idx) => {
            const isLast = idx === nodes.length - 1;
            const matchingEdge = edges.find(e => e.from === node.id);

            return (
              <React.Fragment key={node.id || idx}>
                <VisualMapNode
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={interactive ? onNodeClick : null}
                  compact={compact}
                />

                {!isLast && (
                  <VisualMapEdge
                    orientation={orientation === 'vertical' ? 'vertical' : 'horizontal'}
                    label={matchingEdge?.label}
                    isHighlighted={node.status === 'completed' || node.status === 'current'}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
