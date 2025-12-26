// services/usuariosCargaService.ts
// Servicio para gestionar usuarios de carga persistentes

import { UsuarioCarga } from '../types/carga.types';

const STORAGE_KEY = 'litper_usuarios_carga';

class UsuariosCargaService {
  /**
   * Obtener todos los usuarios guardados
   */
  getUsuarios(): UsuarioCarga[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const usuarios = JSON.parse(data) as UsuarioCarga[];
      return usuarios.map(u => ({
        ...u,
        creadoEn: new Date(u.creadoEn),
        ultimaActividad: new Date(u.ultimaActividad),
      }));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      return [];
    }
  }

  /**
   * Obtener usuario por ID
   */
  getUsuario(id: string): UsuarioCarga | null {
    const usuarios = this.getUsuarios();
    return usuarios.find(u => u.id === id) || null;
  }

  /**
   * Obtener usuario por nombre (búsqueda parcial)
   */
  buscarUsuarioPorNombre(nombre: string): UsuarioCarga | null {
    const usuarios = this.getUsuarios();
    const nombreLower = nombre.toLowerCase().trim();
    return usuarios.find(u => u.nombre.toLowerCase().includes(nombreLower)) || null;
  }

  /**
   * Crear o actualizar usuario
   * Si el nombre ya existe, lo actualiza
   */
  guardarUsuario(nombre: string): UsuarioCarga {
    const usuarios = this.getUsuarios();
    const nombreNormalizado = nombre.trim();

    // Buscar si ya existe
    const existenteIndex = usuarios.findIndex(
      u => u.nombre.toLowerCase() === nombreNormalizado.toLowerCase()
    );

    const ahora = new Date();

    if (existenteIndex >= 0) {
      // Actualizar usuario existente
      usuarios[existenteIndex] = {
        ...usuarios[existenteIndex],
        ultimaActividad: ahora,
        totalCargas: usuarios[existenteIndex].totalCargas + 1,
      };
      this.guardarTodos(usuarios);
      return usuarios[existenteIndex];
    }

    // Crear nuevo usuario
    const nuevoUsuario: UsuarioCarga = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: nombreNormalizado,
      creadoEn: ahora,
      ultimaActividad: ahora,
      totalCargas: 1,
      totalGuiasRevisadas: 0,
    };

    usuarios.push(nuevoUsuario);
    this.guardarTodos(usuarios);

    return nuevoUsuario;
  }

  /**
   * Incrementar contador de guías revisadas
   */
  incrementarGuiasRevisadas(usuarioId: string, cantidad: number = 1): void {
    const usuarios = this.getUsuarios();
    const index = usuarios.findIndex(u => u.id === usuarioId);

    if (index >= 0) {
      usuarios[index].totalGuiasRevisadas += cantidad;
      usuarios[index].ultimaActividad = new Date();
      this.guardarTodos(usuarios);
    }
  }

  /**
   * Eliminar usuario
   */
  eliminarUsuario(id: string): boolean {
    const usuarios = this.getUsuarios();
    const filtrados = usuarios.filter(u => u.id !== id);

    if (filtrados.length === usuarios.length) return false;

    this.guardarTodos(filtrados);
    return true;
  }

  /**
   * Obtener usuario más reciente (último que trabajó)
   */
  getUsuarioReciente(): UsuarioCarga | null {
    const usuarios = this.getUsuarios();
    if (usuarios.length === 0) return null;

    return usuarios.reduce((prev, current) =>
      new Date(current.ultimaActividad) > new Date(prev.ultimaActividad) ? current : prev
    );
  }

  /**
   * Obtener lista de nombres de usuarios (para autocompletado)
   */
  getNombresUsuarios(): string[] {
    return this.getUsuarios().map(u => u.nombre);
  }

  /**
   * Guardar todos los usuarios
   */
  private guardarTodos(usuarios: UsuarioCarga[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
  }

  /**
   * Limpiar usuarios inactivos (más de 30 días sin actividad)
   */
  limpiarUsuariosInactivos(diasMaximos: number = 30): number {
    const usuarios = this.getUsuarios();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasMaximos);

    const activos = usuarios.filter(u => new Date(u.ultimaActividad) >= fechaLimite);
    const eliminados = usuarios.length - activos.length;

    if (eliminados > 0) {
      this.guardarTodos(activos);
    }

    return eliminados;
  }
}

export const usuariosCargaService = new UsuariosCargaService();
export default usuariosCargaService;
