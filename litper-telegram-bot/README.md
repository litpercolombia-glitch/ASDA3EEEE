# LITPER Telegram Bot

Bot de Telegram para controlar y monitorear tu tiempo de trabajo de forma remota.

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `/iniciar` | Iniciar una sesion de trabajo |
| `/parar` | Finalizar la sesion actual |
| `/estado` | Ver sesion activa |
| `/hoy` | Resumen del dia |
| `/semana` | Resumen semanal |
| `/meta [min]` | Establecer meta diaria |
| `/ayuda` | Ver todos los comandos |

## Configuracion

### 1. Crear bot en Telegram

1. Abre Telegram y busca `@BotFather`
2. Envia `/newbot`
3. Sigue las instrucciones para nombrar tu bot
4. Copia el token que te da BotFather

### 2. Configurar el proyecto

```bash
cd litper-telegram-bot
npm install
cp .env.example .env
```

### 3. Agregar el token

Edita `.env` y agrega tu token:

```
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 4. Ejecutar

Desarrollo:
```bash
npm run dev
```

Produccion:
```bash
npm run build
npm start
```

## Estructura

```
litper-telegram-bot/
├── src/
│   ├── index.ts      # Bot principal
│   └── database.ts   # Base de datos SQLite
├── data/             # Base de datos (se crea automaticamente)
├── package.json
├── tsconfig.json
└── .env              # Token del bot (no commitear)
```

## Hosting gratuito

Puedes hospedar el bot gratis en:

- **Railway** - railway.app
- **Render** - render.com
- **Fly.io** - fly.io

Solo necesitas conectar tu repositorio y agregar la variable de entorno `BOT_TOKEN`.
