# GrupoLyN Plan Admin (v2.4)

Automatización de la plantilla DSM PROSPR Plan: menú **Admin**, reporte comparativo mensual y un enfoque de despliegue masivo por biblioteca.

## Qué se entrega

- Copia de la plantilla en Google Drive personal (`yohannylugo88@gmail.com`), Cover en **Version 2.4**.
  - Hoja: [https://docs.google.com/spreadsheets/d/1f4oapQZvQt8RRobKEcICEt-RcNKsLv90QSv_wNLR5ms/edit](https://docs.google.com/spreadsheets/d/1f4oapQZvQt8RRobKEcICEt-RcNKsLv90QSv_wNLR5ms/edit)
  - Carpeta: [https://drive.google.com/drive/folders/1Y85yoeS1-k7dI_VxmyFumjMqO9waYZ9S](https://drive.google.com/drive/folders/1Y85yoeS1-k7dI_VxmyFumjMqO9waYZ9S)
- Código Apps Script modular: repositorio privado [https://github.com/dev-yohannylugo/grupolyn-plan-admin](https://github.com/dev-yohannylugo/grupolyn-plan-admin) (invitar al evaluador).
- PIN de administrador por defecto: `GrupoLyn2026` (cambiable desde el menú).

Para ligar el código a la hoja, el proyecto bound ya está creado: [https://script.google.com/d/1JX9h0KVMX28RMq4WNWfUaaNwo3gpY0sRKomTBiFrDX3yx5t0IEf6UDMO/edit](https://script.google.com/d/1JX9h0KVMX28RMq4WNWfUaaNwo3gpY0sRKomTBiFrDX3yx5t0IEf6UDMO/edit) — recarga la hoja para ver el menú **Admin**. Detalles en [docs/INSTALL.md](docs/INSTALL.md). El plan técnico de la prueba está en [docs/PLAN.md](docs/PLAN.md).

## Cómo probar

1. Abre la copia de la hoja y recarga.
2. Menú **Admin → Unlock…** e introduce `GrupoLyn2026`.
3. **Generate monthly comparative report** — crea la pestaña `Admin Comparative Report` a partir de `Monthly Budget` (mes en F3 / año en F2).
4. **Create Gmail draft** — mismo texto en un borrador de Gmail (no se envía).
5. **Change admin PIN…** — pide PIN actual, PIN nuevo y confirmación.
6. **Lock Admin** — oculta las herramientas hasta un nuevo unlock.

Umbral de desviación: **15%**. Categorías dentro del umbral: solo totales. Si la categoría se desvía, se insertan líneas con los conceptos (drivers) responsables.

Ejemplo (datos reales de Jan 2025 en la plantilla): Food & Supplies queda over budget (~21.5%) y Grocery aparece como driver.

## Diseño

La lógica vive en archivos separados (`Config`, `AuthService`, `MenuService`, `BudgetParser`, `VarianceAnalyzer`, `ReportBuilder`, `GmailDraftService`). El bound script de demostración incluye todo el código para que el menú funcione sin configurar una library ID.

Para N copias de clientes, el mismo código se publica como **Master Script Library** (`GrupoLynFinanceLib`). El bootstrap y el enlace a la librería están en `apps-script/deploy/MassDeploy.gs`.

## Parser de Monthly Budget

- D = Budget, F = Actual, B = categoría / `Total …`, C = concepto, P = Hide.
- Solo el bloque `Expenses & Debt Service` (Shelter, Food & Supplies, etc.).
- No se escriben las pestañas `* Budget Comparison` existentes.

La columna Variance de la plantilla es Budget − Actual. El texto del reporte usa actual vs planned (over = actual > planned), como en el enunciado.

## Supuestos

- El PIN evita uso accidental por el cliente; quien edite el script puede leer propiedades.
- El reporte se genera en inglés, alineado al ejemplo del enunciado.
- El repositorio GitHub es **privado**; el evaluador necesita invitación o el código vía Drive.
- El deployer masivo requiere Apps Script API habilitada y el `LIBRARY_ID` real tras publicar la librería.



## PIN y versión

- Default: `GrupoLyn2026` (se persiste en Script Properties en el primer `onOpen`).
- Versión de plantilla: **2.4**.

  
Nota: vale la pena destacar, que no creaba codigo para hojas de calculo desde hace mas de 7 años cuando programe un excel con datos de directus para un cashflow inicial...  aunque realmente no sabia por donde empezar, siempre trabajo asi,  IA-first... leo lo que me recomienda, voy ajustando, y al final pruebo todo... en este caso, a pesar de los años que tengo sin programar una hoja de calculo, en especial Google Sheets que nunca antes la habia usado para programarle, pude cumplir con el objetivo... 