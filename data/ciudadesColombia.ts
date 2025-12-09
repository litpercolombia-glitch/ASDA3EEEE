/**
 * Lista completa de ciudades de Colombia
 * Incluye departamentos y códigos DANE para autocompletado inteligente
 */

export interface CiudadColombia {
  nombre: string;
  departamento: string;
  codigoDane?: string;
  poblacion?: number;
  esCapital?: boolean;
}

export const CIUDADES_COLOMBIA: CiudadColombia[] = [
  // AMAZONAS
  { nombre: 'Leticia', departamento: 'Amazonas', esCapital: true, poblacion: 48144 },
  { nombre: 'Puerto Nariño', departamento: 'Amazonas', poblacion: 8988 },

  // ANTIOQUIA
  { nombre: 'Medellín', departamento: 'Antioquia', esCapital: true, poblacion: 2569007 },
  { nombre: 'Bello', departamento: 'Antioquia', poblacion: 533936 },
  { nombre: 'Itagüí', departamento: 'Antioquia', poblacion: 279894 },
  { nombre: 'Envigado', departamento: 'Antioquia', poblacion: 232272 },
  { nombre: 'Apartadó', departamento: 'Antioquia', poblacion: 195853 },
  { nombre: 'Turbo', departamento: 'Antioquia', poblacion: 178134 },
  { nombre: 'Rionegro', departamento: 'Antioquia', poblacion: 127835 },
  { nombre: 'Caucasia', departamento: 'Antioquia', poblacion: 123304 },
  { nombre: 'Copacabana', departamento: 'Antioquia', poblacion: 77828 },
  { nombre: 'La Estrella', departamento: 'Antioquia', poblacion: 67096 },
  { nombre: 'Sabaneta', departamento: 'Antioquia', poblacion: 53479 },
  { nombre: 'Caldas', departamento: 'Antioquia', poblacion: 83000 },
  { nombre: 'Girardota', departamento: 'Antioquia', poblacion: 58000 },
  { nombre: 'Barbosa', departamento: 'Antioquia', poblacion: 55000 },
  { nombre: 'El Carmen de Viboral', departamento: 'Antioquia', poblacion: 52000 },
  { nombre: 'Marinilla', departamento: 'Antioquia', poblacion: 58000 },
  { nombre: 'La Ceja', departamento: 'Antioquia', poblacion: 58000 },
  { nombre: 'El Retiro', departamento: 'Antioquia', poblacion: 20000 },
  { nombre: 'Guarne', departamento: 'Antioquia', poblacion: 52000 },
  { nombre: 'El Santuario', departamento: 'Antioquia', poblacion: 28000 },
  { nombre: 'Santa Rosa de Osos', departamento: 'Antioquia', poblacion: 37000 },
  { nombre: 'Yarumal', departamento: 'Antioquia', poblacion: 48000 },
  { nombre: 'Don Matías', departamento: 'Antioquia', poblacion: 23000 },
  { nombre: 'Chigorodó', departamento: 'Antioquia', poblacion: 85000 },
  { nombre: 'Carepa', departamento: 'Antioquia', poblacion: 62000 },
  { nombre: 'Necoclí', departamento: 'Antioquia', poblacion: 70000 },
  { nombre: 'San Pedro de los Milagros', departamento: 'Antioquia', poblacion: 28000 },
  { nombre: 'Segovia', departamento: 'Antioquia', poblacion: 42000 },
  { nombre: 'Remedios', departamento: 'Antioquia', poblacion: 32000 },
  { nombre: 'Puerto Berrío', departamento: 'Antioquia', poblacion: 52000 },
  { nombre: 'Andes', departamento: 'Antioquia', poblacion: 48000 },
  { nombre: 'Ciudad Bolívar', departamento: 'Antioquia', poblacion: 30000 },
  { nombre: 'Jardín', departamento: 'Antioquia', poblacion: 14000 },
  { nombre: 'Jericó', departamento: 'Antioquia', poblacion: 12000 },
  { nombre: 'Fredonia', departamento: 'Antioquia', poblacion: 22000 },
  { nombre: 'Santa Fe de Antioquia', departamento: 'Antioquia', poblacion: 27000 },
  { nombre: 'Sopetrán', departamento: 'Antioquia', poblacion: 15000 },
  { nombre: 'San Jerónimo', departamento: 'Antioquia', poblacion: 14000 },

  // ARAUCA
  { nombre: 'Arauca', departamento: 'Arauca', esCapital: true, poblacion: 94287 },
  { nombre: 'Saravena', departamento: 'Arauca', poblacion: 52832 },
  { nombre: 'Tame', departamento: 'Arauca', poblacion: 58000 },
  { nombre: 'Arauquita', departamento: 'Arauca', poblacion: 45000 },
  { nombre: 'Fortul', departamento: 'Arauca', poblacion: 28000 },

  // ATLÁNTICO
  { nombre: 'Barranquilla', departamento: 'Atlántico', esCapital: true, poblacion: 1274250 },
  { nombre: 'Soledad', departamento: 'Atlántico', poblacion: 685534 },
  { nombre: 'Malambo', departamento: 'Atlántico', poblacion: 135519 },
  { nombre: 'Sabanalarga', departamento: 'Atlántico', poblacion: 105000 },
  { nombre: 'Baranoa', departamento: 'Atlántico', poblacion: 62000 },
  { nombre: 'Galapa', departamento: 'Atlántico', poblacion: 55000 },
  { nombre: 'Puerto Colombia', departamento: 'Atlántico', poblacion: 35000 },
  { nombre: 'Santo Tomás', departamento: 'Atlántico', poblacion: 28000 },
  { nombre: 'Palmar de Varela', departamento: 'Atlántico', poblacion: 32000 },
  { nombre: 'Campo de la Cruz', departamento: 'Atlántico', poblacion: 22000 },

  // BOGOTÁ D.C.
  { nombre: 'Bogotá', departamento: 'Bogotá D.C.', esCapital: true, poblacion: 7901653 },
  { nombre: 'Bogotá D.C.', departamento: 'Bogotá D.C.', esCapital: true, poblacion: 7901653 },

  // BOLÍVAR
  { nombre: 'Cartagena', departamento: 'Bolívar', esCapital: true, poblacion: 1057767 },
  { nombre: 'Magangué', departamento: 'Bolívar', poblacion: 128000 },
  { nombre: 'Turbaco', departamento: 'Bolívar', poblacion: 80000 },
  { nombre: 'Arjona', departamento: 'Bolívar', poblacion: 75000 },
  { nombre: 'El Carmen de Bolívar', departamento: 'Bolívar', poblacion: 78000 },
  { nombre: 'San Juan Nepomuceno', departamento: 'Bolívar', poblacion: 36000 },
  { nombre: 'María la Baja', departamento: 'Bolívar', poblacion: 52000 },
  { nombre: 'Mompox', departamento: 'Bolívar', poblacion: 45000 },
  { nombre: 'San Jacinto', departamento: 'Bolívar', poblacion: 25000 },

  // BOYACÁ
  { nombre: 'Tunja', departamento: 'Boyacá', esCapital: true, poblacion: 202996 },
  { nombre: 'Duitama', departamento: 'Boyacá', poblacion: 115000 },
  { nombre: 'Sogamoso', departamento: 'Boyacá', poblacion: 114000 },
  { nombre: 'Chiquinquirá', departamento: 'Boyacá', poblacion: 68000 },
  { nombre: 'Paipa', departamento: 'Boyacá', poblacion: 35000 },
  { nombre: 'Puerto Boyacá', departamento: 'Boyacá', poblacion: 55000 },
  { nombre: 'Villa de Leyva', departamento: 'Boyacá', poblacion: 18000 },
  { nombre: 'Moniquirá', departamento: 'Boyacá', poblacion: 25000 },
  { nombre: 'Garagoa', departamento: 'Boyacá', poblacion: 18000 },
  { nombre: 'Samacá', departamento: 'Boyacá', poblacion: 22000 },
  { nombre: 'Tibasosa', departamento: 'Boyacá', poblacion: 15000 },
  { nombre: 'Nobsa', departamento: 'Boyacá', poblacion: 18000 },
  { nombre: 'Santa Rosa de Viterbo', departamento: 'Boyacá', poblacion: 15000 },

  // CALDAS
  { nombre: 'Manizales', departamento: 'Caldas', esCapital: true, poblacion: 434403 },
  { nombre: 'La Dorada', departamento: 'Caldas', poblacion: 80000 },
  { nombre: 'Chinchiná', departamento: 'Caldas', poblacion: 52000 },
  { nombre: 'Villamaría', departamento: 'Caldas', poblacion: 62000 },
  { nombre: 'Anserma', departamento: 'Caldas', poblacion: 35000 },
  { nombre: 'Riosucio', departamento: 'Caldas', poblacion: 65000 },
  { nombre: 'Supía', departamento: 'Caldas', poblacion: 28000 },
  { nombre: 'Aguadas', departamento: 'Caldas', poblacion: 22000 },
  { nombre: 'Pácora', departamento: 'Caldas', poblacion: 14000 },
  { nombre: 'Salamina', departamento: 'Caldas', poblacion: 17000 },
  { nombre: 'Neira', departamento: 'Caldas', poblacion: 32000 },
  { nombre: 'Palestina', departamento: 'Caldas', poblacion: 18000 },

  // CAQUETÁ
  { nombre: 'Florencia', departamento: 'Caquetá', esCapital: true, poblacion: 187479 },
  { nombre: 'San Vicente del Caguán', departamento: 'Caquetá', poblacion: 75000 },
  { nombre: 'Puerto Rico', departamento: 'Caquetá', poblacion: 35000 },
  { nombre: 'El Doncello', departamento: 'Caquetá', poblacion: 22000 },
  { nombre: 'El Paujil', departamento: 'Caquetá', poblacion: 20000 },
  { nombre: 'Cartagena del Chairá', departamento: 'Caquetá', poblacion: 38000 },
  { nombre: 'Belén de los Andaquíes', departamento: 'Caquetá', poblacion: 12000 },

  // CASANARE
  { nombre: 'Yopal', departamento: 'Casanare', esCapital: true, poblacion: 169000 },
  { nombre: 'Aguazul', departamento: 'Casanare', poblacion: 45000 },
  { nombre: 'Tauramena', departamento: 'Casanare', poblacion: 25000 },
  { nombre: 'Villanueva', departamento: 'Casanare', poblacion: 32000 },
  { nombre: 'Paz de Ariporo', departamento: 'Casanare', poblacion: 35000 },
  { nombre: 'Monterrey', departamento: 'Casanare', poblacion: 18000 },

  // CAUCA
  { nombre: 'Popayán', departamento: 'Cauca', esCapital: true, poblacion: 318059 },
  { nombre: 'Santander de Quilichao', departamento: 'Cauca', poblacion: 105000 },
  { nombre: 'Puerto Tejada', departamento: 'Cauca', poblacion: 48000 },
  { nombre: 'Piendamó', departamento: 'Cauca', poblacion: 45000 },
  { nombre: 'El Bordo', departamento: 'Cauca', poblacion: 35000 },
  { nombre: 'Corinto', departamento: 'Cauca', poblacion: 35000 },
  { nombre: 'Miranda', departamento: 'Cauca', poblacion: 45000 },
  { nombre: 'Guapi', departamento: 'Cauca', poblacion: 32000 },
  { nombre: 'Timbío', departamento: 'Cauca', poblacion: 38000 },
  { nombre: 'Silvia', departamento: 'Cauca', poblacion: 35000 },

  // CESAR
  { nombre: 'Valledupar', departamento: 'Cesar', esCapital: true, poblacion: 493342 },
  { nombre: 'Aguachica', departamento: 'Cesar', poblacion: 105000 },
  { nombre: 'Codazzi', departamento: 'Cesar', poblacion: 65000 },
  { nombre: 'Bosconia', departamento: 'Cesar', poblacion: 38000 },
  { nombre: 'La Jagua de Ibirico', departamento: 'Cesar', poblacion: 25000 },
  { nombre: 'Curumaní', departamento: 'Cesar', poblacion: 32000 },
  { nombre: 'Chimichagua', departamento: 'Cesar', poblacion: 35000 },
  { nombre: 'El Copey', departamento: 'Cesar', poblacion: 28000 },
  { nombre: 'San Alberto', departamento: 'Cesar', poblacion: 28000 },
  { nombre: 'San Martín', departamento: 'Cesar', poblacion: 22000 },

  // CHOCÓ
  { nombre: 'Quibdó', departamento: 'Chocó', esCapital: true, poblacion: 130825 },
  { nombre: 'Istmina', departamento: 'Chocó', poblacion: 28000 },
  { nombre: 'Tadó', departamento: 'Chocó', poblacion: 22000 },
  { nombre: 'Condoto', departamento: 'Chocó', poblacion: 18000 },
  { nombre: 'Riosucio', departamento: 'Chocó', poblacion: 35000 },
  { nombre: 'Bahía Solano', departamento: 'Chocó', poblacion: 12000 },
  { nombre: 'Nuquí', departamento: 'Chocó', poblacion: 10000 },

  // CÓRDOBA
  { nombre: 'Montería', departamento: 'Córdoba', esCapital: true, poblacion: 505334 },
  { nombre: 'Lorica', departamento: 'Córdoba', poblacion: 125000 },
  { nombre: 'Cereté', departamento: 'Córdoba', poblacion: 95000 },
  { nombre: 'Sahagún', departamento: 'Córdoba', poblacion: 100000 },
  { nombre: 'Ciénaga de Oro', departamento: 'Córdoba', poblacion: 72000 },
  { nombre: 'Planeta Rica', departamento: 'Córdoba', poblacion: 75000 },
  { nombre: 'Montelíbano', departamento: 'Córdoba', poblacion: 85000 },
  { nombre: 'Tierralta', departamento: 'Córdoba', poblacion: 105000 },
  { nombre: 'San Pelayo', departamento: 'Córdoba', poblacion: 48000 },
  { nombre: 'San Bernardo del Viento', departamento: 'Córdoba', poblacion: 38000 },
  { nombre: 'San Andrés de Sotavento', departamento: 'Córdoba', poblacion: 45000 },
  { nombre: 'Chinú', departamento: 'Córdoba', poblacion: 52000 },
  { nombre: 'Puerto Libertador', departamento: 'Córdoba', poblacion: 48000 },

  // CUNDINAMARCA
  { nombre: 'Soacha', departamento: 'Cundinamarca', poblacion: 753548 },
  { nombre: 'Facatativá', departamento: 'Cundinamarca', poblacion: 148000 },
  { nombre: 'Zipaquirá', departamento: 'Cundinamarca', poblacion: 132000 },
  { nombre: 'Chía', departamento: 'Cundinamarca', poblacion: 142000 },
  { nombre: 'Fusagasugá', departamento: 'Cundinamarca', poblacion: 145000 },
  { nombre: 'Mosquera', departamento: 'Cundinamarca', poblacion: 120000 },
  { nombre: 'Madrid', departamento: 'Cundinamarca', poblacion: 95000 },
  { nombre: 'Funza', departamento: 'Cundinamarca', poblacion: 85000 },
  { nombre: 'Cajicá', departamento: 'Cundinamarca', poblacion: 75000 },
  { nombre: 'Girardot', departamento: 'Cundinamarca', poblacion: 108000 },
  { nombre: 'Cota', departamento: 'Cundinamarca', poblacion: 32000 },
  { nombre: 'Sopó', departamento: 'Cundinamarca', poblacion: 32000 },
  { nombre: 'Tocancipá', departamento: 'Cundinamarca', poblacion: 42000 },
  { nombre: 'Gachancipá', departamento: 'Cundinamarca', poblacion: 18000 },
  { nombre: 'Tabio', departamento: 'Cundinamarca', poblacion: 32000 },
  { nombre: 'Tenjo', departamento: 'Cundinamarca', poblacion: 24000 },
  { nombre: 'La Calera', departamento: 'Cundinamarca', poblacion: 32000 },
  { nombre: 'Sibaté', departamento: 'Cundinamarca', poblacion: 45000 },
  { nombre: 'Silvania', departamento: 'Cundinamarca', poblacion: 25000 },
  { nombre: 'Arbeláez', departamento: 'Cundinamarca', poblacion: 14000 },
  { nombre: 'La Mesa', departamento: 'Cundinamarca', poblacion: 35000 },
  { nombre: 'Anapoima', departamento: 'Cundinamarca', poblacion: 15000 },
  { nombre: 'Villeta', departamento: 'Cundinamarca', poblacion: 28000 },
  { nombre: 'Ubaté', departamento: 'Cundinamarca', poblacion: 42000 },
  { nombre: 'Pacho', departamento: 'Cundinamarca', poblacion: 28000 },
  { nombre: 'Chocontá', departamento: 'Cundinamarca', poblacion: 25000 },
  { nombre: 'Villapinzón', departamento: 'Cundinamarca', poblacion: 22000 },
  { nombre: 'Nemocón', departamento: 'Cundinamarca', poblacion: 14000 },
  { nombre: 'Cogua', departamento: 'Cundinamarca', poblacion: 25000 },
  { nombre: 'El Rosal', departamento: 'Cundinamarca', poblacion: 22000 },
  { nombre: 'Subachoque', departamento: 'Cundinamarca', poblacion: 18000 },
  { nombre: 'Guatavita', departamento: 'Cundinamarca', poblacion: 8000 },
  { nombre: 'Sesquilé', departamento: 'Cundinamarca', poblacion: 14000 },
  { nombre: 'Suesca', departamento: 'Cundinamarca', poblacion: 18000 },

  // GUAINÍA
  { nombre: 'Inírida', departamento: 'Guainía', esCapital: true, poblacion: 23000 },

  // GUAVIARE
  { nombre: 'San José del Guaviare', departamento: 'Guaviare', esCapital: true, poblacion: 76000 },
  { nombre: 'El Retorno', departamento: 'Guaviare', poblacion: 25000 },
  { nombre: 'Calamar', departamento: 'Guaviare', poblacion: 15000 },

  // HUILA
  { nombre: 'Neiva', departamento: 'Huila', esCapital: true, poblacion: 357392 },
  { nombre: 'Pitalito', departamento: 'Huila', poblacion: 135000 },
  { nombre: 'Garzón', departamento: 'Huila', poblacion: 95000 },
  { nombre: 'La Plata', departamento: 'Huila', poblacion: 68000 },
  { nombre: 'Campoalegre', departamento: 'Huila', poblacion: 38000 },
  { nombre: 'Palermo', departamento: 'Huila', poblacion: 35000 },
  { nombre: 'San Agustín', departamento: 'Huila', poblacion: 35000 },
  { nombre: 'Isnos', departamento: 'Huila', poblacion: 28000 },
  { nombre: 'Gigante', departamento: 'Huila', poblacion: 32000 },
  { nombre: 'Algeciras', departamento: 'Huila', poblacion: 28000 },
  { nombre: 'Rivera', departamento: 'Huila', poblacion: 22000 },
  { nombre: 'Aipe', departamento: 'Huila', poblacion: 28000 },

  // LA GUAJIRA
  { nombre: 'Riohacha', departamento: 'La Guajira', esCapital: true, poblacion: 279995 },
  { nombre: 'Maicao', departamento: 'La Guajira', poblacion: 165000 },
  { nombre: 'Uribia', departamento: 'La Guajira', poblacion: 185000 },
  { nombre: 'Manaure', departamento: 'La Guajira', poblacion: 115000 },
  { nombre: 'San Juan del Cesar', departamento: 'La Guajira', poblacion: 42000 },
  { nombre: 'Fonseca', departamento: 'La Guajira', poblacion: 35000 },
  { nombre: 'Barrancas', departamento: 'La Guajira', poblacion: 38000 },
  { nombre: 'Villanueva', departamento: 'La Guajira', poblacion: 32000 },
  { nombre: 'Albania', departamento: 'La Guajira', poblacion: 28000 },

  // MAGDALENA
  { nombre: 'Santa Marta', departamento: 'Magdalena', esCapital: true, poblacion: 515556 },
  { nombre: 'Ciénaga', departamento: 'Magdalena', poblacion: 110000 },
  { nombre: 'Fundación', departamento: 'Magdalena', poblacion: 62000 },
  { nombre: 'El Banco', departamento: 'Magdalena', poblacion: 58000 },
  { nombre: 'Aracataca', departamento: 'Magdalena', poblacion: 42000 },
  { nombre: 'Plato', departamento: 'Magdalena', poblacion: 58000 },
  { nombre: 'Pivijay', departamento: 'Magdalena', poblacion: 42000 },
  { nombre: 'Zona Bananera', departamento: 'Magdalena', poblacion: 65000 },
  { nombre: 'El Retén', departamento: 'Magdalena', poblacion: 25000 },
  { nombre: 'Pueblo Viejo', departamento: 'Magdalena', poblacion: 32000 },

  // META
  { nombre: 'Villavicencio', departamento: 'Meta', esCapital: true, poblacion: 531275 },
  { nombre: 'Acacías', departamento: 'Meta', poblacion: 75000 },
  { nombre: 'Granada', departamento: 'Meta', poblacion: 68000 },
  { nombre: 'Puerto López', departamento: 'Meta', poblacion: 35000 },
  { nombre: 'San Martín', departamento: 'Meta', poblacion: 28000 },
  { nombre: 'Cumaral', departamento: 'Meta', poblacion: 22000 },
  { nombre: 'Restrepo', departamento: 'Meta', poblacion: 12000 },
  { nombre: 'Puerto Gaitán', departamento: 'Meta', poblacion: 22000 },
  { nombre: 'Vista Hermosa', departamento: 'Meta', poblacion: 28000 },
  { nombre: 'La Macarena', departamento: 'Meta', poblacion: 35000 },

  // NARIÑO
  { nombre: 'Pasto', departamento: 'Nariño', esCapital: true, poblacion: 464612 },
  { nombre: 'Tumaco', departamento: 'Nariño', poblacion: 215000 },
  { nombre: 'Ipiales', departamento: 'Nariño', poblacion: 145000 },
  { nombre: 'Túquerres', departamento: 'Nariño', poblacion: 48000 },
  { nombre: 'La Unión', departamento: 'Nariño', poblacion: 32000 },
  { nombre: 'Samaniego', departamento: 'Nariño', poblacion: 52000 },
  { nombre: 'Barbacoas', departamento: 'Nariño', poblacion: 42000 },
  { nombre: 'El Charco', departamento: 'Nariño', poblacion: 38000 },
  { nombre: 'Sandoná', departamento: 'Nariño', poblacion: 28000 },
  { nombre: 'La Cruz', departamento: 'Nariño', poblacion: 22000 },
  { nombre: 'Cumbal', departamento: 'Nariño', poblacion: 38000 },

  // NORTE DE SANTANDER
  { nombre: 'Cúcuta', departamento: 'Norte de Santander', esCapital: true, poblacion: 777106 },
  { nombre: 'Ocaña', departamento: 'Norte de Santander', poblacion: 105000 },
  { nombre: 'Pamplona', departamento: 'Norte de Santander', poblacion: 58000 },
  { nombre: 'Los Patios', departamento: 'Norte de Santander', poblacion: 85000 },
  { nombre: 'Villa del Rosario', departamento: 'Norte de Santander', poblacion: 95000 },
  { nombre: 'El Zulia', departamento: 'Norte de Santander', poblacion: 25000 },
  { nombre: 'Tibú', departamento: 'Norte de Santander', poblacion: 42000 },
  { nombre: 'Ábrego', departamento: 'Norte de Santander', poblacion: 42000 },
  { nombre: 'Chinácota', departamento: 'Norte de Santander', poblacion: 18000 },
  { nombre: 'Convención', departamento: 'Norte de Santander', poblacion: 18000 },

  // PUTUMAYO
  { nombre: 'Mocoa', departamento: 'Putumayo', esCapital: true, poblacion: 48000 },
  { nombre: 'Puerto Asís', departamento: 'Putumayo', poblacion: 62000 },
  { nombre: 'Orito', departamento: 'Putumayo', poblacion: 52000 },
  { nombre: 'Valle del Guamuez', departamento: 'Putumayo', poblacion: 55000 },
  { nombre: 'Villagarzón', departamento: 'Putumayo', poblacion: 25000 },
  { nombre: 'Puerto Caicedo', departamento: 'Putumayo', poblacion: 18000 },
  { nombre: 'San Miguel', departamento: 'Putumayo', poblacion: 28000 },
  { nombre: 'Sibundoy', departamento: 'Putumayo', poblacion: 18000 },

  // QUINDÍO
  { nombre: 'Armenia', departamento: 'Quindío', esCapital: true, poblacion: 301226 },
  { nombre: 'Calarcá', departamento: 'Quindío', poblacion: 82000 },
  { nombre: 'La Tebaida', departamento: 'Quindío', poblacion: 45000 },
  { nombre: 'Montenegro', departamento: 'Quindío', poblacion: 45000 },
  { nombre: 'Quimbaya', departamento: 'Quindío', poblacion: 38000 },
  { nombre: 'Circasia', departamento: 'Quindío', poblacion: 32000 },
  { nombre: 'Filandia', departamento: 'Quindío', poblacion: 15000 },
  { nombre: 'Salento', departamento: 'Quindío', poblacion: 8000 },
  { nombre: 'Génova', departamento: 'Quindío', poblacion: 9000 },
  { nombre: 'Pijao', departamento: 'Quindío', poblacion: 7000 },
  { nombre: 'Córdoba', departamento: 'Quindío', poblacion: 6000 },
  { nombre: 'Buenavista', departamento: 'Quindío', poblacion: 3500 },

  // RISARALDA
  { nombre: 'Pereira', departamento: 'Risaralda', esCapital: true, poblacion: 477027 },
  { nombre: 'Dosquebradas', departamento: 'Risaralda', poblacion: 208000 },
  { nombre: 'Santa Rosa de Cabal', departamento: 'Risaralda', poblacion: 75000 },
  { nombre: 'La Virginia', departamento: 'Risaralda', poblacion: 35000 },
  { nombre: 'Belén de Umbría', departamento: 'Risaralda', poblacion: 28000 },
  { nombre: 'Quinchía', departamento: 'Risaralda', poblacion: 35000 },
  { nombre: 'Marsella', departamento: 'Risaralda', poblacion: 25000 },
  { nombre: 'Apía', departamento: 'Risaralda', poblacion: 20000 },
  { nombre: 'Santuario', departamento: 'Risaralda', poblacion: 18000 },
  { nombre: 'Guática', departamento: 'Risaralda', poblacion: 16000 },

  // SAN ANDRÉS Y PROVIDENCIA
  { nombre: 'San Andrés', departamento: 'San Andrés y Providencia', esCapital: true, poblacion: 78000 },
  { nombre: 'Providencia', departamento: 'San Andrés y Providencia', poblacion: 5500 },

  // SANTANDER
  { nombre: 'Bucaramanga', departamento: 'Santander', esCapital: true, poblacion: 581130 },
  { nombre: 'Floridablanca', departamento: 'Santander', poblacion: 285000 },
  { nombre: 'Girón', departamento: 'Santander', poblacion: 200000 },
  { nombre: 'Piedecuesta', departamento: 'Santander', poblacion: 175000 },
  { nombre: 'Barrancabermeja', departamento: 'Santander', poblacion: 195000 },
  { nombre: 'San Gil', departamento: 'Santander', poblacion: 48000 },
  { nombre: 'Socorro', departamento: 'Santander', poblacion: 32000 },
  { nombre: 'Málaga', departamento: 'Santander', poblacion: 22000 },
  { nombre: 'Barbosa', departamento: 'Santander', poblacion: 32000 },
  { nombre: 'Vélez', departamento: 'Santander', poblacion: 22000 },
  { nombre: 'Lebrija', departamento: 'Santander', poblacion: 45000 },
  { nombre: 'Puerto Wilches', departamento: 'Santander', poblacion: 35000 },
  { nombre: 'Cimitarra', departamento: 'Santander', poblacion: 42000 },
  { nombre: 'Sabana de Torres', departamento: 'Santander', poblacion: 22000 },
  { nombre: 'Rionegro', departamento: 'Santander', poblacion: 32000 },
  { nombre: 'Oiba', departamento: 'Santander', poblacion: 12000 },
  { nombre: 'Charalá', departamento: 'Santander', poblacion: 12000 },

  // SUCRE
  { nombre: 'Sincelejo', departamento: 'Sucre', esCapital: true, poblacion: 287269 },
  { nombre: 'Corozal', departamento: 'Sucre', poblacion: 65000 },
  { nombre: 'San Marcos', departamento: 'Sucre', poblacion: 58000 },
  { nombre: 'Sampués', departamento: 'Sucre', poblacion: 42000 },
  { nombre: 'Tolú', departamento: 'Sucre', poblacion: 35000 },
  { nombre: 'San Onofre', departamento: 'Sucre', poblacion: 52000 },
  { nombre: 'Majagual', departamento: 'Sucre', poblacion: 38000 },
  { nombre: 'Sucre', departamento: 'Sucre', poblacion: 25000 },
  { nombre: 'Coveñas', departamento: 'Sucre', poblacion: 15000 },
  { nombre: 'Sincé', departamento: 'Sucre', poblacion: 35000 },
  { nombre: 'Ovejas', departamento: 'Sucre', poblacion: 22000 },
  { nombre: 'Los Palmitos', departamento: 'Sucre', poblacion: 22000 },

  // TOLIMA
  { nombre: 'Ibagué', departamento: 'Tolima', esCapital: true, poblacion: 569336 },
  { nombre: 'Espinal', departamento: 'Tolima', poblacion: 82000 },
  { nombre: 'Melgar', departamento: 'Tolima', poblacion: 42000 },
  { nombre: 'Honda', departamento: 'Tolima', poblacion: 28000 },
  { nombre: 'Mariquita', departamento: 'Tolima', poblacion: 35000 },
  { nombre: 'Líbano', departamento: 'Tolima', poblacion: 42000 },
  { nombre: 'Chaparral', departamento: 'Tolima', poblacion: 48000 },
  { nombre: 'Lérida', departamento: 'Tolima', poblacion: 22000 },
  { nombre: 'Guamo', departamento: 'Tolima', poblacion: 35000 },
  { nombre: 'Purificación', departamento: 'Tolima', poblacion: 32000 },
  { nombre: 'Flandes', departamento: 'Tolima', poblacion: 32000 },
  { nombre: 'Fresno', departamento: 'Tolima', poblacion: 32000 },
  { nombre: 'Saldaña', departamento: 'Tolima', poblacion: 18000 },
  { nombre: 'Cajamarca', departamento: 'Tolima', poblacion: 22000 },
  { nombre: 'Planadas', departamento: 'Tolima', poblacion: 35000 },
  { nombre: 'Natagaima', departamento: 'Tolima', poblacion: 25000 },

  // VALLE DEL CAUCA
  { nombre: 'Cali', departamento: 'Valle del Cauca', esCapital: true, poblacion: 2252616 },
  { nombre: 'Buenaventura', departamento: 'Valle del Cauca', poblacion: 430000 },
  { nombre: 'Palmira', departamento: 'Valle del Cauca', poblacion: 320000 },
  { nombre: 'Tuluá', departamento: 'Valle del Cauca', poblacion: 220000 },
  { nombre: 'Buga', departamento: 'Valle del Cauca', poblacion: 125000 },
  { nombre: 'Cartago', departamento: 'Valle del Cauca', poblacion: 140000 },
  { nombre: 'Yumbo', departamento: 'Valle del Cauca', poblacion: 130000 },
  { nombre: 'Jamundí', departamento: 'Valle del Cauca', poblacion: 128000 },
  { nombre: 'Candelaria', departamento: 'Valle del Cauca', poblacion: 90000 },
  { nombre: 'Florida', departamento: 'Valle del Cauca', poblacion: 62000 },
  { nombre: 'Pradera', departamento: 'Valle del Cauca', poblacion: 58000 },
  { nombre: 'Zarzal', departamento: 'Valle del Cauca', poblacion: 48000 },
  { nombre: 'Sevilla', departamento: 'Valle del Cauca', poblacion: 48000 },
  { nombre: 'Caicedonia', departamento: 'Valle del Cauca', poblacion: 32000 },
  { nombre: 'Roldanillo', departamento: 'Valle del Cauca', poblacion: 38000 },
  { nombre: 'La Unión', departamento: 'Valle del Cauca', poblacion: 38000 },
  { nombre: 'Dagua', departamento: 'Valle del Cauca', poblacion: 42000 },
  { nombre: 'Ginebra', departamento: 'Valle del Cauca', poblacion: 22000 },
  { nombre: 'El Cerrito', departamento: 'Valle del Cauca', poblacion: 58000 },
  { nombre: 'Andalucía', departamento: 'Valle del Cauca', poblacion: 22000 },
  { nombre: 'Bugalagrande', departamento: 'Valle del Cauca', poblacion: 25000 },
  { nombre: 'San Pedro', departamento: 'Valle del Cauca', poblacion: 18000 },
  { nombre: 'Guacarí', departamento: 'Valle del Cauca', poblacion: 38000 },
  { nombre: 'Vijes', departamento: 'Valle del Cauca', poblacion: 12000 },
  { nombre: 'La Cumbre', departamento: 'Valle del Cauca', poblacion: 12000 },
  { nombre: 'Restrepo', departamento: 'Valle del Cauca', poblacion: 18000 },
  { nombre: 'Calima El Darién', departamento: 'Valle del Cauca', poblacion: 18000 },

  // VAUPÉS
  { nombre: 'Mitú', departamento: 'Vaupés', esCapital: true, poblacion: 35000 },
  { nombre: 'Carurú', departamento: 'Vaupés', poblacion: 5000 },

  // VICHADA
  { nombre: 'Puerto Carreño', departamento: 'Vichada', esCapital: true, poblacion: 18000 },
  { nombre: 'La Primavera', departamento: 'Vichada', poblacion: 18000 },
  { nombre: 'Santa Rosalía', departamento: 'Vichada', poblacion: 5000 },
  { nombre: 'Cumaribo', departamento: 'Vichada', poblacion: 38000 },
];

// Función para buscar ciudades por texto (autocompletado)
export const buscarCiudades = (query: string, limite: number = 10): CiudadColombia[] => {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return CIUDADES_COLOMBIA
    .filter(ciudad => {
      const nombreNorm = ciudad.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const deptoNorm = ciudad.departamento.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nombreNorm.includes(queryLower) || deptoNorm.includes(queryLower);
    })
    .sort((a, b) => {
      // Priorizar coincidencias que empiezan con el query
      const aNorm = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const bNorm = b.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      const aStartsWith = aNorm.startsWith(queryLower) ? 0 : 1;
      const bStartsWith = bNorm.startsWith(queryLower) ? 0 : 1;

      if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;

      // Luego por población (más grande primero)
      return (b.poblacion || 0) - (a.poblacion || 0);
    })
    .slice(0, limite);
};

// Obtener todas las ciudades capitales
export const getCiudadesCapitales = (): CiudadColombia[] => {
  return CIUDADES_COLOMBIA.filter(c => c.esCapital);
};

// Obtener ciudades por departamento
export const getCiudadesPorDepartamento = (departamento: string): CiudadColombia[] => {
  return CIUDADES_COLOMBIA.filter(c =>
    c.departamento.toLowerCase() === departamento.toLowerCase()
  );
};

// Lista de departamentos únicos
export const DEPARTAMENTOS_COLOMBIA = [...new Set(CIUDADES_COLOMBIA.map(c => c.departamento))].sort();

export default CIUDADES_COLOMBIA;
