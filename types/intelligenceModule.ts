// ============================================
// LITPER - MÓDULO DE INTELIGENCIA LOGÍSTICA
// Sistema de Enlace y Trazabilidad de Guías - Amazon Level
// ============================================

import { Shipment, CarrierName, ShipmentStatus } from '../types';

// ============================================
// CARRIER STATUS MAPPINGS
// Based on Coordinadora, Interrapidísimo, Envía
// ============================================

/**
 * Estados de COORDINADORA con sus significados
 */
export const COORDINADORA_STATUS_MAP: Record<string, CoordinadoraStatusInfo> = {
  'GUIA_GENERADA': {
    dropiStatus: 'GUÍA GENERADA',
    carrierStatus: 'A RECIBIR POR COORDINADORA',
    meaning: 'Guía generada en el sistema Dropi y no se ha recolectado por el carro de la transportadora. No se refleja información en la transportadora.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'TERMINAL_ORIGEN': {
    dropiStatus: 'EN TERMINAL ORIGEN',
    carrierStatus: 'EN TERMINAL ORIGEN',
    meaning: 'Coordinadora recogió el paquete y se encuentra en la bodega principal de la ciudad en donde se hizo esta recolección.',
    expectedDays: 0.5,
    alertAfterDays: 1,
  },
  'EN_TRANSPORTE': {
    dropiStatus: 'EN TRANSPORTE',
    carrierStatus: 'EN TRANSPORTE',
    meaning: 'La guía está en movimiento desde el punto origen hacia el punto destino.',
    expectedDays: 2,
    alertAfterDays: 4,
  },
  'TERMINAL_DESTINO': {
    dropiStatus: 'EN TERMINAL DESTINO',
    carrierStatus: 'EN TERMINAL DESTINO',
    meaning: '1. El paquete llegó a la bodega principal de la ciudad destino. 2. El paquete no pudo ser entregado al cliente y se devuelve a la bodega mientras se hace un nuevo intento de entrega. 3. Se almacena el paquete en la bodega principal porque será devuelto al remitente.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'EN_REPARTO': {
    dropiStatus: 'EN REPARTO',
    carrierStatus: 'EN REPARTO',
    meaning: '1. Si es población principal es porque está en ruta urbana para entrega ese día. 2. Si es una población lejana es que el paquete ya lo tiene nuestro aliado en su poder para entregar al cliente.',
    expectedDays: 1,
    alertAfterDays: 1,
  },
  'EN_PUNTO_DROOP': {
    dropiStatus: 'EN PUNTO DROOP',
    carrierStatus: 'EN PUNTO DROOP',
    meaning: 'El paquete se encuentra en una oficina de Coordinadora, ya sea porque es para reclamo en oficina o porque ya se agotó los 2 intentos de entrega sin éxito, se encuentra en uno de los puntos de Coordinadora más cercanos al cliente para ser reclamado.',
    expectedDays: 0,
    alertAfterDays: 1,
    contactEmails: ['LCOLIVO@COORDINADORA.COM', 'JHONC@COORDINADORA.COM', 'NCRUZ@COORDINADORA.COM'],
  },
  'DEVOLUCION': {
    dropiStatus: 'DEVOLUCIÓN',
    carrierStatus: 'CERRADO POR INCIDENCIA',
    meaning: 'Paquete fue devuelto, será devuelto, fue indemnizado, declarado en abandono.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'ENTREGADA': {
    dropiStatus: 'ENTREGADA',
    carrierStatus: 'ENTREGADA',
    meaning: 'La guía fue entregada al cliente final.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
};

/**
 * Estados de INTERRAPIDÍSIMO con sus significados
 */
export const INTERRAPIDISIMO_STATUS_MAP: Record<string, InterrapidisimoStatusInfo> = {
  'ADMITIDA': {
    dropiStatus: 'ADMITIDA',
    carrierStatus: 'ADMITIDA / FÍSICO FALTANTE',
    meaning: 'El paquete entra y se recibe en un punto de atención de Interrapidísimo para iniciar su proceso logístico.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'DEVOLUCION': {
    dropiStatus: 'DEVOLUCIÓN',
    carrierStatus: 'DEVOLUCIÓN RATIFICADA',
    meaning: 'La guía puede estar en el proceso de devolución o estar entregada al remitente.',
    expectedDays: 3,
    alertAfterDays: 5,
  },
  'DIGITALIZADA': {
    dropiStatus: 'DIGITALIZADA',
    carrierStatus: 'DIGITALIZADA',
    meaning: 'La guía no se entregó al cliente final ni al remitente. Normalmente es un siniestro.',
    expectedDays: 0,
    alertAfterDays: 0,
    isCritical: true,
  },
  'EN_BODEGA_TRANSPORTADORA': {
    dropiStatus: 'EN BODEGA TRANSPORTADORA',
    carrierStatus: 'CENTRO ACOPIO',
    meaning: 'El paquete se encuentra en la bodega de la transportadora ya sea en la bodega origen o la bodega destino.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'EN_PROCESAMIENTO': {
    dropiStatus: 'EN PROCESAMIENTO',
    carrierStatus: 'TRANSITO NACIONAL / REGIONAL / URBANO / DEVOLUCIÓN REGIONAL',
    meaning: 'El envío se encuentra viajando a un departamento diferente al del origen (Nacional), dentro del mismo departamento (Regional), o dentro del mismo municipio (Urbano).',
    expectedDays: 3,
    alertAfterDays: 5,
  },
  'EN_REPARTO': {
    dropiStatus: 'EN REPARTO',
    carrierStatus: 'REPARTO',
    meaning: 'Se encuentra en la ciudad destino para realizar el primer intento de entrega.',
    expectedDays: 1,
    alertAfterDays: 1,
  },
  'ENTREGADO': {
    dropiStatus: 'ENTREGADO',
    carrierStatus: 'ENTREGADA',
    meaning: 'Paquete entregado al cliente final.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'FACTURADO': {
    dropiStatus: 'FACTURADO',
    carrierStatus: 'FACTURADO',
    meaning: 'Es un estado propio de Interrapidísimo para dar un cierre logístico a una guía en estado admitida y puede que no sea real o lo sea; ya que fue por admisión manual.',
    expectedDays: 0,
    alertAfterDays: 1,
  },
  'GUIA_GENERADA': {
    dropiStatus: 'GUIA GENERADA',
    carrierStatus: 'NO SE VISUALIZA EN LA TRANSPORTADORA',
    meaning: 'Se generó un pre-envío. En decir que se tiene un número de guía asignado pero no se visualiza en la transportadora hasta que sea admitido.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'INDEMNIZADA_POR_DROPI': {
    dropiStatus: 'INDEMNIZADA POR DROPI',
    carrierStatus: 'CUALQUIER ESTADO',
    meaning: 'Dropi lo indemnizó.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'INTENTO_DE_ENTREGA': {
    dropiStatus: 'INTENTO DE ENTREGA',
    carrierStatus: 'INTENTO DE ENTREGA',
    meaning: 'Es el segundo intento de entrega.',
    expectedDays: 1,
    alertAfterDays: 2,
    deliveryAttempt: 2,
  },
  'PREPARADO_PARA_TRANSPORTADORA': {
    dropiStatus: 'PREPARADO PARA TRANSPORTADORA',
    carrierStatus: 'NO SE VISUALIZA EN LA TRANSPORTADORA',
    meaning: 'Lo escanearon con ecomscanne, es una aplicación de Dropi donde se informa que a la transportadora para que realice la recolección.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'RECHAZADO': {
    dropiStatus: 'RECHAZADO',
    carrierStatus: 'NO SE VISUALIZA EN LA TRANSPORTADORA',
    meaning: 'Ya se tiene la guía generada y el dropshipper no puede cancelar la orden, entonces a través de servicio al cliente solicitan la opción de cancelarla. En este caso se ha cobrado el flete y se procede a su reintegro dentro del sistema Dropi al Dropshipper. Nota: No despachar el paquete. Para que la guía sea rechazada primero se valida que la transportadora no haya recibido el paquete.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'RECLAME_EN_OFICINA': {
    dropiStatus: 'RECLAME EN OFICINA',
    carrierStatus: 'RECLAME EN OFICINA',
    meaning: 'Se tiene un plazo de 15 días calendario para que se reclame en oficina a partir de la fecha de admisión.',
    expectedDays: 0,
    alertAfterDays: 1,
    maxDaysInOffice: 15,
  },
  'TELEMERCADEO': {
    dropiStatus: 'TELEMERCADEO',
    carrierStatus: 'TELEMERCADEO',
    meaning: 'La guía entró en novedad y se intenta comunicación con el origen y/o destino para dar solución a esta y así mismo continuar con el proceso logístico.',
    expectedDays: 2,
    alertAfterDays: 3,
  },
  'REENVIO': {
    dropiStatus: 'REENVIO',
    carrierStatus: 'REENVIO',
    meaning: 'Tercer intento de entrega.',
    expectedDays: 1,
    alertAfterDays: 2,
    deliveryAttempt: 3,
  },
  'ANULADA': {
    dropiStatus: 'ANULADA',
    carrierStatus: 'ANULADA',
    meaning: 'La guía es anulada por la transportadora. El envío no está físicamente.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'INDEMNIZACION': {
    dropiStatus: 'CUALQUIER ESTADO',
    carrierStatus: 'INDEMNIZACIÓN',
    meaning: 'Fue indemnizada por la transportadora.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'ARCHIVADA': {
    dropiStatus: 'ENTREGADO / DEVOLUCIÓN / SINIESTRO',
    carrierStatus: 'ARCHIVADA',
    meaning: 'Cierre logístico, no tendrá más movimientos o cambios de estado.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
};

/**
 * Movimientos de INTERRAPIDÍSIMO
 */
export const INTERRAPIDISIMO_MOVEMENTS: Record<string, MovementInfo> = {
  'ENVIO_ADMITIDA': {
    movement: 'ENVIO ADMITIDA',
    meaning: 'Ingresa a la agencia de la transportadora.',
  },
  'NO_LLEGO_EL_ENVIO_FISICO': {
    movement: 'NO LLEGO EL ENVIO FISICO',
    meaning: 'No se tiene el paquete físico en la agencia.',
  },
  'DOCUMENTO_ANULADO': {
    movement: 'DOCUMENTO ANULADO',
    meaning: 'Es anulada por la transportadora. El envío no está físicamente.',
    isCritical: true,
  },
  'FACTURADO': {
    movement: 'FACTURADO',
    meaning: 'Es un estado propio de Interrapidísimo para dar un cierre logístico a una guía que quedó en estado admitida por mucho tiempo.',
  },
  'DESPACHADO_PARA_BODEGA': {
    movement: 'DESPACHADO PARA BODEGA',
    meaning: 'En ruta hacia la bodega.',
  },
  'INGRESADO_A_BODEGA': {
    movement: 'INGRESADO A BODEGA',
    meaning: 'Ingresa al centro de Acopio origen o destino.',
  },
  'VIAJANDO_A_RUTA_NACIONAL': {
    movement: 'VIAJANDO A RUTA NACIONAL',
    meaning: 'Viaja fuera del departamento origen.',
  },
  'VIAJANDO_A_RUTA_REGIONAL': {
    movement: 'VIAJANDO A RUTA REGIONAL',
    meaning: 'Viaja dentro del departamento origen.',
  },
  'VIAJANDO_RUTA_URBANA': {
    movement: 'VIAJANDO RUTA URBANA',
    meaning: 'Viajando ruta urbana el origen y el destino en dentro del mismo municipio.',
  },
  'EN_DISTRIBUCION_URBANA': {
    movement: 'EN DISTRIBUCIÓN URBANA',
    meaning: 'Sale al intento de entrega al destinatario.',
  },
  'EN_PROCESO_DE_DEVOLUCION': {
    movement: 'EN PROCESO DE DEVOLUCIÓN',
    meaning: 'El paquete retorna al centro de Acopio porque no se logró hacer la entrega efectiva. En las observaciones de la transportadora se visualiza la novedad del porqué lo devuelven.',
  },
  'CONFIRMACION_TELEFONICA': {
    movement: 'CONFIRMACIÓN TELEFONICA',
    meaning: 'La racol inicia comunicación con el remitente y/o el destinatario porque salió novedad para así mismo continuar con su proceso logístico.',
  },
  'PARA_NUEVO_INTENTO_DE_ENTREGA': {
    movement: 'PARA NUEVO INTENTO DE ENTREGA',
    meaning: 'Se realiza telemercadeo y si se resuelve la novedad se programa un nuevo intento de entrega.',
  },
  'PARA_DEVOLVER_AL_REMITENTE': {
    movement: 'PARA DEVOLVER AL REMITENTE',
    meaning: 'Se realiza telemercadeo y no se resuelve la novedad se programa para devolución.',
  },
  'DEVUELTO_AL_REMITENTE': {
    movement: 'DEVUELTO AL REMITENTE',
    meaning: 'Se encuentra en el centro de Acopio pendiente por la generación de la guía 3 mil.',
  },
  'PRUEBA_DE_ENTREGA_DIGITALIZADA': {
    movement: 'PRUEBA DE ENTREGA DIGITALIZADA',
    meaning: 'Cuando es una guía que se hizo devolución, la prueba de entrega se visualiza en la guía "3 mil" de devolución. Cuando es una entrega exitosa la prueba de entrega se visualiza en la misma guía.',
  },
  'PRUEBA_DE_ENTREGA_ARCHIVADA': {
    movement: 'PRUEBA DE ENTREGA ARCHIVADA',
    meaning: 'Finaliza el proceso logístico de la guía.',
  },
  'PARA_RECLAMAR_EN_OFICINA': {
    movement: 'PARA RECLAMAR EN OFICINA',
    meaning: '15 días calendario para que se reclame en oficina a partir de la fecha de admisión.',
    maxDays: 15,
  },
  'EN_INVESTIGACION': {
    movement: 'EN INVESTIGACIÓN',
    meaning: 'Cuando se reporta un siniestro o incautación e inicia el proceso de investigación.',
    isCritical: true,
  },
};

/**
 * Estados de ENVÍA con sus significados
 */
export const ENVIA_STATUS_MAP: Record<string, EnviaStatusInfo> = {
  'PENDIENTE_CONFIRMACION': {
    dropiStatus: 'PENDIENTE CONFIRMACIÓN',
    carrierStatus: 'N/A',
    meaning: 'Orden creada automáticamente por integración con Dropify Dropshipper/Proveedor/Emprendedor.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'PENDIENTE': {
    dropiStatus: 'PENDIENTE',
    carrierStatus: 'N/A',
    meaning: 'Crea orden en Dropi, se genera cobro de flete pero aún no hay número de guía. Se genera la guía en la transportadora y se puede visualizar en Dropi (Aún no se ha recogido paquete).',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'GUIA_GENERADA': {
    dropiStatus: 'GUÍA GENERADA',
    carrierStatus: 'GENERADA',
    meaning: 'Se puede visualizar en Dropi (Aún no se ha recogido paquete).',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'SIN_MOVIMIENTOS': {
    dropiStatus: 'SIN MOVIMIENTOS',
    carrierStatus: 'PRODUCIDA',
    meaning: 'Pedido ha ingresado en bodega de transportadora por primera vez.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'GUIA_ANULADA': {
    dropiStatus: 'GUÍA ANULADA',
    carrierStatus: 'ANULADA',
    meaning: 'Se anula la guía, este proceso se solicita a Dropi (NO anular guías después de que la transportadora haya recibido el paquete).',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'DESPACHADA': {
    dropiStatus: 'DESPACHADA',
    carrierStatus: 'DESPACHADA',
    meaning: 'La guía va a ciudad de destino.',
    expectedDays: 2,
    alertAfterDays: 4,
  },
  'EN_TRANSITO': {
    dropiStatus: 'EN TRÁNSITO',
    carrierStatus: 'EN TRÁNSITO',
    meaning: 'Se despachó para ciudad destino, pero debe hacer una parada.',
    expectedDays: 2,
    alertAfterDays: 4,
  },
  'EN_BODEGA_DESTINO': {
    dropiStatus: 'EN BODEGA DESTINO',
    carrierStatus: 'EN BODEGA DESTINO',
    meaning: 'La guía llega a destino e ingresa al centro logístico destino.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'EN_REPARTO': {
    dropiStatus: 'EN REPARTO',
    carrierStatus: 'EN REPARTO',
    meaning: 'La guía está en zona de distribución para entrega.',
    expectedDays: 1,
    alertAfterDays: 1,
  },
  'ENTREGADA': {
    dropiStatus: 'ENTREGADA',
    carrierStatus: 'ENTREGADA',
    meaning: 'Guía entregada (en proceso de digitalización, hace falta subir al sistema el soporte de entregado).',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'ENTREGADA_DIGITALIZADA': {
    dropiStatus: 'ENTREGADA',
    carrierStatus: 'ENTREGADA',
    meaning: 'Guía entregada y digitalizada por Envía.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'NOVEDAD': {
    dropiStatus: 'NOVEDAD',
    carrierStatus: 'NOVEDAD',
    meaning: 'Guía con novedad.',
    expectedDays: 2,
    alertAfterDays: 2,
  },
  'EN_PROCESO_DE_INDEMNIZACION': {
    dropiStatus: 'EN PROCESO DE INDEMNIZACIÓN',
    carrierStatus: 'EN PROCESO DE INDEMNIZACIÓN',
    meaning: 'Guía reportada para indemnización.',
    expectedDays: 5,
    alertAfterDays: 7,
  },
  'INDEMNIZADA': {
    dropiStatus: '',
    carrierStatus: 'INDEMNIZADA',
    meaning: 'Guía indemnizada.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'DEVOLUCION': {
    dropiStatus: 'DEVOLUCIÓN',
    carrierStatus: 'DEVOLUCIÓN',
    meaning: 'Guía que no se pudo entregar, se genera un nuevo número de guía para devolver al remitente.',
    expectedDays: 3,
    alertAfterDays: 5,
  },
  'EN_ESPERA_DE_RX': {
    dropiStatus: 'EN ESPERA DE RX',
    carrierStatus: 'EN ESPERA DE RX',
    meaning: 'Guía en espera para ser asignada a una ruta (camión) aliado de entrega para llevar el paquete a una población lejana.',
    expectedDays: 2,
    alertAfterDays: 3,
  },
  'EN_REEXPEDICION': {
    dropiStatus: 'EN REEXPEDICIÓN',
    carrierStatus: 'EN REEXPEDICIÓN',
    meaning: 'Guía para una población lejana donde el servicio es tercerizado, el proceso de envío de esta guía llegará a bodega destino (centro logístico) y de bodega destino pasa a este estado ya la tiene el aliado.',
    expectedDays: 2,
    alertAfterDays: 3,
  },
  'EN_ESPERA_DE_RUTA_DOMESTICA': {
    dropiStatus: 'EN ESPERA DE RUTA DOMÉSTICA',
    carrierStatus: 'EN ESPERA DE RUTA DOMÉSTICA',
    meaning: 'En espera de salir en el camión siguiente para trayectos que se consideren domésticos / entre municipios.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'NOVEDAD_SOLUCIONADA': {
    dropiStatus: 'NOVEDAD SOLUCIONADA',
    carrierStatus: 'SOLUCIONADA EN MALLA',
    meaning: 'Guía que se le resolvió la novedad (de aquí debe pasar a reparto).',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'ORIGEN_DOMESTICO': {
    dropiStatus: '',
    carrierStatus: 'ORIGEN DOMÉSTICO',
    meaning: 'En espera desde lo que llega de un destino.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'MERCANCIA': {
    dropiStatus: '',
    carrierStatus: 'MERCANCÍA',
    meaning: 'Guía recogida en origen que ha sido montada.',
    expectedDays: 1,
    alertAfterDays: 2,
  },
  'REDIRECCIONADO': {
    dropiStatus: 'REDIRECCIONADO',
    carrierStatus: 'REDIRECCIONADO',
    meaning: 'Guía que se solicita cambiar de ciudad (tiene costo).',
    expectedDays: 2,
    alertAfterDays: 3,
  },
  'CANCELADO': {
    dropiStatus: 'CANCELADO',
    carrierStatus: 'N/A',
    meaning: 'Orden en estatus pendiente ha sido cancelada por orden.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'RECHAZADO': {
    dropiStatus: 'RECHAZADO',
    carrierStatus: 'N/A',
    meaning: 'Orden y guía anulada por servicio al cliente Dropi.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
  'ENTREGADA_CON_OBSERVACION': {
    dropiStatus: 'ENTREGADA',
    carrierStatus: 'ENTREGADA CON OBSERVACIÓN',
    meaning: 'Paquete que se entrega con observación o avería.',
    expectedDays: 0,
    alertAfterDays: 0,
  },
};

// ============================================
// NOVELTY TYPES AND RESOLUTIONS
// Based on Coordinadora specifications
// ============================================

export interface NoveltyResolution {
  novelty: string;
  meaning: string;
  resolution: string;
  doNot: string;
  whoResolves: 'USUARIO DROPI' | 'TRANSPORTADORA' | 'CLIENTE';
}

export const COORDINADORA_NOVELTIES: NoveltyResolution[] = [
  {
    novelty: 'SECTOR DE LA POBLACIÓN DE DESTINO QUE NO SE CUBRE',
    meaning: 'Paquete enviado a un corregimiento, finca, vereda o zona roja donde la transportadora no ofrece el servicio.',
    resolution: 'Enviar a la oficina principal de Coordinadora más cercana al lugar en donde se encuentra el envío, para que el cliente pase a recoger su paquete, no se cubren ni fincas ni veredas. Se puede brindar una dirección urbana y hacer el ofrecimiento allí.',
    doNot: 'Volver a ofrecer sin aportar nueva dirección o información adicional.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'EN PUNTO DROP',
    meaning: 'El paquete se envía a una oficina de Coordinadora para ser reclamada, aplica para las guías sin o con recaudo.',
    resolution: 'Unidad se encuentra en un punto Coordinadora para reclamar.',
    doNot: 'Volver a ofrecer, porque el cliente va hasta el punto.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'DIRECCIÓN INCOMPLETA',
    meaning: 'Cuando hacen falta datos de la dirección y no es posible localizar el punto de entrega.',
    resolution: 'Confirmar con el cliente final la nueva dirección completa, incluyendo barrio y ciudad y punto de referencia si es necesario (sobre todo en la región Caribe).',
    doNot: 'Brindar solución de ofrecer en la misma dirección porque faltan datos.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'SE VISITA, NO SE LOGRA ENTREGA',
    meaning: 'Es cuando vamos y está cerrado o nadie sale. Cliente no se encuentra para entregar el envío y no cuenta con portería. Si ya van 2 intentos confirmar con el cliente. El tercer intento debe ser autorizado por el cliente.',
    resolution: 'Confirmar con el destinatario día y jornada (mañana o tarde) para la entrega, máximo cinco días para volver a ofrecer. Dar solución: Autorización tercer intento de entrega.',
    doNot: 'No dar solución de volver a ofrecer sin antes validar con el cliente cuando se le puede entregar.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'NO SE LOCALIZA DIRECCIÓN DEL DESTINATARIO',
    meaning: 'Dirección errada. Confirmar con el destinatario datos para entrega. La dirección no se puede ubicar. Debe confirmar con el cliente la dirección, si es la misma especificar y dar más información.',
    resolution: 'Confirmar con el cliente final la nueva dirección completa, incluyendo barrio y ciudad y punto de referencia si es necesario (sobre todo en la región Caribe).',
    doNot: 'Volver a ofrecer en la misma dirección.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'EN DIRECCIÓN DE ENTREGA NO CONOCEN DESTINATARIO',
    meaning: 'No hay una persona referente para entrega de los paquetes o nombre de bodega para hacer efectiva la entrega. Se visita la dirección de la guía e indican no conocer al destinatario.',
    resolution: 'Confirmar dirección con el cliente y el nombre de la persona que va a recibir el paquete, puede ser diferente al titular de la guía.',
    doNot: 'No dar solución de ofrecer en la misma dirección sin validar los datos primero.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'NO SE ENTREGA, DESTINATARIO SOLICITA OTRA DIRECCIÓN',
    meaning: 'Es cuando vamos a la dirección que tenemos en la guía y el destinatario solicita que se entregue en otra.',
    resolution: 'Confirmar la nueva dirección. Ejemplo entregar en dirección CRA 53 #13A 147 APT 202 L.',
    doNot: 'Solucionar con la misma dirección.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'NO SE ENTREGA, DESTINATARIO SOLICITA INVENTARIO, UNIDADES SELLADAS',
    meaning: 'El cliente quiere abrir el paquete antes de pagar el recaudo. El cliente quiere abrir el paquete antes de que el mensajero se retire.',
    resolution: 'Se valida con el cliente y acepta recibir sin hacer inventario.',
    doNot: 'Brindar solución de volver a ofrecer al mismo destino e informar que no entregan inventariado.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'CITA PROGRAMADA PARA ENTREGA',
    meaning: 'El cliente confirma día y hora de entrega, se intenta realizar entrega en ese tiempo.',
    resolution: 'Confirmar con el destinatario día y jornada (mañana o tarde) para la entrega, máximo cinco días para volver a ofrecer.',
    doNot: 'No dar solución de volver a ofrecer sin validar cita para entrega.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'AGENDAR CITA PARA ENTREGA',
    meaning: 'Se va o llamar al cliente para confirmar día y hora de entrega.',
    resolution: 'Con los destinatarios persona natural no se agendan citas para entrega / No aplica.',
    doNot: 'No dar solución de volver a ofrecer sin validar cita para entrega.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'DEVOLUCIÓN EN PROCESO',
    meaning: 'El paquete está proceso de devolución al remitente.',
    resolution: 'El paquete se devolverá / No responder novedad.',
    doNot: 'No se debe volver a ofrecer ya el paquete se devolverá.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'INFORMACIÓN SOPORTE DEL ENVÍO CON NOVEDAD NO DETERIORO (OC / FACT / REM)',
    meaning: 'Cliente solicita factura. El cliente va a reclamar directamente en oficina principal. El cliente desconoce el pedido.',
    resolution: 'Si el cliente va a reclamar en oficina, detallar cuál oficina es y en lo posible la dirección. Si el cliente pide factura, informar al cliente que no se entrega y si acepta, volver a ofrecer. Si el cliente desconoce el pedido, confirmar con el destinatario si solicitó o no el pedido y volver a ofrecer.',
    doNot: 'No dar solución de volver a ofrecer sin validar: Recibir en oficina o que el pedido no se entrega con factura.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'PEDIDO CANCELADO',
    meaning: 'Destinatario informa que no quiere el pedido.',
    resolution: 'Pedido cancelado o cliente no cancela el flete, llamar al destinatario y validar si se vuelve a ofrecer o se devuelve al remitente.',
    doNot: 'No dar solución de volver a ofrecer sin antes validar con el cliente si definitivamente quiere el pedido.',
    whoResolves: 'USUARIO DROPI',
  },
  {
    novelty: 'NO SE ENTREGA, EL DESTINATARIO NO CANCELA EL VALOR A RECAUDAR. RCE: RECAUDO CONTRA ENTREGA',
    meaning: 'Cliente no tiene dinero para cancelar el valor del producto.',
    resolution: 'Confirmar con el cliente el monto a pagar y recomendar que tenga el dinero en efectivo para pagar.',
    doNot: 'No dar solución de volver a ofrecer sin antes validar qué día el cliente ya tiene el dinero.',
    whoResolves: 'USUARIO DROPI',
  },
];

// ============================================
// GUIDE LINKING SYSTEM TYPES
// ============================================

export interface GuideHistoryEvent {
  timestamp: string;
  status: string;
  carrierStatus: string;
  location?: string;
  description: string;
  daysInStatus: number;
  source: 'AUTO' | 'MANUAL' | 'CARRIER_API';
}

export interface LinkedGuide {
  guia: string;
  transportadora: CarrierName;
  historial: GuideHistoryEvent[];
  novedadesRegistradas: NoveltyRecord[];
  intentosEntrega: number;
  tiempoTotalTransito: string;
  scoreRiesgo: number;
  estadoActual: string;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
  telefono?: string;
  ciudadDestino?: string;
  ciudadOrigen?: string;
  valorRecaudo?: number;
  cliente?: string;
  vertical?: 'Home' | 'Fashion' | 'Travel' | 'Tech' | 'Beauty' | 'Other';
}

export interface NoveltyRecord {
  id: string;
  tipo: string;
  descripcion: string;
  fechaRegistro: string;
  fechaResolucion?: string;
  estado: 'PENDIENTE' | 'EN_GESTION' | 'RESUELTA' | 'ESCALADA';
  agente?: string;
  solucionAplicada?: string;
  notasInternas?: string;
}

// ============================================
// ALERT SYSTEM TYPES
// ============================================

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertCategory =
  | 'SIN_MOVIMIENTO'
  | 'RECOLECCION_PENDIENTE'
  | 'NOVEDAD_SIN_RESOLVER'
  | 'INTENTOS_FALLIDOS'
  | 'ZONA_ROJA'
  | 'TRANSITO_LENTO'
  | 'DESTINO_PROBLEMATICO'
  | 'HORARIO_CRITICO'
  | 'PUNTO_DROOP'
  | 'RECAUDO_PENDIENTE';

export interface IntelligenceAlert {
  id: string;
  guia: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  suggestedAction: string;
  createdAt: string;
  resolvedAt?: string;
  isResolved: boolean;
  assignedTo?: string;
  scoreImpact: number;
}

export interface AlertThresholds {
  diasSinMovimientoAlerta: number;
  horasNovedadSinResolver: number;
  scoreMinimoPorAlerta: number;
  intentosMaximosAntesDevolucion: number;
  diasMaximoPuntoDropo: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  diasSinMovimientoAlerta: 3,
  horasNovedadSinResolver: 24,
  scoreMinimoPorAlerta: 70,
  intentosMaximosAntesDevolucion: 3,
  diasMaximoPuntoDropo: 5,
};

// ============================================
// RISK SCORING SYSTEM
// ============================================

export interface RiskScoreBreakdown {
  diasSinMovimiento: number;      // +20 puntos por día
  intentosFallidos: number;       // +30 puntos por intento
  novedadAbierta: number;         // +25 puntos
  ciudadProblematica: number;     // +15 puntos
  transportadoraProblematica: number; // +10 puntos
  valorAltoRecaudo: number;       // +5 puntos si > 500k
  horasCriticas: number;          // +10 puntos si viernes tarde
  total: number;
}

export interface RiskScore {
  score: number;
  level: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  breakdown: RiskScoreBreakdown;
  lastCalculated: string;
}

// ============================================
// FILTER SYSTEM TYPES
// ============================================

export interface GuideFilters {
  // Basic filters
  estados: string[];
  transportadoras: CarrierName[];
  fechaInicio?: string;
  fechaFin?: string;
  ciudadOrigen?: string;
  ciudadDestino?: string;
  tieneNovedad?: boolean;
  numeroGuia?: string;

  // Advanced filters
  diasSinMovimiento?: { min: number; max: number };
  scoreRiesgo?: { min: number; max: number };
  intentosEntrega?: number[];
  tiposNovedad?: string[];
  rangoRecaudo?: { min: number; max: number };
  vertical?: string[];

  // Quick filters
  soloUrgentes?: boolean;
  soloPuntoDropo?: boolean;
  soloRiesgoDevolucion?: boolean;
}

export interface SavedView {
  id: string;
  name: string;
  icon: string;
  filters: GuideFilters;
  isSystem: boolean;
  createdAt: string;
  createdBy?: string;
}

export const DEFAULT_SAVED_VIEWS: SavedView[] = [
  {
    id: 'urgentes',
    name: 'Urgentes',
    icon: '🚨',
    filters: { scoreRiesgo: { min: 80, max: 100 }, estados: [], transportadoras: [] },
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sin-movimiento',
    name: 'Sin Movimiento',
    icon: '⏰',
    filters: { diasSinMovimiento: { min: 3, max: 30 }, estados: [], transportadoras: [] },
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'riesgo-devolucion',
    name: 'Riesgo Devolución',
    icon: '🔄',
    filters: { intentosEntrega: [2, 3], estados: [], transportadoras: [] },
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'punto-droop',
    name: 'Punto Droop',
    icon: '📍',
    filters: { soloPuntoDropo: true, estados: [], transportadoras: [] },
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'recaudos-pendientes',
    name: 'Recaudos Pendientes',
    icon: '💰',
    filters: { tiposNovedad: ['NO_CANCELA_RECAUDO'], estados: [], transportadoras: [] },
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// AI RECOMMENDATION TYPES
// ============================================

export interface NoveltyRecommendation {
  noveltyType: string;
  automaticRecommendation: string;
  whatsappTemplate: string;
  ticketTemplate: string;
  escalationTemplate?: string;
  doNotDo: string[];
  successRate?: number;
}

export interface AIRecommendationResult {
  recommendation: string;
  confidence: number;
  source: 'MATRIX' | 'AI' | 'FALLBACK';
  templates: {
    whatsapp: string;
    ticket: string;
    escalation?: string;
  };
  suggestedActions: string[];
  estimatedResolutionTime: string;
}

// ============================================
// METRICS AND KPI TYPES
// ============================================

export interface DailyMetrics {
  fecha: string;
  guiasActivas: number;
  guiasEnRiesgo: number;
  novedadesPendientes: number;
  tasaEntregaDia: number;
  tiempoPromedioTransito: number;
  devolucionesEnProceso: number;
  scoreSatisfaccion?: number;
}

export interface CarrierMetrics {
  transportadora: CarrierName;
  guiasActivas: number;
  tasaExito: number;
  tiempoPromedio: number;
  novedadesActivas: number;
  tendencia: 'UP' | 'DOWN' | 'STABLE';
  cambioVsSemanaAnterior: number;
}

export interface CityMetrics {
  ciudad: string;
  guiasActivas: number;
  tasaExito: number;
  tiempoPromedio: number;
  esProblematica: boolean;
  mejorTransportadora: CarrierName;
  peorTransportadora: CarrierName;
}

export interface IntelligenceKPIs {
  tasaEntregaExitosa: number;        // Meta: 85%
  tasaDevoluciones: number;          // Meta: <8%
  tiempoPromedioResolucionNovedades: number;  // En horas
  tasaRecoleccionMenos24h: number;   // Meta: >90%
  npsLogistico: number;              // -100 a 100
  costoPorEntregaFallida: number;    // En COP
}

// ============================================
// REPORT TYPES
// ============================================

export interface IntelligenceReport {
  tipo: 'DIARIO' | 'SEMANAL' | 'MENSUAL';
  fechaGeneracion: string;
  periodoInicio: string;
  periodoFin: string;

  resumenEjecutivo: {
    totalGuias: number;
    entregasExitosas: number;
    devoluciones: number;
    novedadesGestionadas: number;
    alertasCriticas: number;
    recomendacionPrincipal: string;
  };

  kpis: IntelligenceKPIs;

  metricsTransportadoras: CarrierMetrics[];
  metricsCiudades: CityMetrics[];

  patronesDetectados: {
    tipo: string;
    descripcion: string;
    impacto: number;
    recomendacion: string;
  }[];

  proyecciones: {
    volumenProximo7Dias: number;
    novedadesEsperadas: number;
    cargaTrabajoEstimada: number;
  };
}

// ============================================
// TYPE HELPERS
// ============================================

export interface CoordinadoraStatusInfo {
  dropiStatus: string;
  carrierStatus: string;
  meaning: string;
  expectedDays: number;
  alertAfterDays: number;
  contactEmails?: string[];
}

export interface InterrapidisimoStatusInfo {
  dropiStatus: string;
  carrierStatus: string;
  meaning: string;
  expectedDays: number;
  alertAfterDays: number;
  isCritical?: boolean;
  deliveryAttempt?: number;
  maxDaysInOffice?: number;
}

export interface MovementInfo {
  movement: string;
  meaning: string;
  isCritical?: boolean;
  maxDays?: number;
}

export interface EnviaStatusInfo {
  dropiStatus: string;
  carrierStatus: string;
  meaning: string;
  expectedDays: number;
  alertAfterDays: number;
}

// ============================================
// STORAGE KEYS FOR INTELLIGENCE MODULE
// ============================================

export const INTELLIGENCE_STORAGE_KEYS = {
  LINKED_GUIDES: 'litper_intelligence_linked_guides',
  ALERTS: 'litper_intelligence_alerts',
  SAVED_VIEWS: 'litper_intelligence_saved_views',
  METRICS_CACHE: 'litper_intelligence_metrics_cache',
  ALERT_THRESHOLDS: 'litper_intelligence_alert_thresholds',
  LAST_SYNC: 'litper_intelligence_last_sync',
} as const;

// ============================================
// CARRIER STATUS INFO HELPER
// ============================================

export interface CarrierStatusResult {
  status: string;
  description: string;
  isDelivered: boolean;
  hasNovelty: boolean;
  category: string;
}

export const getCarrierStatusInfo = (
  carrier: string,
  carrierStatus: string
): CarrierStatusResult | null => {
  const statusKey = carrierStatus?.toUpperCase?.()?.trim?.() || '';

  if (carrier === 'COORDINADORA' || carrier === 'Coordinadora') {
    const info = COORDINADORA_STATUS_MAP[statusKey];
    if (info) {
      return {
        status: info.status,
        description: info.description,
        isDelivered: info.status === 'DELIVERED',
        hasNovelty: info.status === 'ISSUE' || info.status === 'RETURNED',
        category: info.category,
      };
    }
  }

  if (carrier === 'INTERRAPIDISIMO' || carrier === 'Interrapidisimo') {
    const info = INTERRAPIDISIMO_STATUS_MAP[statusKey];
    if (info) {
      return {
        status: info.status,
        description: info.description,
        isDelivered: info.status === 'DELIVERED',
        hasNovelty: info.status === 'ISSUE' || info.status === 'RETURNED',
        category: info.category,
      };
    }
  }

  if (carrier === 'ENVIA' || carrier === 'Envía' || carrier === 'Envia') {
    const info = ENVIA_STATUS_MAP[statusKey];
    if (info) {
      return {
        status: info.status,
        description: info.description,
        isDelivered: info.status === 'DELIVERED',
        hasNovelty: info.status === 'ISSUE' || info.status === 'RETURNED',
        category: info.category,
      };
    }
  }

  // Default fallback
  return {
    status: 'UNKNOWN',
    description: carrierStatus || 'Estado desconocido',
    isDelivered: false,
    hasNovelty: false,
    category: 'unknown',
  };
};
