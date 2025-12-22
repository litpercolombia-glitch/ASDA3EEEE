"""
Definición de herramientas (tools) que Claude puede usar para ejecutar acciones autónomas.
Estas tools permiten al cerebro interactuar con el sistema de forma estructurada.
"""

from typing import List, Dict, Any

# =============================================================================
# BRAIN TOOLS - Herramientas principales del cerebro
# =============================================================================

BRAIN_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "send_whatsapp",
        "description": "Envía un mensaje de WhatsApp al cliente. Usar para notificaciones, actualizaciones de estado, o respuestas a consultas.",
        "input_schema": {
            "type": "object",
            "properties": {
                "phone": {
                    "type": "string",
                    "description": "Número de teléfono con código de país (ej: +573001234567)"
                },
                "message": {
                    "type": "string",
                    "description": "Mensaje a enviar (máximo 1000 caracteres)"
                },
                "template": {
                    "type": "string",
                    "description": "Plantilla predefinida a usar: delay_notification, delivery_confirmation, issue_update",
                    "enum": ["delay_notification", "delivery_confirmation", "issue_update", "tracking_update", "custom"]
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "normal", "high"],
                    "default": "normal"
                }
            },
            "required": ["phone", "message"]
        }
    },
    {
        "name": "update_shipment_status",
        "description": "Actualiza el estado de un envío en la base de datos. Usar cuando hay cambios en el tracking o se resuelven novedades.",
        "input_schema": {
            "type": "object",
            "properties": {
                "guide_number": {
                    "type": "string",
                    "description": "Número de guía del envío"
                },
                "new_status": {
                    "type": "string",
                    "description": "Nuevo estado del envío",
                    "enum": [
                        "en_proceso", "despachado", "en_transito", "en_ciudad_destino",
                        "en_reparto", "entregado", "novedad", "devolucion", "retenido"
                    ]
                },
                "notes": {
                    "type": "string",
                    "description": "Notas adicionales sobre la actualización"
                },
                "resolved_issue": {
                    "type": "boolean",
                    "description": "Si se resolvió una novedad previa"
                }
            },
            "required": ["guide_number", "new_status"]
        }
    },
    {
        "name": "create_alert",
        "description": "Crea una alerta en el sistema para que el equipo de operaciones tome acción. Usar para situaciones que requieren atención.",
        "input_schema": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "description": "Tipo de alerta",
                    "enum": ["delay", "issue", "critical", "info", "warning", "carrier_failure"]
                },
                "title": {
                    "type": "string",
                    "description": "Título breve de la alerta"
                },
                "description": {
                    "type": "string",
                    "description": "Descripción detallada de la situación"
                },
                "priority": {
                    "type": "integer",
                    "description": "Prioridad de 1 (baja) a 5 (crítica)",
                    "minimum": 1,
                    "maximum": 5
                },
                "related_guides": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Guías relacionadas con esta alerta"
                },
                "suggested_action": {
                    "type": "string",
                    "description": "Acción sugerida para resolver"
                }
            },
            "required": ["type", "title", "priority"]
        }
    },
    {
        "name": "schedule_action",
        "description": "Programa una acción para ejecutar en el futuro. Útil para seguimientos, recordatorios, o acciones diferidas.",
        "input_schema": {
            "type": "object",
            "properties": {
                "action_type": {
                    "type": "string",
                    "description": "Tipo de acción a programar",
                    "enum": [
                        "follow_up", "reminder", "escalate", "recheck_status",
                        "send_notification", "generate_report"
                    ]
                },
                "execute_at": {
                    "type": "string",
                    "description": "Fecha y hora de ejecución en formato ISO (YYYY-MM-DDTHH:MM:SS)"
                },
                "parameters": {
                    "type": "object",
                    "description": "Parámetros para la acción"
                },
                "reason": {
                    "type": "string",
                    "description": "Razón por la que se programa esta acción"
                }
            },
            "required": ["action_type", "execute_at"]
        }
    },
    {
        "name": "query_database",
        "description": "Consulta información de la base de datos para tomar decisiones informadas.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query_type": {
                    "type": "string",
                    "description": "Tipo de consulta",
                    "enum": ["shipments", "customers", "carriers", "metrics", "history", "alerts"]
                },
                "filters": {
                    "type": "object",
                    "description": "Filtros para la consulta (ciudad, fechas, estado, etc.)"
                },
                "limit": {
                    "type": "integer",
                    "description": "Número máximo de resultados",
                    "default": 10,
                    "maximum": 100
                },
                "order_by": {
                    "type": "string",
                    "description": "Campo para ordenar resultados"
                }
            },
            "required": ["query_type"]
        }
    },
    {
        "name": "trigger_ml_prediction",
        "description": "Ejecuta una predicción usando los modelos de Machine Learning del sistema.",
        "input_schema": {
            "type": "object",
            "properties": {
                "model": {
                    "type": "string",
                    "description": "Modelo a usar",
                    "enum": ["delay", "issue", "churn", "demand", "carrier_selection"]
                },
                "input_data": {
                    "type": "object",
                    "description": "Datos de entrada para la predicción"
                },
                "explain": {
                    "type": "boolean",
                    "description": "Si incluir explicación de la predicción",
                    "default": False
                }
            },
            "required": ["model", "input_data"]
        }
    },
    {
        "name": "escalate_to_human",
        "description": "Escala un caso a un operador humano cuando la situación requiere intervención manual.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Razón detallada de la escalación"
                },
                "priority": {
                    "type": "string",
                    "description": "Prioridad de la escalación",
                    "enum": ["low", "medium", "high", "critical"]
                },
                "context": {
                    "type": "object",
                    "description": "Contexto completo del caso"
                },
                "suggested_actions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Acciones sugeridas para el operador"
                },
                "assigned_to": {
                    "type": "string",
                    "description": "Usuario o rol al que asignar (opcional)"
                }
            },
            "required": ["reason", "priority"]
        }
    },
    {
        "name": "generate_report",
        "description": "Genera un reporte automático basado en datos del sistema.",
        "input_schema": {
            "type": "object",
            "properties": {
                "report_type": {
                    "type": "string",
                    "description": "Tipo de reporte",
                    "enum": [
                        "daily_summary", "carrier_performance", "city_analysis",
                        "issue_report", "financial_summary", "sla_compliance"
                    ]
                },
                "date_range": {
                    "type": "object",
                    "properties": {
                        "start": {"type": "string"},
                        "end": {"type": "string"}
                    },
                    "description": "Rango de fechas para el reporte"
                },
                "filters": {
                    "type": "object",
                    "description": "Filtros adicionales"
                },
                "format": {
                    "type": "string",
                    "enum": ["pdf", "excel", "json", "html"],
                    "default": "json"
                },
                "send_to": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Emails a los que enviar el reporte"
                }
            },
            "required": ["report_type"]
        }
    },
    {
        "name": "update_customer_profile",
        "description": "Actualiza información del perfil del cliente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "ID o teléfono del cliente"
                },
                "updates": {
                    "type": "object",
                    "description": "Campos a actualizar",
                    "properties": {
                        "satisfaction_score": {"type": "number"},
                        "preferred_carrier": {"type": "string"},
                        "notes": {"type": "string"},
                        "tags": {"type": "array", "items": {"type": "string"}}
                    }
                },
                "reason": {
                    "type": "string",
                    "description": "Razón de la actualización"
                }
            },
            "required": ["customer_id", "updates"]
        }
    },
    {
        "name": "log_learning",
        "description": "Registra un aprendizaje o insight para mejorar el sistema.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["pattern", "anomaly", "success", "failure", "insight"]
                },
                "description": {
                    "type": "string",
                    "description": "Descripción del aprendizaje"
                },
                "evidence": {
                    "type": "object",
                    "description": "Evidencia que soporta el aprendizaje"
                },
                "recommended_action": {
                    "type": "string",
                    "description": "Acción recomendada basada en el aprendizaje"
                },
                "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 100
                }
            },
            "required": ["category", "description"]
        }
    }
]

# =============================================================================
# LOGISTICS AGENT TOOLS - Herramientas para el agente de logística
# =============================================================================

LOGISTICS_AGENT_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "optimize_route",
        "description": "Optimiza la ruta de entrega para un conjunto de destinos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Ciudad o dirección de origen"
                },
                "destinations": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Lista de destinos a visitar"
                },
                "constraints": {
                    "type": "object",
                    "properties": {
                        "max_time_hours": {"type": "number"},
                        "priority_destinations": {"type": "array", "items": {"type": "string"}},
                        "avoid_cities": {"type": "array", "items": {"type": "string"}}
                    }
                },
                "optimize_for": {
                    "type": "string",
                    "enum": ["time", "cost", "distance"],
                    "default": "time"
                }
            },
            "required": ["origin", "destinations"]
        }
    },
    {
        "name": "select_carrier",
        "description": "Selecciona la mejor transportadora para un envío basándose en historial y restricciones.",
        "input_schema": {
            "type": "object",
            "properties": {
                "destination_city": {
                    "type": "string",
                    "description": "Ciudad de destino"
                },
                "origin_city": {
                    "type": "string",
                    "description": "Ciudad de origen",
                    "default": "Bogotá"
                },
                "weight_kg": {
                    "type": "number",
                    "description": "Peso del paquete en kg"
                },
                "priority": {
                    "type": "string",
                    "enum": ["standard", "express", "same_day"],
                    "default": "standard"
                },
                "budget": {
                    "type": "number",
                    "description": "Presupuesto máximo para el envío"
                },
                "fragile": {
                    "type": "boolean",
                    "default": False
                }
            },
            "required": ["destination_city"]
        }
    },
    {
        "name": "predict_delivery_time",
        "description": "Predice el tiempo de entrega estimado para un envío.",
        "input_schema": {
            "type": "object",
            "properties": {
                "carrier": {
                    "type": "string",
                    "description": "Transportadora a usar"
                },
                "origin": {
                    "type": "string",
                    "description": "Ciudad de origen"
                },
                "destination": {
                    "type": "string",
                    "description": "Ciudad de destino"
                },
                "ship_date": {
                    "type": "string",
                    "description": "Fecha de despacho (ISO format)"
                }
            },
            "required": ["carrier", "destination"]
        }
    },
    {
        "name": "check_carrier_capacity",
        "description": "Verifica la capacidad disponible de una transportadora.",
        "input_schema": {
            "type": "object",
            "properties": {
                "carrier": {
                    "type": "string",
                    "description": "Nombre de la transportadora"
                },
                "date": {
                    "type": "string",
                    "description": "Fecha a consultar"
                },
                "destination_city": {
                    "type": "string",
                    "description": "Ciudad de destino (opcional)"
                }
            },
            "required": ["carrier"]
        }
    },
    {
        "name": "calculate_shipping_cost",
        "description": "Calcula el costo de envío para diferentes transportadoras.",
        "input_schema": {
            "type": "object",
            "properties": {
                "origin": {"type": "string"},
                "destination": {"type": "string"},
                "weight_kg": {"type": "number"},
                "dimensions": {
                    "type": "object",
                    "properties": {
                        "length_cm": {"type": "number"},
                        "width_cm": {"type": "number"},
                        "height_cm": {"type": "number"}
                    }
                },
                "declared_value": {"type": "number"},
                "carriers": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Lista de transportadoras a cotizar (vacío = todas)"
                }
            },
            "required": ["origin", "destination", "weight_kg"]
        }
    }
]

# =============================================================================
# CUSTOMER AGENT TOOLS - Herramientas para el agente de clientes
# =============================================================================

CUSTOMER_AGENT_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "get_customer_profile",
        "description": "Obtiene el perfil completo del cliente incluyendo historial.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "ID, teléfono o email del cliente"
                },
                "include_history": {
                    "type": "boolean",
                    "description": "Incluir historial de pedidos",
                    "default": True
                },
                "include_interactions": {
                    "type": "boolean",
                    "description": "Incluir interacciones previas",
                    "default": False
                }
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "calculate_ltv",
        "description": "Calcula el Lifetime Value (valor de vida) del cliente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "ID del cliente"
                },
                "projection_months": {
                    "type": "integer",
                    "description": "Meses a proyectar",
                    "default": 12
                }
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "personalize_message",
        "description": "Personaliza un mensaje para el cliente basándose en su perfil.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "ID del cliente"
                },
                "message_template": {
                    "type": "string",
                    "description": "Plantilla base del mensaje"
                },
                "context": {
                    "type": "object",
                    "description": "Contexto adicional (pedido, situación, etc.)"
                },
                "tone": {
                    "type": "string",
                    "enum": ["formal", "friendly", "apologetic", "urgent"],
                    "default": "friendly"
                }
            },
            "required": ["customer_id", "message_template"]
        }
    },
    {
        "name": "predict_churn",
        "description": "Predice la probabilidad de que un cliente abandone.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "ID del cliente"
                },
                "include_recommendations": {
                    "type": "boolean",
                    "description": "Incluir recomendaciones de retención",
                    "default": True
                }
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "segment_customer",
        "description": "Determina el segmento al que pertenece un cliente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "ID del cliente"
                }
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "get_customer_sentiment",
        "description": "Analiza el sentimiento del cliente basándose en interacciones recientes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string"
                },
                "period_days": {
                    "type": "integer",
                    "description": "Días hacia atrás a analizar",
                    "default": 30
                }
            },
            "required": ["customer_id"]
        }
    }
]

# =============================================================================
# ANALYTICS AGENT TOOLS - Herramientas para análisis
# =============================================================================

ANALYTICS_AGENT_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "calculate_kpis",
        "description": "Calcula KPIs para un período específico.",
        "input_schema": {
            "type": "object",
            "properties": {
                "kpis": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Lista de KPIs a calcular",
                    "enum": [
                        "on_time_delivery_rate", "issue_rate", "resolution_time",
                        "customer_satisfaction", "carrier_performance", "cost_per_delivery"
                    ]
                },
                "date_range": {
                    "type": "object",
                    "properties": {
                        "start": {"type": "string"},
                        "end": {"type": "string"}
                    }
                },
                "group_by": {
                    "type": "string",
                    "enum": ["day", "week", "month", "carrier", "city"]
                }
            },
            "required": ["kpis"]
        }
    },
    {
        "name": "detect_anomalies",
        "description": "Detecta anomalías en métricas del sistema.",
        "input_schema": {
            "type": "object",
            "properties": {
                "metric": {
                    "type": "string",
                    "description": "Métrica a analizar"
                },
                "sensitivity": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "default": "medium"
                },
                "period_days": {
                    "type": "integer",
                    "default": 7
                }
            },
            "required": ["metric"]
        }
    },
    {
        "name": "forecast_demand",
        "description": "Pronostica la demanda futura.",
        "input_schema": {
            "type": "object",
            "properties": {
                "horizon_days": {
                    "type": "integer",
                    "description": "Días a pronosticar",
                    "default": 7
                },
                "granularity": {
                    "type": "string",
                    "enum": ["daily", "weekly"],
                    "default": "daily"
                },
                "by_city": {
                    "type": "boolean",
                    "default": False
                },
                "by_carrier": {
                    "type": "boolean",
                    "default": False
                }
            }
        }
    }
]

# =============================================================================
# ALL TOOLS COMBINED
# =============================================================================

ALL_TOOLS: List[Dict[str, Any]] = (
    BRAIN_TOOLS +
    LOGISTICS_AGENT_TOOLS +
    CUSTOMER_AGENT_TOOLS +
    ANALYTICS_AGENT_TOOLS
)

# Mapeo de nombres de tools a sus definiciones
TOOLS_MAP: Dict[str, Dict[str, Any]] = {
    tool["name"]: tool for tool in ALL_TOOLS
}


def get_tools_by_category(category: str) -> List[Dict[str, Any]]:
    """Retorna tools por categoría."""
    categories = {
        "brain": BRAIN_TOOLS,
        "logistics": LOGISTICS_AGENT_TOOLS,
        "customer": CUSTOMER_AGENT_TOOLS,
        "analytics": ANALYTICS_AGENT_TOOLS,
        "all": ALL_TOOLS
    }
    return categories.get(category, BRAIN_TOOLS)


def get_tool_schema(tool_name: str) -> Dict[str, Any]:
    """Retorna el schema de una tool específica."""
    return TOOLS_MAP.get(tool_name, {})
