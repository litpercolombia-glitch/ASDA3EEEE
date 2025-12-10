// ============================================
// SISTEMA DE PAÍSES Y TRANSPORTADORAS
// ============================================

export type Country = 'COLOMBIA' | 'ECUADOR' | 'CHILE';

export interface Carrier {
  id: string;
  name: string;
  logo?: string;
  trackingUrlPattern: string;
  guidePattern: RegExp;
  avgDeliveryDays: number;
  coverage: string[];
  services: CarrierService[];
}

export interface CarrierService {
  id: string;
  name: string;
  type: 'express' | 'standard' | 'economic';
  avgDays: number;
  price: 'high' | 'medium' | 'low';
}

export interface CountryConfig {
  code: Country;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  phonePattern: RegExp;
  carriers: Carrier[];
}

// ============================================
// CONFIGURACIÓN POR PAÍS
// ============================================

export const COUNTRY_CONFIGS: Record<Country, CountryConfig> = {
  COLOMBIA: {
    code: 'COLOMBIA',
    name: 'Colombia',
    flag: '',
    currency: 'COP',
    currencySymbol: '$',
    phonePrefix: '+57',
    phonePattern: /^(\+57)?3\d{9}$/,
    carriers: [
      {
        id: 'interrapidisimo',
        name: 'Inter Rapidísimo',
        trackingUrlPattern: 'https://www.interrapidisimo.com/rastreo/{guide}',
        guidePattern: /^(80|81|82|83|84|85|86|87|88|89)\d{8,9}$/,
        avgDeliveryDays: 3,
        coverage: ['Nacional', 'Principales ciudades', 'Zonas rurales'],
        services: [
          { id: 'inter_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          { id: 'inter_standard', name: 'Estándar', type: 'standard', avgDays: 3, price: 'medium' },
          { id: 'inter_economic', name: 'Económico', type: 'economic', avgDays: 5, price: 'low' },
        ],
      },
      {
        id: 'envia',
        name: 'Envía',
        trackingUrlPattern: 'https://www.envia.co/rastreo/{guide}',
        guidePattern: /^(ENV|env|Env)\d{10}$/,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Express urbano'],
        services: [
          { id: 'envia_hoy', name: 'Envía Hoy', type: 'express', avgDays: 1, price: 'high' },
          { id: 'envia_standard', name: 'Estándar', type: 'standard', avgDays: 2, price: 'medium' },
        ],
      },
      {
        id: 'coordinadora',
        name: 'Coordinadora',
        trackingUrlPattern: 'https://www.coordinadora.com/rastreo/{guide}',
        guidePattern: /^\d{11}$/,
        avgDeliveryDays: 3,
        coverage: ['Nacional', 'Empresarial'],
        services: [
          {
            id: 'coord_mercancia',
            name: 'Mercancía',
            type: 'standard',
            avgDays: 3,
            price: 'medium',
          },
          { id: 'coord_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          { id: 'coord_eco', name: 'Económico', type: 'economic', avgDays: 5, price: 'low' },
        ],
      },
      {
        id: 'tcc',
        name: 'TCC',
        trackingUrlPattern: 'https://www.tcc.com.co/rastreo/{guide}',
        guidePattern: /^(7|8|9)\d{10,11}$/,
        avgDeliveryDays: 4,
        coverage: ['Nacional', 'Carga pesada', 'Paquetería'],
        services: [
          { id: 'tcc_express', name: 'Express', type: 'express', avgDays: 2, price: 'high' },
          { id: 'tcc_standard', name: 'Estándar', type: 'standard', avgDays: 4, price: 'medium' },
        ],
      },
      {
        id: 'servientrega',
        name: 'Servientrega',
        trackingUrlPattern: 'https://www.servientrega.com/rastreo/{guide}',
        guidePattern: /^\d{12}$/,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Express', 'Documentos'],
        services: [
          { id: 'servi_hoy', name: 'Hoy', type: 'express', avgDays: 1, price: 'high' },
          { id: 'servi_standard', name: 'Estándar', type: 'standard', avgDays: 2, price: 'medium' },
        ],
      },
      {
        id: 'deprisa',
        name: 'Deprisa',
        trackingUrlPattern: 'https://www.deprisa.com/rastreo/{guide}',
        guidePattern: /^DP\d{10}$/i,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Urbano'],
        services: [
          { id: 'deprisa_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          {
            id: 'deprisa_standard',
            name: 'Estándar',
            type: 'standard',
            avgDays: 2,
            price: 'medium',
          },
        ],
      },
    ],
  },
  ECUADOR: {
    code: 'ECUADOR',
    name: 'Ecuador',
    flag: '',
    currency: 'USD',
    currencySymbol: '$',
    phonePrefix: '+593',
    phonePattern: /^(\+593)?9\d{8}$/,
    carriers: [
      {
        id: 'servientrega_ec',
        name: 'Servientrega Ecuador',
        trackingUrlPattern: 'https://www.servientrega.com.ec/rastreo/{guide}',
        guidePattern: /^\d{12}$/,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Principales ciudades'],
        services: [
          { id: 'servi_ec_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          {
            id: 'servi_ec_standard',
            name: 'Estándar',
            type: 'standard',
            avgDays: 2,
            price: 'medium',
          },
        ],
      },
      {
        id: 'tramaco',
        name: 'Tramaco Express',
        trackingUrlPattern: 'https://www.tramaco.com.ec/rastreo/{guide}',
        guidePattern: /^TR\d{10}$/i,
        avgDeliveryDays: 3,
        coverage: ['Nacional', 'Sierra', 'Costa'],
        services: [
          { id: 'tramaco_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          {
            id: 'tramaco_standard',
            name: 'Estándar',
            type: 'standard',
            avgDays: 3,
            price: 'medium',
          },
          { id: 'tramaco_eco', name: 'Económico', type: 'economic', avgDays: 5, price: 'low' },
        ],
      },
      {
        id: 'laar_courier',
        name: 'Laar Courier',
        trackingUrlPattern: 'https://www.laarcourier.com/rastreo/{guide}',
        guidePattern: /^LC\d{9}$/i,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'E-commerce'],
        services: [
          { id: 'laar_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          { id: 'laar_standard', name: 'Estándar', type: 'standard', avgDays: 2, price: 'medium' },
        ],
      },
      {
        id: 'urbano_ec',
        name: 'Urbano Express',
        trackingUrlPattern: 'https://www.urbanoexpress.com.ec/rastreo/{guide}',
        guidePattern: /^UE\d{10}$/i,
        avgDeliveryDays: 2,
        coverage: ['Quito', 'Guayaquil', 'Cuenca'],
        services: [
          { id: 'urbano_same', name: 'Same Day', type: 'express', avgDays: 0, price: 'high' },
          { id: 'urbano_next', name: 'Next Day', type: 'standard', avgDays: 1, price: 'medium' },
        ],
      },
      {
        id: 'correos_ec',
        name: 'Correos del Ecuador',
        trackingUrlPattern: 'https://www.correosdelecuador.gob.ec/rastreo/{guide}',
        guidePattern: /^EC\d{9}[A-Z]{2}$/i,
        avgDeliveryDays: 5,
        coverage: ['Nacional', 'Internacional'],
        services: [
          {
            id: 'correos_express',
            name: 'EMS Express',
            type: 'express',
            avgDays: 2,
            price: 'high',
          },
          {
            id: 'correos_standard',
            name: 'Certificado',
            type: 'standard',
            avgDays: 5,
            price: 'low',
          },
        ],
      },
    ],
  },
  CHILE: {
    code: 'CHILE',
    name: 'Chile',
    flag: '',
    currency: 'CLP',
    currencySymbol: '$',
    phonePrefix: '+56',
    phonePattern: /^(\+56)?9\d{8}$/,
    carriers: [
      {
        id: 'chilexpress',
        name: 'Chilexpress',
        trackingUrlPattern: 'https://www.chilexpress.cl/rastreo/{guide}',
        guidePattern: /^\d{12}$/,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Express', 'E-commerce'],
        services: [
          {
            id: 'chilex_priority',
            name: 'Prioritario',
            type: 'express',
            avgDays: 1,
            price: 'high',
          },
          {
            id: 'chilex_dia_sig',
            name: 'Día Siguiente',
            type: 'standard',
            avgDays: 2,
            price: 'medium',
          },
          { id: 'chilex_eco', name: 'Económico', type: 'economic', avgDays: 4, price: 'low' },
        ],
      },
      {
        id: 'starken',
        name: 'Starken',
        trackingUrlPattern: 'https://www.starken.cl/rastreo/{guide}',
        guidePattern: /^ST\d{10}$/i,
        avgDeliveryDays: 3,
        coverage: ['Nacional', 'Encomiendas'],
        services: [
          { id: 'starken_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          { id: 'starken_normal', name: 'Normal', type: 'standard', avgDays: 3, price: 'medium' },
        ],
      },
      {
        id: 'bluexpress',
        name: 'Blue Express',
        trackingUrlPattern: 'https://www.blue.cl/rastreo/{guide}',
        guidePattern: /^BX\d{10}$/i,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Retail', 'E-commerce'],
        services: [
          { id: 'blue_same', name: 'Same Day', type: 'express', avgDays: 0, price: 'high' },
          { id: 'blue_next', name: 'Next Day', type: 'standard', avgDays: 1, price: 'medium' },
          { id: 'blue_flex', name: 'Flex', type: 'economic', avgDays: 3, price: 'low' },
        ],
      },
      {
        id: 'correos_chile',
        name: 'Correos de Chile',
        trackingUrlPattern: 'https://www.correos.cl/rastreo/{guide}',
        guidePattern: /^CL\d{9}[A-Z]{2}$/i,
        avgDeliveryDays: 4,
        coverage: ['Nacional', 'Internacional'],
        services: [
          { id: 'correos_cl_express', name: 'Express', type: 'express', avgDays: 2, price: 'high' },
          {
            id: 'correos_cl_standard',
            name: 'Certificado',
            type: 'standard',
            avgDays: 4,
            price: 'medium',
          },
        ],
      },
      {
        id: 'fedex_chile',
        name: 'FedEx Chile',
        trackingUrlPattern: 'https://www.fedex.com/rastreo/{guide}',
        guidePattern: /^\d{12,15}$/,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Internacional', 'Premium'],
        services: [
          {
            id: 'fedex_priority',
            name: 'Priority Overnight',
            type: 'express',
            avgDays: 1,
            price: 'high',
          },
          { id: 'fedex_standard', name: 'Standard', type: 'standard', avgDays: 2, price: 'medium' },
        ],
      },
      {
        id: 'dhl_chile',
        name: 'DHL Express',
        trackingUrlPattern: 'https://www.dhl.com/rastreo/{guide}',
        guidePattern: /^\d{10}$/,
        avgDeliveryDays: 2,
        coverage: ['Nacional', 'Internacional', 'Documentos'],
        services: [
          { id: 'dhl_express', name: 'Express', type: 'express', avgDays: 1, price: 'high' },
          { id: 'dhl_economy', name: 'Economy', type: 'economic', avgDays: 3, price: 'medium' },
        ],
      },
    ],
  },
};

// Ciudades principales por país
export const MAIN_CITIES: Record<Country, string[]> = {
  COLOMBIA: [
    'Bogotá',
    'Medellín',
    'Cali',
    'Barranquilla',
    'Cartagena',
    'Bucaramanga',
    'Pereira',
    'Santa Marta',
    'Manizales',
    'Cúcuta',
    'Ibagué',
    'Villavicencio',
    'Pasto',
    'Montería',
    'Neiva',
  ],
  ECUADOR: [
    'Quito',
    'Guayaquil',
    'Cuenca',
    'Santo Domingo',
    'Machala',
    'Manta',
    'Portoviejo',
    'Ambato',
    'Riobamba',
    'Loja',
    'Ibarra',
    'Esmeraldas',
    'Quevedo',
    'Durán',
    'Milagro',
  ],
  CHILE: [
    'Santiago',
    'Valparaíso',
    'Concepción',
    'Antofagasta',
    'Viña del Mar',
    'Temuco',
    'Rancagua',
    'Talca',
    'Arica',
    'Iquique',
    'Puerto Montt',
    'Coquimbo',
    'La Serena',
    'Chillán',
    'Osorno',
  ],
};
