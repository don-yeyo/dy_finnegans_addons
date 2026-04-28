# Finnegans Addons — Don Yeyo S.A.

Sistema web interno de herramientas auxiliares para Don Yeyo S.A. que integra consultas al ERP Finnegans con servicios externos (ARBA, ARCA).

## Stack Tecnológico

- **Frontend**: React 19 + Vite (Montserrat, CSS Variables, Glassmorphism, Dark/Light mode)
- **Backend**: Node.js + Express 5
- **Integraciones**: Finnegans ERP API (OAuth2), ARBA COT (HTTP multipart)

## Funcionalidades

### Regeneración de COT
Cuando un camión deja de estar disponible (avería mecánica, falla en cámara de frío, etc.) y es necesario cargar los productos en otro vehículo, esta herramienta permite:

1. **Buscar el envío** en Finnegans por número o rango de fechas.
2. **Seleccionar la hoja de ruta** afectada y ver sus datos actuales (incluyendo transportista, chofer y detalle de viaje).
3. **Filtrado avanzado**: Permite buscar hojas de ruta por número, transportista, chofer, detalle de viaje o patente directamente desde la lista.
4. **Regenerar el COT** ingresando los nuevos datos de transporte y enviando la solicitud directamente a ARBA.

## Setup

### Requisitos
- Node.js 18+
- Credenciales OAuth de Finnegans (client_id + client_secret)
- Credenciales COT de ARBA (usuario + password)

### Instalación

```bash
# Instalar dependencias (root, server y client)
npm run install-all

# O individualmente
npm install
npm install --prefix server
npm install --prefix client
```

### Configuración

1. Copiar los archivos `.env.template` a `.env` en `server/` y `client/`
2. Configurar las credenciales en cada `.env`

#### Server (`server/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `5000` |
| `FINNEGANS_CLIENT_ID` | Client ID OAuth de Finnegans | `abc123...` |
| `FINNEGANS_CLIENT_SECRET` | Client Secret OAuth de Finnegans | `xyz789...` |
| `FINNEGANS_TOKEN_URL` | URL de autenticación | `https://api.teamplace.finneg.com/api/oauth/token` |
| `FINNEGANS_API_BASE` | URL base de la API | `https://api.finneg.com/api` |
| `FINNEGANS_EMPRESA_COD` | Código de empresa | `EMPRE01` |
| `FINNEGANS_ENVIOS_REPORT` | Reporte de envíos | `APICONSULTAENVIOSDY` |
| `FINNEGANS_HOJAS_RUTA_REPORT` | Reporte de hojas de ruta | `APICONSULTAHOJASRUTADY` |
| `FINNEGANS_TIMEOUT` | Timeout en segundos | `30` |
| `ARBA_COT_USER` | Usuario COT de ARBA | `miusuario` |
| `ARBA_COT_PASSWORD` | Contraseña COT de ARBA | `mipass` |
| `ARBA_COT_URL` | URL del servicio COT | `http://cot.test.arba.gov.ar/...` |
| `ARBA_CUIT_EMPRESA` | CUIT de la empresa (11 dígitos) | `30123456789` |
| `ARBA_SAVE_LOCAL` | ¿Guardar copia local del TXT? | `false` |
| `ARBA_LOCAL_PATH` | Path para archivos locales | `./txts` |

#### Client (`client/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL del backend | `http://localhost:5000/api` |
| `VITE_MOCK_USER_NAME` | Nombre del usuario mock | `Gabriel Tonelli` |
| `VITE_MOCK_USER_EMAIL` | Email del usuario mock | `gabrielt@donyeyo.com.ar` |

### Ejecución

```bash
# Iniciar server + client en paralelo
npm run dev

# Solo server
npm run server

# Solo client
npm run client
```

## Estructura del Proyecto

```
dy_finnegans_addons/
├── package.json               # Root: concurrently
├── .gitignore
├── README.md
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Layout, Header, Drawer, Modal, Button, FormElements
│   │   ├── config/            # ThemeContext, AuthContext
│   │   ├── pages/             # Dashboard, Settings, cot/RegeneracionCOT
│   │   └── services/          # api.js (Axios)
│   └── ...
└── server/                    # Backend (Express)
    ├── controllers/           # Lógica de negocio
    ├── routes/                # Rutas de la API
    └── services/              # finnegansService, arbaService
```

## API Endpoints

### Finnegans
- `GET /api/finnegans/envios?numero=X&fechaDesde=X&fechaHasta=X` — Buscar envíos
- `GET /api/finnegans/envios/:id/hojas-ruta` — Hojas de ruta de un envío
- `GET /api/finnegans/hojas-ruta/:id` — Detalle de una hoja de ruta

### COT
- `POST /api/cot/preview` — Vista previa del archivo COT
- `POST /api/cot/regenerar` — Generar y enviar COT a ARBA

### Sistema
- `GET /api/system/version` — Versión del backend

## Notas Importantes

- **ARBA COT**: El formato del archivo de remito debe ajustarse al diseño oficial vigente de ARBA. La implementación actual es una aproximación que debe validarse contra la especificación exacta.
- **Finnegans Reports**: Los nombres de los reportes (`FINNEGANS_ENVIOS_REPORT`, `FINNEGANS_HOJAS_RUTA_REPORT`) deben coincidir con los configurados en Finnegans > App Builder > Diccionario de APIs.
- **Autenticación**: Actualmente usa mock auth. Se puede integrar MSAL (Azure AD) o Google OAuth cuando se determine el modelo de autenticación.

## Licencia

Uso interno — Don Yeyo S.A.
