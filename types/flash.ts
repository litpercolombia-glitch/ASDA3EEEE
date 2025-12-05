// ============================================
// LITPER FLASH - ONE-CLICK SHIPPING PROFILES
// ============================================

import { Country } from './country';

export interface FlashRecipient {
  name: string;
  phone: string;
  email?: string;
  document?: string; // Cédula/RUT/DNI
}

export interface FlashAddress {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: Country;
  neighborhood?: string;
  reference?: string; // Instrucciones adicionales
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface FlashProduct {
  name: string;
  description?: string;
  weight?: number; // kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue?: number;
  fragile?: boolean;
  category?: 'electronics' | 'clothing' | 'documents' | 'food' | 'fragile' | 'other';
}

export interface FlashProfile {
  id: string;
  name: string; // "Express Bogotá", "Económico Costa"
  emoji?: string;
  color?: string;
  country: Country;

  // Configuración de envío
  carrierId: string;
  serviceId: string;

  // Destinatario
  recipient: FlashRecipient;

  // Dirección destino
  address: FlashAddress;

  // Producto típico
  defaultProduct?: FlashProduct;

  // Instrucciones
  deliveryInstructions?: string;

  // Metadatos
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;

  // Etiquetas para organización
  tags?: string[];

  // Favorito
  isFavorite?: boolean;
}

export interface FlashShipment {
  id: string;
  profileId: string;
  profileName: string;

  // Datos del envío
  guideNumber?: string;
  carrierId: string;
  carrierName: string;
  serviceId: string;
  serviceName: string;

  // Destinatario
  recipient: FlashRecipient;
  address: FlashAddress;

  // Producto
  product: FlashProduct;

  // Estado
  status: 'pending' | 'label_generated' | 'pickup_scheduled' | 'in_transit' | 'delivered' | 'cancelled';

  // Costos
  shippingCost?: number;

  // Timestamps
  createdAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;

  // Notificaciones
  notificationsSent: {
    type: 'label' | 'pickup' | 'transit' | 'delivered';
    sentAt: string;
    channel: 'sms' | 'email' | 'whatsapp';
  }[];
}

export interface FlashStats {
  totalProfiles: number;
  totalShipments: number;
  totalTimeSaved: number; // en segundos
  avgTimePerShipment: number;
  mostUsedProfiles: {
    profileId: string;
    profileName: string;
    count: number;
  }[];
  shipmentsByDay: {
    date: string;
    count: number;
    timeSaved: number;
  }[];
}

// Tiempo promedio de crear guía manualmente vs Flash
export const MANUAL_SHIPMENT_TIME_SECONDS = 270; // 4.5 minutos
export const FLASH_SHIPMENT_TIME_SECONDS = 8; // 8 segundos
export const TIME_SAVED_PER_SHIPMENT = MANUAL_SHIPMENT_TIME_SECONDS - FLASH_SHIPMENT_TIME_SECONDS;
