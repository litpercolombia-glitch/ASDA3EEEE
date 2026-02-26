import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'data', 'litper.db');

// Crear directorio data si no existe
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    chat_id INTEGER PRIMARY KEY,
    nombre TEXT,
    meta_diaria INTEGER DEFAULT 480,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    proceso TEXT,
    inicio DATETIME,
    fin DATETIME,
    duracion INTEGER,
    cantidad INTEGER DEFAULT 0,
    notas TEXT,
    FOREIGN KEY (chat_id) REFERENCES usuarios(chat_id)
  );

  CREATE TABLE IF NOT EXISTS sesion_activa (
    chat_id INTEGER PRIMARY KEY,
    proceso TEXT,
    inicio DATETIME,
    FOREIGN KEY (chat_id) REFERENCES usuarios(chat_id)
  );
`);

export interface Usuario {
  chat_id: number;
  nombre: string;
  meta_diaria: number;
}

export interface Sesion {
  id: number;
  chat_id: number;
  proceso: string;
  inicio: string;
  fin: string;
  duracion: number;
  cantidad: number;
  notas: string;
}

export interface SesionActiva {
  chat_id: number;
  proceso: string;
  inicio: string;
}

// Funciones de usuario
export function getUsuario(chatId: number): Usuario | undefined {
  return db.prepare('SELECT * FROM usuarios WHERE chat_id = ?').get(chatId) as Usuario | undefined;
}

export function crearUsuario(chatId: number, nombre: string): void {
  db.prepare('INSERT OR IGNORE INTO usuarios (chat_id, nombre) VALUES (?, ?)').run(chatId, nombre);
}

export function setMetaDiaria(chatId: number, minutos: number): void {
  db.prepare('UPDATE usuarios SET meta_diaria = ? WHERE chat_id = ?').run(minutos, chatId);
}

// Funciones de sesión activa
export function getSesionActiva(chatId: number): SesionActiva | undefined {
  return db.prepare('SELECT * FROM sesion_activa WHERE chat_id = ?').get(chatId) as SesionActiva | undefined;
}

export function iniciarSesion(chatId: number, proceso: string): void {
  const ahora = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO sesion_activa (chat_id, proceso, inicio) VALUES (?, ?, ?)').run(chatId, proceso, ahora);
}

export function finalizarSesion(chatId: number, cantidad: number = 0, notas: string = ''): Sesion | null {
  const activa = getSesionActiva(chatId);
  if (!activa) return null;

  const ahora = new Date();
  const inicio = new Date(activa.inicio);
  const duracion = Math.floor((ahora.getTime() - inicio.getTime()) / 1000 / 60); // minutos

  const result = db.prepare(`
    INSERT INTO sesiones (chat_id, proceso, inicio, fin, duracion, cantidad, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(chatId, activa.proceso, activa.inicio, ahora.toISOString(), duracion, cantidad, notas);

  db.prepare('DELETE FROM sesion_activa WHERE chat_id = ?').run(chatId);

  return {
    id: result.lastInsertRowid as number,
    chat_id: chatId,
    proceso: activa.proceso,
    inicio: activa.inicio,
    fin: ahora.toISOString(),
    duracion,
    cantidad,
    notas
  };
}

// Funciones de estadísticas
export function getSesionesHoy(chatId: number): Sesion[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return db.prepare(`
    SELECT * FROM sesiones
    WHERE chat_id = ? AND inicio >= ?
    ORDER BY inicio DESC
  `).all(chatId, hoy.toISOString()) as Sesion[];
}

export function getSesionesSemana(chatId: number): Sesion[] {
  const hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);
  return db.prepare(`
    SELECT * FROM sesiones
    WHERE chat_id = ? AND inicio >= ?
    ORDER BY inicio DESC
  `).all(chatId, hace7dias.toISOString()) as Sesion[];
}

export function getResumenHoy(chatId: number): { totalMinutos: number; totalSesiones: number; porProceso: Record<string, number> } {
  const sesiones = getSesionesHoy(chatId);
  const totalMinutos = sesiones.reduce((acc, s) => acc + s.duracion, 0);
  const porProceso: Record<string, number> = {};

  sesiones.forEach(s => {
    porProceso[s.proceso] = (porProceso[s.proceso] || 0) + s.duracion;
  });

  return {
    totalMinutos,
    totalSesiones: sesiones.length,
    porProceso
  };
}

export function getResumenSemana(chatId: number): { totalMinutos: number; totalSesiones: number; porDia: Record<string, number> } {
  const sesiones = getSesionesSemana(chatId);
  const totalMinutos = sesiones.reduce((acc, s) => acc + s.duracion, 0);
  const porDia: Record<string, number> = {};

  sesiones.forEach(s => {
    const dia = new Date(s.inicio).toLocaleDateString('es-CO', { weekday: 'short' });
    porDia[dia] = (porDia[dia] || 0) + s.duracion;
  });

  return {
    totalMinutos,
    totalSesiones: sesiones.length,
    porDia
  };
}

export default db;
