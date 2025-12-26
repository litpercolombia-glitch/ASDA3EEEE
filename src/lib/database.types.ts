// /src/lib/database.types.ts
// Tipos de la base de datos Supabase para Litper Pro
// Adaptado al esquema real del proyecto

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      cargas: {
        Row: {
          id: string;
          nombre: string;
          numero_carga: number;
          fecha: string;
          usuario_id: string;
          usuario_nombre: string;
          estado: string;
          total_guias: number;
          entregadas: number;
          en_transito: number;
          con_novedad: number;
          devueltas: number;
          porcentaje_entrega: number;
          valor_total: number;
          ganancia_total: number;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          numero_carga: number;
          fecha?: string;
          usuario_id: string;
          usuario_nombre: string;
          estado?: string;
          total_guias?: number;
          entregadas?: number;
          en_transito?: number;
          con_novedad?: number;
          devueltas?: number;
          porcentaje_entrega?: number;
          valor_total?: number;
          ganancia_total?: number;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          numero_carga?: number;
          fecha?: string;
          usuario_id?: string;
          usuario_nombre?: string;
          estado?: string;
          total_guias?: number;
          entregadas?: number;
          en_transito?: number;
          con_novedad?: number;
          devueltas?: number;
          porcentaje_entrega?: number;
          valor_total?: number;
          ganancia_total?: number;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
      };
      guias: {
        Row: {
          id: string;
          numero_guia: string;
          transportadora: string;
          ciudad_destino: string;
          departamento: string | null;
          estado: string;
          estado_detalle: string | null;
          nombre_cliente: string | null;
          telefono: string | null;
          direccion: string | null;
          valor_declarado: number;
          valor_flete: number;
          ganancia: number;
          dias_transito: number;
          tiene_novedad: boolean;
          tipo_novedad: string | null;
          descripcion_novedad: string | null;
          fecha_creacion: string;
          fecha_actualizacion: string;
          fecha_entrega: string | null;
          carga_id: string | null;
          usuario_id: string | null;
          fuente: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          numero_guia: string;
          transportadora: string;
          ciudad_destino: string;
          departamento?: string | null;
          estado?: string;
          estado_detalle?: string | null;
          nombre_cliente?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          valor_declarado?: number;
          valor_flete?: number;
          ganancia?: number;
          dias_transito?: number;
          tiene_novedad?: boolean;
          tipo_novedad?: string | null;
          descripcion_novedad?: string | null;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
          fecha_entrega?: string | null;
          carga_id?: string | null;
          usuario_id?: string | null;
          fuente?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          numero_guia?: string;
          transportadora?: string;
          ciudad_destino?: string;
          departamento?: string | null;
          estado?: string;
          estado_detalle?: string | null;
          nombre_cliente?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          valor_declarado?: number;
          valor_flete?: number;
          ganancia?: number;
          dias_transito?: number;
          tiene_novedad?: boolean;
          tipo_novedad?: string | null;
          descripcion_novedad?: string | null;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
          fecha_entrega?: string | null;
          carga_id?: string | null;
          usuario_id?: string | null;
          fuente?: string;
          metadata?: Json;
        };
      };
      ciudades_stats: {
        Row: {
          id: string;
          ciudad: string;
          departamento: string | null;
          total_guias: number;
          entregadas: number;
          devueltas: number;
          en_transito: number;
          tasa_entrega: number;
          tasa_devolucion: number;
          tiempo_promedio: number;
          status: string;
          transportadora_principal: string | null;
          pausado: boolean;
          ultima_actualizacion: string;
        };
        Insert: {
          id?: string;
          ciudad: string;
          departamento?: string | null;
          total_guias?: number;
          entregadas?: number;
          devueltas?: number;
          en_transito?: number;
          tasa_entrega?: number;
          tasa_devolucion?: number;
          tiempo_promedio?: number;
          status?: string;
          transportadora_principal?: string | null;
          pausado?: boolean;
          ultima_actualizacion?: string;
        };
        Update: {
          id?: string;
          ciudad?: string;
          departamento?: string | null;
          total_guias?: number;
          entregadas?: number;
          devueltas?: number;
          en_transito?: number;
          tasa_entrega?: number;
          tasa_devolucion?: number;
          tiempo_promedio?: number;
          status?: string;
          transportadora_principal?: string | null;
          pausado?: boolean;
          ultima_actualizacion?: string;
        };
      };
      alertas: {
        Row: {
          id: string;
          tipo: string;
          titulo: string;
          mensaje: string;
          fuente: string | null;
          leida: boolean;
          accion_url: string | null;
          usuario_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          titulo: string;
          mensaje: string;
          fuente?: string | null;
          leida?: boolean;
          accion_url?: string | null;
          usuario_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          titulo?: string;
          mensaje?: string;
          fuente?: string | null;
          leida?: boolean;
          accion_url?: string | null;
          usuario_id?: string | null;
          created_at?: string;
        };
      };
      actividad: {
        Row: {
          id: string;
          tipo: string;
          titulo: string;
          descripcion: string | null;
          usuario_id: string | null;
          usuario_nombre: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          titulo: string;
          descripcion?: string | null;
          usuario_id?: string | null;
          usuario_nombre?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          titulo?: string;
          descripcion?: string | null;
          usuario_id?: string | null;
          usuario_nombre?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Tipos de conveniencia
export type Carga = Database['public']['Tables']['cargas']['Row'];
export type CargaInsert = Database['public']['Tables']['cargas']['Insert'];
export type CargaUpdate = Database['public']['Tables']['cargas']['Update'];

export type Guia = Database['public']['Tables']['guias']['Row'];
export type GuiaInsert = Database['public']['Tables']['guias']['Insert'];
export type GuiaUpdate = Database['public']['Tables']['guias']['Update'];

export type CiudadStats = Database['public']['Tables']['ciudades_stats']['Row'];
export type CiudadStatsInsert = Database['public']['Tables']['ciudades_stats']['Insert'];
export type CiudadStatsUpdate = Database['public']['Tables']['ciudades_stats']['Update'];

export type Alerta = Database['public']['Tables']['alertas']['Row'];
export type AlertaInsert = Database['public']['Tables']['alertas']['Insert'];
export type AlertaUpdate = Database['public']['Tables']['alertas']['Update'];

export type Actividad = Database['public']['Tables']['actividad']['Row'];
export type ActividadInsert = Database['public']['Tables']['actividad']['Insert'];
