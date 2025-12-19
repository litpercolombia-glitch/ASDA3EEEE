// components/brain/ShipmentTimeline.tsx
// Componente visual de línea de tiempo del envío

import React from 'react';
import { TimelineStep, TimelineData } from '../../services/brain';

interface ShipmentTimelineProps {
  timeline: TimelineData;
  variant?: 'full' | 'compact' | 'mini';
  showSources?: boolean;
  onStepClick?: (step: TimelineStep) => void;
}

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({
  timeline,
  variant = 'full',
  showSources = true,
  onStepClick,
}) => {
  if (variant === 'mini') {
    return <MiniTimeline timeline={timeline} />;
  }

  if (variant === 'compact') {
    return <CompactTimeline timeline={timeline} onStepClick={onStepClick} />;
  }

  return (
    <FullTimeline
      timeline={timeline}
      showSources={showSources}
      onStepClick={onStepClick}
    />
  );
};

// Timeline completo con todos los detalles
const FullTimeline: React.FC<{
  timeline: TimelineData;
  showSources: boolean;
  onStepClick?: (step: TimelineStep) => void;
}> = ({ timeline, showSources, onStepClick }) => {
  return (
    <div className="shipment-timeline">
      {/* Resumen */}
      <div className="timeline-summary">
        <div className="summary-item">
          <span className="label">Inicio</span>
          <span className="value">{timeline.summary.startDate}</span>
        </div>
        <div className="summary-item">
          <span className="label">Estado</span>
          <span className="value">{timeline.summary.currentStatus}</span>
        </div>
        <div className="summary-item">
          <span className="label">Días</span>
          <span className="value">{timeline.summary.daysInTransit}</span>
        </div>
        <div className="summary-item">
          <span className="label">Ubicaciones</span>
          <span className="value">{timeline.summary.totalLocations}</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="timeline-progress">
        <div
          className="progress-bar"
          style={{ width: `${timeline.progress}%` }}
        />
        <span className="progress-text">{timeline.progress}%</span>
      </div>

      {/* Pasos del timeline */}
      <div className="timeline-steps">
        {timeline.steps.map((step, index) => (
          <div
            key={step.id}
            className={`timeline-step ${step.isCurrent ? 'current' : ''} ${
              step.isCompleted ? 'completed' : ''
            } ${step.hasIssue ? 'has-issue' : ''}`}
            onClick={() => onStepClick?.(step)}
          >
            {/* Línea conectora */}
            {index > 0 && (
              <div className="connector">
                {step.duration && (
                  <span className="duration">{step.duration}</span>
                )}
              </div>
            )}

            {/* Icono del paso */}
            <div
              className="step-icon"
              style={{ backgroundColor: step.statusColor }}
            >
              {step.statusIcon}
            </div>

            {/* Contenido del paso */}
            <div className="step-content">
              <div className="step-header">
                <span className="step-title">{step.title}</span>
                {showSources && (
                  <span className="step-source" title={step.source}>
                    {step.sourceIcon}
                  </span>
                )}
              </div>
              <p className="step-description">{step.description}</p>
              <div className="step-meta">
                <span className="step-date">{step.formattedDate}</span>
                <span className="step-time">{step.formattedTime}</span>
                {step.location && (
                  <span className="step-location">📍 {step.location}</span>
                )}
              </div>
              <span className="step-relative">{step.relativeTime}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .shipment-timeline {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 0 auto;
        }

        .timeline-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .summary-item {
          text-align: center;
        }

        .summary-item .label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .summary-item .value {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .timeline-progress {
          position: relative;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #22c55e);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.625rem;
          font-weight: 600;
          color: #475569;
        }

        .timeline-steps {
          position: relative;
          padding-left: 2rem;
        }

        .timeline-step {
          position: relative;
          padding: 1rem 0;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .timeline-step:hover {
          background: #f1f5f9;
          border-radius: 8px;
        }

        .timeline-step.current .step-icon {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
          animation: pulse 2s infinite;
        }

        .timeline-step.has-issue .step-icon {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
        }

        .connector {
          position: absolute;
          left: -1.5rem;
          top: -0.5rem;
          width: 2px;
          height: calc(100% - 1rem);
          background: #e2e8f0;
        }

        .connector .duration {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.625rem;
          color: #94a3b8;
          white-space: nowrap;
        }

        .timeline-step.completed .connector {
          background: #22c55e;
        }

        .step-icon {
          position: absolute;
          left: -2.5rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          z-index: 1;
        }

        .step-content {
          padding-left: 0.5rem;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .step-title {
          font-weight: 600;
          color: #1e293b;
        }

        .step-source {
          font-size: 0.875rem;
          opacity: 0.7;
        }

        .step-description {
          color: #475569;
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
        }

        .step-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .step-location {
          color: #3b82f6;
        }

        .step-relative {
          display: block;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Timeline compacto (solo hitos principales)
const CompactTimeline: React.FC<{
  timeline: TimelineData;
  onStepClick?: (step: TimelineStep) => void;
}> = ({ timeline, onStepClick }) => {
  return (
    <div className="compact-timeline">
      <div className="progress-bar-container">
        <div
          className="progress-fill"
          style={{ width: `${timeline.progress}%` }}
        />
      </div>
      <div className="steps-row">
        {timeline.steps.slice(0, 5).map((step) => (
          <div
            key={step.id}
            className={`compact-step ${step.isCurrent ? 'current' : ''} ${
              step.isCompleted ? 'completed' : ''
            }`}
            onClick={() => onStepClick?.(step)}
            title={`${step.title}: ${step.description}`}
          >
            <span className="icon" style={{ backgroundColor: step.statusColor }}>
              {step.statusIcon}
            </span>
            <span className="label">{step.title}</span>
          </div>
        ))}
      </div>

      <style>{`
        .compact-timeline {
          padding: 0.5rem;
        }

        .progress-bar-container {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          margin-bottom: 0.75rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #22c55e);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .steps-row {
          display: flex;
          justify-content: space-between;
        }

        .compact-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s ease;
        }

        .compact-step.completed,
        .compact-step.current {
          opacity: 1;
        }

        .compact-step .icon {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .compact-step .label {
          font-size: 0.625rem;
          color: #64748b;
          text-align: center;
        }

        .compact-step.current .icon {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
};

// Timeline mini (solo icono y progreso)
const MiniTimeline: React.FC<{ timeline: TimelineData }> = ({ timeline }) => {
  const currentStep = timeline.currentStep;

  return (
    <div className="mini-timeline">
      <span
        className="status-icon"
        style={{ backgroundColor: currentStep?.statusColor || '#9ca3af' }}
      >
        {currentStep?.statusIcon || '?'}
      </span>
      <div className="mini-progress">
        <div
          className="mini-fill"
          style={{ width: `${timeline.progress}%` }}
        />
      </div>
      <span className="mini-label">{currentStep?.title || 'Sin datos'}</span>

      <style>{`
        .mini-timeline {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-icon {
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
        }

        .mini-progress {
          flex: 1;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .mini-fill {
          height: 100%;
          background: #22c55e;
        }

        .mini-label {
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default ShipmentTimeline;
