import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'

const source = path.dirname(fileURLToPath(import.meta.url))
const output = path.resolve(source, '../../public/difuntos')
const hash = value => createHash('sha256').update(value).digest('hex')
const data = JSON.parse(readFileSync(path.join(source, 'data.json'), 'utf8'))
mkdirSync(path.join(output, 'assets'), { recursive: true })
const result = await build({ entryPoints: [path.join(source, 'app.js')], bundle: true, format: 'iife', minify: true, target: 'es2020', write: false })
const engine = result.outputFiles[0].contents
const appFile = `assets/app-${hash(engine).slice(0, 12)}.js`
for (const file of readdirSync(path.join(output, 'assets'))) {
  if (/^app-[a-f0-9]+\.js$/.test(file) && file !== path.basename(appFile)) unlinkSync(path.join(output, 'assets', file))
}
writeFileSync(path.join(output, appFile), engine)
const template = readFileSync(path.join(source, 'index.template.html'), 'utf8').replace('__CSS__', readFileSync(path.join(source, 'style.css'), 'utf8'))
const version = hash(JSON.stringify(data) + engine.toString() + template).slice(0, 12)
const core = ['index.html', appFile, ...Object.values(data.images), 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png']
const allFiles = [...core, ...Object.values(data.routes.topos)]
for (const file of allFiles.filter(file => file !== 'index.html')) {
  if (!existsSync(path.join(output, file))) throw new Error(`Falta el recurso del mapa: ${file}`)
}
data.offline = { version, coreFiles: core, allFiles, appFile, coreBytes: 0, totalBytes: 0 }
data.exportTemplate = template
function render() {
  return template.replace('__APP_TAG__', `<script data-app src="${appFile}" defer></script>`)
    .replace('__DATA__', `window.MAP_DATA=${JSON.stringify(data).replaceAll('</', '<\\/')};`)
}
for (let i = 0; i < 3; i++) {
  writeFileSync(path.join(output, 'index.html'), render())
  data.offline.coreBytes = core.reduce((total, file) => total + statSync(path.join(output, file)).size, 0)
  data.offline.totalBytes = allFiles.reduce((total, file) => total + statSync(path.join(output, file)).size, 0)
}
writeFileSync(path.join(output, 'index.html'), render())
const files = allFiles.map(file => {
  const body = readFileSync(path.join(output, file))
  return { path: file, bytes: body.length, sha256: hash(body) }
})
const manifest = { version, core, files }
writeFileSync(path.join(output, 'offline-manifest.json'), JSON.stringify(manifest))
writeFileSync(path.join(output, 'sw.js'), readFileSync(path.join(source, 'sw.template.js'), 'utf8').replace('__MANIFEST__', JSON.stringify(manifest)))
console.log(`Difuntos: ${data.routes.sectors.length} sectores, ${Object.keys(data.routes.topos).length} fotos, ${(data.offline.totalBytes / 1e6).toFixed(1)} MB sin conexión.`)
