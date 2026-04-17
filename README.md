🐾 DogBeauty Grooming — Sistema de Gestión

Sistema web completo para la gestión de una peluquería canina premium, desarrollado como prueba técnica.

🌐 Demo en Vivo
Frontend: https://dogbeauty-grooming.vercel.app
Backend API: https://dogbeauty-grooming-production.up.railway.app
Credenciales de prueba:
Admin: admin1@dogbeauty.com / 123456
Groomer: carlos1@dogbeauty.com / 123456
🏗️ Arquitectura
dogbeauty-grooming/
├── src/                    # Backend Node.js
│   ├── config/
│   │   └── db.js           # Conexión PostgreSQL
│   ├── controllers/        # Lógica de negocio
│   ├── middleware/
│   │   └── auth.js         # JWT middleware
│   ├── routes/             # Endpoints REST
│   └── index.js            # Servidor Express
├── client/                 # Frontend React
│   ├── src/
│   │   ├── context/        # AuthContext
│   │   ├── services/       # Axios API
│   │   ├── components/     # Navbar
│   │   └── pages/          # Vistas
│   └── public/
└── README.md
🛠️ Tecnologías
Capa	Tecnología
Backend	Node.js + Express
Base de datos	PostgreSQL
Autenticación	JWT + bcryptjs
Frontend	React.js
Estilos	CSS (Flexbox + Grid)
Deploy Backend	Railway
Deploy Frontend	Vercel
Control de versiones	Git + GitHub
📡 Endpoints Principales
🔐 Autenticación
Método	Endpoint	Descripción
POST	/api/auth/register	Registrar usuario
POST	/api/auth/login	Iniciar sesión
GET	/api/auth/me	Perfil del usuario
📅 Citas
Método	Endpoint	Descripción
GET	/api/appointments	Listar citas
POST	/api/appointments	Crear cita
PUT	/api/appointments/:id	Actualizar cita
PUT	/api/appointments/:id/complete	Completar cita
PUT	/api/appointments/:id/cancel	Cancelar cita
🐶 Mascotas
Método	Endpoint	Descripción
GET	/api/pets	Listar mascotas
POST	/api/pets	Crear mascota
PUT	/api/pets/:id	Actualizar mascota
DELETE	/api/pets/:id	Eliminar mascota
👤 Dueños
Método	Endpoint	Descripción
GET	/api/owners	Listar dueños
POST	/api/owners	Crear dueño
PUT	/api/owners/:id	Actualizar dueño
DELETE	/api/owners/:id	Eliminar dueño
🛒 Productos
Método	Endpoint	Descripción
GET	/api/products	Listar productos
POST	/api/products	Crear producto
PUT	/api/products/:id	Actualizar producto
POST	/api/products/sell	Registrar venta
📊 Dashboard (Admin)
Método	Endpoint	Descripción
GET	/api/dashboard	Métricas del sistema
⚙️ Instalación Local
🔧 Requisitos
Node.js 18+
PostgreSQL
npm
▶️ Backend
git clone https://github.com/omaralfonso51/dogbeauty-grooming.git
cd dogbeauty-grooming
npm install

Crear archivo .env:

DATABASE_URL=postgresql://usuario:password@localhost:5432/dogbeauty
JWT_SECRET=dogbeauty_secret
PORT=3000
NODE_ENV=development

Ejecutar:

npm run dev
💻 Frontend
cd client
npm install

Crear archivo .env:

REACT_APP_API_URL=http://localhost:3000/api

Ejecutar:

npm start
✨ Funcionalidades
✅ Funcionalidades principales
Gestión de citas grooming
Registro de mascotas y dueños
Catálogo de cortes por raza
Venta de productos
Historial de servicios
Sistema de recordatorios
📊 Dashboard
Citas pendientes y completadas
Ingresos generados
Métricas por groomer
Control de actividad
👥 Roles del sistema
Admin: acceso total, métricas y gestión completa
Groomer: gestión de sus citas y seguimiento de trabajo
🔐 Seguridad
Autenticación con JWT
Middleware de protección de rutas
Control de acceso por roles
Manejo seguro de contraseñas con bcrypt
🚀 Despliegue
Backend (Railway)
Conectado a PostgreSQL en la nube
Variables de entorno configuradas
Deploy automático desde GitHub
Frontend (Vercel)
Build automático con React
Variables de entorno configuradas
Integración con backend desplegado
📸 Capturas (Opcional)

Puedes agregar aquí imágenes de:

Login
Dashboard
Mascotas
Citas
👨‍💻 Desarrollado por

Omar Alfonso
Candidato a pasantía de desarrollo
2026

📌 Notas Finales

Este proyecto fue desarrollado como solución completa fullstack, aplicando buenas prácticas de:

Arquitectura MVC
Consumo de APIs REST
Manejo de estado en frontend
Despliegue en la nube