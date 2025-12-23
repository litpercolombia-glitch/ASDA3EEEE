// tests/components/QuickDashboard.test.tsx
// Tests para el componente QuickDashboard

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickDashboard } from '../../components/Dashboard/QuickDashboard';
import { Shipment } from '../../types';

// Mock de shipments para tests
const createMockShipments = (overrides: Partial<Shipment>[] = []): Shipment[] => {
  const baseShipments: Shipment[] = [
    {
      id: '1',
      trackingNumber: 'TRACK001',
      status: 'delivered',
      carrier: 'Coordinadora',
      detailedInfo: { destination: 'Bogota', daysInTransit: 2 },
    },
    {
      id: '2',
      trackingNumber: 'TRACK002',
      status: 'in_transit',
      carrier: 'TCC',
      detailedInfo: { destination: 'Medellin', daysInTransit: 3 },
    },
    {
      id: '3',
      trackingNumber: 'TRACK003',
      status: 'issue',
      carrier: 'Servientrega',
      detailedInfo: { destination: 'Cali', daysInTransit: 5 },
    },
    {
      id: '4',
      trackingNumber: 'TRACK004',
      status: 'in_office',
      carrier: 'Coordinadora',
      detailedInfo: { destination: 'Bogota', daysInTransit: 4 },
    },
    {
      id: '5',
      trackingNumber: 'TRACK005',
      status: 'delivered',
      carrier: 'Envia',
      phone: '3001234567',
      detailedInfo: { destination: 'Barranquilla', daysInTransit: 1 },
    },
  ];

  return baseShipments.map((shipment, index) => ({
    ...shipment,
    ...(overrides[index] || {}),
  })) as Shipment[];
};

describe('QuickDashboard', () => {
  describe('Renderizado básico', () => {
    it('renderiza correctamente con shipments', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} userName="Test User" />);

      // Verifica que el nombre de usuario aparezca
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });

    it('muestra saludo según hora del día', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      // Debe mostrar algún tipo de saludo
      const greeting = screen.getByText(/Buenos|Buenas/);
      expect(greeting).toBeInTheDocument();
    });

    it('muestra la fecha actual', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      // Debe mostrar alguna fecha
      const dateElement = screen.getByText(/\d{4}/);
      expect(dateElement).toBeInTheDocument();
    });
  });

  describe('Métricas', () => {
    it('calcula correctamente el total de guías', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('calcula correctamente las guías entregadas', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      // 2 de 5 están entregadas
      const deliveredElements = screen.getAllByText('2');
      expect(deliveredElements.length).toBeGreaterThan(0);
    });

    it('muestra tasa de entrega correcta', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      // 2/5 = 40%
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('identifica guías con teléfono', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      // Solo 1 tiene teléfono
      expect(screen.getByText('Con Teléfono')).toBeInTheDocument();
    });
  });

  describe('Alertas', () => {
    it('muestra alerta cuando hay guías críticas', () => {
      const shipments = createMockShipments([
        { status: 'in_transit', detailedInfo: { daysInTransit: 10 } },
      ]);
      render(<QuickDashboard shipments={shipments as Shipment[]} />);

      expect(screen.getByText(/críticas/i)).toBeInTheDocument();
    });

    it('muestra alerta cuando hay guías en oficina', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      expect(screen.getByText(/oficina/i)).toBeInTheDocument();
    });

    it('muestra alerta cuando hay guías con novedad', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      expect(screen.getByText(/novedad/i)).toBeInTheDocument();
    });
  });

  describe('Navegación', () => {
    it('llama a onNavigateToTab cuando se hace clic en una tarjeta', () => {
      const shipments = createMockShipments();
      const onNavigate = vi.fn();

      render(
        <QuickDashboard
          shipments={shipments}
          onNavigateToTab={onNavigate}
        />
      );

      // Click en el botón de "Centro de Operaciones"
      const operacionesButton = screen.getByText('Centro de Operaciones');
      fireEvent.click(operacionesButton);

      expect(onNavigate).toHaveBeenCalledWith('operaciones');
    });
  });

  describe('Top transportadoras y ciudades', () => {
    it('muestra las transportadoras principales', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      expect(screen.getByText('Coordinadora')).toBeInTheDocument();
      expect(screen.getByText('TCC')).toBeInTheDocument();
    });

    it('muestra las ciudades principales', () => {
      const shipments = createMockShipments();
      render(<QuickDashboard shipments={shipments} />);

      expect(screen.getByText('Bogota')).toBeInTheDocument();
    });
  });

  describe('Estados vacíos', () => {
    it('maneja correctamente array vacío de shipments', () => {
      render(<QuickDashboard shipments={[]} userName="Test" />);

      // Debe mostrar 0 en las métricas
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
