import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

// --- Configuración del transporte ---
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// --- Correo al CLIENTE ---
export const enviarCorreoCliente = async (reserva) => {
  const mailOptions = {
    from: `"Hotel Sol" <${process.env.EMAIL_USER}>`,
    to: reserva.email,
    subject: 'Confirmación de tu Reserva - Hotel Sol',
    html: `
      <h2>¡Hola ${reserva.nombre}!</h2>
      <p>Gracias por elegir <strong>Hotel Sol</strong>. Tu reserva fue confirmada con éxito.</p>
      <ul>
        <li><strong>Check-in:</strong> ${reserva.fechaEntrada}</li>
        <li><strong>Check-out:</strong> ${reserva.fechaSalida}</li>
        <li><strong>Habitación:</strong> ${reserva.tipoHabitacion}</li>
        <li><strong>Total:</strong> $${reserva.total}</li>
      </ul>
      <p>¡Te esperamos pronto! 🌞</p>
    `,
  }

  await transporter.sendMail(mailOptions)
  console.log('Correo de confirmación enviado al cliente:', reserva.email)
}

// --- Correo al OPERADOR ---
export const enviarCorreoOperador = async (operador) => {
  const mailOptions = {
    from: `"Hotel Sol - Administración" <${process.env.EMAIL_USER}>`,
    to: operador.email,
    subject: 'Designación como nuevo operador - Hotel Sol',
    html: `
      <h2>¡Bienvenido ${operador.nombre}!</h2>
      <p>Has sido designado como nuevo <strong>operador</strong> del sistema Hotel Sol.</p>
      <p>Podrás acceder al panel de administración con las siguientes credenciales:</p>
      <ul>
        <li><strong>Usuario:</strong> ${operador.email}</li>
        <li><strong>Contraseña:</strong> (definida por el administrador)</li>
      </ul>
      <p>Por favor, inicia sesión y actualiza tu contraseña lo antes posible.</p>
      <p>— El equipo de Hotel Sol</p>
    `,
  }

  await transporter.sendMail(mailOptions)
  console.log('Correo de notificación enviado al operador:', operador.email)
}
