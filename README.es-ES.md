# 🌳 FileTree Pro - Extensión de VS Code

Un potente generador de árboles de archivos para VS Code y Cursor. Genera árboles de archivos hermosos en múltiples formatos con exclusiones inteligentes y configuraciones personalizadas.

[![Version](https://img.shields.io/visual-studio-marketplace/v/0xtanzim.filetree-pro?style=flat-square&label=version&color=blue)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/0xtanzim.filetree-pro?style=flat-square&label=downloads&color=brightgreen)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/0xtanzim.filetree-pro?style=flat-square&label=rating&color=yellow)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/0xtanzim.filetree-pro?style=flat-square&label=installs&color=orange)](https://marketplace.visualstudio.com/items?itemName=0xtanzim.filetree-pro)

## 📹 Videos Demo

¡Mira FileTree Pro en acción a continuación!

### 🧪 Video Demo

[![Short Demo](https://img.youtube.com/vi/k0TNEr43gQ0/hqdefault.jpg)](https://youtu.be/k0TNEr43gQ0)

➡️ _Haz clic derecho en cualquier carpeta → ¡Genera el árbol de archivos en segundos!_

## ⚙️ Configuración

### Configuración Rápida

Añade esto a tus ajustes de VS Code (`Ctrl/Cmd + ,`):

```json
{
  "filetree-pro.maxDepth": 15,
  "filetree-pro.exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/.venv/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.log",
    "**/*.tmp"
  ],
  "filetree-pro.showIcons": true,
  "filetree-pro.respectGitignore": true
}
```

### 🎯 Configuración de Profundidad (Depth)

**¡NUEVO!** Controla qué tan profundo llega el escaneo del árbol de archivos:

```json
{
  "filetree-pro.maxDepth": 5 // Escanear 5 niveles de profundidad
}
```

**Guía de Profundidad:**

| Profundidad | Velocidad       | Ideal Para                     | Archivos Escaneados |
| ----------- | --------------- | ------------------------------ | ------------------- |
| 2           | ⚡⚡⚡ Instantáneo | Documentación README, vista rápida | ~50                |
| 5           | ⚡⚡ Rápido     | Revisiones de código, presentaciones | ~500               |
| 10          | ⚡ Bueno       | Análisis completo, documentación | ~5,000             |
| 15+         | ⏱️ Más lento   | Análisis profundo, monorepos grandes | 10,000+            |

**Consejo:** Comienza con una profundidad de 3-5 para proyectos grandes, ¡y auméntala si es necesario!

### Exclusiones Personalizadas

Añade tus propios patrones para excluir archivos/carpetas:

```json
{
  "filetree-pro.exclude": [
    "**/node_modules/**",
    "**/mi-carpeta-personalizada/**",
    "**/*.test.js",
    "**/temp/**"
  ]
}
```

### 📚 Guía de Configuración Completa

Para opciones de configuración detalladas que incluyen:

- Estrategias de optimización para monorepos
- Configuraciones específicas por lenguaje
- Ajustes de rendimiento
- Sintaxis de patrones de exclusión

**[📖 Leer la Guía de Configuración Completa →](./docs/CONFIGURATION-GUIDE.md)**

## 🚀 Características

### 📁 Generación Inteligente de Árboles de Archivos

- **Clic derecho en cualquier carpeta** → Generar árbol de archivos
- **Seleccionar texto** → Convertir a formato de árbol
- **4 Formatos de Salida**: Markdown, JSON, SVG, ASCII
- **Soporte de Iconos**: Iconos hermosos para todos los tipos de archivos
- **Exclusiones Inteligentes**: Excluye automáticamente archivos de compilación, dependencias y archivos temporales

### 🌍 Soporte Universal de Lenguajes

- **Más de 50 Lenguajes de Programación**: JavaScript, Python, Java, C++, Go, Rust, Kotlin, Scala, C#, F#, Dart, R, MATLAB, Julia, Perl, Lua, Haskell, Clojure, Elixir, Erlang, OCaml, Nim, Zig, V, Assembly, y más
- **Archivos Especiales**: Dockerfile, Makefile, README, LICENSE, CHANGELOG
- **Tecnologías Web**: HTML, CSS, SCSS, Vue, Svelte
- **Archivos de Configuración**: YAML, TOML, INI, XML, JSON

### 🎨 Múltiples Formatos de Exportación

| Formato         | Caso de Uso                | Características                |
| --------------- | -------------------------- | ----------------------------- |
| **📄 Markdown** | Documentación, GitHub       | Iconos, formato limpio         |
| **📊 JSON**     | APIs, Procesamiento de datos | Datos estructurados, iconos   |
| **🎨 SVG**      | Presentaciones, diagramas   | Visual, escalable             |
| **📝 ASCII**    | Compatibilidad universal   | Texto plano, portátil         |

### 🛡️ Exclusiones Inteligentes

Excluye automáticamente los artefactos de compilación comunes y **respeta los archivos .gitignore**:

- **Respeta .gitignore**: Honra los patrones de `.gitignore` de tu proyecto
- `node_modules`, `dist`, `build`, `out`
- `.git`, `.venv`, `venv`, `env`
- `*.log`, `*.tmp`, `*.cache`
- `__pycache__`, `*.pyc`
- `target`, `bin`, `obj`
- `.DS_Store`, `Thumbs.db`

### ⚡ Optimización de Rendimiento

- **Gestión de Memoria**: Eficiente para proyectos grandes
- **Procesamiento Asíncrono**: Generación de árbol no bloqueante
- **Estados de Carga**: Retroalimentación visual durante el procesamiento
- **Procesamiento por Lotes**: Maneja más de 10,000 archivos sin problemas

## 🎯 Inicio Rápido

1. **Instalar Extensión**: Busca "FileTree Pro" en las extensiones de VS Code
2. **Abrir Proyecto**: Abre cualquier carpeta de proyecto en VS Code
3. **Generar Árbol**: Clic derecho en cualquier carpeta → "Generate File Tree"
4. **Elegir Formato**: Selecciona Markdown, JSON, SVG o ASCII
5. **Elegir Estilo**: Con o sin iconos
6. **Guardar**: El árbol se abre en una pestaña sin guardar; ¡guárdalo cuando estés listo!

## 📝 Conversión de Texto a Árbol

**¡Nueva Función!** Convierte cualquier lista de texto en un hermoso formato de árbol:

1. **Selecciona texto** en cualquier editor (rutas de archivos, listas de carpetas, etc.)
2. **Clic derecho** → "Convert Text to Tree"
3. **Visualiza** el árbol convertido en una nueva pestaña

### 📹 Video Demo - Cómo convertir texto a árbol

[![Text to Tree Conversion](https://img.youtube.com/vi/ixqyyAPhodw/hqdefault.jpg)](https://youtu.be/ixqyyAPhodw)

### Ejemplo de Entrada

```
src/
main.js
utils.js
components/
Header.js
Footer.js
```

### Ejemplo de Salida

```
# File Tree from Text

├── 📁 src/
├── 📄 main.js
├── 📄 utils.js
├── 📁 components/
├── 📄 Header.js
└── 📄 Footer.js

*Generated by FileTree Pro Extension*
```

## 📹 Guía en Video

Mira esta demo rápida para ver FileTree Pro en acción:

[![Short Demo](https://img.youtube.com/vi/EvgOWywtJjU/hqdefault.jpg)](https://youtu.be/EvgOWywtJjU)

_La demo cubre el clic derecho en una carpeta; también puedes ejecutar **File Tree Pro: Generate File Tree** desde la Paleta de Comandos (usa todo el espacio de trabajo) o usar el icono de lista en el título de la vista de **File Tree Pro**._

## 📋 Comandos

- **File Tree Pro: Generate File Tree** (`filetree-pro.generateFileTree`) — Haz clic derecho en un **nodo de carpeta** en el Explorador (no en el encabezado de sección del Explorador) para generar un árbol para esa carpeta. Desde la Paleta de Comandos, se ejecuta en la **raíz del espacio de trabajo** (carpeta única) o te pide elegir una carpeta (multi-raíz).
- **File Tree Pro: Generate Tree for Workspace** (`filetree-pro.generateWorkspaceTree`) — Mismo flujo de raíz de espacio de trabajo desde la paleta; también disponible como el botón **Generate Tree for Workspace** (icono de lista) en el título de la vista lateral de **File Tree Pro**.
- **File Tree Pro: Convert Text to Tree** (`filetree-pro.convertTextToTree`) — Selecciona texto en un editor y conviértelo a formato de árbol.

**Consejo:** En el Explorador, haz clic derecho en la **fila de la carpeta raíz** real debajo del nombre de tu espacio de trabajo, no en el encabezado de sección en MAYÚSCULAS (esa barra es el menú propio de VS Code).

## 🎨 Ejemplos

### Salida en Markdown

```
# File Tree: my-project

├── 📁 src/
│   ├── 📄 main.js
│   ├── 📄 utils.js
│   └── 📁 components/
│       ├── 📄 Header.js
│       └── 📄 Footer.js
├── 📄 package.json
├── 📄 README.md
└── 📁 node_modules/ 🚫 (auto-hidden)
```

### Salida en JSON

```json
{
  "name": "my-project",
  "type": "directory",
  "icon": "📁",
  "children": [
    {
      "name": "src",
      "type": "directory",
      "icon": "📁",
      "children": [...]
    }
  ]
}
```

## 🔧 Configuración Avanzada

### Soporte de .gitignore

```json
{
  "filetree-pro.respectGitignore": true
}
```

Respeta automáticamente los patrones de `.gitignore` de tu proyecto al generar los árboles de archivos. Activado por defecto.

### Exclusiones Personalizadas

```json
{
  "filetree-pro.exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/mi-carpeta-personalizada/**",
    "**/*.test.js",
    "**/temp/**",
    "**/logs/**"
  ]
}
```

### Ajustes de Iconos

```json
{
  "filetree-pro.showIcons": true
}
```

### Integración con Copilot (Opcional)

```json
{
  "filetree-pro.useCopilot": false
}
```

## 🌟 Casos de Uso

### Para Desarrolladores

- **Documentación de Proyecto**: Generar árboles de archivos para archivos README
- **Revisiones de Código**: Compartir la estructura del proyecto con el equipo
- **Onboarding**: Ayudar a nuevos desarrolladores a entender la disposición del proyecto
- **Análisis de Arquitectura**: Visualizar la estructura del proyecto

### Para Equipos

- **Documentación**: Exportar árboles para la documentación del proyecto
- **Presentaciones**: Usar el formato SVG para diapositivas
- **Documentación de API**: Formato JSON para herramientas
- **Multiplataforma**: El formato ASCII funciona en cualquier lugar

### Para Educadores

- **Enseñanza**: Mostrar estructuras de proyectos a los estudiantes
- **Ejemplos**: Demostrar diferentes organizaciones de proyectos
- **Análisis**: Analizar las estructuras de proyectos de los estudiantes

## 🚀 Rendimiento

- **Proyectos Pequeños** (< 1,000 archivos): < 1 segundo
- **Proyectos Medianos** (1,000-10,000 archivos): < 3 segundos
- **Proyectos Grandes** (10,000+ archivos): < 10 segundos

**💡 Consejo:** ¡Usa `maxDepth: 3-5` para proyectos grandes para acelerar la generación!

---

## 🏗️ Arquitectura y Documentación

### Para Desarrolladores y Colaboradores

¿Quieres entender cómo funciona FileTree Pro internamente? Consulta nuestra documentación exhaustiva:

**[📐 Documentación de Arquitectura →](./docs/ARCHITECTURE.md)**

**Qué hay dentro:**

- 🏛️ Arquitectura de alto nivel con diagramas Mermaid
- 📦 Desglose de componentes y responsabilidades
- 🔄 Flujo de datos y ciclo de vida de las solicitudes
- ⚙️ Explicación del sistema de configuración
- 🔒 Patrones de seguridad y validación
- 📊 Técnicas de optimización de rendimiento
- 🚀 Hoja de ruta de mejoras futuras

**Perfecto para:**

- Desarrolladores senior que revisan la base de código
- Colaboradores que quieran entender la arquitectura
- Equipos que consideren su adopción
- Entusiastas del código abierto que aprenden el desarrollo de extensiones

### Documentación Adicional

- **[📖 Guía de Configuración](./docs/CONFIGURATION-GUIDE.md)** - Referencia completa de ajustes
- **[⚡ Inicio Rápido](./docs/CONFIG-QUICK-START.md)** - Recetas de configuración comunes
- **[🏛️ Propuesta de Arquitectura](./docs/ARCHITECTURE_PROPOSAL.md)** - Mejoras futuras
- **[📝 Registro de Cambios](./CHANGELOG.md)** - Historial de versiones

---

## 📄 Licencia

Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

## ☕ Soporte

Si encuentras útil esta extensión, ¡considera invitarme a un café! ☕

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/tanzimhossain)

## 📞 Contacto y Redes Sociales

- **Email**: <tanzimhossain2@gmail.com>
- **GitHub**: [@0xTanzim](https://github.com/0xTanzim)
- **LinkedIn**: [@0xtanzim](https://linkedin.com/in/0xtanzim)
- **Facebook**: [@0xtanzim](https://facebook.com/0xtanzim)
- **Instagram**: [@0xtanzim](https://instagram.com/0xtanzim)

---

**Hecho con ❤️ para la comunidad de VS Code**
