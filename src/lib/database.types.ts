// /src/lib/database.types.ts
// Tipos de la base de datos Supabase para Litper Pro

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
      orders: {
        Row: {
          id: string;
          external_id: string;
          source: string;
          status: string;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          shipping_address: string | null;
          shipping_city: string | null;
          shipping_department: string | null;
          total_amount: number | null;
          payment_method: string | null;
          risk_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_id: string;
          source: string;
          status?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: string | null;
          shipping_city?: string | null;
          shipping_department?: string | null;
          total_amount?: number | null;
          payment_method?: string | null;
          risk_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_id?: string;
          source?: string;
          status?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: string | null;
          shipping_city?: string | null;
          shipping_department?: string | null;
          total_amount?: number | null;
          payment_method?: string | null;
          risk_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      shipments: {
        Row: {
          id: string;
          order_id: string | null;
          guide_number: string | null;
          carrier: string;
          status: string;
          status_detail: string | null;
          city: string | null;
          department: string | null;
          risk_score: number;
          tracking_url: string | null;
          estimated_delivery: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          guide_number?: string | null;
          carrier: string;
          status?: string;
          status_detail?: string | null;
          city?: string | null;
          department?: string | null;
          risk_score?: number;
          tracking_url?: string | null;
          estimated_delivery?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          guide_number?: string | null;
          carrier?: string;
          status?: string;
          status_detail?: string | null;
          city?: string | null;
          department?: string | null;
          risk_score?: number;
          tracking_url?: string | null;
          estimated_delivery?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          source: string;
          event_type: string;
          idempotency_key: string | null;
          payload: Json | null;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          event_type: string;
          idempotency_key?: string | null;
          payload?: Json | null;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          event_type?: string;
          idempotency_key?: string | null;
          payload?: Json | null;
          processed?: boolean;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          shipment_id: string | null;
          order_id: string | null;
          type: string;
          priority: string;
          message: string | null;
          resolved: boolean;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id?: string | null;
          order_id?: string | null;
          type: string;
          priority?: string;
          message?: string | null;
          resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string | null;
          order_id?: string | null;
          type?: string;
          priority?: string;
          message?: string | null;
          resolved?: boolean;
          resolved_at?: string | null;
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
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type Shipment = Database['public']['Tables']['shipments']['Row'];
export type ShipmentInsert = Database['public']['Tables']['shipments']['Insert'];
export type ShipmentUpdate = Database['public']['Tables']['shipments']['Update'];

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];

export type Alert = Database['public']['Tables']['alerts']['Row'];
export type AlertInsert = Database['public']['Tables']['alerts']['Insert'];
export type AlertUpdate = Database['public']['Tables']['alerts']['Update'];
