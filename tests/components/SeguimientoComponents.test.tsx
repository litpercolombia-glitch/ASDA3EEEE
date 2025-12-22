/**
 * Tests para components/tabs/SeguimientoComponents.tsx
 *
 * Verifica que los componentes extraídos de SeguimientoTab
 * funcionan correctamente.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  getStatusColor,
  getStatusIcon,
  getSeasonInfo,
  isNearHoliday,
  detectarAnomalias,
  StatusBadge,
  AnalysisPanel,
  DynamicStatusButtons,
  SummaryCards,
  GuiaTableRow,
  type GuiaProcesada,
} from '../../components/tabs/SeguimientoComponents';
import { ShipmentStatus } from '../../types';

// Helper para crear guías de prueba
const createMockGuia = (overrides: Partial<GuiaProcesada> = {}): GuiaProcesada => ({
  guia: {
    id: '12345678901',
    status: ShipmentStatus.IN_TRANSIT,
    carrier: 'Coordinadora',
  } as any,
  celular: '3001234567',
  transportadora: 'Coordinadora',
  origen: 'Bogotá',
  destino: 'Medellín',
  ultimoEvento: {
    fecha: new Date().toISOString(),
    descripcion: 'En tránsito hacia destino',
  },
  ultimos2Estados: [],
  estadoGeneral: 'En Tránsito',
  estadoReal: 'En Tránsito',
  dias: 2,
  tieneTracking: true,
  tieneNovedad: false,
  ...overrides,
});

// ============================================
// getStatusColor tests
// ============================================
describe('getStatusColor', () => {
  it('should return green for delivered status', () => {
    const result = getStatusColor('Entregado');
    expect(result.bg).toContain('green');
    expect(result.text).toContain('green');
  });

  it('should return green for DELIVERED enum', () => {
    const result = getStatusColor(ShipmentStatus.DELIVERED);
    expect(result.bg).toContain('green');
  });

  it('should return blue for in transit status', () => {
    const result = getStatusColor('En Tránsito');
    expect(result.bg).toContain('blue');
  });

  it('should return blue for "En Reparto"', () => {
    const result = getStatusColor('En Reparto');
    expect(result.bg).toContain('blue');
  });

  it('should return purple for office status', () => {
    const result = getStatusColor('En Oficina');
    expect(result.bg).toContain('purple');
  });

  it('should return red for issue status', () => {
    const result = getStatusColor('Con Novedad');
    expect(result.bg).toContain('red');
  });

  it('should return red for rejected status', () => {
    const result = getStatusColor('Rechazado');
    expect(result.bg).toContain('red');
  });

  it('should return yellow for pending status', () => {
    const result = getStatusColor('Pendiente');
    expect(result.bg).toContain('yellow');
  });

  it('should return gray for unknown status', () => {
    const result = getStatusColor('Desconocido');
    expect(result.bg).toContain('gray');
  });
});

// ============================================
// getStatusIcon tests
// ============================================
describe('getStatusIcon', () => {
  it('should return green circle for delivered', () => {
    expect(getStatusIcon('Entregado')).toBe('🟢');
  });

  it('should return blue circle for transit', () => {
    expect(getStatusIcon('En Tránsito')).toBe('🔵');
  });

  it('should return purple circle for office', () => {
    expect(getStatusIcon('En Oficina')).toBe('🟣');
  });

  it('should return red circle for issue', () => {
    expect(getStatusIcon('Con Novedad')).toBe('🔴');
  });

  it('should return yellow circle for pending', () => {
    expect(getStatusIcon('Pendiente')).toBe('🟡');
  });

  it('should return white circle for unknown', () => {
    expect(getStatusIcon('Desconocido')).toBe('⚪');
  });
});

// ============================================
// getSeasonInfo tests
// ============================================
describe('getSeasonInfo', () => {
  it('should return season info object', () => {
    const result = getSeasonInfo();

    expect(result).toHaveProperty('season');
    expect(result).toHaveProperty('impact');
    expect(result).toHaveProperty('icon');
    expect(result).toHaveProperty('color');
    expect(typeof result.impact).toBe('number');
  });
});

// ============================================
// isNearHoliday tests
// ============================================
describe('isNearHoliday', () => {
  it('should return boolean', () => {
    const result = isNearHoliday();
    expect(typeof result).toBe('boolean');
  });
});

// ============================================
// detectarAnomalias tests
// ============================================
describe('detectarAnomalias', () => {
  it('should detect no movement anomaly', () => {
    const guias = [
      createMockGuia({
        dias: 5,
        tieneTracking: true,
        estadoGeneral: 'En Tránsito',
      }),
    ];

    const anomalias = detectarAnomalias(guias);

    expect(anomalias.length).toBeGreaterThan(0);
    expect(anomalias[0].tipo).toBe('SIN_MOVIMIENTO');
  });

  it('should detect office too long anomaly', () => {
    const guias = [
      createMockGuia({
        dias: 4,
        estadoGeneral: 'En Oficina',
      }),
    ];

    const anomalias = detectarAnomalias(guias);

    expect(anomalias.some(a => a.tipo === 'OFICINA_MUCHO')).toBe(true);
  });

  it('should detect open issue anomaly', () => {
    const guias = [
      createMockGuia({
        dias: 3,
        tieneNovedad: true,
        estadoGeneral: 'Con Novedad',
      }),
    ];

    const anomalias = detectarAnomalias(guias);

    expect(anomalias.some(a => a.tipo === 'NOVEDAD_ABIERTA')).toBe(true);
  });

  it('should not detect anomalies for delivered packages', () => {
    const guias = [
      createMockGuia({
        dias: 10,
        estadoGeneral: 'Entregado',
      }),
    ];

    const anomalias = detectarAnomalias(guias);

    expect(anomalias.length).toBe(0);
  });

  it('should sort anomalies by severity', () => {
    const guias = [
      createMockGuia({ dias: 2, tieneNovedad: true, estadoGeneral: 'Con Novedad' }), // MEDIO
      createMockGuia({ dias: 6, tieneTracking: true, estadoGeneral: 'En Tránsito' }), // CRITICO
    ];

    const anomalias = detectarAnomalias(guias);

    if (anomalias.length >= 2) {
      expect(anomalias[0].severidad).toBe('CRITICO');
    }
  });
});

// ============================================
// StatusBadge tests
// ============================================
describe('StatusBadge', () => {
  it('should render status text', () => {
    render(<StatusBadge status="Entregado" />);

    expect(screen.getByText('Entregado')).toBeInTheDocument();
  });

  it('should render status icon', () => {
    render(<StatusBadge status="Entregado" />);

    expect(screen.getByText('🟢')).toBeInTheDocument();
  });

  it('should apply correct color classes for delivered', () => {
    const { container } = render(<StatusBadge status="Entregado" />);

    const badge = container.querySelector('span');
    expect(badge?.className).toContain('green');
  });

  it('should apply correct color classes for issue', () => {
    const { container } = render(<StatusBadge status="Con Novedad" />);

    const badge = container.querySelector('span');
    expect(badge?.className).toContain('red');
  });
});

// ============================================
// AnalysisPanel tests
// ============================================
describe('AnalysisPanel', () => {
  it('should render nothing when no guias', () => {
    const { container } = render(<AnalysisPanel guiasProcesadas={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render score when guias provided', () => {
    const guias = [
      createMockGuia({ estadoGeneral: 'Entregado' }),
      createMockGuia({ estadoGeneral: 'En Tránsito' }),
    ];

    render(<AnalysisPanel guiasProcesadas={guias} />);

    // Should show score out of 100
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('should show delivery rate', () => {
    const guias = [
      createMockGuia({ estadoGeneral: 'Entregado' }),
      createMockGuia({ estadoGeneral: 'Entregado' }),
    ];

    render(<AnalysisPanel guiasProcesadas={guias} />);

    expect(screen.getByText('entrega')).toBeInTheDocument();
  });
});

// ============================================
// DynamicStatusButtons tests
// ============================================
describe('DynamicStatusButtons', () => {
  it('should render "Todas" button', () => {
    const guias = [createMockGuia()];
    const onFilter = vi.fn();

    render(
      <DynamicStatusButtons
        guiasProcesadas={guias}
        onFilterByStatus={onFilter}
        activeFilter={null}
      />
    );

    expect(screen.getByText('Todas')).toBeInTheDocument();
  });

  it('should call onFilterByStatus when clicking a status button', () => {
    const guias = [createMockGuia({ estadoGeneral: 'En Tránsito' })];
    const onFilter = vi.fn();

    render(
      <DynamicStatusButtons
        guiasProcesadas={guias}
        onFilterByStatus={onFilter}
        activeFilter={null}
      />
    );

    fireEvent.click(screen.getByText('En Tránsito'));

    expect(onFilter).toHaveBeenCalledWith('En Tránsito');
  });

  it('should call onFilterByStatus with null when clicking "Todas"', () => {
    const guias = [createMockGuia()];
    const onFilter = vi.fn();

    render(
      <DynamicStatusButtons
        guiasProcesadas={guias}
        onFilterByStatus={onFilter}
        activeFilter="En Tránsito"
      />
    );

    fireEvent.click(screen.getByText('Todas'));

    expect(onFilter).toHaveBeenCalledWith(null);
  });

  it('should show count for each status', () => {
    const guias = [
      createMockGuia({ estadoGeneral: 'En Tránsito' }),
      createMockGuia({ estadoGeneral: 'En Tránsito' }),
    ];
    const onFilter = vi.fn();

    render(
      <DynamicStatusButtons
        guiasProcesadas={guias}
        onFilterByStatus={onFilter}
        activeFilter={null}
      />
    );

    // Should show count of 2
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });
});

// ============================================
// SummaryCards tests
// ============================================
describe('SummaryCards', () => {
  it('should render total count', () => {
    const guias = [createMockGuia(), createMockGuia()];
    const onFilter = vi.fn();

    render(
      <SummaryCards
        guiasProcesadas={guias}
        onFilterByStatus={onFilter}
        activeFilter={null}
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render all status categories', () => {
    const guias = [createMockGuia()];
    const onFilter = vi.fn();

    render(
      <SummaryCards
        guiasProcesadas={guias}
        onFilterByStatus={onFilter}
        activeFilter={null}
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Entregados')).toBeInTheDocument();
    expect(screen.getByText('En Tránsito')).toBeInTheDocument();
    expect(screen.getByText('En Oficina')).toBeInTheDocument();
    expect(screen.getByText('Con Novedad')).toBeInTheDocument();
  });

  it('should call onFilterByStatus when clicking a card', () => {
    const guias = [createMockGuia()];
    const onFilter = vi.fn();

    render(
      <SummaryCards
        guiasProcesadas={guias}
        onFilterByStatus={onFilter}
        activeFilter={null}
      />
    );

    fireEvent.click(screen.getByText('Entregados').closest('button')!);

    expect(onFilter).toHaveBeenCalledWith('Entregado');
  });
});

// ============================================
// GuiaTableRow tests
// ============================================
describe('GuiaTableRow', () => {
  const renderRow = (guia: GuiaProcesada, props: Partial<Parameters<typeof GuiaTableRow>[0]> = {}) => {
    return render(
      <table>
        <tbody>
          <GuiaTableRow
            guia={guia}
            onExpand={vi.fn()}
            isExpanded={false}
            {...props}
          />
        </tbody>
      </table>
    );
  };

  it('should render guia ID', () => {
    const guia = createMockGuia();
    renderRow(guia);

    expect(screen.getByText('12345678901')).toBeInTheDocument();
  });

  it('should render phone number when available', () => {
    const guia = createMockGuia({ celular: '3001234567' });
    renderRow(guia);

    expect(screen.getByText('3001234567')).toBeInTheDocument();
  });

  it('should render transportadora', () => {
    const guia = createMockGuia({ transportadora: 'Coordinadora' });
    renderRow(guia);

    expect(screen.getByText('Coordinadora')).toBeInTheDocument();
  });

  it('should render destino', () => {
    const guia = createMockGuia({ destino: 'Medellín' });
    renderRow(guia);

    expect(screen.getByText('Medellín')).toBeInTheDocument();
  });

  it('should render days in transit', () => {
    const guia = createMockGuia({ dias: 3 });
    renderRow(guia);

    expect(screen.getByText('3d')).toBeInTheDocument();
  });

  it('should show "Novedad" badge when tieneNovedad is true', () => {
    const guia = createMockGuia({ tieneNovedad: true });
    renderRow(guia);

    expect(screen.getByText('Novedad')).toBeInTheDocument();
  });

  it('should call onExpand when row is clicked', () => {
    const guia = createMockGuia();
    const onExpand = vi.fn();

    renderRow(guia, { onExpand });

    fireEvent.click(screen.getByText('12345678901').closest('tr')!);

    expect(onExpand).toHaveBeenCalled();
  });

  it('should show row number when provided', () => {
    const guia = createMockGuia();
    renderRow(guia, { rowNumber: 5 });

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
