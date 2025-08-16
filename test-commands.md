# Guía de Comandos de Pruebas - Consola del Navegador

## 🚀 Ejecución Básica

```javascript
// 1. Verificar que la aplicación esté inicializada
window.app.isReady()  // Debería retornar true

// 2. Ejecutar todas las pruebas
await window.TestFramework.runTests('all')

// 3. Ver resultados detallados
console.table(window.TestFramework.results)
```

## 📋 Comandos por Categoría

### Pruebas Unitarias
```javascript
// Ejecutar solo pruebas unitarias
await window.TestFramework.runTests('unit')

// Ver cuántas pruebas unitarias hay
window.TestFramework.testCategories.unit.length
```

### Pruebas de Integración
```javascript
// Ejecutar pruebas de integración
await window.TestFramework.runTests('integration')

// Ver pruebas de integración disponibles
window.TestFramework.testCategories.integration.map(t => t.name)
```

### Pruebas de Validación
```javascript
// Ejecutar pruebas de validación
await window.TestFramework.runTests('validation')

// Ver todas las pruebas de validación
window.TestFramework.testCategories.validation
```

## 🔍 Comandos de Diagnóstico

### Información de la Aplicación
```javascript
// Estado general de la aplicación
window.app.getInfo()

// Componentes cargados
Object.keys(window.app.components)

// Rendimiento
window.app.getPerformanceInfo()
```

### Información del TestFramework
```javascript
// Estadísticas de pruebas
window.TestFramework.getTestStatistics()

// Todas las pruebas registradas
window.TestFramework.tests

// Última ejecución
window.TestFramework.results
```

## 🛠️ Comandos de Desarrollo

### Herramientas de Desarrollo (solo en localhost)
```javascript
// Verificar si las herramientas de dev están disponibles
typeof window.dev !== 'undefined'

// Ejecutar pruebas (forma corta)
window.dev.runTests()

// Ver estadísticas completas
window.dev.getStats()

// Acceder a utilidades
window.dev.utils

// Acceder a configuración
window.dev.config
```

### Gestión de Datos
```javascript
// Exportar todos los datos
await window.app.exportApplicationData()

// Limpiar datos (¡CUIDADO!)
// await window.app.reset()  // Descomenta solo si quieres resetear
```

## 📊 Análisis de Resultados

### Ver Resultados de Pruebas
```javascript
// Última ejecución (formato tabla)
console.table(window.TestFramework.results)

// Solo pruebas fallidas
window.TestFramework.results.filter(r => r.status === 'fail')

// Solo pruebas exitosas
window.TestFramework.results.filter(r => r.status === 'pass')

// Tiempo total de ejecución
window.TestFramework.results.reduce((sum, r) => sum + r.duration, 0)
```

### Resumen de Resultados
```javascript
// Después de ejecutar pruebas
const summary = window.TestFramework.generateTestSummary()
console.log(`
✅ Exitosas: ${summary.passed}
❌ Fallidas: ${summary.failed}
⏭️ Omitidas: ${summary.skipped}
📊 Tasa de éxito: ${summary.passRate.toFixed(1)}%
⏱️ Tiempo total: ${summary.totalDuration}ms
`)
```

## 🔄 Comandos de Pruebas Personalizadas

### Ejecutar Prueba Individual
```javascript
// Ejecutar una prueba específica por nombre
const testName = "Course model validates required fields"
const test = window.TestFramework.tests.get(testName)
if (test) {
    try {
        await test.testFunction()
        console.log(`✅ ${testName} - PASSED`)
    } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}`)
    }
}
```

### Crear Prueba Temporal
```javascript
// Registrar y ejecutar una prueba personalizada
window.TestFramework.registerTest(
    'Mi Prueba Personalizada',
    () => {
        // Tu código de prueba aquí
        if (2 + 2 !== 4) {
            throw new Error('Matemáticas rotas!')
        }
    },
    'unit'
)

// Ejecutar solo esa prueba
await window.TestFramework.runTests('unit')
```

## 🐛 Comandos de Debugging

### Información del Sistema
```javascript
// Información del navegador
navigator.userAgent

// Rendimiento de memoria (si está disponible)
if (performance.memory) {
    console.log(`Memoria usada: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`)
}

// Verificar localStorage
localStorage.getItem('course_management_data') ? 'Datos guardados' : 'Sin datos'
```

### Estados de Componentes
```javascript
// Estado del DataService
window.app.components.dataService.initialized

// Caché del CourseManager
window.app.components.courseManager.getCacheSize()

// Estado del ValidationService
window.app.components.validationService.validators.size
```

## ⚡ Comandos Rápidos

```javascript
// Suite completa rápida
await window.dev?.runTests() || await window.TestFramework.runTests('all')

// Solo verificar que todo funciona
await window.TestFramework.runTests('unit').then(r => 
    console.log(`${r.summary.passed}/${r.summary.total} pruebas pasaron`)
)

// Limpiar consola y ejecutar
console.clear(); await window.TestFramework.runTests('all')
```