/**
 * Invoice Service - Facturación Electrónica
 *
 * Servicio para gestión de facturación electrónica Colombia.
 * Incluye generación, envío DIAN, y reportes.
 */

import type {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  InvoiceItem,
  InvoiceParty,
  InvoiceTax,
  InvoicePayment,
  InvoiceFilters,
  InvoiceStats,
  InvoiceSettings,
  DIANResolution,
  DIANResponse,
  InvoiceValidationError,
  PaymentMethod,
  TaxType,
} from '@/types/invoice.types';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  INVOICES: 'litper_invoices',
  SETTINGS: 'litper_invoice_settings',
  RESOLUTIONS: 'litper_dian_resolutions',
};

// ============================================
// CONSTANTES
// ============================================

const TAX_RATES = {
  IVA_GENERAL: 19,
  IVA_REDUCED: 5,
  IVA_EXEMPT: 0,
  INC_8: 8,
  INC_16: 16,
  RETE_FUENTE: 2.5,
  RETE_IVA: 15,
  RETE_ICA: 1,
};

const PAYMENT_MEANS_CODES: Record<string, string> = {
  instrument_not_defined: '1',
  credit: '2',
  debit: '3',
  cash: '10',
  check: '20',
  credit_card: '48',
  debit_card: '49',
  bank_transfer: '31',
};

// ============================================
// CLASE PRINCIPAL
// ============================================

class InvoiceService {
  private invoices: Map<string, Invoice> = new Map();
  private settings: InvoiceSettings | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // ============================================
  // STORAGE
  // ============================================

  private loadFromStorage(): void {
    // Cargar facturas
    const invoicesData = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (invoicesData) {
      const invoices: Invoice[] = JSON.parse(invoicesData);
      invoices.forEach(inv => this.invoices.set(inv.id, inv));
    }

    // Cargar configuración
    const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsData) {
      this.settings = JSON.parse(settingsData);
    }
  }

  private saveInvoices(): void {
    const invoices = Array.from(this.invoices.values());
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }

  private saveSettings(): void {
    if (this.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    }
  }

  // ============================================
  // CRUD DE FACTURAS
  // ============================================

  /**
   * Obtiene todas las facturas con filtros opcionales
   */
  getAll(filters?: InvoiceFilters): Invoice[] {
    let invoices = Array.from(this.invoices.values());

    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        invoices = invoices.filter(inv =>
          inv.fullNumber.toLowerCase().includes(search) ||
          inv.buyer.name.toLowerCase().includes(search) ||
          inv.buyer.documentNumber.includes(search)
        );
      }

      if (filters.type?.length) {
        invoices = invoices.filter(inv => filters.type!.includes(inv.type));
      }

      if (filters.status?.length) {
        invoices = invoices.filter(inv => filters.status!.includes(inv.status));
      }

      if (filters.dateFrom) {
        invoices = invoices.filter(inv => new Date(inv.issueDate) >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        invoices = invoices.filter(inv => new Date(inv.issueDate) <= filters.dateTo!);
      }

      if (filters.buyerId) {
        invoices = invoices.filter(inv => inv.buyer.documentNumber === filters.buyerId);
      }

      if (filters.minAmount !== undefined) {
        invoices = invoices.filter(inv => inv.total >= filters.minAmount!);
      }

      if (filters.maxAmount !== undefined) {
        invoices = invoices.filter(inv => inv.total <= filters.maxAmount!);
      }

      if (filters.isPaid !== undefined) {
        if (filters.isPaid) {
          invoices = invoices.filter(inv => inv.status === 'paid');
        } else {
          invoices = invoices.filter(inv => inv.status !== 'paid');
        }
      }

      if (filters.isOverdue) {
        const today = new Date();
        invoices = invoices.filter(inv =>
          inv.status !== 'paid' &&
          inv.status !== 'cancelled' &&
          new Date(inv.dueDate) < today
        );
      }
    }

    return invoices.sort((a, b) =>
      new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    );
  }

  /**
   * Obtiene una factura por ID
   */
  getById(id: string): Invoice | null {
    return this.invoices.get(id) || null;
  }

  /**
   * Obtiene una factura por número
   */
  getByNumber(fullNumber: string): Invoice | null {
    return Array.from(this.invoices.values())
      .find(inv => inv.fullNumber === fullNumber) || null;
  }

  /**
   * Crea una nueva factura
   */
  create(data: Partial<Invoice>): Invoice {
    const resolution = this.getActiveResolution(data.type || 'invoice');
    if (!resolution) {
      throw new Error('No hay resolución activa para este tipo de documento');
    }

    const number = resolution.currentNumber + 1;
    const fullNumber = `${resolution.prefix}-${number}`;

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (this.settings?.defaultPaymentTermDays || 30));

    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || 'invoice',
      prefix: resolution.prefix,
      number,
      fullNumber,
      status: 'draft',
      issueDate: data.issueDate || now,
      dueDate: data.dueDate || dueDate,
      createdAt: now,
      updatedAt: now,
      seller: data.seller || this.settings?.company || this.getDefaultSeller(),
      buyer: data.buyer || this.getDefaultBuyer(),
      items: data.items || [],
      subtotal: 0,
      totalDiscount: 0,
      totalTaxBase: 0,
      taxes: [],
      totalTax: 0,
      total: 0,
      paymentMethod: data.paymentMethod || this.settings?.defaultPaymentMethod || 'credit',
      paymentMeans: data.paymentMeans || 'credit',
      paymentDueDate: data.dueDate || dueDate,
      payments: [],
      amountPaid: 0,
      amountDue: 0,
      notes: data.notes,
      currency: 'COP',
      createdBy: data.createdBy || 'system',
      ...data,
    };

    // Calcular totales
    this.calculateTotals(invoice);

    // Actualizar resolución
    resolution.currentNumber = number;
    this.saveResolution(resolution);

    // Guardar factura
    this.invoices.set(invoice.id, invoice);
    this.saveInvoices();

    return invoice;
  }

  /**
   * Actualiza una factura existente
   */
  update(id: string, data: Partial<Invoice>): Invoice {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('Factura no encontrada');

    if (invoice.status !== 'draft') {
      throw new Error('Solo se pueden editar facturas en borrador');
    }

    const updated: Invoice = {
      ...invoice,
      ...data,
      updatedAt: new Date(),
    };

    // Recalcular totales
    this.calculateTotals(updated);

    this.invoices.set(id, updated);
    this.saveInvoices();

    return updated;
  }

  /**
   * Elimina una factura (solo borradores)
   */
  delete(id: string): void {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('Factura no encontrada');

    if (invoice.status !== 'draft') {
      throw new Error('Solo se pueden eliminar facturas en borrador');
    }

    this.invoices.delete(id);
    this.saveInvoices();
  }

  // ============================================
  // CÁLCULOS
  // ============================================

  /**
   * Calcula los totales de una factura
   */
  calculateTotals(invoice: Invoice): void {
    let subtotal = 0;
    let totalDiscount = 0;
    const taxMap = new Map<string, InvoiceTax>();

    // Calcular items
    for (const item of invoice.items) {
      item.subtotal = item.quantity * item.unitPrice;
      item.discount = item.subtotal * (item.discountPercentage / 100);
      const itemBase = item.subtotal - item.discount;

      subtotal += item.subtotal;
      totalDiscount += item.discount;

      // Calcular impuestos del item
      item.totalTax = 0;
      for (const tax of item.taxes) {
        tax.baseAmount = itemBase;
        tax.taxAmount = itemBase * (tax.percentage / 100);
        item.totalTax += tax.taxAmount;

        // Agregar al mapa de impuestos
        const key = `${tax.type}_${tax.percentage}`;
        const existing = taxMap.get(key);
        if (existing) {
          existing.baseAmount += tax.baseAmount;
          existing.taxAmount += tax.taxAmount;
        } else {
          taxMap.set(key, {
            type: tax.type,
            percentage: tax.percentage,
            baseAmount: tax.baseAmount,
            taxAmount: tax.taxAmount,
          });
        }
      }

      item.total = itemBase + item.totalTax;
    }

    // Actualizar totales de factura
    invoice.subtotal = subtotal;
    invoice.totalDiscount = totalDiscount;
    invoice.totalTaxBase = subtotal - totalDiscount;
    invoice.taxes = Array.from(taxMap.values());
    invoice.totalTax = invoice.taxes.reduce((sum, t) => sum + t.taxAmount, 0);
    invoice.total = invoice.totalTaxBase + invoice.totalTax;
    invoice.amountDue = invoice.total - invoice.amountPaid;
  }

  /**
   * Agrega un item a una factura
   */
  addItem(invoiceId: string, item: Omit<InvoiceItem, 'id' | 'lineNumber'>): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Factura no encontrada');

    const newItem: InvoiceItem = {
      ...item,
      id: `item_${Date.now()}`,
      lineNumber: invoice.items.length + 1,
    };

    invoice.items.push(newItem);
    this.calculateTotals(invoice);
    invoice.updatedAt = new Date();

    this.invoices.set(invoiceId, invoice);
    this.saveInvoices();

    return invoice;
  }

  /**
   * Elimina un item de una factura
   */
  removeItem(invoiceId: string, itemId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Factura no encontrada');

    invoice.items = invoice.items.filter(i => i.id !== itemId);

    // Renumerar items
    invoice.items.forEach((item, index) => {
      item.lineNumber = index + 1;
    });

    this.calculateTotals(invoice);
    invoice.updatedAt = new Date();

    this.invoices.set(invoiceId, invoice);
    this.saveInvoices();

    return invoice;
  }

  // ============================================
  // PAGOS
  // ============================================

  /**
   * Registra un pago en una factura
   */
  addPayment(invoiceId: string, payment: Omit<InvoicePayment, 'id' | 'createdAt'>): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Factura no encontrada');

    if (invoice.status === 'paid') {
      throw new Error('La factura ya está pagada');
    }

    if (payment.amount > invoice.amountDue) {
      throw new Error('El monto excede el saldo pendiente');
    }

    const newPayment: InvoicePayment = {
      ...payment,
      id: `pay_${Date.now()}`,
      createdAt: new Date(),
    };

    invoice.payments.push(newPayment);
    invoice.amountPaid += payment.amount;
    invoice.amountDue = invoice.total - invoice.amountPaid;

    // Actualizar estado
    if (invoice.amountDue <= 0) {
      invoice.status = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partially_paid';
    }

    invoice.updatedAt = new Date();

    this.invoices.set(invoiceId, invoice);
    this.saveInvoices();

    return invoice;
  }

  // ============================================
  // DIAN
  // ============================================

  /**
   * Valida una factura antes de enviar a DIAN
   */
  validate(invoice: Invoice): InvoiceValidationError[] {
    const errors: InvoiceValidationError[] = [];

    // Validar comprador
    if (!invoice.buyer.documentNumber) {
      errors.push({
        field: 'buyer.documentNumber',
        code: 'REQUIRED',
        message: 'El número de documento del comprador es requerido',
      });
    }

    if (!invoice.buyer.email) {
      errors.push({
        field: 'buyer.email',
        code: 'REQUIRED',
        message: 'El email del comprador es requerido',
      });
    }

    // Validar items
    if (invoice.items.length === 0) {
      errors.push({
        field: 'items',
        code: 'REQUIRED',
        message: 'La factura debe tener al menos un item',
      });
    }

    // Validar totales
    if (invoice.total <= 0) {
      errors.push({
        field: 'total',
        code: 'INVALID',
        message: 'El total debe ser mayor a cero',
      });
    }

    // Validar resolución
    const resolution = this.getActiveResolution(invoice.type);
    if (!resolution) {
      errors.push({
        field: 'resolution',
        code: 'NO_RESOLUTION',
        message: 'No hay resolución activa para este tipo de documento',
      });
    } else {
      if (invoice.number > resolution.rangeTo) {
        errors.push({
          field: 'number',
          code: 'RANGE_EXCEEDED',
          message: 'Se ha excedido el rango de numeración autorizado',
        });
      }

      if (new Date() > resolution.validTo) {
        errors.push({
          field: 'resolution',
          code: 'EXPIRED',
          message: 'La resolución de facturación ha expirado',
        });
      }
    }

    return errors;
  }

  /**
   * Envía una factura a la DIAN (simulado)
   */
  async sendToDIAN(invoiceId: string): Promise<DIANResponse> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error('Factura no encontrada');

    // Validar
    const errors = this.validate(invoice);
    if (errors.length > 0) {
      return {
        success: false,
        statusCode: 'VALIDATION_ERROR',
        statusDescription: 'La factura tiene errores de validación',
        errors: errors.map(e => ({
          code: e.code,
          message: e.message,
          location: e.field,
        })),
        processedAt: new Date(),
      };
    }

    // Actualizar estado
    invoice.status = 'pending';
    this.saveInvoices();

    // Simular envío a DIAN
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generar CUFE (simulado)
    const cufe = this.generateCUFE(invoice);
    const qrCode = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;

    // Actualizar factura
    invoice.cufe = cufe;
    invoice.qrCode = qrCode;
    invoice.status = 'accepted';
    invoice.updatedAt = new Date();

    this.invoices.set(invoiceId, invoice);
    this.saveInvoices();

    return {
      success: true,
      cufe,
      qrCode,
      statusCode: 'ACCEPTED',
      statusDescription: 'Documento validado por la DIAN',
      processedAt: new Date(),
    };
  }

  /**
   * Genera un CUFE simulado
   */
  private generateCUFE(invoice: Invoice): string {
    // En producción esto se genera según especificación DIAN
    const data = `${invoice.fullNumber}${invoice.issueDate}${invoice.total}`;
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 96);
  }

  // ============================================
  // NOTAS CRÉDITO/DÉBITO
  // ============================================

  /**
   * Crea una nota crédito para una factura
   */
  createCreditNote(
    invoiceId: string,
    items: InvoiceItem[],
    reason: string
  ): Invoice {
    const originalInvoice = this.invoices.get(invoiceId);
    if (!originalInvoice) throw new Error('Factura no encontrada');

    if (originalInvoice.status === 'cancelled') {
      throw new Error('No se puede crear nota crédito para una factura anulada');
    }

    const creditNote = this.create({
      type: 'credit_note',
      buyer: originalInvoice.buyer,
      seller: originalInvoice.seller,
      items,
      notes: reason,
      relatedInvoiceId: invoiceId,
    });

    return creditNote;
  }

  // ============================================
  // RESOLUCIONES
  // ============================================

  /**
   * Obtiene la resolución activa para un tipo de documento
   */
  getActiveResolution(type: InvoiceType): DIANResolution | null {
    const stored = localStorage.getItem(STORAGE_KEYS.RESOLUTIONS);
    if (!stored) return null;

    const resolutions: DIANResolution[] = JSON.parse(stored);
    const prefix = type === 'credit_note' ? 'NC' : type === 'debit_note' ? 'ND' : 'FE';

    return resolutions.find(r =>
      r.prefix === prefix &&
      r.isActive &&
      new Date() <= new Date(r.validTo)
    ) || null;
  }

  /**
   * Guarda una resolución
   */
  saveResolution(resolution: DIANResolution): void {
    const stored = localStorage.getItem(STORAGE_KEYS.RESOLUTIONS);
    const resolutions: DIANResolution[] = stored ? JSON.parse(stored) : [];

    const index = resolutions.findIndex(r =>
      r.resolutionNumber === resolution.resolutionNumber
    );

    if (index >= 0) {
      resolutions[index] = resolution;
    } else {
      resolutions.push(resolution);
    }

    localStorage.setItem(STORAGE_KEYS.RESOLUTIONS, JSON.stringify(resolutions));
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene estadísticas de facturación
   */
  getStats(filters?: InvoiceFilters): InvoiceStats {
    const invoices = this.getAll(filters);

    const stats: InvoiceStats = {
      total: invoices.length,
      totalAmount: 0,
      byStatus: {} as any,
      byType: {} as any,
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      taxCollected: 0,
      taxWithheld: 0,
    };

    const today = new Date();

    for (const invoice of invoices) {
      stats.totalAmount += invoice.total;

      // Por estado
      if (!stats.byStatus[invoice.status]) {
        stats.byStatus[invoice.status] = { count: 0, amount: 0 };
      }
      stats.byStatus[invoice.status].count++;
      stats.byStatus[invoice.status].amount += invoice.total;

      // Por tipo
      if (!stats.byType[invoice.type]) {
        stats.byType[invoice.type] = { count: 0, amount: 0 };
      }
      stats.byType[invoice.type].count++;
      stats.byType[invoice.type].amount += invoice.total;

      // Pagadas/Pendientes/Vencidas
      if (invoice.status === 'paid') {
        stats.paid.count++;
        stats.paid.amount += invoice.total;
      } else if (invoice.status !== 'cancelled') {
        if (new Date(invoice.dueDate) < today) {
          stats.overdue.count++;
          stats.overdue.amount += invoice.amountDue;
        } else {
          stats.pending.count++;
          stats.pending.amount += invoice.amountDue;
        }
      }

      // Impuestos
      for (const tax of invoice.taxes) {
        if (['IVA', 'INC'].includes(tax.type)) {
          stats.taxCollected += tax.taxAmount;
        } else if (['ReteIVA', 'ReteICA', 'ReteFuente'].includes(tax.type)) {
          stats.taxWithheld += tax.taxAmount;
        }
      }
    }

    return stats;
  }

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Obtiene la configuración de facturación
   */
  getSettings(): InvoiceSettings | null {
    return this.settings;
  }

  /**
   * Actualiza la configuración de facturación
   */
  updateSettings(settings: Partial<InvoiceSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    } as InvoiceSettings;
    this.saveSettings();
  }

  // ============================================
  // HELPERS
  // ============================================

  private getDefaultSeller(): InvoiceParty {
    return {
      documentType: 'NIT',
      documentNumber: '900123456',
      verificationDigit: '1',
      name: 'LITPER PRO S.A.S',
      email: 'facturacion@litper.co',
      address: 'Carrera 1 # 2-3',
      city: 'Bogotá',
      cityCode: '11001',
      department: 'Bogotá D.C.',
      departmentCode: '11',
      country: 'Colombia',
      countryCode: 'CO',
      taxRegime: 'common',
    };
  }

  private getDefaultBuyer(): InvoiceParty {
    return {
      documentType: 'CC',
      documentNumber: '',
      name: '',
      email: '',
      address: '',
      city: '',
      cityCode: '',
      department: '',
      departmentCode: '',
      country: 'Colombia',
      countryCode: 'CO',
      taxRegime: 'simplified',
    };
  }
}

// ============================================
// SINGLETON
// ============================================

export const invoiceService = new InvoiceService();

// ============================================
// HOOK
// ============================================

export function useInvoiceService() {
  return {
    getAll: invoiceService.getAll.bind(invoiceService),
    getById: invoiceService.getById.bind(invoiceService),
    create: invoiceService.create.bind(invoiceService),
    update: invoiceService.update.bind(invoiceService),
    delete: invoiceService.delete.bind(invoiceService),
    addItem: invoiceService.addItem.bind(invoiceService),
    removeItem: invoiceService.removeItem.bind(invoiceService),
    addPayment: invoiceService.addPayment.bind(invoiceService),
    validate: invoiceService.validate.bind(invoiceService),
    sendToDIAN: invoiceService.sendToDIAN.bind(invoiceService),
    createCreditNote: invoiceService.createCreditNote.bind(invoiceService),
    getStats: invoiceService.getStats.bind(invoiceService),
    getSettings: invoiceService.getSettings.bind(invoiceService),
    updateSettings: invoiceService.updateSettings.bind(invoiceService),
  };
}

export default invoiceService;
