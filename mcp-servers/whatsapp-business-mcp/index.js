#!/usr/bin/env node

/**
 * WhatsApp Business Cloud API MCP Server
 * 25 herramientas para Litper Pro - Gestion completa de WhatsApp Business
 *
 * Usa la WhatsApp Business Cloud API v21.0
 * Documentacion: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ============================================
// CONFIG
// ============================================

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// ============================================
// HTTP HELPER
// ============================================

async function waRequest(path, method = "GET", body = null) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const errMsg =
      data?.error?.message || data?.error?.error_user_msg || JSON.stringify(data);
    throw new Error(`WhatsApp API error (${response.status}): ${errMsg}`);
  }
  return data;
}

// ============================================
// 25 TOOL DEFINITIONS
// ============================================

const TOOLS = [
  // --- MESSAGING (1-8) ---
  {
    name: "send_text_message",
    description:
      "Envia un mensaje de texto simple por WhatsApp a un numero de telefono. Incluye opcion de preview de links.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono con codigo de pais (ej: 573001234567)" },
        body: { type: "string", description: "Texto del mensaje a enviar" },
        preview_url: { type: "boolean", description: "Mostrar preview de URLs en el mensaje", default: false },
      },
      required: ["to", "body"],
    },
  },
  {
    name: "send_template_message",
    description:
      "Envia un mensaje usando una plantilla pre-aprobada de WhatsApp Business. Soporta variables y botones.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        template_name: { type: "string", description: "Nombre de la plantilla aprobada" },
        language_code: { type: "string", description: "Codigo de idioma (ej: es, es_CO, en_US)", default: "es" },
        components: {
          type: "array",
          description: "Componentes de la plantilla (header, body, buttons) con sus parametros",
          items: { type: "object" },
        },
      },
      required: ["to", "template_name"],
    },
  },
  {
    name: "send_media_message",
    description:
      "Envia un mensaje con archivo multimedia (imagen, video, audio, documento) por WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        media_type: {
          type: "string",
          enum: ["image", "video", "audio", "document", "sticker"],
          description: "Tipo de medio a enviar",
        },
        media_url: { type: "string", description: "URL publica del archivo multimedia" },
        media_id: { type: "string", description: "ID del medio subido previamente a WhatsApp" },
        caption: { type: "string", description: "Texto de descripcion del medio (no aplica para audio/sticker)" },
        filename: { type: "string", description: "Nombre del archivo (solo para documentos)" },
      },
      required: ["to", "media_type"],
    },
  },
  {
    name: "send_location_message",
    description: "Envia una ubicacion por WhatsApp con coordenadas, nombre y direccion.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        latitude: { type: "number", description: "Latitud de la ubicacion" },
        longitude: { type: "number", description: "Longitud de la ubicacion" },
        name: { type: "string", description: "Nombre del lugar" },
        address: { type: "string", description: "Direccion del lugar" },
      },
      required: ["to", "latitude", "longitude"],
    },
  },
  {
    name: "send_contact_message",
    description: "Envia una tarjeta de contacto por WhatsApp con nombre, telefono, email, etc.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        contacts: {
          type: "array",
          description: "Array de contactos a enviar",
          items: {
            type: "object",
            properties: {
              name: { type: "object", description: "Nombre del contacto con first_name, last_name, formatted_name" },
              phones: { type: "array", description: "Telefonos del contacto", items: { type: "object" } },
              emails: { type: "array", description: "Emails del contacto", items: { type: "object" } },
            },
          },
        },
      },
      required: ["to", "contacts"],
    },
  },
  {
    name: "send_interactive_buttons",
    description:
      "Envia un mensaje interactivo con hasta 3 botones de respuesta rapida. Ideal para confirmaciones.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        body_text: { type: "string", description: "Texto del cuerpo del mensaje" },
        header_text: { type: "string", description: "Texto del encabezado (opcional)" },
        footer_text: { type: "string", description: "Texto del pie (opcional)" },
        buttons: {
          type: "array",
          description: "Array de botones (max 3)",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "ID unico del boton" },
              title: { type: "string", description: "Texto del boton (max 20 chars)" },
            },
            required: ["id", "title"],
          },
          maxItems: 3,
        },
      },
      required: ["to", "body_text", "buttons"],
    },
  },
  {
    name: "send_interactive_list",
    description:
      "Envia un mensaje interactivo con una lista desplegable de opciones organizadas en secciones.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        body_text: { type: "string", description: "Texto del cuerpo del mensaje" },
        button_text: { type: "string", description: "Texto del boton que abre la lista" },
        header_text: { type: "string", description: "Texto del encabezado (opcional)" },
        footer_text: { type: "string", description: "Texto del pie (opcional)" },
        sections: {
          type: "array",
          description: "Secciones de la lista con filas",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Titulo de la seccion" },
              rows: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["id", "title"],
                },
              },
            },
          },
        },
      },
      required: ["to", "body_text", "button_text", "sections"],
    },
  },
  {
    name: "send_reaction",
    description: "Envia una reaccion (emoji) a un mensaje existente en WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        message_id: { type: "string", description: "ID del mensaje al que se reacciona" },
        emoji: { type: "string", description: "Emoji de la reaccion (ej: \\ud83d\\udc4d)" },
      },
      required: ["to", "message_id", "emoji"],
    },
  },

  // --- MESSAGE MANAGEMENT (9-12) ---
  {
    name: "mark_message_read",
    description: "Marca un mensaje como leido (doble check azul) en WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        message_id: { type: "string", description: "ID del mensaje a marcar como leido" },
      },
      required: ["message_id"],
    },
  },
  {
    name: "reply_to_message",
    description: "Envia una respuesta directa (quote/reply) a un mensaje especifico.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Numero de telefono destino" },
        message_id: { type: "string", description: "ID del mensaje al que se responde" },
        body: { type: "string", description: "Texto de la respuesta" },
      },
      required: ["to", "message_id", "body"],
    },
  },
  {
    name: "delete_message",
    description:
      "Elimina un mensaje enviado previamente para todos los participantes (within time window).",
    inputSchema: {
      type: "object",
      properties: {
        message_id: { type: "string", description: "ID del mensaje a eliminar" },
      },
      required: ["message_id"],
    },
  },
  {
    name: "get_message_status",
    description: "Consulta el estado de entrega de un mensaje (sent, delivered, read, failed).",
    inputSchema: {
      type: "object",
      properties: {
        message_id: { type: "string", description: "ID del mensaje a consultar" },
      },
      required: ["message_id"],
    },
  },

  // --- MEDIA MANAGEMENT (13-15) ---
  {
    name: "upload_media",
    description: "Sube un archivo multimedia a WhatsApp para enviarlo despues usando su ID.",
    inputSchema: {
      type: "object",
      properties: {
        file_url: { type: "string", description: "URL del archivo a subir" },
        mime_type: {
          type: "string",
          description: "Tipo MIME del archivo (ej: image/jpeg, application/pdf)",
        },
      },
      required: ["file_url", "mime_type"],
    },
  },
  {
    name: "get_media_url",
    description: "Obtiene la URL de descarga de un archivo multimedia recibido por WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        media_id: { type: "string", description: "ID del medio a consultar" },
      },
      required: ["media_id"],
    },
  },
  {
    name: "delete_media",
    description: "Elimina un archivo multimedia previamente subido a WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        media_id: { type: "string", description: "ID del medio a eliminar" },
      },
      required: ["media_id"],
    },
  },

  // --- TEMPLATES (16-19) ---
  {
    name: "list_message_templates",
    description:
      "Lista todas las plantillas de mensajes de tu cuenta de WhatsApp Business con su estado de aprobacion.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["APPROVED", "PENDING", "REJECTED"],
          description: "Filtrar por estado de aprobacion",
        },
        limit: { type: "number", description: "Numero maximo de resultados", default: 20 },
      },
    },
  },
  {
    name: "create_message_template",
    description:
      "Crea una nueva plantilla de mensaje para enviar a clientes. Requiere aprobacion de Meta.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre unico de la plantilla (snake_case)" },
        category: {
          type: "string",
          enum: ["MARKETING", "UTILITY", "AUTHENTICATION"],
          description: "Categoria de la plantilla",
        },
        language: { type: "string", description: "Codigo de idioma", default: "es" },
        components: {
          type: "array",
          description: "Componentes de la plantilla (HEADER, BODY, FOOTER, BUTTONS)",
          items: { type: "object" },
        },
      },
      required: ["name", "category", "components"],
    },
  },
  {
    name: "delete_message_template",
    description: "Elimina una plantilla de mensaje existente.",
    inputSchema: {
      type: "object",
      properties: {
        template_name: { type: "string", description: "Nombre de la plantilla a eliminar" },
      },
      required: ["template_name"],
    },
  },
  {
    name: "get_template_analytics",
    description:
      "Obtiene las metricas de rendimiento de una plantilla: enviados, entregados, leidos, clicks.",
    inputSchema: {
      type: "object",
      properties: {
        template_name: { type: "string", description: "Nombre de la plantilla" },
        start_date: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
        end_date: { type: "string", description: "Fecha fin YYYY-MM-DD" },
      },
      required: ["template_name"],
    },
  },

  // --- BUSINESS PROFILE & ACCOUNT (20-23) ---
  {
    name: "get_business_profile",
    description:
      "Obtiene el perfil de negocio de WhatsApp Business: nombre, descripcion, foto, horarios, etc.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "update_business_profile",
    description:
      "Actualiza el perfil de negocio de WhatsApp: descripcion, direccion, email, sitio web, etc.",
    inputSchema: {
      type: "object",
      properties: {
        about: { type: "string", description: "Descripcion del negocio (max 139 chars)" },
        address: { type: "string", description: "Direccion del negocio" },
        description: { type: "string", description: "Descripcion larga" },
        email: { type: "string", description: "Email de contacto" },
        websites: { type: "array", description: "URLs del sitio web", items: { type: "string" }, maxItems: 2 },
        vertical: {
          type: "string",
          enum: [
            "UNDEFINED", "OTHER", "AUTO", "BEAUTY", "APPAREL", "EDU", "ENTERTAIN",
            "EVENT_PLAN", "FINANCE", "GROCERY", "GOVT", "HOTEL", "HEALTH",
            "NONPROFIT", "PROF_SERVICES", "RETAIL", "TRAVEL", "RESTAURANT", "NOT_A_BIZ",
          ],
          description: "Sector del negocio",
        },
      },
    },
  },
  {
    name: "get_phone_numbers",
    description: "Lista todos los numeros de telefono registrados en tu cuenta de WhatsApp Business.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_account_analytics",
    description:
      "Obtiene metricas de la cuenta: mensajes enviados, entregados, leidos, conversaciones, costos.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
        end_date: { type: "string", description: "Fecha fin YYYY-MM-DD" },
        granularity: {
          type: "string",
          enum: ["DAILY", "MONTHLY"],
          description: "Granularidad de los datos",
          default: "DAILY",
        },
      },
      required: ["start_date", "end_date"],
    },
  },

  // --- BULK & FLOWS (24-25) ---
  {
    name: "send_bulk_messages",
    description:
      "Envia mensajes masivos usando plantillas a multiples destinatarios. Respeta rate limits de WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        template_name: { type: "string", description: "Nombre de la plantilla aprobada" },
        language_code: { type: "string", description: "Codigo de idioma", default: "es" },
        recipients: {
          type: "array",
          description: "Lista de destinatarios con sus variables de plantilla",
          items: {
            type: "object",
            properties: {
              phone: { type: "string", description: "Numero de telefono" },
              variables: {
                type: "object",
                description: "Variables para personalizar la plantilla para este destinatario",
              },
            },
            required: ["phone"],
          },
        },
        delay_ms: {
          type: "number",
          description: "Delay en ms entre cada mensaje para respetar rate limits",
          default: 100,
        },
      },
      required: ["template_name", "recipients"],
    },
  },
  {
    name: "manage_whatsapp_flow",
    description:
      "Gestiona WhatsApp Flows: crea, actualiza, lista o publica flujos interactivos para automatizacion.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "create", "get", "update", "publish", "delete"],
          description: "Accion a realizar sobre el flow",
        },
        flow_id: { type: "string", description: "ID del flow (para get/update/publish/delete)" },
        name: { type: "string", description: "Nombre del flow (para create)" },
        categories: {
          type: "array",
          description: "Categorias del flow",
          items: { type: "string", enum: ["SIGN_UP", "SIGN_IN", "APPOINTMENT_BOOKING", "LEAD_GENERATION", "CONTACT_US", "CUSTOMER_SUPPORT", "SURVEY", "OTHER"] },
        },
        flow_json: { type: "string", description: "JSON del flow (para create/update)" },
      },
      required: ["action"],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleTool(name, args) {
  switch (name) {
    // --- MESSAGING ---
    case "send_text_message":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "text",
        text: { preview_url: args.preview_url || false, body: args.body },
      });

    case "send_template_message":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "template",
        template: {
          name: args.template_name,
          language: { code: args.language_code || "es" },
          ...(args.components && { components: args.components }),
        },
      });

    case "send_media_message": {
      const mediaObj = {};
      if (args.media_id) mediaObj.id = args.media_id;
      else if (args.media_url) mediaObj.link = args.media_url;
      if (args.caption) mediaObj.caption = args.caption;
      if (args.filename) mediaObj.filename = args.filename;
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: args.media_type,
        [args.media_type]: mediaObj,
      });
    }

    case "send_location_message":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "location",
        location: {
          latitude: args.latitude,
          longitude: args.longitude,
          name: args.name || "",
          address: args.address || "",
        },
      });

    case "send_contact_message":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "contacts",
        contacts: args.contacts,
      });

    case "send_interactive_buttons":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "interactive",
        interactive: {
          type: "button",
          ...(args.header_text && { header: { type: "text", text: args.header_text } }),
          body: { text: args.body_text },
          ...(args.footer_text && { footer: { text: args.footer_text } }),
          action: {
            buttons: args.buttons.map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.title },
            })),
          },
        },
      });

    case "send_interactive_list":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "interactive",
        interactive: {
          type: "list",
          ...(args.header_text && { header: { type: "text", text: args.header_text } }),
          body: { text: args.body_text },
          ...(args.footer_text && { footer: { text: args.footer_text } }),
          action: {
            button: args.button_text,
            sections: args.sections,
          },
        },
      });

    case "send_reaction":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "reaction",
        reaction: { message_id: args.message_id, emoji: args.emoji },
      });

    // --- MESSAGE MANAGEMENT ---
    case "mark_message_read":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        status: "read",
        message_id: args.message_id,
      });

    case "reply_to_message":
      return await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", {
        messaging_product: "whatsapp",
        to: args.to,
        type: "text",
        text: { body: args.body },
        context: { message_id: args.message_id },
      });

    case "delete_message":
      // WhatsApp Cloud API does not have a direct delete endpoint for sent messages.
      // This is handled client-side. We return informational response.
      return {
        note: "WhatsApp Cloud API no soporta eliminacion remota de mensajes. El mensaje solo puede ser eliminado desde el dispositivo del remitente dentro de la ventana de tiempo permitida.",
        message_id: args.message_id,
      };

    case "get_message_status":
      // Status is received via webhooks, not directly queryable.
      return {
        note: "El estado de mensajes se recibe via webhooks. Configura el webhook endpoint para recibir actualizaciones en tiempo real de: sent, delivered, read, failed.",
        message_id: args.message_id,
        webhook_events: ["messages", "message_status"],
      };

    // --- MEDIA MANAGEMENT ---
    case "upload_media":
      // For simplicity, we document that file upload requires multipart form.
      // In production, you'd fetch the file and upload it.
      return {
        note: "Para subir media, usa POST /{PHONE_NUMBER_ID}/media con multipart/form-data.",
        endpoint: `${BASE_URL}/${PHONE_NUMBER_ID}/media`,
        required_fields: {
          messaging_product: "whatsapp",
          type: args.mime_type,
          file: "binary data",
        },
      };

    case "get_media_url":
      return await waRequest(`/${args.media_id}`);

    case "delete_media":
      return await waRequest(`/${args.media_id}`, "DELETE");

    // --- TEMPLATES ---
    case "list_message_templates": {
      let url = `/${BUSINESS_ACCOUNT_ID}/message_templates?limit=${args.limit || 20}`;
      if (args.status) url += `&status=${args.status}`;
      return await waRequest(url);
    }

    case "create_message_template":
      return await waRequest(`/${BUSINESS_ACCOUNT_ID}/message_templates`, "POST", {
        name: args.name,
        category: args.category,
        language: args.language || "es",
        components: args.components,
      });

    case "delete_message_template":
      return await waRequest(
        `/${BUSINESS_ACCOUNT_ID}/message_templates?name=${args.template_name}`,
        "DELETE"
      );

    case "get_template_analytics": {
      let url = `/${BUSINESS_ACCOUNT_ID}/template_analytics?template_ids=["${args.template_name}"]`;
      if (args.start_date) url += `&start=${args.start_date}`;
      if (args.end_date) url += `&end=${args.end_date}`;
      return await waRequest(url);
    }

    // --- BUSINESS PROFILE & ACCOUNT ---
    case "get_business_profile":
      return await waRequest(
        `/${PHONE_NUMBER_ID}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`
      );

    case "update_business_profile": {
      const profileData = {};
      if (args.about !== undefined) profileData.about = args.about;
      if (args.address !== undefined) profileData.address = args.address;
      if (args.description !== undefined) profileData.description = args.description;
      if (args.email !== undefined) profileData.email = args.email;
      if (args.websites !== undefined) profileData.websites = args.websites;
      if (args.vertical !== undefined) profileData.vertical = args.vertical;
      return await waRequest(`/${PHONE_NUMBER_ID}/whatsapp_business_profile`, "POST", {
        messaging_product: "whatsapp",
        ...profileData,
      });
    }

    case "get_phone_numbers":
      return await waRequest(`/${BUSINESS_ACCOUNT_ID}/phone_numbers`);

    case "get_account_analytics":
      return await waRequest(
        `/${BUSINESS_ACCOUNT_ID}/analytics?start=${args.start_date}&end=${args.end_date}&granularity=${args.granularity || "DAILY"}&phone_numbers=["${PHONE_NUMBER_ID}"]&product_types=["NOTIFICATION_MESSAGES"]&country_codes=["CO"]`
      );

    // --- BULK & FLOWS ---
    case "send_bulk_messages": {
      const results = [];
      const delay = args.delay_ms || 100;

      for (const recipient of args.recipients) {
        try {
          const templatePayload = {
            messaging_product: "whatsapp",
            to: recipient.phone,
            type: "template",
            template: {
              name: args.template_name,
              language: { code: args.language_code || "es" },
            },
          };

          if (recipient.variables) {
            templatePayload.template.components = [
              {
                type: "body",
                parameters: Object.values(recipient.variables).map((val) => ({
                  type: "text",
                  text: String(val),
                })),
              },
            ];
          }

          const result = await waRequest(`/${PHONE_NUMBER_ID}/messages`, "POST", templatePayload);
          results.push({ phone: recipient.phone, status: "sent", message_id: result.messages?.[0]?.id });
        } catch (error) {
          results.push({ phone: recipient.phone, status: "failed", error: error.message });
        }

        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      }

      return {
        total: args.recipients.length,
        sent: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status === "failed").length,
        results,
      };
    }

    case "manage_whatsapp_flow": {
      switch (args.action) {
        case "list":
          return await waRequest(`/${BUSINESS_ACCOUNT_ID}/flows`);
        case "create":
          return await waRequest(`/${BUSINESS_ACCOUNT_ID}/flows`, "POST", {
            name: args.name,
            categories: args.categories || ["OTHER"],
          });
        case "get":
          return await waRequest(`/${args.flow_id}`);
        case "update":
          return await waRequest(`/${args.flow_id}/assets`, "POST", {
            file: args.flow_json,
            name: "flow.json",
            asset_type: "FLOW_JSON",
          });
        case "publish":
          return await waRequest(`/${args.flow_id}/publish`, "POST");
        case "delete":
          return await waRequest(`/${args.flow_id}`, "DELETE");
        default:
          throw new Error(`Accion no soportada: ${args.action}`);
      }
    }

    default:
      throw new Error(`Herramienta no encontrada: ${name}`);
  }
}

// ============================================
// MCP SERVER SETUP
// ============================================

const server = new Server(
  {
    name: "whatsapp-business-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleTool(name, args || {});
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================
// START SERVER
// ============================================

async function main() {
  if (!WHATSAPP_TOKEN) {
    console.error("WHATSAPP_TOKEN environment variable is required");
    process.exit(1);
  }
  if (!PHONE_NUMBER_ID) {
    console.error("WHATSAPP_PHONE_NUMBER_ID environment variable is required");
    process.exit(1);
  }
  if (!BUSINESS_ACCOUNT_ID) {
    console.error("WHATSAPP_BUSINESS_ACCOUNT_ID environment variable is required");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WhatsApp Business MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
