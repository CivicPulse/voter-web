/**
 * Type declarations for the W3C Shape Detection API — BarcodeDetector.
 * Available in Chromium-based browsers (Chrome, Edge).
 * https://wicg.github.io/shape-detection-api/#barcode-detection-api
 */

interface DetectedBarcode {
  rawValue: string
  format: string
  boundingBox: DOMRectReadOnly
  cornerPoints: ReadonlyArray<{ x: number; y: number }>
}

interface BarcodeDetectorOptions {
  formats?: string[]
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<string[]>
  detect(image: ImageBitmapSource | HTMLVideoElement): Promise<DetectedBarcode[]>
}
