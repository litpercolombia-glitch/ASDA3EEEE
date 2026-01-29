/**
 * Invoice Types - Facturación Electrónica Colombia
 *
 * Tipos para facturación electrónica según normativa DIAN Colombia.
 * Compatible con resolución de facturación electrónica.
 */

// ============================================
// TIPOS BÁSICOS
// ============================================

export type InvoiceType =
  | 'invoice'           // Factura de venta
  | 'credit_note'       // Nota crédito
  | 'debit_note'        // Nota débito
  | 'export_invoice';   // Factura de exportación

export type InvoiceStatus =
  | 'draft'             // Borrador
  | 'pending'           // Pendiente de envío DIAN
  | 'sent'              // Enviada a DIAN
  | 'accepted'          // Aceptada por DIAN
  | 'rejected'          // Rechazada por DIAN
  | 'cancelled'         // Anulada
  | 'paid'              // Pagada
  | 'partially_paid'    // Parcialmente pagada
  | 'overdue';          // Vencida

export type PaymentMethod =
  | 'cash'              // Efectivo
  | 'credit'            // Crédito
  | 'debit_card'        // Tarjeta débito
  | 'credit_card'       // Tarjeta crédito
  | 'bank_transfer'     // Transferencia bancaria
  | 'check'             // Cheque
  | 'other';            // Otro

export type PaymentMeans =
  | 'instrument_not_defined'  // 1 - Instrumento no definido
  | 'credit'                  // 2 - Crédito
  | 'debit'                   // 3 - Débito
  | 'cash'                    // 10 - Efectivo
  | 'check'                   // 20 - Cheque
  | 'credit_card'             // 48 - Tarjeta crédito
  | 'debit_card'              // 49 - Tarjeta débito
  | 'bank_transfer';          // 31 - Transferencia bancaria

export type TaxType =
  | 'IVA'               // IVA
  | 'INC'               // Impuesto al consumo
  | 'ICA'               // Industria y comercio
  | 'ReteIVA'           // Retención IVA
  | 'ReteICA'           // Retención ICA
  | 'ReteFuente';       // Retención en la fuente

export type DocumentType =
  | 'CC'   // Cédula de ciudadanía
  | 'CE'   // Cédula de extranjería
  | 'NIT'  // NIT
  | 'PP'   // Pasaporte
  | 'TI'   // Tarjeta de identidad
  | 'RC'   // Registro civil
  | 'DE';  // Documento extranjero

// ============================================
// ENTIDADES PRINCIPALES
// ============================================

export interface Invoice {
  id: string;

  // Identificación
  type: InvoiceType;
  prefix: string;                    // Prefijo de facturación (ej: FE, NC)
  number: number;                    // Número consecutivo
  fullNumber: string;                // Número completo (ej: FE-12345)

  // DIAN
  cufe?: string;                     // Código Único de Facturación Electrónica
  qrCode?: string;                   // Código QR
  dianResolution?: DIANResolution;

  // Estado
  status: InvoiceStatus;

  // Fechas
  issueDate: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;

  // Partes
  seller: InvoiceParty;
  buyer: InvoiceParty;

  // Items
  items: InvoiceItem[];

  // Totales
  subtotal: number;
  totalDiscount: number;
  totalTaxBase: number;
  taxes: InvoiceTax[];
  totalTax: number;
  total: number;

  // Pagos
  paymentMethod: PaymentMethod;
  paymentMeans: PaymentMeans;
  paymentDueDate: Date;
  payments: InvoicePayment[];
  amountPaid: number;
  amountDue: number;

  // Notas
  notes?: string;
  internalNotes?: string;

  // Referencias
  orderId?: string;
  guideIds?: string[];
  relatedInvoiceId?: string;       // Para notas crédito/débito

  // Archivos
  pdfUrl?: string;
  xmlUrl?: string;
  attachments?: InvoiceAttachment[];

  // Metadata
  createdBy: string;
  currency: string;
  exchangeRate?: number;
}

export interface InvoiceParty {
  // Identificación
  documentType: DocumentType;
  documentNumber: string;
  verificationDigit?: string;        // Dígito de verificación NIT

  // Información básica
  name: string;
  tradeName?: string;                // Nombre comercial

  // Contacto
  email: string;
  phone?: string;

  // Dirección
  address: string;
  city: string;
  cityCode: string;                  // Código DANE
  department: string;
  departmentCode: string;            // Código DANE
  country: string;
  countryCode: string;               // ISO 3166-1 alpha-2
  postalCode?: string;

  // Régimen tributario
  taxRegime: 'simplified' | 'common' | 'special' | 'not_responsible';
  taxResponsibilities?: string[];    // Responsabilidades tributarias

  // Información adicional
  economicActivity?: string;         // Código CIIU
}

export interface InvoiceItem {
  id: string;
  lineNumber: number;

  // Producto
  productId?: string;
  sku?: string;
  barcode?: string;

  // Descripción
  description: string;
  notes?: string;

  // Cantidades
  quantity: number;
  unitOfMeasure: string;
  unitOfMeasureCode: string;         // Código UNECE

  // Precios
  unitPrice: number;
  discount: number;
  discountPercentage: number;
  subtotal: number;

  // Impuestos
  taxes: InvoiceItemTax[];
  totalTax: number;
  total: number;

  // Referencias
  orderItemId?: string;
}

export interface InvoiceItemTax {
  type: TaxType;
  percentage: number;
  baseAmount: number;
  taxAmount: number;
}

export interface InvoiceTax {
  type: TaxType;
  percentage: number;
  baseAmount: number;
  taxAmount: number;
}

export interface InvoicePayment {
  id: string;
  date: Date;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface InvoiceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// ============================================
// RESOLUCIÓN DIAN
// ============================================

export interface DIANResolution {
  resolutionNumber: string;
  resolutionDate: Date;
  prefix: string;
  rangeFrom: number;
  rangeTo: number;
  technicalKey?: string;
  validFrom: Date;
  validTo: Date;
  currentNumber: number;
  isActive: boolean;
}

// ============================================
// CONFIGURACIÓN DE FACTURACIÓN
// ============================================

export interface InvoiceSettings {
  // Empresa
  company: InvoiceParty;
  logo?: string;

  // Resoluciones activas
  resolutions: DIANResolution[];

  // Configuración por defecto
  defaultPaymentMethod: PaymentMethod;
  defaultPaymentTermDays: number;
  defaultTaxRate: number;

  // Numeración
  creditNotePrefix: string;
  debitNotePrefix: string;

  // Impuestos
  applyIVA: boolean;
  applyINC: boolean;
  applyRetentions: boolean;

  // Notificaciones
  sendEmailOnCreate: boolean;
  sendEmailOnPaid: boolean;
  reminderDaysBeforeDue: number;

  // Plantillas
  emailTemplate?: string;
  pdfTemplate?: string;

  // Integración DIAN
  dianEnvironment: 'production' | 'test';
  dianSoftwareId?: string;
  dianPin?: string;
  certificatePath?: string;
  certificatePassword?: string;
}

// ============================================
// FILTROS Y REPORTES
// ============================================

export interface InvoiceFilters {
  search?: string;
  type?: InvoiceType[];
  status?: InvoiceStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  buyerId?: string;
  minAmount?: number;
  maxAmount?: number;
  isPaid?: boolean;
  isOverdue?: boolean;
}

export interface InvoiceStats {
  total: number;
  totalAmount: number;

  byStatus: Record<InvoiceStatus, { count: number; amount: number }>;
  byType: Record<InvoiceType, { count: number; amount: number }>;

  paid: { count: number; amount: number };
  pending: { count: number; amount: number };
  overdue: { count: number; amount: number };

  taxCollected: number;
  taxWithheld: number;
}

export interface InvoiceReport {
  period: { from: Date; to: Date };
  invoices: Invoice[];
  stats: InvoiceStats;

  // Resumen de impuestos
  taxSummary: {
    type: TaxType;
    baseAmount: number;
    taxAmount: number;
  }[];

  // Top clientes
  topCustomers: {
    buyer: InvoiceParty;
    invoiceCount: number;
    totalAmount: number;
  }[];
}

// ============================================
// VALIDACIONES Y ERRORES
// ============================================

export interface InvoiceValidationError {
  field: string;
  code: string;
  message: string;
}

export interface DIANResponse {
  success: boolean;
  cufe?: string;
  qrCode?: string;
  statusCode: string;
  statusDescription: string;
  errors?: DIANError[];
  warnings?: string[];
  processedAt: Date;
}

export interface DIANError {
  code: string;
  message: string;
  location?: string;
}

// ============================================
// PLANTILLAS Y PREVIEW
// ============================================

export interface InvoiceTemplate {
  id: string;
  name: string;
  type: 'pdf' | 'email';
  content: string;
  variables: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoicePreview {
  html: string;
  pdf?: Blob;
}
