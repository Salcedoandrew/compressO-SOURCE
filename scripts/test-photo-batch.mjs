import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

function load(relativePath, dependencies = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  })
  const exports = {}
  new Function('require', 'exports', outputText)((name) => {
    assert.ok(name in dependencies, `Unexpected import: ${name}`)
    return dependencies[name]
  }, exports)
  return exports
}

const { fitInsideBox, normalizeFitBox } = load('../src/utils/fitBox.ts')
const { clampImageConcurrency, DEFAULT_IMAGE_CONCURRENCY } = load(
  '../src/utils/imageConcurrency.ts',
)
const { parseLanguageList, matchingTrackIndexes, sanitizeLanguageList } = load(
  '../src/utils/trackLanguages.ts',
)
const {
  normalizeBatchSession,
  unfinishedBatchItems,
  markBatchItem,
  resumeQueueItems,
  isSafeMediaPath,
} = load('../src/utils/batchSession.ts')
const {
  createPhotoDeliveryPreset,
  PHOTO_DELIVERY_LONG_EDGE,
  PHOTO_DELIVERY_QUALITY,
} = load('../src/utils/photoDelivery.ts')

test('fit inside a box never upscales', () => {
  assert.deepEqual(
    fitInsideBox(6000, 4000, { maxWidth: 2560, maxHeight: 2560 }),
    {
      width: 2560,
      height: 1707,
    },
  )
  assert.equal(
    fitInsideBox(800, 600, { maxWidth: 2560, maxHeight: 2560 }),
    null,
  )
  assert.deepEqual(
    fitInsideBox(1000, 3000, { maxWidth: 2560, maxHeight: 1920 }),
    {
      width: 640,
      height: 1920,
    },
  )
  assert.equal(
    fitInsideBox(4000, 3000, { maxWidth: null, maxHeight: null }),
    null,
  )
  assert.equal(fitInsideBox(0, 3000, { maxWidth: 2560, maxHeight: 2560 }), null)
  assert.deepEqual(normalizeFitBox({ maxWidth: 0, maxHeight: 2048 }), {
    maxWidth: null,
    maxHeight: 2048,
  })
})

test('image concurrency stays in range', () => {
  assert.equal(clampImageConcurrency(undefined), DEFAULT_IMAGE_CONCURRENCY)
  assert.equal(clampImageConcurrency(0), 1)
  assert.equal(clampImageConcurrency(2.4), 2)
  assert.equal(clampImageConcurrency(40), 8)
})

test('language lists keep only named tracks', () => {
  assert.deepEqual(parseLanguageList(' ENG, spa deu '), ['eng', 'spa', 'deu'])
  assert.equal(sanitizeLanguageList('eng<script>'), 'engscript')
  assert.deepEqual(matchingTrackIndexes(['eng', null, 'spa'], ['spa']), [2])
  assert.deepEqual(matchingTrackIndexes(['eng', 'spa'], []), [0, 1])
})

test('batch resume drops unsafe paths and keeps unfinished files', () => {
  assert.equal(isSafeMediaPath('photo.jpg'), false)
  assert.equal(isSafeMediaPath('/weddings/photo.jpg'), true)
  const session = normalizeBatchSession({
    version: 1,
    items: [
      {
        path: '/weddings/a.jpg',
        relativeDir: 'day',
        presetId: 'photo-delivery',
        status: 'pending',
      },
      { path: 'relative.jpg', status: 'pending' },
      { path: '/weddings/b.jpg', status: 'done', presetId: null },
      { path: '/weddings/bad\0.jpg', status: 'failed' },
    ],
  })
  assert.equal(session.items.length, 2)
  assert.deepEqual(
    unfinishedBatchItems(session).map((item) => item.path),
    ['/weddings/a.jpg'],
  )
  const saved = markBatchItem(session, '/weddings/a.jpg', 'done')
  assert.equal(unfinishedBatchItems(saved).length, 0)
})

test('interrupted queue items wait again and forget partial output', () => {
  const [job] = resumeQueueItems([
    {
      path: '/videos/clip.mp4',
      status: 'compressing',
      progress: 40,
      outputPath: '/tmp/partial.mp4',
    },
    { path: 'clip.mp4', status: 'waiting', progress: 0, outputPath: null },
  ])
  assert.equal(job.status, 'waiting')
  assert.equal(job.progress, 0)
  assert.equal(job.outputPath, null)
})

test('photo delivery preset fits a long edge without stripping metadata', () => {
  const preset = createPhotoDeliveryPreset()
  assert.equal(preset.settings.convertToExtension, 'jpg')
  assert.equal(preset.settings.quality, PHOTO_DELIVERY_QUALITY)
  assert.equal(preset.settings.shouldStripMetadata, false)
  assert.equal(preset.settings.resolution, null)
  assert.deepEqual(preset.settings.fitBox, {
    maxWidth: PHOTO_DELIVERY_LONG_EDGE,
    maxHeight: PHOTO_DELIVERY_LONG_EDGE,
  })
  assert.ok(
    PHOTO_DELIVERY_LONG_EDGE >= 2048 && PHOTO_DELIVERY_LONG_EDGE <= 3000,
  )
  assert.equal(
    fitInsideBox(7000, 4000, preset.settings.fitBox).width,
    PHOTO_DELIVERY_LONG_EDGE,
  )
  assert.equal(fitInsideBox(1200, 800, preset.settings.fitBox), null)
})
