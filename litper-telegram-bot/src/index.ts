import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import {
  crearUsuario,
  getUsuario,
  setMetaDiaria,
  getSesionActiva,
  iniciarSesion,
  finalizarSesion,
  getResumenHoy,
  getResumenSemana,
  getSesionesHoy
} from './database';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('ERROR: Falta BOT_TOKEN en el archivo .env');
  console.log('1. Crea un bot en @BotFather en Telegram');
  console.log('2. Copia el token y ponlo en .env como: BOT_TOKEN=tu_token_aqui');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Emojis para procesos
const PROCESOS = {
  guias: { emoji: '📗', nombre: 'Guías' },
  novedades: { emoji: '📙', nombre: 'Novedades' },
  otro: { emoji: '📘', nombre: 'Otro' }
};

// Formatear minutos a horas:minutos
function formatearTiempo(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (horas > 0) {
    return `${horas}h ${mins}m`;
  }
  return `${mins}m`;
}

// Comando /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const nombre = ctx.from.first_name || 'Usuario';

  crearUsuario(chatId, nombre);

  await ctx.reply(
    `👋 ¡Hola ${nombre}!\n\n` +
    `Soy el bot de LITPER Tracker. Te ayudo a registrar tu tiempo de trabajo.\n\n` +
    `📋 *Comandos disponibles:*\n\n` +
    `/iniciar - Iniciar una sesión de trabajo\n` +
    `/parar - Finalizar la sesión actual\n` +
    `/hoy - Ver resumen del día\n` +
    `/semana - Ver resumen semanal\n` +
    `/meta - Establecer meta diaria\n` +
    `/estado - Ver sesión activa\n` +
    `/ayuda - Ver todos los comandos`,
    { parse_mode: 'Markdown' }
  );
});

// Comando /ayuda
bot.command('ayuda', async (ctx) => {
  await ctx.reply(
    `📖 *LITPER Bot - Ayuda*\n\n` +
    `*Sesiones:*\n` +
    `/iniciar - Comenzar a trabajar\n` +
    `/parar - Terminar sesión\n` +
    `/estado - Ver sesión actual\n\n` +
    `*Estadísticas:*\n` +
    `/hoy - Resumen de hoy\n` +
    `/semana - Resumen semanal\n\n` +
    `*Configuración:*\n` +
    `/meta [minutos] - Establecer meta diaria\n` +
    `  Ejemplo: /meta 480 (8 horas)\n\n` +
    `💡 *Tip:* Usa los botones para acciones rápidas`,
    { parse_mode: 'Markdown' }
  );
});

// Comando /iniciar
bot.command('iniciar', async (ctx) => {
  const chatId = ctx.chat.id;
  const activa = getSesionActiva(chatId);

  if (activa) {
    const inicio = new Date(activa.inicio);
    const ahora = new Date();
    const minutos = Math.floor((ahora.getTime() - inicio.getTime()) / 1000 / 60);

    await ctx.reply(
      `⚠️ Ya tienes una sesión activa:\n\n` +
      `${PROCESOS[activa.proceso as keyof typeof PROCESOS]?.emoji || '📘'} *${activa.proceso}*\n` +
      `⏱ Tiempo: ${formatearTiempo(minutos)}\n\n` +
      `Usa /parar para finalizarla primero.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply(
    '🎯 *¿Qué tipo de trabajo vas a hacer?*',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('📗 Guías', 'iniciar_guias'),
          Markup.button.callback('📙 Novedades', 'iniciar_novedades')
        ],
        [
          Markup.button.callback('📘 Otro', 'iniciar_otro')
        ]
      ])
    }
  );
});

// Handlers para botones de iniciar
bot.action(/^iniciar_(.+)$/, async (ctx) => {
  const proceso = ctx.match[1];
  const chatId = ctx.chat!.id;
  const nombreProceso = PROCESOS[proceso as keyof typeof PROCESOS]?.nombre || proceso;
  const emoji = PROCESOS[proceso as keyof typeof PROCESOS]?.emoji || '📘';

  iniciarSesion(chatId, proceso);

  await ctx.editMessageText(
    `${emoji} *Sesión iniciada: ${nombreProceso}*\n\n` +
    `⏱ Comenzando a contar tiempo...\n\n` +
    `Usa /parar cuando termines.`,
    { parse_mode: 'Markdown' }
  );
});

// Comando /parar
bot.command('parar', async (ctx) => {
  const chatId = ctx.chat.id;
  const activa = getSesionActiva(chatId);

  if (!activa) {
    await ctx.reply('❌ No tienes ninguna sesión activa.\n\nUsa /iniciar para comenzar.');
    return;
  }

  const sesion = finalizarSesion(chatId);

  if (sesion) {
    const emoji = PROCESOS[sesion.proceso as keyof typeof PROCESOS]?.emoji || '📘';
    const nombre = PROCESOS[sesion.proceso as keyof typeof PROCESOS]?.nombre || sesion.proceso;

    // Obtener progreso del día
    const resumen = getResumenHoy(chatId);
    const usuario = getUsuario(chatId);
    const meta = usuario?.meta_diaria || 480;
    const progreso = Math.min(100, Math.round((resumen.totalMinutos / meta) * 100));
    const barraProgreso = generarBarraProgreso(progreso);

    await ctx.reply(
      `✅ *Sesión finalizada*\n\n` +
      `${emoji} *${nombre}*\n` +
      `⏱ Duración: ${formatearTiempo(sesion.duracion)}\n\n` +
      `📊 *Progreso del día:*\n` +
      `${barraProgreso} ${progreso}%\n` +
      `Total: ${formatearTiempo(resumen.totalMinutos)} / ${formatearTiempo(meta)}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Comando /estado
bot.command('estado', async (ctx) => {
  const chatId = ctx.chat.id;
  const activa = getSesionActiva(chatId);

  if (!activa) {
    await ctx.reply(
      '💤 *Sin sesión activa*\n\nUsa /iniciar para comenzar a trabajar.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const inicio = new Date(activa.inicio);
  const ahora = new Date();
  const minutos = Math.floor((ahora.getTime() - inicio.getTime()) / 1000 / 60);
  const emoji = PROCESOS[activa.proceso as keyof typeof PROCESOS]?.emoji || '📘';
  const nombre = PROCESOS[activa.proceso as keyof typeof PROCESOS]?.nombre || activa.proceso;

  await ctx.reply(
    `🔴 *Sesión en curso*\n\n` +
    `${emoji} *${nombre}*\n` +
    `⏱ Tiempo: ${formatearTiempo(minutos)}\n` +
    `🕐 Inicio: ${inicio.toLocaleTimeString('es-CO')}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏹ Parar sesión', 'parar_sesion')]
      ])
    }
  );
});

// Handler para botón parar
bot.action('parar_sesion', async (ctx) => {
  const chatId = ctx.chat!.id;
  const sesion = finalizarSesion(chatId);

  if (sesion) {
    const emoji = PROCESOS[sesion.proceso as keyof typeof PROCESOS]?.emoji || '📘';
    const nombre = PROCESOS[sesion.proceso as keyof typeof PROCESOS]?.nombre || sesion.proceso;

    await ctx.editMessageText(
      `✅ *Sesión finalizada*\n\n` +
      `${emoji} *${nombre}*\n` +
      `⏱ Duración: ${formatearTiempo(sesion.duracion)}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Comando /hoy
bot.command('hoy', async (ctx) => {
  const chatId = ctx.chat.id;
  const resumen = getResumenHoy(chatId);
  const usuario = getUsuario(chatId);
  const meta = usuario?.meta_diaria || 480;
  const progreso = Math.min(100, Math.round((resumen.totalMinutos / meta) * 100));
  const barraProgreso = generarBarraProgreso(progreso);

  let detalle = '';
  for (const [proceso, minutos] of Object.entries(resumen.porProceso)) {
    const emoji = PROCESOS[proceso as keyof typeof PROCESOS]?.emoji || '📘';
    const nombre = PROCESOS[proceso as keyof typeof PROCESOS]?.nombre || proceso;
    detalle += `${emoji} ${nombre}: ${formatearTiempo(minutos)}\n`;
  }

  if (!detalle) {
    detalle = '_(Sin sesiones registradas)_\n';
  }

  await ctx.reply(
    `📅 *Resumen de hoy*\n\n` +
    `${barraProgreso} ${progreso}%\n` +
    `⏱ Total: ${formatearTiempo(resumen.totalMinutos)} / ${formatearTiempo(meta)}\n` +
    `📋 Sesiones: ${resumen.totalSesiones}\n\n` +
    `*Por tipo:*\n${detalle}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Actualizar', 'actualizar_hoy')]
      ])
    }
  );
});

bot.action('actualizar_hoy', async (ctx) => {
  const chatId = ctx.chat!.id;
  const resumen = getResumenHoy(chatId);
  const usuario = getUsuario(chatId);
  const meta = usuario?.meta_diaria || 480;
  const progreso = Math.min(100, Math.round((resumen.totalMinutos / meta) * 100));
  const barraProgreso = generarBarraProgreso(progreso);

  let detalle = '';
  for (const [proceso, minutos] of Object.entries(resumen.porProceso)) {
    const emoji = PROCESOS[proceso as keyof typeof PROCESOS]?.emoji || '📘';
    const nombre = PROCESOS[proceso as keyof typeof PROCESOS]?.nombre || proceso;
    detalle += `${emoji} ${nombre}: ${formatearTiempo(minutos)}\n`;
  }

  if (!detalle) {
    detalle = '_(Sin sesiones registradas)_\n';
  }

  await ctx.editMessageText(
    `📅 *Resumen de hoy* _(actualizado)_\n\n` +
    `${barraProgreso} ${progreso}%\n` +
    `⏱ Total: ${formatearTiempo(resumen.totalMinutos)} / ${formatearTiempo(meta)}\n` +
    `📋 Sesiones: ${resumen.totalSesiones}\n\n` +
    `*Por tipo:*\n${detalle}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Actualizar', 'actualizar_hoy')]
      ])
    }
  );
});

// Comando /semana
bot.command('semana', async (ctx) => {
  const chatId = ctx.chat.id;
  const resumen = getResumenSemana(chatId);

  let detalleDias = '';
  const dias = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  for (const dia of dias) {
    const minutos = resumen.porDia[dia] || 0;
    const bloques = Math.min(10, Math.floor(minutos / 48)); // 480min = 10 bloques
    const barra = '█'.repeat(bloques) + '░'.repeat(10 - bloques);
    detalleDias += `${dia}: ${barra} ${formatearTiempo(minutos)}\n`;
  }

  await ctx.reply(
    `📊 *Resumen semanal*\n\n` +
    `⏱ Total: ${formatearTiempo(resumen.totalMinutos)}\n` +
    `📋 Sesiones: ${resumen.totalSesiones}\n` +
    `📈 Promedio/día: ${formatearTiempo(Math.round(resumen.totalMinutos / 7))}\n\n` +
    `*Por día:*\n\`\`\`\n${detalleDias}\`\`\``,
    { parse_mode: 'Markdown' }
  );
});

// Comando /meta
bot.command('meta', async (ctx) => {
  const chatId = ctx.chat.id;
  const args = ctx.message.text.split(' ');

  if (args.length < 2) {
    const usuario = getUsuario(chatId);
    const metaActual = usuario?.meta_diaria || 480;

    await ctx.reply(
      `🎯 *Meta diaria actual: ${formatearTiempo(metaActual)}*\n\n` +
      `Para cambiarla, usa:\n` +
      `/meta [minutos]\n\n` +
      `Ejemplos:\n` +
      `• /meta 480 (8 horas)\n` +
      `• /meta 360 (6 horas)\n` +
      `• /meta 240 (4 horas)`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const minutos = parseInt(args[1]);

  if (isNaN(minutos) || minutos < 1 || minutos > 1440) {
    await ctx.reply('❌ Por favor ingresa un número válido de minutos (1-1440)');
    return;
  }

  crearUsuario(chatId, ctx.from.first_name || 'Usuario');
  setMetaDiaria(chatId, minutos);

  await ctx.reply(
    `✅ *Meta actualizada*\n\n` +
    `🎯 Nueva meta diaria: ${formatearTiempo(minutos)}`,
    { parse_mode: 'Markdown' }
  );
});

// Función para generar barra de progreso
function generarBarraProgreso(porcentaje: number): string {
  const llenos = Math.floor(porcentaje / 10);
  const vacios = 10 - llenos;
  return '█'.repeat(llenos) + '░'.repeat(vacios);
}

// Manejo de errores
bot.catch((err, ctx) => {
  console.error('Error en el bot:', err);
  ctx.reply('❌ Ocurrió un error. Por favor intenta de nuevo.');
});

// Iniciar bot
console.log('🤖 Iniciando LITPER Bot...');
bot.launch();

// Manejo de cierre graceful
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('✅ LITPER Bot iniciado correctamente');
