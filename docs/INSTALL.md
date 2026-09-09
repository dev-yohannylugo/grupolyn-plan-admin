# Instalar el script en la copia de Drive

La hoja ya está en tu Drive:

https://docs.google.com/spreadsheets/d/1f4oapQZvQt8RRobKEcICEt-RcNKsLv90QSv_wNLR5ms/edit

Carpeta: https://drive.google.com/drive/folders/1Y85yoeS1-k7dI_VxmyFumjMqO9waYZ9S

## Activar Apps Script API (un clic)

1. Abre https://script.google.com/home/usersettings
2. Activa **Google Apps Script API**.
3. En esta carpeta:

```bash
cd apps-script
npx clasp create --title "GrupoLyN Admin v2.4" --parentId 1f4oapQZvQt8RRobKEcICEt-RcNKsLv90QSv_wNLR5ms
npx clasp push --force
```

4. Recarga la hoja. Debe aparecer el menú **Admin**.
5. Unlock con PIN `GrupoLyn2026`.

## Pegado manual (si no usas clasp)

En la copia: **Extensiones → Apps Script**. Crea un archivo por cada `.gs` de `apps-script/` (excepto `deploy/MassDeploy.gs` si solo quieres el menú) y pega el contenido. Copia también `appsscript.json` en Configuración del proyecto (manifiesto).
