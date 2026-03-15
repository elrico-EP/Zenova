<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>


# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/de221262-0e06-42c6-9879-e0bc86f2cb92

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Usar Zenova como app móvil (Android/iPhone)

### Opción 1: Instalable directa (PWA)

La app ya está preparada para instalarse con icono y abrirse en modo app (sin barra del navegador).

- Android (Chrome): abre la URL de producción y pulsa **Instalar app**.
- iPhone (Safari): abre la URL, pulsa **Compartir** → **Añadir a pantalla de inicio**.

### Opción 2: App nativa (Capacitor)

Esta opción genera proyectos nativos Android/iOS para publicar en tiendas.

1. Instala dependencias:
   `npm install`
2. Primera vez (crear proyecto nativo):
   `npm run mobile:add:android`
   `npm run mobile:add:ios`
3. Sincroniza web + nativo:
   `npm run mobile:sync`
4. Android Studio:
   `npm run mobile:android`
5. Xcode (en macOS):
   `npm run mobile:ios`

Notas:
- Android requiere Android Studio.
- iOS requiere macOS + Xcode.
- Cada cambio web nuevo: ejecuta `npm run mobile:sync` antes de compilar la app nativa.
