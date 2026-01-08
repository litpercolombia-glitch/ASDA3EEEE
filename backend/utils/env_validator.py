"""
LITPER - Validador de Variables de Entorno
Verifica que las variables requeridas estén configuradas correctamente.
"""

import os
import sys
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
from loguru import logger


class Severity(Enum):
    """Severidad de los problemas encontrados"""
    ERROR = "error"      # Falla el startup
    WARNING = "warning"  # Advertencia, continúa
    INFO = "info"        # Informativo


@dataclass
class ValidationResult:
    """Resultado de validación de una variable"""
    name: str
    value: Optional[str]
    is_valid: bool
    severity: Severity
    message: str


# ==================== CONFIGURACIÓN ====================

# Variables requeridas siempre
REQUIRED_VARS = [
    ("DATABASE_URL", "URL de conexión a PostgreSQL"),
]

# Variables requeridas en producción
PRODUCTION_REQUIRED = [
    ("JWT_SECRET", "Secret para tokens JWT"),
    ("SESSION_SECRET", "Secret para sesiones"),
]

# Variables con valores por defecto peligrosos
DANGEROUS_DEFAULTS = {
    "DB_PASSWORD": ["litper_pass", "litper_secure_pass_2024", "password", "123456"],
    "JWT_SECRET": ["secret", "changeme", "your-secret-key"],
    "DATABASE_URL": ["litper_pass@localhost", "postgres:postgres@"],
}

# Variables opcionales pero recomendadas
RECOMMENDED_VARS = [
    ("ANTHROPIC_API_KEY", "API key de Claude para chat inteligente"),
    ("REDIS_URL", "URL de Redis para cache"),
]


# ==================== VALIDADOR ====================

class EnvValidator:
    """Validador de variables de entorno"""

    def __init__(self):
        self.results: List[ValidationResult] = []
        self.is_production = os.getenv("NODE_ENV") == "production"

    def validate_all(self) -> bool:
        """
        Ejecuta todas las validaciones.
        Returns: True si pasa todas las validaciones críticas.
        """
        self.results = []

        # 1. Variables requeridas
        self._validate_required()

        # 2. Variables de producción
        if self.is_production:
            self._validate_production()

        # 3. Valores peligrosos
        self._validate_dangerous_defaults()

        # 4. Variables recomendadas
        self._validate_recommended()

        # 5. Validaciones específicas
        self._validate_database_url()
        self._validate_api_keys()

        # Mostrar resultados
        self._show_results()

        # Retornar si hay errores
        errors = [r for r in self.results if r.severity == Severity.ERROR and not r.is_valid]
        return len(errors) == 0

    def _validate_required(self) -> None:
        """Valida variables requeridas"""
        for var_name, description in REQUIRED_VARS:
            value = os.getenv(var_name)
            is_valid = bool(value and value.strip())

            self.results.append(ValidationResult(
                name=var_name,
                value=self._mask_value(value) if value else None,
                is_valid=is_valid,
                severity=Severity.ERROR,
                message=f"Requerido: {description}" if not is_valid else "OK"
            ))

    def _validate_production(self) -> None:
        """Valida variables requeridas en producción"""
        for var_name, description in PRODUCTION_REQUIRED:
            value = os.getenv(var_name)
            is_valid = bool(value and value.strip())

            self.results.append(ValidationResult(
                name=var_name,
                value=self._mask_value(value) if value else None,
                is_valid=is_valid,
                severity=Severity.ERROR,
                message=f"Requerido en producción: {description}" if not is_valid else "OK"
            ))

    def _validate_dangerous_defaults(self) -> None:
        """Valida que no se usen valores por defecto peligrosos"""
        for var_name, dangerous_values in DANGEROUS_DEFAULTS.items():
            value = os.getenv(var_name, "")

            is_dangerous = any(dv in value for dv in dangerous_values)

            if is_dangerous:
                severity = Severity.ERROR if self.is_production else Severity.WARNING
                self.results.append(ValidationResult(
                    name=var_name,
                    value=self._mask_value(value),
                    is_valid=False,
                    severity=severity,
                    message=f"Usando valor por defecto inseguro"
                ))

    def _validate_recommended(self) -> None:
        """Valida variables recomendadas"""
        for var_name, description in RECOMMENDED_VARS:
            value = os.getenv(var_name)
            is_valid = bool(value and value.strip())

            if not is_valid:
                self.results.append(ValidationResult(
                    name=var_name,
                    value=None,
                    is_valid=False,
                    severity=Severity.INFO,
                    message=f"Recomendado: {description}"
                ))

    def _validate_database_url(self) -> None:
        """Validaciones específicas de DATABASE_URL"""
        db_url = os.getenv("DATABASE_URL", "")

        # Verificar formato
        if db_url and not (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
            self.results.append(ValidationResult(
                name="DATABASE_URL",
                value=self._mask_value(db_url),
                is_valid=False,
                severity=Severity.ERROR,
                message="Formato inválido. Debe comenzar con postgresql://"
            ))

        # Verificar que no use localhost en producción
        if self.is_production and db_url and "localhost" in db_url:
            self.results.append(ValidationResult(
                name="DATABASE_URL",
                value=self._mask_value(db_url),
                is_valid=False,
                severity=Severity.WARNING,
                message="Usando localhost en producción. Considera una DB remota."
            ))

    def _validate_api_keys(self) -> None:
        """Validaciones de API keys"""
        api_keys = [
            ("ANTHROPIC_API_KEY", "sk-ant-"),
            ("OPENAI_API_KEY", "sk-"),
            ("GOOGLE_API_KEY", "AIza"),
        ]

        for var_name, expected_prefix in api_keys:
            value = os.getenv(var_name, "")
            if value and not value.startswith(expected_prefix):
                self.results.append(ValidationResult(
                    name=var_name,
                    value=self._mask_value(value),
                    is_valid=False,
                    severity=Severity.WARNING,
                    message=f"Formato de API key inválido (esperado: {expected_prefix}...)"
                ))

    def _mask_value(self, value: Optional[str]) -> str:
        """Enmascara valores sensibles para logging"""
        if not value:
            return ""
        if len(value) <= 8:
            return "****"
        return value[:4] + "****" + value[-4:]

    def _show_results(self) -> None:
        """Muestra los resultados de validación"""
        errors = [r for r in self.results if r.severity == Severity.ERROR and not r.is_valid]
        warnings = [r for r in self.results if r.severity == Severity.WARNING and not r.is_valid]
        infos = [r for r in self.results if r.severity == Severity.INFO and not r.is_valid]

        logger.info("=" * 50)
        logger.info("VALIDACIÓN DE VARIABLES DE ENTORNO")
        logger.info("=" * 50)

        if errors:
            logger.error(f"Errores críticos: {len(errors)}")
            for r in errors:
                logger.error(f"  ❌ {r.name}: {r.message}")

        if warnings:
            logger.warning(f"Advertencias: {len(warnings)}")
            for r in warnings:
                logger.warning(f"  ⚠️  {r.name}: {r.message}")

        if infos:
            logger.info(f"Recomendaciones: {len(infos)}")
            for r in infos:
                logger.info(f"  ℹ️  {r.name}: {r.message}")

        if not errors and not warnings:
            logger.success("✅ Todas las variables de entorno están correctamente configuradas")

        logger.info("=" * 50)


# ==================== FUNCIONES PÚBLICAS ====================

def validate_environment() -> bool:
    """
    Valida las variables de entorno.
    Falla el startup si hay errores críticos.

    Returns:
        bool: True si la validación es exitosa
    """
    validator = EnvValidator()
    is_valid = validator.validate_all()

    if not is_valid:
        logger.error("La validación de entorno falló. Revisa los errores anteriores.")
        if validator.is_production:
            logger.error("No se puede iniciar en modo producción con errores de configuración.")
            sys.exit(1)
        else:
            logger.warning("Continuando en modo desarrollo con advertencias...")

    return is_valid


def get_env_status() -> Dict[str, any]:
    """
    Obtiene el estado de las variables de entorno.
    Útil para endpoints de health check.
    """
    validator = EnvValidator()
    validator.validate_all()

    return {
        "is_production": validator.is_production,
        "errors": len([r for r in validator.results if r.severity == Severity.ERROR and not r.is_valid]),
        "warnings": len([r for r in validator.results if r.severity == Severity.WARNING and not r.is_valid]),
        "details": [
            {
                "name": r.name,
                "is_valid": r.is_valid,
                "severity": r.severity.value,
                "message": r.message
            }
            for r in validator.results
            if not r.is_valid
        ]
    }


def require_env(var_name: str, default: Optional[str] = None) -> str:
    """
    Obtiene una variable de entorno, fallando si no existe.

    Args:
        var_name: Nombre de la variable
        default: Valor por defecto (None = requerido)

    Returns:
        El valor de la variable

    Raises:
        ValueError: Si la variable no existe y no hay default
    """
    value = os.getenv(var_name, default)
    if value is None:
        raise ValueError(f"Variable de entorno requerida: {var_name}")
    return value


# ==================== AUTO-EJECUTAR ====================

if __name__ == "__main__":
    """
    Ejecutar validación desde línea de comandos.
    Uso: python -m backend.utils.env_validator
    """
    # Configurar logging para CLI
    logger.remove()
    logger.add(
        sys.stderr,
        format="<level>{message}</level>",
        level="INFO"
    )

    print("\n🔍 Validando variables de entorno...\n")

    is_valid = validate_environment()

    print()
    if is_valid:
        print("✅ Validación completada sin errores críticos")
        sys.exit(0)
    else:
        print("❌ Validación fallida")
        sys.exit(1)
